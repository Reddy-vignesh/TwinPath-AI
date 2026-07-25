"""
Decision Twin AI — Admin Service.

Business logic for admin operations:
- User management (list, update roles, deactivate)
- Career catalog seeding
- Audit log access
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import ForbiddenException, NotFoundException
from app.ml.seed_data import CAREER_SEED_DATA
from app.models.audit_log import AuditLog
from app.models.career import Career
from app.models.profile import StudentProfile
from app.models.user import User
from app.repositories.twin_repositories import CareerRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import AdminUserUpdate, UserListParams

logger = structlog.get_logger(__name__)


class AdminService:
    """Service for admin-only operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.career_repo = CareerRepository(session)

    # ══════════════════════════════════════════════════════════════
    # USER MANAGEMENT
    # ══════════════════════════════════════════════════════════════

    async def list_users(
        self, params: UserListParams
    ) -> dict[str, Any]:
        """List users with filtering, searching, and pagination."""
        stmt = select(User)

        # Filters
        if params.role:
            stmt = stmt.where(User.role == params.role.value)
        if params.is_active is not None:
            stmt = stmt.where(User.is_active == params.is_active)
        if params.search:
            search_term = f"%{params.search}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        # Sort
        sort_col = getattr(User, params.sort_by, User.created_at)
        if params.sort_order == "asc":
            stmt = stmt.order_by(sort_col.asc())
        else:
            stmt = stmt.order_by(sort_col.desc())

        # Paginate
        offset = (params.page - 1) * params.page_size
        stmt = stmt.offset(offset).limit(params.page_size)

        result = await self.session.execute(stmt)
        users = list(result.scalars().all())

        # Enrich with profile data
        user_data = []
        for user in users:
            profile_stmt = select(StudentProfile).where(
                StudentProfile.user_id == user.id
            )
            profile_result = await self.session.execute(profile_stmt)
            profile = profile_result.scalar_one_or_none()

            user_data.append({
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "is_active": user.is_active,
                "email_verified": user.email_verified,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
                "has_profile": profile is not None,
                "twin_completeness": (
                    profile.twin_completeness_score if profile else 0.0
                ),
            })

        return {
            "users": user_data,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": max(1, (total + params.page_size - 1) // params.page_size),
        }

    async def update_user(
        self,
        user_id: uuid.UUID,
        data: AdminUserUpdate,
        admin_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Update a user's role, active status, or verification."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found.")

        # Prevent self-demotion
        if user_id == admin_id and data.role and data.role != UserRole.ADMIN:
            raise ForbiddenException(message="Cannot demote yourself.")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "role":
                value = value.value if isinstance(value, UserRole) else value
            setattr(user, field, value)

        await self.session.commit()
        await self.session.refresh(user)

        logger.info(
            "Admin updated user",
            admin_id=str(admin_id),
            user_id=str(user_id),
            changes=update_data,
        )

        return {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        }

    async def deactivate_user(
        self, user_id: uuid.UUID, admin_id: uuid.UUID
    ) -> None:
        """Soft-deactivate a user."""
        if user_id == admin_id:
            raise ForbiddenException(message="Cannot deactivate yourself.")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found.")

        user.is_active = False
        await self.session.commit()
        logger.info("User deactivated", user_id=str(user_id), by=str(admin_id))

    # ══════════════════════════════════════════════════════════════
    # CAREER CATALOG SEEDING
    # ══════════════════════════════════════════════════════════════

    async def seed_careers(
        self, overwrite: bool = False
    ) -> dict[str, Any]:
        """Seed the career catalog from built-in seed data."""
        created = 0
        updated = 0
        skipped = 0
        errors: list[str] = []

        for career_data in CAREER_SEED_DATA:
            try:
                existing = await self.career_repo.get_by_title(career_data["title"])

                if existing and not overwrite:
                    skipped += 1
                    continue

                if existing and overwrite:
                    for field, value in career_data.items():
                        if field != "title":
                            setattr(existing, field, value)
                    updated += 1
                else:
                    career = Career(**career_data)
                    await self.career_repo.create(career)
                    created += 1

            except Exception as exc:
                errors.append(f"{career_data.get('title', '?')}: {str(exc)}")

        await self.session.commit()

        logger.info(
            "Career catalog seeded",
            created=created, updated=updated,
            skipped=skipped, errors=len(errors),
        )

        return {
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
        }

    # ══════════════════════════════════════════════════════════════
    # AUDIT LOGS
    # ══════════════════════════════════════════════════════════════

    async def get_audit_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        user_id: uuid.UUID | None = None,
        action: str | None = None,
    ) -> dict[str, Any]:
        """Retrieve audit logs with filtering and pagination."""
        stmt = select(AuditLog)

        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        # Paginate
        stmt = stmt.order_by(AuditLog.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.session.execute(stmt)
        logs = list(result.scalars().all())

        return {
            "logs": [
                {
                    "id": str(log.id),
                    "user_id": str(log.user_id) if log.user_id else None,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

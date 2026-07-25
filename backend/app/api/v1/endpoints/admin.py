"""
Decision Twin AI — Admin Endpoints.

Admin-only operations:
- User management (list, update, deactivate)
- Career catalog seeding
- Audit log access
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException
from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.schemas.admin import (
    AdminUserUpdate,
    CareerSeedRequest,
    UserListParams,
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
    """Dependency that enforces admin role."""
    if current_user.role != "admin":
        raise ForbiddenException(message="Admin access required.")
    return current_user


def _get_service(session: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(session)


# ── User Management ───────────────────────────────────────────────


@router.get("/users", summary="List all users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    search: str | None = Query(None, max_length=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """List users with filtering, search, and pagination."""
    from app.core.constants import UserRole

    params = UserListParams(
        page=page,
        page_size=page_size,
        role=UserRole(role) if role else None,
        is_active=is_active,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    result = await service.list_users(params)
    return success_response(data=result, message=f"Found {result['total']} users.")


@router.get("/users/{user_id}", summary="Get user details")
async def get_user(
    user_id: uuid.UUID,
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """Get detailed user info (admin view)."""
    from app.repositories.user_repository import UserRepository
    from sqlalchemy.ext.asyncio import AsyncSession

    user = await service.user_repo.get_by_id(user_id)
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(message="User not found.")

    return success_response(
        data={
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
        message="User retrieved.",
    )


@router.patch("/users/{user_id}", summary="Update user (admin)")
async def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """Update user role, active status, or email verification."""
    result = await service.update_user(
        user_id=user_id,
        data=payload,
        admin_id=uuid.UUID(admin.sub),
    )
    return success_response(data=result, message="User updated.")


@router.post("/users/{user_id}/deactivate", summary="Deactivate user")
async def deactivate_user(
    user_id: uuid.UUID,
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """Soft-deactivate a user account."""
    await service.deactivate_user(user_id, uuid.UUID(admin.sub))
    return success_response(data=None, message="User deactivated.")


# ── Career Catalog ────────────────────────────────────────────────


@router.post("/careers/seed", summary="Seed career catalog")
async def seed_careers(
    payload: CareerSeedRequest | None = None,
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """Seed the career catalog from built-in data (20 curated careers)."""
    params = payload or CareerSeedRequest()
    result = await service.seed_careers(overwrite=params.overwrite_existing)
    return success_response(
        data=result,
        message=f"Seeded: {result['created']} created, {result['updated']} updated, {result['skipped']} skipped.",
    )


# ── Audit Logs ────────────────────────────────────────────────────


@router.get("/audit-logs", summary="View audit logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user_id: uuid.UUID | None = None,
    action: str | None = None,
    admin: TokenPayload = Depends(_require_admin),
    service: AdminService = Depends(_get_service),
) -> dict[str, Any]:
    """Retrieve audit logs with optional filtering."""
    result = await service.get_audit_logs(
        page=page, page_size=page_size,
        user_id=user_id, action=action,
    )
    return success_response(data=result, message=f"Found {result['total']} logs.")

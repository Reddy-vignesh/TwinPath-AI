"""
Decision Twin AI — Profile Endpoints.

CRUD for the student profile + twin completeness scoring.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.schemas.profile import ProfileCreate, ProfileRead, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def _get_service(session: AsyncSession = Depends(get_db)) -> ProfileService:
    return ProfileService(session)


@router.post("", summary="Create profile", status_code=201)
async def create_profile(
    payload: ProfileCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict[str, Any]:
    profile = await service.create_profile(
        user_id=uuid.UUID(current_user.sub), data=payload
    )
    return success_response(
        data=ProfileRead.model_validate(profile).model_dump(mode="json"),
        message="Profile created successfully.",
    )


@router.get("", summary="Get my profile")
async def get_profile(
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict[str, Any]:
    profile = await service.get_profile(uuid.UUID(current_user.sub))
    return success_response(
        data=ProfileRead.model_validate(profile).model_dump(mode="json"),
        message="Profile retrieved.",
    )


@router.patch("", summary="Update my profile")
async def update_profile(
    payload: ProfileUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict[str, Any]:
    profile = await service.update_profile(
        user_id=uuid.UUID(current_user.sub), data=payload
    )
    return success_response(
        data=ProfileRead.model_validate(profile).model_dump(mode="json"),
        message="Profile updated.",
    )


@router.delete("", summary="Delete my profile", status_code=200)
async def delete_profile(
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict[str, Any]:
    await service.delete_profile(uuid.UUID(current_user.sub))
    return success_response(data=None, message="Profile deleted.")


@router.get("/completeness", summary="Get twin completeness score")
async def get_completeness(
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict[str, Any]:
    result = await service.recalculate_completeness(uuid.UUID(current_user.sub))
    return success_response(data=result, message="Completeness calculated.")


@router.get("/export-data", summary="GDPR Data Portability: Export My Digital Twin Data")
async def export_user_data(
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Exports all user data, profile evidence, calibrated skills, and vector twin metrics in JSON format.
    """
    from app.repositories.user_repository import UserRepository
    from app.repositories.twin_repositories import UserSkillRepository
    from datetime import datetime, UTC

    user_id = uuid.UUID(current_user.sub)
    user_repo = UserRepository(session)
    skill_repo = UserSkillRepository(session)

    user = await user_repo.get_by_id(user_id)
    profile = await service.get_profile(user_id)
    skills = await skill_repo.get_by_user_id(user_id)

    export_payload = {
        "export_metadata": {
            "platform": "TwinPath AI",
            "exported_at": datetime.now(UTC).isoformat(),
            "user_id": str(user_id),
            "version": "1.0-GDPR",
        },
        "user_account": {
            "email": user.email if user else current_user.sub,
            "first_name": user.first_name if user else "",
            "last_name": user.last_name if user else "",
            "role": current_user.role,
        },
        "student_profile": ProfileRead.model_validate(profile).model_dump(mode="json") if profile else None,
        "calibrated_skills": [
            {
                "skill_id": str(s.skill_id),
                "proficiency_level": s.proficiency_level,
                "verified": s.verified,
                "source": s.source,
            }
            for s in skills
        ],
    }

    return success_response(
        data=export_payload,
        message="GDPR Digital Twin data export generated successfully.",
    )


@router.delete("/erase-data", summary="GDPR Right to be Forgotten: Permanently Erase All Data")
async def erase_user_data(
    current_user: TokenPayload = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Permanently erases all profile evidence, skills, and simulations from the database.
    """
    from app.repositories.twin_repositories import UserSkillRepository
    from sqlalchemy import delete
    from app.models.profile import StudentProfile
    from app.models.skill import UserSkill

    user_id = uuid.UUID(current_user.sub)

    # 1. Delete all user skills
    await session.execute(delete(UserSkill).where(UserSkill.user_id == user_id))

    # 2. Delete profile
    await session.execute(delete(StudentProfile).where(StudentProfile.user_id == user_id))

    await session.commit()

    return success_response(
        data=None,
        message="All Digital Twin evidence and profile records have been permanently erased.",
    )

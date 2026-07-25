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

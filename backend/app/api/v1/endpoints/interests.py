"""
Decision Twin AI — Interests Endpoints.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.repositories.interest_repository import InterestCatalogRepository
from app.schemas.interest import (
    InterestCreate,
    InterestRead,
    UserInterestCreate,
    UserInterestRead,
    UserInterestUpdate,
)
from app.services.twin_service import TwinDataService

router = APIRouter(prefix="/interests", tags=["Interests"])


def _get_service(session: AsyncSession = Depends(get_db)) -> TwinDataService:
    return TwinDataService(session)


@router.get("/catalog", summary="Search interest catalog")
async def search_interests(
    q: str = Query("", max_length=100),
    category: str | None = None,
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    repo = InterestCatalogRepository(session)
    if q:
        interests = await repo.search(q)
    elif category:
        interests = await repo.get_by_category(category)
    else:
        interests = await repo.get_all()
    return success_response(
        data=[InterestRead.model_validate(i).model_dump(mode="json") for i in interests],
        message=f"Found {len(interests)} interests.",
    )


@router.post("/catalog", summary="Add interest to catalog", status_code=201)
async def create_catalog_interest(
    payload: InterestCreate,
    current_user: TokenPayload = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.core.exceptions import ConflictException
    from app.models.interest import Interest

    repo = InterestCatalogRepository(session)
    existing = await repo.get_by_name(payload.name)
    if existing:
        raise ConflictException(message="Interest already exists.")

    interest = Interest(**payload.model_dump())
    created = await repo.create(interest)
    await session.commit()
    return success_response(
        data=InterestRead.model_validate(created).model_dump(mode="json"),
        message="Interest added to catalog.",
    )


@router.get("", summary="Get my interests")
async def get_my_interests(
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    interests = await service.get_interests(uuid.UUID(current_user.sub))
    return success_response(
        data=[UserInterestRead.model_validate(i).model_dump(mode="json") for i in interests],
        message=f"Found {len(interests)} interests.",
    )


@router.post("", summary="Add interest to my profile", status_code=201)
async def add_interest(
    payload: UserInterestCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    ui = await service.add_interest(uuid.UUID(current_user.sub), payload)
    return success_response(
        data=UserInterestRead.model_validate(ui).model_dump(mode="json"),
        message="Interest added.",
    )


@router.patch("/{interest_id}", summary="Update interest intensity")
async def update_interest(
    interest_id: uuid.UUID,
    payload: UserInterestUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    updated = await service.update_interest(uuid.UUID(current_user.sub), interest_id, payload)
    return success_response(
        data=UserInterestRead.model_validate(updated).model_dump(mode="json"),
        message="Interest updated.",
    )


@router.delete("/{interest_id}", summary="Remove interest")
async def remove_interest(
    interest_id: uuid.UUID,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    await service.remove_interest(uuid.UUID(current_user.sub), interest_id)
    return success_response(data=None, message="Interest removed.")

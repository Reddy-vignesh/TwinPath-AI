"""
Decision Twin AI — Career Catalog Endpoints.

Read-only career catalog for students.
Admin-only create/update (managed via data seeding).
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.repositories.twin_repositories import CareerRepository
from app.schemas.career import CareerCreate, CareerRead, CareerSummaryRead, CareerUpdate

from app.core.cache import catalog_cache

router = APIRouter(prefix="/careers", tags=["Careers"])


@router.get("", summary="Browse careers")
async def list_careers(
    q: str = Query("", max_length=100),
    category: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    cache_key = f"careers_list:{q}:{category}:{limit}"
    cached_data = await catalog_cache.get(cache_key)
    if cached_data is not None:
        return success_response(
            data=cached_data,
            message=f"Found {len(cached_data)} careers (cached).",
        )

    repo = CareerRepository(session)
    if q:
        careers = await repo.search(q, category=category, limit=limit)
    elif category:
        careers = await repo.get_by_category(category, limit=limit)
    else:
        careers = await repo.get_all_active(limit=limit)
    
    result_data = [CareerSummaryRead.model_validate(c).model_dump(mode="json") for c in careers]
    await catalog_cache.set(cache_key, result_data, ttl_seconds=600)

    return success_response(
        data=result_data,
        message=f"Found {len(careers)} careers.",
    )


@router.get("/{career_id}", summary="Get career details")
async def get_career(
    career_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    cache_key = f"career_detail:{career_id}"
    cached_data = await catalog_cache.get(cache_key)
    if cached_data is not None:
        return success_response(
            data=cached_data,
            message="Career retrieved (cached).",
        )

    repo = CareerRepository(session)
    career = await repo.get_by_id(career_id)
    if not career:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(message="Career not found.")
    
    result_data = CareerRead.model_validate(career).model_dump(mode="json")
    await catalog_cache.set(cache_key, result_data, ttl_seconds=600)

    return success_response(
        data=result_data,
        message="Career retrieved.",
    )


@router.post("", summary="Add career (admin)", status_code=201)
async def create_career(
    payload: CareerCreate,
    current_user: TokenPayload = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.core.exceptions import ConflictException, ForbiddenException
    from app.models.career import Career

    if current_user.role != "admin":
        raise ForbiddenException(message="Only admins can manage the career catalog.")

    repo = CareerRepository(session)
    existing = await repo.get_by_title(payload.title)
    if existing:
        raise ConflictException(message="Career already exists.")

    career = Career(**payload.model_dump())
    created = await repo.create(career)
    await session.commit()
    await catalog_cache.invalidate()
    return success_response(
        data=CareerRead.model_validate(created).model_dump(mode="json"),
        message="Career added to catalog.",
    )


@router.patch("/{career_id}", summary="Update career (admin)")
async def update_career(
    career_id: uuid.UUID,
    payload: CareerUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.core.exceptions import ForbiddenException, NotFoundException

    if current_user.role != "admin":
        raise ForbiddenException(message="Only admins can manage the career catalog.")

    repo = CareerRepository(session)
    career = await repo.get_by_id(career_id)
    if not career:
        raise NotFoundException(message="Career not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(career, field, value)

    await session.commit()
    await session.refresh(career)
    await catalog_cache.invalidate()
    return success_response(
        data=CareerRead.model_validate(career).model_dump(mode="json"),
        message="Career updated.",
    )

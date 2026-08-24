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
    
    # Fallback to in-memory seed data if DB is not yet populated
    if not careers:
        from app.ml.seed_data import CAREER_SEED_DATA
        import uuid as _uuid
        seed_matches = []
        for c in CAREER_SEED_DATA:
            if category and category.lower() != 'all' and c.get("category", "").lower() != category.lower():
                continue
            if q and q.lower() not in c.get("title", "").lower() and q.lower() not in (c.get("description") or "").lower():
                continue
            item = dict(c)
            if "id" not in item or not isinstance(item["id"], _uuid.UUID):
                try:
                    item["id"] = _uuid.UUID(str(item.get("id")))
                except Exception:
                    item["id"] = _uuid.uuid5(_uuid.NAMESPACE_DNS, item.get("title", "career"))
            seed_matches.append(item)
            if len(seed_matches) >= limit:
                break
        result_data = [
            {
                "id": str(item["id"]),
                "title": item["title"],
                "category": item.get("category", "software_engineering"),
                "short_description": item.get("short_description"),
                "median_salary_usd": item.get("median_salary_usd"),
                "market_demand": item.get("market_demand", "high"),
                "growth_rate_percent": item.get("growth_rate_percent", 15.0),
                "automation_risk_percent": item.get("automation_risk_percent", 10.0),
                "typical_experience_years": item.get("typical_experience_years", 2),
            }
            for item in seed_matches
        ]
    else:
        result_data = [CareerSummaryRead.model_validate(c).model_dump(mode="json") for c in careers]

    await catalog_cache.set(cache_key, result_data, ttl_seconds=600)

    return success_response(
        data=result_data,
        message=f"Found {len(result_data)} careers.",
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
        from app.ml.seed_data import CAREER_SEED_DATA
        for c in CAREER_SEED_DATA:
            cid_str = str(c.get("id"))
            if str(career_id) == cid_str or str(career_id) == str(uuid.uuid5(uuid.NAMESPACE_DNS, c.get("title", ""))):
                result_data = {
                    "id": str(career_id),
                    "title": c["title"],
                    "category": c.get("category", "software_engineering"),
                    "short_description": c.get("short_description"),
                    "description": c.get("description"),
                    "median_salary_usd": c.get("median_salary_usd"),
                    "salary_range_low": c.get("salary_range_low"),
                    "salary_range_high": c.get("salary_range_high"),
                    "market_demand": c.get("market_demand", "high"),
                    "growth_rate_percent": c.get("growth_rate_percent", 15.0),
                    "automation_risk_percent": c.get("automation_risk_percent", 10.0),
                    "required_skills": c.get("required_skills", {}),
                    "preferred_skills": c.get("preferred_skills", {}),
                    "required_education": c.get("required_education", "Bachelor's"),
                    "typical_experience_years": c.get("typical_experience_years", 2),
                    "is_active": True,
                }
                return success_response(data=result_data, message="Career retrieved.")
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

"""
Decision Twin AI — Skills Endpoints.

Skill catalog queries + user-skill CRUD.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.repositories.skill_repository import SkillCatalogRepository
from app.schemas.skill import (
    SkillCreate,
    SkillRead,
    UserSkillCreate,
    UserSkillRead,
    UserSkillUpdate,
)
from app.services.twin_service import TwinDataService

router = APIRouter(prefix="/skills", tags=["Skills"])


def _get_service(session: AsyncSession = Depends(get_db)) -> TwinDataService:
    return TwinDataService(session)


# ── Skill Catalog ─────────────────────────────────────────────────


@router.get("/catalog", summary="Search skill catalog")
async def search_skills(
    q: str = Query("", max_length=100),
    category: str | None = None,
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    repo = SkillCatalogRepository(session)
    if q:
        skills = await repo.search(q)
    elif category:
        skills = await repo.get_by_category(category)
    else:
        skills = await repo.get_all()
    return success_response(
        data=[SkillRead.model_validate(s).model_dump(mode="json") for s in skills],
        message=f"Found {len(skills)} skills.",
    )


@router.post("/catalog", summary="Add skill to catalog", status_code=201)
async def create_catalog_skill(
    payload: SkillCreate,
    current_user: TokenPayload = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.models.skill import Skill

    repo = SkillCatalogRepository(session)
    existing = await repo.get_by_name(payload.name)
    if existing:
        from app.core.exceptions import ConflictException
        raise ConflictException(message="Skill already exists in catalog.")

    skill = Skill(**payload.model_dump())
    created = await repo.create(skill)
    await session.commit()
    return success_response(
        data=SkillRead.model_validate(created).model_dump(mode="json"),
        message="Skill added to catalog.",
    )


# ── User Skills ───────────────────────────────────────────────────


@router.get("", summary="Get my skills")
async def get_my_skills(
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    skills = await service.get_skills(uuid.UUID(current_user.sub))
    data = []
    for s in skills:
        if getattr(s, "skill", None) is None:
            sk = await service.skill_catalog_repo.get_by_id(s.skill_id)
            if sk:
                s.skill = sk
        data.append(UserSkillRead.model_validate(s).model_dump(mode="json"))
    return success_response(
        data=data,
        message=f"Found {len(data)} skills.",
    )


@router.post("", summary="Add skill to my profile", status_code=201)
async def add_skill(
    payload: UserSkillCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    user_skill = await service.add_skill(uuid.UUID(current_user.sub), payload)
    if getattr(user_skill, "skill", None) is None:
        sk = await service.skill_catalog_repo.get_by_id(user_skill.skill_id)
        if sk:
            user_skill.skill = sk
    return success_response(
        data=UserSkillRead.model_validate(user_skill).model_dump(mode="json"),
        message="Skill added to profile.",
    )


@router.patch("/{skill_id}", summary="Update my skill proficiency")
async def update_skill(
    skill_id: uuid.UUID,
    payload: UserSkillUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    updated = await service.update_skill(uuid.UUID(current_user.sub), skill_id, payload)
    return success_response(
        data=UserSkillRead.model_validate(updated).model_dump(mode="json"),
        message="Skill updated.",
    )


@router.delete("/{skill_id}", summary="Remove skill from profile")
async def remove_skill(
    skill_id: uuid.UUID,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    await service.remove_skill(uuid.UUID(current_user.sub), skill_id)
    return success_response(data=None, message="Skill removed.")

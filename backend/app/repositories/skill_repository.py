"""
Decision Twin AI — Skill Repository.

Data access for Skill catalog and UserSkill junction.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.skill import Skill, UserSkill
from app.repositories.base import BaseRepository


class SkillCatalogRepository(BaseRepository[Skill]):
    """Repository for the master Skill catalog."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Skill, session)

    async def get_by_name(self, name: str) -> Skill | None:
        from sqlalchemy import func
        stmt = select(Skill).where(func.lower(Skill.name) == name.strip().lower())
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def search(self, query: str, limit: int = 20) -> list[Skill]:
        stmt = (
            select(Skill)
            .where(Skill.name.ilike(f"%{query}%"))
            .order_by(Skill.name)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_category(self, category: str) -> list[Skill]:
        stmt = (
            select(Skill)
            .where(Skill.category == category)
            .order_by(Skill.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class UserSkillRepository(BaseRepository[UserSkill]):
    """Repository for user-skill associations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UserSkill, session)

    async def get_by_profile(self, profile_id: uuid.UUID) -> list[UserSkill]:
        stmt = (
            select(UserSkill)
            .where(UserSkill.profile_id == profile_id)
            .options(selectinload(UserSkill.skill))
            .order_by(UserSkill.proficiency_level.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_profile_and_skill(
        self, profile_id: uuid.UUID, skill_id: uuid.UUID
    ) -> UserSkill | None:
        stmt = (
            select(UserSkill)
            .where(
                UserSkill.profile_id == profile_id,
                UserSkill.skill_id == skill_id,
            )
            .options(selectinload(UserSkill.skill))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_profile(self, profile_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(UserSkill)
            .where(UserSkill.profile_id == profile_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

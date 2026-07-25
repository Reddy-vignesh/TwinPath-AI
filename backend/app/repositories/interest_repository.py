"""
Decision Twin AI — Interest Repository.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.interest import Interest, UserInterest
from app.repositories.base import BaseRepository


class InterestCatalogRepository(BaseRepository[Interest]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Interest, session)

    async def get_by_name(self, name: str) -> Interest | None:
        stmt = select(Interest).where(Interest.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(self, query: str, limit: int = 20) -> list[Interest]:
        stmt = (
            select(Interest)
            .where(Interest.name.ilike(f"%{query}%"))
            .order_by(Interest.name)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_category(self, category: str) -> list[Interest]:
        stmt = (
            select(Interest)
            .where(Interest.category == category)
            .order_by(Interest.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class UserInterestRepository(BaseRepository[UserInterest]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UserInterest, session)

    async def get_by_profile(self, profile_id: uuid.UUID) -> list[UserInterest]:
        stmt = (
            select(UserInterest)
            .where(UserInterest.profile_id == profile_id)
            .options(selectinload(UserInterest.interest))
            .order_by(UserInterest.intensity_level.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_profile_and_interest(
        self, profile_id: uuid.UUID, interest_id: uuid.UUID
    ) -> UserInterest | None:
        stmt = (
            select(UserInterest)
            .where(
                UserInterest.profile_id == profile_id,
                UserInterest.interest_id == interest_id,
            )
            .options(selectinload(UserInterest.interest))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_profile(self, profile_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(UserInterest)
            .where(UserInterest.profile_id == profile_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

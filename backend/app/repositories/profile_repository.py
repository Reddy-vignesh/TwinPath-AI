"""
Decision Twin AI — Profile Repository.

Data access layer for StudentProfile entity.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import StudentProfile
from app.repositories.base import BaseRepository


class ProfileRepository(BaseRepository[StudentProfile]):
    """Repository for StudentProfile CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(StudentProfile, session)

    async def get_by_user_id(self, user_id: uuid.UUID) -> StudentProfile | None:
        """Get a profile by user ID (1:1 relationship)."""
        stmt = (
            select(StudentProfile)
            .where(StudentProfile.user_id == user_id)
            .options(
                selectinload(StudentProfile.skills),
                selectinload(StudentProfile.interests),
                selectinload(StudentProfile.academic_records),
                selectinload(StudentProfile.certifications),
                selectinload(StudentProfile.projects),
                selectinload(StudentProfile.psychometric_assessments),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id_light(self, user_id: uuid.UUID) -> StudentProfile | None:
        """Get profile without eager-loading relations (faster)."""
        stmt = select(StudentProfile).where(StudentProfile.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_completeness(
        self,
        profile_id: uuid.UUID,
        score: float,
        skills_count: int,
        projects_count: int,
        certifications_count: int,
    ) -> None:
        """Update the twin completeness metadata fields."""
        profile = await self.get_by_id(profile_id)
        if profile:
            profile.twin_completeness_score = score
            profile.total_skills_count = skills_count
            profile.total_projects_count = projects_count
            profile.total_certifications_count = certifications_count
            await self.session.flush()

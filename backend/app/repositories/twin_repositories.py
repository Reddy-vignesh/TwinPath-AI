"""
Decision Twin AI — Academic, Certification, Project, Career Repositories.

Grouped in one file as they share the same simple CRUD pattern
with profile-scoped queries.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.academic import AcademicRecord, CourseGrade
from app.models.career import Career
from app.models.certification import Certification
from app.models.project import Project
from app.repositories.base import BaseRepository


# ── Academic ──────────────────────────────────────────────────────


class AcademicRecordRepository(BaseRepository[AcademicRecord]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AcademicRecord, session)

    async def get_by_profile(self, profile_id: uuid.UUID) -> list[AcademicRecord]:
        stmt = (
            select(AcademicRecord)
            .where(AcademicRecord.profile_id == profile_id)
            .options(selectinload(AcademicRecord.course_grades))
            .order_by(AcademicRecord.start_date.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_profile(self, profile_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(AcademicRecord)
            .where(AcademicRecord.profile_id == profile_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()


class CourseGradeRepository(BaseRepository[CourseGrade]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(CourseGrade, session)

    async def get_by_record(self, record_id: uuid.UUID) -> list[CourseGrade]:
        stmt = (
            select(CourseGrade)
            .where(CourseGrade.academic_record_id == record_id)
            .order_by(CourseGrade.semester, CourseGrade.course_name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


# ── Certification ─────────────────────────────────────────────────


class CertificationRepository(BaseRepository[Certification]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Certification, session)

    async def get_by_profile(self, profile_id: uuid.UUID) -> list[Certification]:
        stmt = (
            select(Certification)
            .where(Certification.profile_id == profile_id)
            .order_by(Certification.issue_date.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_profile(self, profile_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(Certification)
            .where(Certification.profile_id == profile_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()


# ── Project ───────────────────────────────────────────────────────


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Project, session)

    async def get_by_profile(self, profile_id: uuid.UUID) -> list[Project]:
        stmt = (
            select(Project)
            .where(Project.profile_id == profile_id)
            .order_by(Project.start_date.desc().nullslast())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_profile(self, profile_id: uuid.UUID) -> int:
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(Project)
            .where(Project.profile_id == profile_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()


# ── Career ────────────────────────────────────────────────────────


class CareerRepository(BaseRepository[Career]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Career, session)

    async def get_by_title(self, title: str) -> Career | None:
        stmt = select(Career).where(Career.title == title)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self, query: str, category: str | None = None, limit: int = 20
    ) -> list[Career]:
        stmt = select(Career).where(
            Career.is_active.is_(True),
            Career.title.ilike(f"%{query}%"),
        )
        if category:
            stmt = stmt.where(Career.category == category)
        stmt = stmt.order_by(Career.title).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_category(
        self, category: str, limit: int = 50
    ) -> list[Career]:
        stmt = (
            select(Career)
            .where(Career.is_active.is_(True), Career.category == category)
            .order_by(Career.title)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_active(self, limit: int = 100) -> list[Career]:
        stmt = (
            select(Career)
            .where(Career.is_active.is_(True))
            .order_by(Career.category, Career.title)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

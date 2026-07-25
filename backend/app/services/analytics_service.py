"""
Decision Twin AI — Analytics Service.

Aggregates platform metrics for the admin dashboard:
- User stats and distribution
- Profile completeness distribution
- Skill popularity rankings
- Career catalog metrics
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import structlog
from sqlalchemy import Float, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.career import Career
from app.models.interest import Interest, UserInterest
from app.models.profile import StudentProfile
from app.models.skill import Skill, UserSkill
from app.models.user import User

logger = structlog.get_logger(__name__)


class AnalyticsService:
    """Service for platform analytics and metrics aggregation."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_dashboard(self) -> dict[str, Any]:
        """Generate the complete analytics dashboard."""
        overview = await self._get_overview()
        distribution = await self._get_user_distribution()
        completeness = await self._get_completeness_distribution()
        top_skills = await self._get_top_skills(limit=15)

        return {
            "overview": overview,
            "user_distribution": distribution,
            "completeness_distribution": completeness,
            "top_skills": top_skills,
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def _get_overview(self) -> dict[str, Any]:
        """Platform-level overview metrics."""
        # Total users
        total_users = (await self.session.execute(
            select(func.count()).select_from(User)
        )).scalar_one()

        # Active users
        active_users = (await self.session.execute(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        )).scalar_one()

        # Total profiles
        total_profiles = (await self.session.execute(
            select(func.count()).select_from(StudentProfile)
        )).scalar_one()

        # Profiles with at least 1 skill
        profiles_with_skills = (await self.session.execute(
            select(func.count(func.distinct(UserSkill.profile_id)))
            .select_from(UserSkill)
        )).scalar_one()

        # Average completeness
        avg_completeness_result = (await self.session.execute(
            select(func.avg(StudentProfile.twin_completeness_score))
        )).scalar_one()
        avg_completeness = float(avg_completeness_result or 0)

        # Total careers in catalog
        total_careers = (await self.session.execute(
            select(func.count()).select_from(Career).where(Career.is_active.is_(True))
        )).scalar_one()

        # Skills catalog size
        total_skills = (await self.session.execute(
            select(func.count()).select_from(Skill)
        )).scalar_one()

        # Interests catalog size
        total_interests = (await self.session.execute(
            select(func.count()).select_from(Interest)
        )).scalar_one()

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_profiles": total_profiles,
            "profiles_with_skills": profiles_with_skills,
            "avg_completeness": round(avg_completeness, 4),
            "total_careers": total_careers,
            "total_skills_catalog": total_skills,
            "total_interests_catalog": total_interests,
        }

    async def _get_user_distribution(self) -> dict[str, int]:
        """User count by role."""
        result = await self.session.execute(
            select(User.role, func.count())
            .group_by(User.role)
        )
        distribution = {row[0]: row[1] for row in result.all()}

        return {
            "students": distribution.get("student", 0),
            "counselors": distribution.get("counselor", 0),
            "admins": distribution.get("admin", 0),
        }

    async def _get_completeness_distribution(self) -> dict[str, Any]:
        """Distribution of twin completeness scores across profiles."""
        result = await self.session.execute(
            select(
                func.count(case(
                    (StudentProfile.twin_completeness_score >= 0.8, 1),
                )).label("excellent"),
                func.count(case(
                    (
                        StudentProfile.twin_completeness_score >= 0.6,
                        case(
                            (StudentProfile.twin_completeness_score < 0.8, 1),
                        ),
                    ),
                )).label("good"),
                func.count(case(
                    (
                        StudentProfile.twin_completeness_score >= 0.4,
                        case(
                            (StudentProfile.twin_completeness_score < 0.6, 1),
                        ),
                    ),
                )).label("moderate"),
                func.count(case(
                    (
                        StudentProfile.twin_completeness_score >= 0.2,
                        case(
                            (StudentProfile.twin_completeness_score < 0.4, 1),
                        ),
                    ),
                )).label("needs_work"),
                func.count(case(
                    (StudentProfile.twin_completeness_score < 0.2, 1),
                )).label("minimal"),
                func.avg(StudentProfile.twin_completeness_score).label("avg"),
            )
        )
        row = result.one()

        return {
            "excellent": row.excellent or 0,
            "good": row.good or 0,
            "moderate": row.moderate or 0,
            "needs_work": row.needs_work or 0,
            "minimal": row.minimal or 0,
            "avg_score": round(float(row.avg or 0), 4),
        }

    async def _get_top_skills(self, limit: int = 15) -> list[dict[str, Any]]:
        """Most popular skills across the platform."""
        result = await self.session.execute(
            select(
                Skill.name,
                Skill.category,
                func.count(UserSkill.id).label("user_count"),
                func.avg(cast(UserSkill.proficiency_level, Float)).label("avg_proficiency"),
            )
            .join(UserSkill, UserSkill.skill_id == Skill.id)
            .group_by(Skill.id, Skill.name, Skill.category)
            .order_by(func.count(UserSkill.id).desc())
            .limit(limit)
        )

        return [
            {
                "skill_name": row.name,
                "category": row.category,
                "user_count": row.user_count,
                "avg_proficiency": round(float(row.avg_proficiency or 0), 2),
            }
            for row in result.all()
        ]

    async def get_skill_analytics(self) -> dict[str, Any]:
        """Detailed skill analytics across the platform."""
        # Skills per category
        category_result = await self.session.execute(
            select(
                Skill.category,
                func.count(Skill.id).label("catalog_count"),
                func.count(func.distinct(UserSkill.profile_id)).label("users_with_category"),
            )
            .outerjoin(UserSkill, UserSkill.skill_id == Skill.id)
            .group_by(Skill.category)
            .order_by(func.count(Skill.id).desc())
        )

        categories = [
            {
                "category": row.category,
                "catalog_count": row.catalog_count,
                "users_with_category": row.users_with_category,
            }
            for row in category_result.all()
        ]

        # Average skills per user
        avg_skills = (await self.session.execute(
            select(func.avg(StudentProfile.total_skills_count))
        )).scalar_one()

        return {
            "categories": categories,
            "avg_skills_per_user": round(float(avg_skills or 0), 2),
        }

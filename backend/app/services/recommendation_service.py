"""
Decision Twin AI — Recommendation Service.

Orchestrates the recommendation flow:
1. Load user's Digital Twin data from DB
2. Serialize to feature engineering format
3. Run ML recommendation pipeline
4. Return enriched results

Also manages the career index lifecycle.
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.ml.recommender import RecommendationEngine
from app.ml.seed_data import CAREER_SEED_DATA
from app.ml.vector_store import CareerVectorStore
from app.repositories.profile_repository import ProfileRepository
from app.repositories.skill_repository import UserSkillRepository
from app.repositories.interest_repository import UserInterestRepository
from app.repositories.twin_repositories import (
    AcademicRecordRepository,
    CareerRepository,
    CertificationRepository,
    ProjectRepository,
)

logger = structlog.get_logger(__name__)

import asyncio

# ── Singleton vector store (shared across requests) ───────────────
_global_vector_store = CareerVectorStore()
_global_engine = RecommendationEngine(vector_store=_global_vector_store)
_index_built = False
_index_lock = asyncio.Lock()


def get_recommendation_engine() -> RecommendationEngine:
    """Get the singleton recommendation engine."""
    return _global_engine


async def ensure_index_built(session: AsyncSession) -> int:
    """
    Ensure the FAISS career index is built in a thread-safe manner.

    On first call, loads careers from DB (or falls back to seed data)
    and builds the FAISS index. Subsequent calls are no-ops.

    Returns the number of careers in the index.
    """
    global _index_built

    if _index_built and _global_vector_store.is_loaded:
        return _global_vector_store.size

    async with _index_lock:
        if _index_built and _global_vector_store.is_loaded:
            return _global_vector_store.size

        # Try loading from disk first
        if _global_vector_store.load():
            _index_built = True
            return _global_vector_store.size


    # Build from DB careers or seed data
    career_repo = CareerRepository(session)
    db_careers = await career_repo.get_all_active(limit=1000)

    if db_careers:
        career_dicts = [
            {
                "id": str(c.id),
                "title": c.title,
                "category": c.category,
                "short_description": c.short_description,
                "description": c.description,
                "median_salary_usd": c.median_salary_usd,
                "salary_range_low": c.salary_range_low,
                "salary_range_high": c.salary_range_high,
                "growth_rate_percent": c.growth_rate_percent,
                "automation_risk_percent": c.automation_risk_percent,
                "market_demand": c.market_demand,
                "job_outlook": c.job_outlook,
                "required_education": c.required_education,
                "typical_experience_years": c.typical_experience_years,
                "required_skills": c.required_skills or {},
                "preferred_skills": c.preferred_skills or {},
                "required_certifications": c.required_certifications or [],
                "related_careers": c.related_careers or [],
                "work_environment": c.work_environment,
            }
            for c in db_careers
        ]
        logger.info("Building index from DB careers", count=len(career_dicts))
    else:
        # Fall back to seed data
        career_dicts = CAREER_SEED_DATA
        logger.info("Building index from seed data", count=len(career_dicts))

    count = _global_engine.build_career_index(career_dicts)
    _index_built = True

    # Try to save to disk for next startup
    try:
        _global_vector_store.save()
    except Exception as exc:
        logger.warning("Failed to save FAISS index", error=str(exc))

    return count


class RecommendationService:
    """
    Service layer for career recommendations.

    Loads the user's complete Digital Twin data and runs it through
    the ML recommendation pipeline.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.profile_repo = ProfileRepository(session)
        self.skill_repo = UserSkillRepository(session)
        self.interest_repo = UserInterestRepository(session)
        self.academic_repo = AcademicRecordRepository(session)
        self.certification_repo = CertificationRepository(session)
        self.project_repo = ProjectRepository(session)
        self.engine = get_recommendation_engine()

    async def get_recommendations(
        self,
        user_id: uuid.UUID,
        top_k: int = 10,
        include_skill_gap: bool = True,
        include_explanation: bool = True,
    ) -> dict[str, Any]:
        """
        Generate career recommendations for a user.

        Loads all Digital Twin data, builds the 216D vector,
        and runs the full recommendation pipeline.
        """
        # Ensure the FAISS index is built
        await ensure_index_built(self.session)

        # Check profile exists — return empty gracefully for new users (no 404 crash)
        profile_check = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile_check:
            return {
                "recommendations": [],
                "total_careers_in_index": 0,
                "message": "Add skills and goals to your profile to generate personalized career matches.",
            }

        # Load complete profile data
        profile_data = await self._load_twin_data(user_id)

        # Run the recommendation engine
        result = self.engine.recommend(
            profile_data=profile_data,
            top_k=top_k,
            include_skill_gap=include_skill_gap,
            include_explanation=include_explanation,
        )

        return result


    async def rebuild_index(self) -> int:
        """Force rebuild the FAISS career index from DB."""
        global _index_built
        _index_built = False
        return await ensure_index_built(self.session)

    async def _load_twin_data(self, user_id: uuid.UUID) -> dict[str, Any]:
        """
        Load complete Digital Twin data for a user from DB.

        Serializes all models into the dict format expected
        by the feature engineering pipeline.
        """
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")


        # Profile base data
        profile_dict = {
            "current_cgpa": profile.current_cgpa,
            "highest_degree": profile.highest_degree,
            "current_major": profile.current_major,
            "current_university": profile.current_university,
            "graduation_year": profile.graduation_year,
            "career_goal_primary": profile.career_goal_primary,
            "career_goal_secondary": profile.career_goal_secondary,
            "preferred_industry": profile.preferred_industry,
            "willing_to_relocate": profile.willing_to_relocate,
            "preferred_work_style": profile.preferred_work_style,
        }

        # Skills
        user_skills = await self.skill_repo.get_by_profile(profile.id)
        skills_list = [
            {
                "name": us.skill.name if us.skill else "",
                "category": us.skill.category if us.skill else "other",
                "proficiency_level": us.proficiency_level,
                "years_experience": us.years_experience,
                "is_primary": us.is_primary,
            }
            for us in user_skills
        ]

        # Interests
        user_interests = await self.interest_repo.get_by_profile(profile.id)
        interests_list = [
            {
                "name": ui.interest.name if ui.interest else "",
                "category": ui.interest.category if ui.interest else "other",
                "intensity_level": ui.intensity_level,
            }
            for ui in user_interests
        ]

        # Academics
        records = await self.academic_repo.get_by_profile(profile.id)
        academics_list = [
            {
                "institution": r.institution,
                "degree": r.degree,
                "major": r.major,
                "cgpa": r.cgpa,
                "max_cgpa": r.max_cgpa,
                "is_current": r.is_current,
                "course_grades": [
                    {
                        "course_name": cg.course_name,
                        "grade": cg.grade,
                        "credits": cg.credits,
                        "semester": cg.semester,
                    }
                    for cg in (r.course_grades or [])
                ],
            }
            for r in records
        ]

        # Certifications
        certs = await self.certification_repo.get_by_profile(profile.id)
        certs_list = [
            {
                "name": c.name,
                "issuing_organization": c.issuing_organization,
                "issue_date": c.issue_date,
                "expiry_date": c.expiry_date,
                "is_verified": c.is_verified,
            }
            for c in certs
        ]

        # Projects
        projects = await self.project_repo.get_by_profile(profile.id)
        projects_list = [
            {
                "title": p.title,
                "technologies": p.technologies or [],
                "role": p.role,
                "team_size": p.team_size,
                "is_ongoing": p.is_ongoing,
                "start_date": p.start_date,
                "end_date": p.end_date,
            }
            for p in projects
        ]

        # Psychometrics (from eager-loaded profile)
        psychometrics_list = [
            {
                "assessment_type": a.assessment_type,
                "openness": a.openness,
                "conscientiousness": a.conscientiousness,
                "extraversion": a.extraversion,
                "agreeableness": a.agreeableness,
                "neuroticism": a.neuroticism,
                "risk_tolerance": a.risk_tolerance,
                "creativity_score": a.creativity_score,
                "leadership_score": a.leadership_score,
                "analytical_score": a.analytical_score,
                "communication_score": a.communication_score,
            }
            for a in (profile.psychometric_assessments or [])
        ]

        return {
            "profile": profile_dict,
            "skills": skills_list,
            "interests": interests_list,
            "academics": academics_list,
            "certifications": certs_list,
            "projects": projects_list,
            "psychometrics": psychometrics_list,
            "behaviors": [],  # Loaded separately for performance
        }

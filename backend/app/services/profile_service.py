"""
Decision Twin AI — Profile Service.

Business logic for:
- Profile CRUD
- Twin completeness score calculation
- Profile-scoped sub-entity management
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.profile import StudentProfile
from app.repositories.profile_repository import ProfileRepository
from app.repositories.skill_repository import UserSkillRepository
from app.repositories.interest_repository import UserInterestRepository
from app.repositories.twin_repositories import (
    AcademicRecordRepository,
    CertificationRepository,
    ProjectRepository,
)
from app.schemas.profile import ProfileCreate, ProfileUpdate

logger = structlog.get_logger(__name__)


class ProfileService:
    """Service layer for StudentProfile operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.profile_repo = ProfileRepository(session)
        self.skill_repo = UserSkillRepository(session)
        self.interest_repo = UserInterestRepository(session)
        self.academic_repo = AcademicRecordRepository(session)
        self.certification_repo = CertificationRepository(session)
        self.project_repo = ProjectRepository(session)

    async def create_profile(
        self, user_id: uuid.UUID, data: ProfileCreate
    ) -> StudentProfile:
        """Create a new student profile for a user."""
        existing = await self.profile_repo.get_by_user_id_light(user_id)
        if existing:
            raise ConflictException(message="Profile already exists for this user.")

        profile = StudentProfile(
            user_id=user_id,
            **data.model_dump(exclude_unset=True),
        )
        created = await self.profile_repo.create(profile)
        await self.session.commit()

        logger.info("Profile created", user_id=str(user_id), profile_id=str(created.id))
        return created

    async def get_profile(self, user_id: uuid.UUID) -> StudentProfile:
        """Get a user's profile with all relations loaded."""
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")
        return profile

    async def get_profile_light(self, user_id: uuid.UUID) -> StudentProfile:
        """Get profile without eager-loading (for quick checks)."""
        profile = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")
        return profile

    async def update_profile(
        self, user_id: uuid.UUID, data: ProfileUpdate
    ) -> StudentProfile:
        """Update profile fields."""
        profile = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        await self.session.flush()
        await self._recalculate_completeness(profile)
        await self.session.commit()
        await self.session.refresh(profile)

        logger.info("Profile updated", user_id=str(user_id))
        return profile

    async def delete_profile(self, user_id: uuid.UUID) -> None:
        """Delete a user's profile and all associated data (cascade)."""
        profile = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")

        await self.profile_repo.delete(profile.id)
        await self.session.commit()
        logger.info("Profile deleted", user_id=str(user_id))

    async def recalculate_completeness(self, user_id: uuid.UUID) -> dict[str, Any]:
        """
        Recalculate and return the twin completeness score.

        Completeness is a weighted average of how many data sections
        have been filled in, weighted by their importance.
        """
        profile = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found.")

        result = await self._recalculate_completeness(profile)
        await self.session.commit()
        return result

    async def _recalculate_completeness(
        self, profile: StudentProfile
    ) -> dict[str, Any]:
        """Internal completeness calculation."""
        dimensions: dict[str, float] = {}
        missing: list[str] = []
        suggestions: list[str] = []

        # Personal info (weight: 10%)
        personal_fields = [
            profile.date_of_birth, profile.gender, profile.location,
            profile.bio, profile.phone,
        ]
        personal_score = sum(1 for f in personal_fields if f) / len(personal_fields)
        dimensions["personal_info"] = personal_score
        if personal_score < 1.0:
            missing.append("personal_info")
            suggestions.append("Complete your personal information for better recommendations.")

        # Academic (weight: 20%)
        academic_count = await self.academic_repo.count_by_profile(profile.id)
        academic_score = min(1.0, academic_count / 1.0)  # At least 1 record
        dimensions["academics"] = academic_score
        if academic_score < 1.0:
            missing.append("academics")
            suggestions.append("Add your academic history to improve career matching.")

        # Skills (weight: 25%)
        skills_count = await self.skill_repo.count_by_profile(profile.id)
        skills_score = min(1.0, skills_count / 5.0)  # At least 5 skills
        dimensions["skills"] = skills_score
        if skills_score < 1.0:
            missing.append("skills")
            suggestions.append(f"Add {max(0, 5 - skills_count)} more skills to reach the minimum.")

        # Interests (weight: 10%)
        interests_count = await self.interest_repo.count_by_profile(profile.id)
        interests_score = min(1.0, interests_count / 3.0)  # At least 3 interests
        dimensions["interests"] = interests_score
        if interests_score < 1.0:
            missing.append("interests")
            suggestions.append("Share your interests to get more personalized suggestions.")

        # Projects (weight: 15%)
        projects_count = await self.project_repo.count_by_profile(profile.id)
        projects_score = min(1.0, projects_count / 2.0)  # At least 2 projects
        dimensions["projects"] = projects_score
        if projects_score < 1.0:
            missing.append("projects")
            suggestions.append("Add projects to showcase your practical experience.")

        # Certifications (weight: 10%)
        certs_count = await self.certification_repo.count_by_profile(profile.id)
        certs_score = min(1.0, certs_count / 1.0)  # At least 1 cert
        dimensions["certifications"] = certs_score
        if certs_score < 1.0:
            missing.append("certifications")
            suggestions.append("Add certifications to strengthen your profile.")

        # Career goals (weight: 10%)
        goals_fields = [profile.career_goal_primary, profile.preferred_industry]
        goals_score = sum(1 for f in goals_fields if f) / len(goals_fields)
        dimensions["career_goals"] = goals_score
        if goals_score < 1.0:
            missing.append("career_goals")
            suggestions.append("Define your career goals for targeted recommendations.")

        # Weighted overall score
        weights = {
            "personal_info": 0.10,
            "academics": 0.20,
            "skills": 0.25,
            "interests": 0.10,
            "projects": 0.15,
            "certifications": 0.10,
            "career_goals": 0.10,
        }
        overall = sum(
            dimensions[dim] * weight for dim, weight in weights.items()
        )

        # Update profile
        await self.profile_repo.update_completeness(
            profile_id=profile.id,
            score=overall,
            skills_count=skills_count,
            projects_count=projects_count,
            certifications_count=certs_count,
        )

        return {
            "overall_score": round(overall, 4),
            "dimensions": {k: round(v, 4) for k, v in dimensions.items()},
            "missing_sections": missing,
            "suggestions": suggestions,
        }

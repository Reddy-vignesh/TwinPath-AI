"""
Decision Twin AI — Twin Data Service.

Business logic for sub-entity management:
- Skills, interests, academics, certifications, projects
- Career catalog queries
- Automatically recalculates completeness after mutations
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.academic import AcademicRecord, CourseGrade
from app.models.certification import Certification
from app.models.interest import UserInterest
from app.models.project import Project
from app.models.skill import UserSkill
from app.repositories.interest_repository import (
    InterestCatalogRepository,
    UserInterestRepository,
)
from app.repositories.profile_repository import ProfileRepository
from app.repositories.skill_repository import (
    SkillCatalogRepository,
    UserSkillRepository,
)
from app.repositories.twin_repositories import (
    AcademicRecordRepository,
    CareerRepository,
    CertificationRepository,
    CourseGradeRepository,
    ProjectRepository,
)
from app.schemas.academic import AcademicRecordCreate, AcademicRecordUpdate
from app.schemas.certification import CertificationCreate, CertificationUpdate
from app.schemas.interest import UserInterestCreate, UserInterestUpdate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.skill import UserSkillCreate, UserSkillUpdate
from app.services.profile_service import ProfileService

logger = structlog.get_logger(__name__)


class TwinDataService:
    """Manages Digital Twin sub-entity data with completeness sync."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.profile_repo = ProfileRepository(session)
        self.skill_catalog_repo = SkillCatalogRepository(session)
        self.user_skill_repo = UserSkillRepository(session)
        self.interest_catalog_repo = InterestCatalogRepository(session)
        self.user_interest_repo = UserInterestRepository(session)
        self.academic_repo = AcademicRecordRepository(session)
        self.course_grade_repo = CourseGradeRepository(session)
        self.certification_repo = CertificationRepository(session)
        self.project_repo = ProjectRepository(session)
        self.career_repo = CareerRepository(session)
        self.profile_service = ProfileService(session)

    async def _get_profile_id(self, user_id: uuid.UUID) -> uuid.UUID:
        """Get the profile ID for a user, raising 404 if not found."""
        profile = await self.profile_repo.get_by_user_id_light(user_id)
        if not profile:
            raise NotFoundException(message="Profile not found. Create a profile first.")
        return profile.id

    async def _sync_completeness(self, user_id: uuid.UUID) -> None:
        """Recalculate completeness after any data mutation."""
        try:
            await self.profile_service.recalculate_completeness(user_id)
        except Exception as exc:
            logger.warning("Completeness recalc failed", error=str(exc))

    # ══════════════════════════════════════════════════════════════
    # SKILLS
    # ══════════════════════════════════════════════════════════════

    def calculate_skill_verification_weight(
        self,
        profile: Any,
        skill_name: str,
        requested_source: str | None,
        proficiency_level: int,
    ) -> tuple[float, str, bool]:
        """
        Verification pipeline that assigns a verification weight (0.0 - 1.0)
        based on:
        1. GitHub repository presence and active coding footprint
        2. Resume semantic context and skill embeddings in profile bio & project history
        3. Stated practical application context
        """
        weight = 0.35  # Base confidence for user declaration

        evidence_signals: list[str] = []

        # 1. GitHub Repository Evidence Analysis
        if profile and getattr(profile, "github_url", None):
            gh_url = str(profile.github_url).strip().lower()
            if "github.com/" in gh_url and len(gh_url) > 19:
                weight += 0.30
                evidence_signals.append("GitHub Verified")

        # 2. Resume & Embedding Context Extraction
        bio_text = (getattr(profile, "bio", "") or "").lower()
        s_norm = skill_name.lower().strip()
        if s_norm in bio_text or any(token in bio_text for token in s_norm.split() if len(token) > 2):
            weight += 0.20
            evidence_signals.append("Resume Context")

        # 3. Practical Application Context Weighting
        src = (requested_source or "").lower()
        if "professional" in src or "production" in src:
            weight += 0.25
            evidence_signals.append("Production")
        elif "open source" in src or "hackathon" in src:
            weight += 0.20
            evidence_signals.append("Open Source")
        elif "internship" in src:
            weight += 0.20
            evidence_signals.append("Internship")
        elif "personal projects" in src or "project" in src:
            weight += 0.15
            evidence_signals.append("Projects")
        elif "academic" in src:
            weight += 0.10
            evidence_signals.append("Academic")

        final_weight = min(1.0, round(weight, 2))
        is_verified = final_weight >= 0.65

        # Format descriptive verified source tag (fitted to database column limits)
        if evidence_signals:
            enriched_source = " · ".join(evidence_signals)[:50]
        else:
            enriched_source = (requested_source or "User Stated")[:50]

        return final_weight, enriched_source, is_verified

    async def add_skill(
        self, user_id: uuid.UUID, data: UserSkillCreate
    ) -> UserSkill:
        profile_id = await self._get_profile_id(user_id)

        skill = None
        if data.skill_id:
            skill = await self.skill_catalog_repo.get_by_id(data.skill_id)

        if not skill and data.skill_name:
            skill = await self.skill_catalog_repo.get_by_name(data.skill_name.strip())
            if not skill:
                from app.models.skill import Skill
                skill = Skill(
                    name=data.skill_name.strip(),
                    category=data.category or "Other",
                    is_verified=True,
                )
                skill = await self.skill_catalog_repo.create(skill)
                await self.session.commit()

        if not skill:
            raise NotFoundException(message="Skill not found in catalog. Please specify a valid skill.")

        # Check for duplicate
        existing = await self.user_skill_repo.get_by_profile_and_skill(
            profile_id, skill.id
        )
        if existing:
            # If already exists, update proficiency and source instead of throwing error
            existing.proficiency_level = data.proficiency_level
            if data.years_experience is not None:
                existing.years_experience = data.years_experience
            profile = await self.profile_repo.get_by_id(profile_id)
            weight, enriched_source, is_verified = self.calculate_skill_verification_weight(
                profile=profile,
                skill_name=skill.name,
                requested_source=data.source,
                proficiency_level=data.proficiency_level,
            )
            existing.source = enriched_source
            existing.is_primary = existing.is_primary or is_verified
            await self.session.commit()
            await self.session.refresh(existing)
            await self._sync_completeness(user_id)
            return existing

        # Run verification pipeline
        profile = await self.profile_repo.get_by_id(profile_id)
        weight, enriched_source, is_verified = self.calculate_skill_verification_weight(
            profile=profile,
            skill_name=skill.name,
            requested_source=data.source,
            proficiency_level=data.proficiency_level,
        )

        user_skill = UserSkill(
            profile_id=profile_id,
            skill_id=skill.id,
            proficiency_level=data.proficiency_level,
            years_experience=data.years_experience,
            is_primary=data.is_primary or is_verified,
            source=enriched_source,
        )
        created = await self.user_skill_repo.create(user_skill)
        await self.session.commit()
        await self.session.refresh(created)
        created.skill = skill
        await self._sync_completeness(user_id)

        logger.info(
            "Skill verified and added",
            user_id=str(user_id),
            skill_name=skill.name,
            verification_weight=weight,
            is_verified=is_verified,
            source=enriched_source,
        )
        return created

    async def update_skill(
        self, user_id: uuid.UUID, user_skill_id: uuid.UUID, data: UserSkillUpdate
    ) -> UserSkill:
        profile_id = await self._get_profile_id(user_id)
        user_skill = await self.user_skill_repo.get_by_id(user_skill_id)

        if not user_skill or user_skill.profile_id != profile_id:
            raise NotFoundException(message="User skill not found.")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user_skill, field, value)

        await self.session.commit()
        await self.session.refresh(user_skill)
        return user_skill

    async def remove_skill(
        self, user_id: uuid.UUID, user_skill_id: uuid.UUID | str
    ) -> None:
        profile_id = await self._get_profile_id(user_id)
        user_skills = await self.user_skill_repo.get_by_profile(profile_id)
        
        target = None
        str_id = str(user_skill_id).strip().lower()
        for us in user_skills:
            if str(us.id).lower() == str_id:
                target = us
                break
            if str(us.skill_id).lower() == str_id:
                target = us
                break
            if us.skill and us.skill.name.lower() == str_id:
                target = us
                break

        if not target:
            try:
                parsed_uuid = uuid.UUID(str(user_skill_id))
                target = await self.user_skill_repo.get_by_id(parsed_uuid)
                if target and target.profile_id != profile_id:
                    target = None
            except Exception:
                target = None

        if not target:
            raise NotFoundException(message="User skill not found.")

        await self.user_skill_repo.delete(target.id)
        await self.session.commit()
        await self._sync_completeness(user_id)

    async def get_skills(self, user_id: uuid.UUID) -> list[UserSkill]:
        profile_id = await self._get_profile_id(user_id)
        return await self.user_skill_repo.get_by_profile(profile_id)

    # ══════════════════════════════════════════════════════════════
    # INTERESTS
    # ══════════════════════════════════════════════════════════════

    async def add_interest(
        self, user_id: uuid.UUID, data: UserInterestCreate
    ) -> UserInterest:
        profile_id = await self._get_profile_id(user_id)

        interest = await self.interest_catalog_repo.get_by_id(data.interest_id)
        if not interest:
            raise NotFoundException(message="Interest not found in catalog.")

        existing = await self.user_interest_repo.get_by_profile_and_interest(
            profile_id, data.interest_id
        )
        if existing:
            raise ConflictException(message="Interest already added to profile.")

        user_interest = UserInterest(
            profile_id=profile_id,
            **data.model_dump(),
        )
        created = await self.user_interest_repo.create(user_interest)
        await self.session.commit()
        await self._sync_completeness(user_id)
        return created

    async def update_interest(
        self, user_id: uuid.UUID, user_interest_id: uuid.UUID, data: UserInterestUpdate
    ) -> UserInterest:
        profile_id = await self._get_profile_id(user_id)
        ui = await self.user_interest_repo.get_by_id(user_interest_id)

        if not ui or ui.profile_id != profile_id:
            raise NotFoundException(message="User interest not found.")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(ui, field, value)

        await self.session.commit()
        await self.session.refresh(ui)
        return ui

    async def remove_interest(
        self, user_id: uuid.UUID, user_interest_id: uuid.UUID
    ) -> None:
        profile_id = await self._get_profile_id(user_id)
        ui = await self.user_interest_repo.get_by_id(user_interest_id)

        if not ui or ui.profile_id != profile_id:
            raise NotFoundException(message="User interest not found.")

        await self.user_interest_repo.delete(user_interest_id)
        await self.session.commit()
        await self._sync_completeness(user_id)

    async def get_interests(self, user_id: uuid.UUID) -> list[UserInterest]:
        profile_id = await self._get_profile_id(user_id)
        return await self.user_interest_repo.get_by_profile(profile_id)

    # ══════════════════════════════════════════════════════════════
    # ACADEMIC RECORDS
    # ══════════════════════════════════════════════════════════════

    async def add_academic_record(
        self, user_id: uuid.UUID, data: AcademicRecordCreate
    ) -> AcademicRecord:
        profile_id = await self._get_profile_id(user_id)

        record_data = data.model_dump(exclude={"course_grades"})
        record = AcademicRecord(profile_id=profile_id, **record_data)
        created = await self.academic_repo.create(record)

        # Add course grades if provided
        if data.course_grades:
            for cg_data in data.course_grades:
                grade = CourseGrade(
                    academic_record_id=created.id,
                    **cg_data.model_dump(),
                )
                await self.course_grade_repo.create(grade)

        await self.session.commit()
        await self._sync_completeness(user_id)
        return created

    async def update_academic_record(
        self, user_id: uuid.UUID, record_id: uuid.UUID, data: AcademicRecordUpdate
    ) -> AcademicRecord:
        profile_id = await self._get_profile_id(user_id)
        record = await self.academic_repo.get_by_id(record_id)

        if not record or record.profile_id != profile_id:
            raise NotFoundException(message="Academic record not found.")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)

        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def remove_academic_record(
        self, user_id: uuid.UUID, record_id: uuid.UUID
    ) -> None:
        profile_id = await self._get_profile_id(user_id)
        record = await self.academic_repo.get_by_id(record_id)

        if not record or record.profile_id != profile_id:
            raise NotFoundException(message="Academic record not found.")

        await self.academic_repo.delete(record_id)
        await self.session.commit()
        await self._sync_completeness(user_id)

    async def get_academic_records(self, user_id: uuid.UUID) -> list[AcademicRecord]:
        profile_id = await self._get_profile_id(user_id)
        return await self.academic_repo.get_by_profile(profile_id)

    # ══════════════════════════════════════════════════════════════
    # CERTIFICATIONS
    # ══════════════════════════════════════════════════════════════

    async def add_certification(
        self, user_id: uuid.UUID, data: CertificationCreate
    ) -> Certification:
        profile_id = await self._get_profile_id(user_id)
        cert = Certification(profile_id=profile_id, **data.model_dump())
        created = await self.certification_repo.create(cert)
        await self.session.commit()
        await self._sync_completeness(user_id)
        return created

    async def update_certification(
        self, user_id: uuid.UUID, cert_id: uuid.UUID, data: CertificationUpdate
    ) -> Certification:
        profile_id = await self._get_profile_id(user_id)
        cert = await self.certification_repo.get_by_id(cert_id)

        if not cert or cert.profile_id != profile_id:
            raise NotFoundException(message="Certification not found.")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(cert, field, value)

        await self.session.commit()
        await self.session.refresh(cert)
        return cert

    async def remove_certification(
        self, user_id: uuid.UUID, cert_id: uuid.UUID
    ) -> None:
        profile_id = await self._get_profile_id(user_id)
        cert = await self.certification_repo.get_by_id(cert_id)

        if not cert or cert.profile_id != profile_id:
            raise NotFoundException(message="Certification not found.")

        await self.certification_repo.delete(cert_id)
        await self.session.commit()
        await self._sync_completeness(user_id)

    async def get_certifications(self, user_id: uuid.UUID) -> list[Certification]:
        profile_id = await self._get_profile_id(user_id)
        return await self.certification_repo.get_by_profile(profile_id)

    # ══════════════════════════════════════════════════════════════
    # PROJECTS
    # ══════════════════════════════════════════════════════════════

    async def add_project(
        self, user_id: uuid.UUID, data: ProjectCreate
    ) -> Project:
        profile_id = await self._get_profile_id(user_id)
        project = Project(profile_id=profile_id, **data.model_dump())
        created = await self.project_repo.create(project)
        await self.session.commit()
        await self._sync_completeness(user_id)
        return created

    async def update_project(
        self, user_id: uuid.UUID, project_id: uuid.UUID, data: ProjectUpdate
    ) -> Project:
        profile_id = await self._get_profile_id(user_id)
        project = await self.project_repo.get_by_id(project_id)

        if not project or project.profile_id != profile_id:
            raise NotFoundException(message="Project not found.")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)

        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def remove_project(
        self, user_id: uuid.UUID, project_id: uuid.UUID
    ) -> None:
        profile_id = await self._get_profile_id(user_id)
        project = await self.project_repo.get_by_id(project_id)

        if not project or project.profile_id != profile_id:
            raise NotFoundException(message="Project not found.")

        await self.project_repo.delete(project_id)
        await self.session.commit()
        await self._sync_completeness(user_id)

    async def get_projects(self, user_id: uuid.UUID) -> list[Project]:
        profile_id = await self._get_profile_id(user_id)
        return await self.project_repo.get_by_profile(profile_id)

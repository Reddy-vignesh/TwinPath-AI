"""
Decision Twin AI — Student Profile Model.

The central profile entity connecting all Digital Twin data.
One-to-one with User. One-to-many with skills, interests,
academics, certifications, projects, psychometrics, behaviors.

The twin_completeness_score is recalculated whenever any
associated data changes, providing a real-time measure of
how complete the student's Digital Twin representation is.
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import (
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import (
    BIO_MAX_LENGTH,
    CGPA_MAX,
    CGPA_MIN,
    NAME_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    URL_MAX_LENGTH,
)
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin


class StudentProfile(UUIDMixin, TimestampMixin, Base):
    """
    Student profile — the core of the Digital Twin.

    Aggregates all personal, academic, and career data
    into a unified profile that drives recommendations.
    """

    __tablename__ = "student_profiles"

    # ── User Link ──────────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Personal ───────────────────────────────────────────────
    date_of_birth: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    gender: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    location: Mapped[str | None] = mapped_column(
        String(NAME_MAX_LENGTH), nullable=True
    )
    bio: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    linkedin_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    github_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    portfolio_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    resume_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )

    # ── Academic Summary ───────────────────────────────────────
    current_cgpa: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    highest_degree: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    current_major: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    current_university: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    graduation_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    # ── Career Goals ───────────────────────────────────────────
    career_goal_primary: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    career_goal_secondary: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    preferred_industry: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    willing_to_relocate: Mapped[bool | None] = mapped_column(
        nullable=True
    )
    preferred_work_style: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ── Twin Metadata ──────────────────────────────────────────
    twin_completeness_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    total_skills_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    total_projects_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    total_certifications_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # ── Relationships ──────────────────────────────────────────
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="profile", lazy="selectin"
    )
    skills: Mapped[list["UserSkill"]] = relationship(  # noqa: F821
        "UserSkill", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )
    interests: Mapped[list["UserInterest"]] = relationship(  # noqa: F821
        "UserInterest", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )
    academic_records: Mapped[list["AcademicRecord"]] = relationship(  # noqa: F821
        "AcademicRecord", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )
    certifications: Mapped[list["Certification"]] = relationship(  # noqa: F821
        "Certification", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )
    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        "Project", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )
    psychometric_assessments: Mapped[list["PsychometricAssessment"]] = relationship(  # noqa: F821
        "PsychometricAssessment", back_populates="profile",
        cascade="all, delete-orphan", lazy="selectin",
    )

    __table_args__ = (
        Index("ix_student_profiles_completeness", "twin_completeness_score"),
    )

    def __repr__(self) -> str:
        return (
            f"<StudentProfile(id={self.id}, user_id={self.user_id}, "
            f"completeness={self.twin_completeness_score:.0%})>"
        )

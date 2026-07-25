"""
Decision Twin AI — Academic Record Models.

Tracks educational history with granular course-level data.
- AcademicRecord: Degree/institution level
- CourseGrade: Individual course grades within a record
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import NAME_MAX_LENGTH, TITLE_MAX_LENGTH
from app.models.base import Base, TimestampMixin, UUIDMixin


class AcademicRecord(UUIDMixin, TimestampMixin, Base):
    """
    Academic record representing a degree or educational stint.

    A student may have multiple academic records
    (e.g., high school, bachelor's, master's).
    """

    __tablename__ = "academic_records"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    institution: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    degree: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    major: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    minor: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=True
    )
    cgpa: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    max_cgpa: Mapped[float] = mapped_column(
        Float, nullable=False, default=10.0
    )
    start_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    is_current: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    achievements: Mapped[str | None] = mapped_column(
        String(2000), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="academic_records",
    )
    course_grades: Mapped[list["CourseGrade"]] = relationship(
        "CourseGrade", back_populates="academic_record",
        cascade="all, delete-orphan", lazy="selectin",
    )

    __table_args__ = (
        Index("ix_academic_records_profile", "profile_id"),
        Index("ix_academic_records_degree", "degree"),
    )

    def __repr__(self) -> str:
        return (
            f"<AcademicRecord(id={self.id}, degree={self.degree}, "
            f"institution={self.institution})>"
        )


class CourseGrade(UUIDMixin, Base):
    """Individual course grade within an academic record."""

    __tablename__ = "course_grades"

    academic_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("academic_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_name: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    course_code: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    grade: Mapped[str] = mapped_column(
        String(10), nullable=False
    )
    credits: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    semester: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    academic_record: Mapped[AcademicRecord] = relationship(
        "AcademicRecord", back_populates="course_grades",
    )

    __table_args__ = (
        Index("ix_course_grades_record", "academic_record_id"),
    )

    def __repr__(self) -> str:
        return f"<CourseGrade(course={self.course_name}, grade={self.grade})>"

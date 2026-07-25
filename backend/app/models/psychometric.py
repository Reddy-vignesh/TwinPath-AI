"""
Decision Twin AI — Psychometric Assessment Model.

Records psychometric assessment results for personality-career matching.
Supports Big Five, MBTI, Holland Code, and custom assessments.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AssessmentType
from app.models.base import Base, UUIDMixin


class PsychometricAssessment(UUIDMixin, Base):
    """
    Psychometric assessment results.

    Stores personality traits that contribute to
    the psychometric dimensions of the 216D feature vector.
    """

    __tablename__ = "psychometric_assessments"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    assessment_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=AssessmentType.BIG_FIVE.value,
    )

    # ── Big Five Personality Traits (0.0 - 1.0) ───────────────
    openness: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    conscientiousness: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    extraversion: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    agreeableness: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    neuroticism: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ── Additional Traits ──────────────────────────────────────
    risk_tolerance: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    creativity_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    leadership_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    analytical_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    communication_score: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ── Extended Results ───────────────────────────────────────
    raw_results: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )

    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="psychometric_assessments",
    )

    __table_args__ = (
        Index("ix_psychometric_profile", "profile_id"),
        Index("ix_psychometric_type", "assessment_type"),
        Index("ix_psychometric_assessed", "assessed_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<PsychometricAssessment(id={self.id}, "
            f"type={self.assessment_type})>"
        )

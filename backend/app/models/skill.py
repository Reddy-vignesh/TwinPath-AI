"""
Decision Twin AI — Skill Models.

Two-table design:
- Skill: Master catalog of all skills (shared across users)
- UserSkill: Junction table linking users to skills with proficiency

This avoids duplicating skill definitions and enables
skill-based analytics across the platform.
"""

from __future__ import annotations

import uuid

from sqlalchemy import (
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import (
    NAME_MAX_LENGTH,
    PROFICIENCY_MAX,
    PROFICIENCY_MIN,
    TITLE_MAX_LENGTH,
    SkillCategory,
)
from app.models.base import Base, GUID, TimestampMixin, UUIDMixin


class Skill(UUIDMixin, TimestampMixin, Base):
    """
    Master skill catalog entry.

    Shared across all users. Created by admins or via seed data.
    """

    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(
        String(NAME_MAX_LENGTH),
        unique=True,
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=SkillCategory.OTHER.value,
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    is_verified: Mapped[bool] = mapped_column(
        nullable=False, default=True
    )

    # ── Relationships ──────────────────────────────────────────
    user_skills: Mapped[list["UserSkill"]] = relationship(
        "UserSkill", back_populates="skill", lazy="noload",
    )

    __table_args__ = (
        Index("ix_skills_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name={self.name}, category={self.category})>"


class UserSkill(UUIDMixin, TimestampMixin, Base):
    """
    User-skill association with proficiency rating.

    Each user can have each skill once with a proficiency level (1-10).
    ON CONFLICT upsert is supported via the unique constraint.
    """

    __tablename__ = "user_skills"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
    )
    proficiency_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=PROFICIENCY_MIN,
    )
    years_experience: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    is_primary: Mapped[bool] = mapped_column(
        nullable=False, default=False
    )
    source: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="skills",
    )
    skill: Mapped[Skill] = relationship(
        "Skill", back_populates="user_skills", lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("profile_id", "skill_id", name="uq_user_skill"),
        Index("ix_user_skills_profile", "profile_id"),
        Index("ix_user_skills_skill", "skill_id"),
        Index("ix_user_skills_proficiency", "proficiency_level"),
    )

    def __repr__(self) -> str:
        return (
            f"<UserSkill(profile={self.profile_id}, skill={self.skill_id}, "
            f"level={self.proficiency_level})>"
        )

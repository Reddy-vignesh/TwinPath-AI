"""
Decision Twin AI — Project Model.

Tracks projects completed by students, including
technologies used, role, and impact description.
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import (
    DESCRIPTION_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    URL_MAX_LENGTH,
)
from app.models.base import Base, TimestampMixin, UUIDMixin


class Project(UUIDMixin, TimestampMixin, Base):
    """Student project with technologies and impact."""

    __tablename__ = "projects"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    repository_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    start_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    is_ongoing: Mapped[bool] = mapped_column(
        nullable=False, default=False
    )
    role: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    technologies: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(50)), nullable=True
    )
    impact_description: Mapped[str | None] = mapped_column(
        String(DESCRIPTION_MAX_LENGTH), nullable=True
    )
    team_size: Mapped[int | None] = mapped_column(
        nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="projects",
    )

    __table_args__ = (
        Index("ix_projects_profile", "profile_id"),
    )

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, title={self.title})>"

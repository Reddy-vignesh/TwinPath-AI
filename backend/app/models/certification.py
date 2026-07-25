"""
Decision Twin AI — Certification Model.

Tracks professional certifications earned by students.
Supports verification status and expiry tracking.
"""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import TITLE_MAX_LENGTH, URL_MAX_LENGTH
from app.models.base import Base, TimestampMixin, UUIDMixin


class Certification(UUIDMixin, TimestampMixin, Base):
    """Professional certification earned by a student."""

    __tablename__ = "certifications"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    issuing_organization: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH), nullable=False
    )
    issue_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    expiry_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    credential_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    credential_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH), nullable=True
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="certifications",
    )

    __table_args__ = (
        Index("ix_certifications_profile", "profile_id"),
        Index("ix_certifications_org", "issuing_organization"),
    )

    def __repr__(self) -> str:
        return f"<Certification(id={self.id}, name={self.name})>"

"""
Decision Twin AI — Interest Models.

Two-table design mirroring skills:
- Interest: Master catalog of interests
- UserInterest: Junction with intensity level (1-10)
"""

from __future__ import annotations

import uuid

from sqlalchemy import (
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
    INTENSITY_MAX,
    INTENSITY_MIN,
    NAME_MAX_LENGTH,
    InterestCategory,
)
from app.models.base import Base, TimestampMixin, UUIDMixin


class Interest(UUIDMixin, TimestampMixin, Base):
    """Master interest catalog entry."""

    __tablename__ = "interests"

    name: Mapped[str] = mapped_column(
        String(NAME_MAX_LENGTH),
        unique=True,
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=InterestCategory.OTHER.value,
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    user_interests: Mapped[list["UserInterest"]] = relationship(
        "UserInterest", back_populates="interest", lazy="noload",
    )

    __table_args__ = (
        Index("ix_interests_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<Interest(id={self.id}, name={self.name})>"


class UserInterest(UUIDMixin, TimestampMixin, Base):
    """User-interest association with intensity level."""

    __tablename__ = "user_interests"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    interest_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interests.id", ondelete="CASCADE"),
        nullable=False,
    )
    intensity_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=INTENSITY_MIN,
    )
    source: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ── Relationships ──────────────────────────────────────────
    profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="interests",
    )
    interest: Mapped[Interest] = relationship(
        "Interest", back_populates="user_interests", lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("profile_id", "interest_id", name="uq_user_interest"),
        Index("ix_user_interests_profile", "profile_id"),
        Index("ix_user_interests_interest", "interest_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<UserInterest(profile={self.profile_id}, "
            f"interest={self.interest_id}, level={self.intensity_level})>"
        )

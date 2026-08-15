"""
Decision Twin AI — Career Model.

Master career catalog used by the recommendation engine.
Seeded from curated data (O*NET-based categories).
Not user-editable — managed by admins.
"""

from __future__ import annotations

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH
from app.models.base import Base, PortableJSON, TimestampMixin, UUIDMixin


class Career(UUIDMixin, TimestampMixin, Base):
    """
    Career catalog entry representing an occupation.

    Contains aggregate market data, salary ranges, skill requirements,
    and growth metrics. Used for recommendation matching and vector search.
    """

    __tablename__ = "careers"

    title: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH),
        unique=True,
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # ── Financial & Market Metrics ──────────────────────────────
    median_salary_usd: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    salary_range_low: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    salary_range_high: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    growth_rate_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    automation_risk_percent: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    market_demand: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ── Requirements ───────────────────────────────────────────
    education_level_min: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    typical_experience_years: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    required_skills: Mapped[dict | None] = mapped_column(
        PortableJSON, nullable=True
    )
    preferred_skills: Mapped[dict | None] = mapped_column(
        PortableJSON, nullable=True
    )
    required_certifications: Mapped[list | None] = mapped_column(
        PortableJSON, nullable=True
    )

    # ── Metadata ───────────────────────────────────────────────
    related_careers: Mapped[list | None] = mapped_column(
        PortableJSON, nullable=True
    )
    work_environment: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        nullable=False, default=True
    )

    __table_args__ = (
        Index("ix_careers_category_active", "category", "is_active"),
        Index("ix_careers_demand", "market_demand"),
    )

    def __repr__(self) -> str:
        return f"<Career(id={self.id}, title={self.title}, category={self.category})>"

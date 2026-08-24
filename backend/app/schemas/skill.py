"""
Decision Twin AI — Skill Schemas.

Pydantic schemas for Skills and UserSkills.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import (
    NAME_MAX_LENGTH,
    PROFICIENCY_MAX,
    PROFICIENCY_MIN,
    SkillCategory,
)


# ── Skill Catalog ─────────────────────────────────────────────────


class SkillCreate(BaseModel):
    """Create a new skill in the master catalog."""

    name: str = Field(min_length=1, max_length=NAME_MAX_LENGTH)
    category: SkillCategory = SkillCategory.OTHER
    description: str | None = None


class SkillRead(BaseModel):
    """Skill catalog read schema."""

    id: UUID
    name: str
    category: str
    description: str | None = None
    is_verified: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


# ── UserSkill ─────────────────────────────────────────────────────


class UserSkillCreate(BaseModel):
    """Add a skill to a user profile."""

    skill_id: UUID | None = None
    skill_name: str | None = None
    category: str | None = None
    proficiency_level: int = Field(
        default=PROFICIENCY_MIN,
        ge=PROFICIENCY_MIN,
        le=PROFICIENCY_MAX,
    )
    years_experience: float | None = Field(None, ge=0)
    is_primary: bool = False
    source: str | None = Field(None, max_length=100)


class UserSkillUpdate(BaseModel):
    """Update a user's skill proficiency."""

    proficiency_level: int | None = Field(
        None, ge=PROFICIENCY_MIN, le=PROFICIENCY_MAX
    )
    years_experience: float | None = None
    is_primary: bool | None = None
    source: str | None = None


class UserSkillRead(BaseModel):
    """User skill response (includes skill details)."""

    id: UUID
    skill: SkillRead | None = None
    proficiency_level: int
    years_experience: float | None = None
    is_primary: bool = False
    source: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

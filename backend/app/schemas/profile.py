"""
Decision Twin AI — Profile Schemas.

Pydantic schemas for the Student Profile entity:
- Create, update, and read
- Twin completeness metrics
- Full profile aggregation (including nested sub-entities)
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.constants import (
    BIO_MAX_LENGTH,
    CGPA_MAX,
    CGPA_MIN,
    NAME_MAX_LENGTH,
    TITLE_MAX_LENGTH,
    URL_MAX_LENGTH,
)


# ── Create / Update ───────────────────────────────────────────────


import re

def _sanitize_xss(text: str | None) -> str | None:
    """Strips all HTML tags and script injections from free-form user inputs."""
    if not text:
        return text
    # Remove HTML tags
    cleaned = re.sub(r"<[^>]*?>", "", text)
    # Remove javascript: or vbscript: pseudoprotocols
    cleaned = re.sub(r"(?i)javascript:|vbscript:", "", cleaned)
    return cleaned.strip()


class ProfileCreate(BaseModel):
    """Fields for creating a new student profile."""

    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=20)
    location: str | None = Field(None, max_length=NAME_MAX_LENGTH)
    bio: str | None = Field(None, max_length=BIO_MAX_LENGTH)
    phone: str | None = Field(None, max_length=20)
    linkedin_url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    github_url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    portfolio_url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    resume_url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    current_cgpa: float | None = Field(None, ge=CGPA_MIN, le=CGPA_MAX)
    highest_degree: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    current_major: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    current_university: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    graduation_year: int | None = Field(None, ge=1950, le=2100)
    career_goal_primary: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    career_goal_secondary: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    preferred_industry: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    willing_to_relocate: bool | None = None
    preferred_work_style: str | None = Field(None, max_length=50)

    @field_validator(
        "bio", "location", "highest_degree", "current_major", 
        "current_university", "career_goal_primary", "career_goal_secondary", "preferred_industry",
        mode="before"
    )
    @classmethod
    def sanitize_xss_fields(cls, v: Any) -> Any:
        if isinstance(v, str):
            return _sanitize_xss(v)
        return v


class ProfileUpdate(BaseModel):
    """Partial update fields for a student profile."""

    date_of_birth: date | None = None
    gender: str | None = None
    location: str | None = None
    bio: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    resume_url: str | None = None
    current_cgpa: float | None = None
    highest_degree: str | None = None
    current_major: str | None = None
    current_university: str | None = None
    graduation_year: int | None = None
    career_goal_primary: str | None = None
    career_goal_secondary: str | None = None
    preferred_industry: str | None = None
    willing_to_relocate: bool | None = None
    preferred_work_style: str | None = None

    @field_validator(
        "bio", "location", "highest_degree", "current_major", 
        "current_university", "career_goal_primary", "career_goal_secondary", "preferred_industry",
        mode="before"
    )
    @classmethod
    def sanitize_xss_fields(cls, v: Any) -> Any:
        if isinstance(v, str):
            return _sanitize_xss(v)
        return v

    @field_validator("current_cgpa")
    @classmethod
    def validate_cgpa(cls, v: float | None) -> float | None:
        if v is not None and not (CGPA_MIN <= v <= CGPA_MAX):
            msg = f"CGPA must be between {CGPA_MIN} and {CGPA_MAX}"
            raise ValueError(msg)
        return v


# ── Read ──────────────────────────────────────────────────────────


class ProfileRead(BaseModel):
    """Profile response schema."""

    id: UUID
    user_id: UUID
    date_of_birth: date | None = None
    gender: str | None = None
    location: str | None = None
    bio: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    resume_url: str | None = None
    current_cgpa: float | None = None
    highest_degree: str | None = None
    current_major: str | None = None
    current_university: str | None = None
    graduation_year: int | None = None
    career_goal_primary: str | None = None
    career_goal_secondary: str | None = None
    preferred_industry: str | None = None
    willing_to_relocate: bool | None = None
    preferred_work_style: str | None = None
    twin_completeness_score: float = 0.0
    total_skills_count: int = 0
    total_projects_count: int = 0
    total_certifications_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TwinCompletenessRead(BaseModel):
    """Detailed twin completeness breakdown."""

    overall_score: float
    dimensions: dict[str, float]
    missing_sections: list[str]
    suggestions: list[str]

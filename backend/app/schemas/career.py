"""
Decision Twin AI — Career Schemas.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import TITLE_MAX_LENGTH


class CareerCreate(BaseModel):
    title: str = Field(max_length=TITLE_MAX_LENGTH)
    category: str = Field(max_length=50)
    description: str | None = None
    short_description: str | None = Field(None, max_length=500)
    median_salary_usd: int | None = Field(None, ge=0)
    salary_range_low: int | None = Field(None, ge=0)
    salary_range_high: int | None = Field(None, ge=0)
    growth_rate_percent: float | None = None
    automation_risk_percent: float | None = Field(None, ge=0, le=100)
    market_demand: str | None = Field(None, max_length=20)
    job_outlook: str | None = Field(None, max_length=50)
    required_education: str | None = Field(None, max_length=100)
    typical_experience_years: int | None = Field(None, ge=0)
    required_skills: dict | None = None
    preferred_skills: dict | None = None
    required_certifications: list | None = None
    related_careers: list | None = None
    work_environment: str | None = Field(None, max_length=100)


class CareerUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    short_description: str | None = None
    median_salary_usd: int | None = None
    salary_range_low: int | None = None
    salary_range_high: int | None = None
    growth_rate_percent: float | None = None
    automation_risk_percent: float | None = None
    market_demand: str | None = None
    job_outlook: str | None = None
    required_education: str | None = None
    typical_experience_years: int | None = None
    required_skills: dict | None = None
    preferred_skills: dict | None = None
    required_certifications: list | None = None
    related_careers: list | None = None
    work_environment: str | None = None
    is_active: bool | None = None


class CareerRead(BaseModel):
    id: UUID
    title: str
    category: str
    description: str | None = None
    short_description: str | None = None
    median_salary_usd: int | None = None
    salary_range_low: int | None = None
    salary_range_high: int | None = None
    growth_rate_percent: float | None = None
    automation_risk_percent: float | None = None
    market_demand: str | None = None
    job_outlook: str | None = None
    required_education: str | None = None
    typical_experience_years: int | None = None
    required_skills: dict | None = None
    preferred_skills: dict | None = None
    required_certifications: list | None = None
    related_careers: list | None = None
    work_environment: str | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CareerSummaryRead(BaseModel):
    """Lightweight career summary for lists."""

    id: UUID
    title: str
    category: str
    short_description: str | None = None
    description: str | None = None
    median_salary_usd: int | None = None
    salary_range_low: int | None = None
    salary_range_high: int | None = None
    growth_rate_percent: float | None = None
    automation_risk_percent: float | None = None
    market_demand: str | None = None
    required_skills: dict | None = None
    preferred_skills: dict | None = None
    required_education: str | None = None
    typical_experience_years: int | None = None

    model_config = {"from_attributes": True}

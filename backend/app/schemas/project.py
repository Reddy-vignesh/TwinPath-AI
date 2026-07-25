"""
Decision Twin AI — Project Schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, URL_MAX_LENGTH


class ProjectCreate(BaseModel):
    title: str = Field(max_length=TITLE_MAX_LENGTH)
    description: str | None = None
    url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    repository_url: str | None = Field(None, max_length=URL_MAX_LENGTH)
    start_date: date | None = None
    end_date: date | None = None
    is_ongoing: bool = False
    role: str | None = Field(None, max_length=100)
    technologies: list[str] | None = None
    impact_description: str | None = Field(None, max_length=DESCRIPTION_MAX_LENGTH)
    team_size: int | None = Field(None, ge=1)


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    url: str | None = None
    repository_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_ongoing: bool | None = None
    role: str | None = None
    technologies: list[str] | None = None
    impact_description: str | None = None
    team_size: int | None = None


class ProjectRead(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    url: str | None = None
    repository_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_ongoing: bool = False
    role: str | None = None
    technologies: list[str] | None = None
    impact_description: str | None = None
    team_size: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

"""
Decision Twin AI — Interest Schemas.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import (
    INTENSITY_MAX,
    INTENSITY_MIN,
    NAME_MAX_LENGTH,
    InterestCategory,
)


class InterestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=NAME_MAX_LENGTH)
    category: InterestCategory = InterestCategory.OTHER
    description: str | None = None


class InterestRead(BaseModel):
    id: UUID
    name: str
    category: str
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserInterestCreate(BaseModel):
    interest_id: UUID
    intensity_level: int = Field(
        default=INTENSITY_MIN,
        ge=INTENSITY_MIN,
        le=INTENSITY_MAX,
    )
    source: str | None = Field(None, max_length=50)


class UserInterestUpdate(BaseModel):
    intensity_level: int | None = Field(
        None, ge=INTENSITY_MIN, le=INTENSITY_MAX
    )
    source: str | None = None


class UserInterestRead(BaseModel):
    id: UUID
    interest: InterestRead
    intensity_level: int
    source: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

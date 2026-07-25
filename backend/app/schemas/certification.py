"""
Decision Twin AI — Certification Schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import TITLE_MAX_LENGTH, URL_MAX_LENGTH


class CertificationCreate(BaseModel):
    name: str = Field(max_length=TITLE_MAX_LENGTH)
    issuing_organization: str = Field(max_length=TITLE_MAX_LENGTH)
    issue_date: date
    expiry_date: date | None = None
    credential_id: str | None = Field(None, max_length=100)
    credential_url: str | None = Field(None, max_length=URL_MAX_LENGTH)


class CertificationUpdate(BaseModel):
    name: str | None = None
    issuing_organization: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    credential_id: str | None = None
    credential_url: str | None = None


class CertificationRead(BaseModel):
    id: UUID
    name: str
    issuing_organization: str
    issue_date: date
    expiry_date: date | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

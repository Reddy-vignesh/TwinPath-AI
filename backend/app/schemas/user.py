"""
Decision Twin AI — User Schemas.

Read and update schemas for user data.
Separate from auth schemas to maintain single responsibility.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.core.constants import NAME_MAX_LENGTH


class UserRead(BaseModel):
    """User data returned in API responses."""

    id: uuid.UUID = Field(description="User unique identifier")
    email: EmailStr = Field(description="User email address")
    first_name: str = Field(description="First name")
    last_name: str = Field(description="Last name")
    role: str = Field(description="User role (student, counselor, admin)")
    is_active: bool = Field(description="Whether the account is active")
    email_verified: bool = Field(description="Whether email is verified")
    created_at: datetime = Field(description="Account creation timestamp")
    last_login_at: datetime | None = Field(
        default=None, description="Last login timestamp"
    )

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """User profile update request."""

    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=NAME_MAX_LENGTH,
        description="Updated first name",
    )
    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=NAME_MAX_LENGTH,
        description="Updated last name",
    )


class UserListItem(BaseModel):
    """Minimal user data for list endpoints."""

    id: uuid.UUID = Field(description="User unique identifier")
    email: EmailStr = Field(description="User email address")
    first_name: str = Field(description="First name")
    last_name: str = Field(description="Last name")
    role: str = Field(description="User role")
    is_active: bool = Field(description="Whether the account is active")

    model_config = {"from_attributes": True}

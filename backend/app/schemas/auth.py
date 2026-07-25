"""
Decision Twin AI — Authentication Schemas.

Request and response schemas for auth endpoints.
All inputs validated with Pydantic Field constraints.
"""

from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.constants import (
    NAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
)


# ====================================================================
# Request Schemas
# ====================================================================


class RegisterRequest(BaseModel):
    """User registration request payload."""

    email: EmailStr = Field(
        description="User email address",
        examples=["student@university.edu"],
    )
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="Password (min 8 chars, must include upper, lower, digit, special)",
        examples=["SecureP@ss123"],
    )
    first_name: str = Field(
        min_length=1,
        max_length=NAME_MAX_LENGTH,
        description="User first name",
        examples=["John"],
    )
    last_name: str = Field(
        min_length=1,
        max_length=NAME_MAX_LENGTH,
        description="User last name",
        examples=["Doe"],
    )

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """Enforce password complexity requirements."""
        if not re.search(r"[A-Z]", value):
            msg = "Password must contain at least one uppercase letter."
            raise ValueError(msg)
        if not re.search(r"[a-z]", value):
            msg = "Password must contain at least one lowercase letter."
            raise ValueError(msg)
        if not re.search(r"\d", value):
            msg = "Password must contain at least one digit."
            raise ValueError(msg)
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            msg = "Password must contain at least one special character."
            raise ValueError(msg)
        return value

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        """Sanitize and validate name fields."""
        stripped = value.strip()
        if not stripped:
            msg = "Name cannot be empty or whitespace only."
            raise ValueError(msg)
        return stripped


class LoginRequest(BaseModel):
    """User login request payload."""

    email: EmailStr = Field(
        description="Registered email address",
        examples=["student@university.edu"],
    )
    password: str = Field(
        min_length=1,
        max_length=PASSWORD_MAX_LENGTH,
        description="Account password",
    )


class RefreshTokenRequest(BaseModel):
    """Token refresh request payload."""

    refresh_token: str = Field(
        min_length=1,
        description="Valid refresh token from previous login or refresh",
    )


class GuestLoginRequest(BaseModel):
    """Guest login request payload."""

    name: str = Field(
        min_length=1,
        max_length=NAME_MAX_LENGTH,
        description="Guest user's preferred display name",
        examples=["Alice"],
    )


# ====================================================================
# Response Schemas
# ====================================================================


class TokenResponse(BaseModel):
    """JWT token pair response."""

    access_token: str = Field(description="JWT access token")
    refresh_token: str = Field(description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Access token TTL in seconds")

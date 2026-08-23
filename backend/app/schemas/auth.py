"""
Decision Twin AI — Authentication Schemas.

Request and response schemas for auth endpoints.
All inputs validated with Pydantic Field constraints.
"""

from __future__ import annotations

import re
from typing import Any

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
    website_url: str | None = Field(
        default=None,
        description="Anti-bot honeypot trap. Must be left empty.",
    )
    form_ts: int | float | None = Field(
        default=None,
        description="Form initiation timestamp for anti-bot timing check",
    )

    @field_validator("website_url")
    @classmethod
    def validate_honeypot(cls, value: str | None) -> str | None:
        """Reject automated submissions that fill out the honeypot field."""
        if value:
            raise ValueError("Automated bot submission detected.")
        return value

    @field_validator("email")
    @classmethod
    def validate_official_email(cls, value: str) -> str:
        """Enforce official and valid email domain verification."""
        email_str = value.lower().strip()
        domain = email_str.split("@")[-1] if "@" in email_str else ""
        
        # Block known disposable / fake / random test email domains
        blocked_domains = {
            "testmail.com", "test.com", "example.com", "tempmail.com",
            "dispostable.com", "guerrillamail.com", "mailinator.com",
            "10minutemail.com", "trashmail.com", "fake.com", "yopmail.com"
        }
        
        if domain in blocked_domains:
            raise ValueError("Invalid email domain. Please use your official or real email address (@gmail.com, .edu, .edu.in, .ac.in, etc.).")
            
        return email_str

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


class SendOTPRequest(BaseModel):
    """Send OTP request schema."""
    email: EmailStr = Field(description="Email to send 6-digit OTP code to")
    purpose: str = Field(default="registration", description="Purpose: registration or password_reset")

    @field_validator("email")
    @classmethod
    def validate_official_email(cls, value: str) -> str:
        email_str = value.lower().strip()
        domain = email_str.split("@")[-1] if "@" in email_str else ""
        blocked_domains = {
            "testmail.com", "test.com", "example.com", "tempmail.com",
            "dispostable.com", "guerrillamail.com", "mailinator.com",
            "10minutemail.com", "trashmail.com", "fake.com", "yopmail.com"
        }
        if domain in blocked_domains:
            raise ValueError("Invalid email domain. Please use your official or real email address (@gmail.com, .edu, .edu.in, etc.).")
        return email_str


class VerifyOTPRequest(BaseModel):
    """Verify OTP request schema."""
    email: EmailStr = Field(description="User email")
    otp_code: str = Field(min_length=6, max_length=6, description="6-digit verification code")
    purpose: str = Field(default="registration", description="Purpose: registration or password_reset")


class ResetPasswordRequest(BaseModel):
    """Reset password request schema."""
    email: EmailStr = Field(description="User email")
    otp_code: str = Field(min_length=6, max_length=6, description="Verified 6-digit OTP code")
    new_password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="New password",
    )

    @field_validator("new_password")
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
    website_url: str | None = Field(
        default=None,
        description="Anti-bot honeypot trap. Must be left empty.",
    )
    form_ts: int | float | None = Field(
        default=None,
        description="Form initiation timestamp for anti-bot timing check",
    )

    @field_validator("website_url")
    @classmethod
    def validate_honeypot(cls, value: str | None) -> str | None:
        """Reject automated submissions that fill out the honeypot field."""
        if value:
            raise ValueError("Automated bot submission detected.")
        return value


class RefreshTokenRequest(BaseModel):
    """Token refresh request payload."""

    refresh_token: str | None = Field(
        default=None,
        description="Valid refresh token (optional if refresh_token httpOnly cookie is present)",
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
    user: dict[str, Any] | None = Field(default=None, description="Authenticated user object")

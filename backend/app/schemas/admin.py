"""
Decision Twin AI — Admin Schemas.

Pydantic schemas for admin operations:
- User management
- Career catalog management
- Audit log viewing
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import UserRole


# ── User Management ───────────────────────────────────────────────


class AdminUserRead(BaseModel):
    """Admin view of a user (includes more fields than self-view)."""

    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    has_profile: bool = False
    twin_completeness: float = 0.0

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    """Admin-level user update (role changes, activation)."""

    role: UserRole | None = None
    is_active: bool | None = None
    email_verified: bool | None = None


class UserListParams(BaseModel):
    """Query parameters for user listing."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    role: UserRole | None = None
    is_active: bool | None = None
    search: str | None = Field(None, max_length=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")


# ── Career Bulk Operations ────────────────────────────────────────


class CareerSeedRequest(BaseModel):
    """Request to seed the career catalog from built-in data."""

    overwrite_existing: bool = False


class CareerSeedResult(BaseModel):
    """Result of career seeding operation."""

    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = []


# ── Audit Log ─────────────────────────────────────────────────────


class AuditLogRead(BaseModel):
    """Audit log entry response."""

    id: UUID
    user_id: UUID | None = None
    action: str
    resource_type: str
    resource_id: str | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListParams(BaseModel):
    """Query parameters for audit log listing."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)
    user_id: UUID | None = None
    action: str | None = None
    resource_type: str | None = None

"""
Decision Twin AI — Common Schemas.

Shared Pydantic schemas used across multiple endpoints:
- Unified response envelopes
- Pagination parameters
- Health check responses
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

T = TypeVar("T")


# ====================================================================
# Response Envelopes
# ====================================================================


class SuccessResponseSchema(BaseModel, Generic[T]):
    """Standard success response envelope."""

    success: bool = Field(default=True)
    message: str = Field(description="Human-readable success message")
    data: T = Field(description="Response payload")


class ErrorDetailSchema(BaseModel):
    """Individual error detail."""

    field: str | None = Field(default=None)
    message: str = Field(description="Error description")
    code: str | None = Field(default=None)


class ErrorResponseSchema(BaseModel):
    """Standard error response envelope."""

    success: bool = Field(default=False)
    message: str = Field(description="Human-readable error summary")
    errors: list[ErrorDetailSchema] = Field(default_factory=list)


# ====================================================================
# Pagination
# ====================================================================


class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(
        default=DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE,
        description="Items per page",
    )

    @property
    def offset(self) -> int:
        """Calculate the SQL OFFSET value."""
        return (self.page - 1) * self.page_size


class PaginatedResponseSchema(BaseModel, Generic[T]):
    """Paginated list response."""

    success: bool = Field(default=True)
    message: str = Field(default="Success.")
    data: PaginatedDataSchema[T] = Field(description="Paginated data")


class PaginatedDataSchema(BaseModel, Generic[T]):
    """Inner data wrapper for paginated responses."""

    items: list[T] = Field(description="Items on this page")
    total: int = Field(ge=0, description="Total number of items")
    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, description="Items per page")
    total_pages: int = Field(ge=0, description="Total pages available")


# ====================================================================
# Health Check
# ====================================================================


class HealthCheckSchema(BaseModel):
    """Health check response."""

    status: str = Field(description="Service status")
    version: str = Field(description="Application version")
    environment: str = Field(description="Runtime environment")


class ReadinessCheckSchema(BaseModel):
    """Readiness check response with component statuses."""

    status: str = Field(description="Overall readiness status")
    checks: dict[str, Any] = Field(description="Individual component check results")

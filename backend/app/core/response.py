"""
Decision Twin AI — Unified Response Envelope.

All API responses follow a consistent envelope structure:
- Success: { "success": true, "message": "...", "data": {...} }
- Error:   { "success": false, "message": "...", "errors": [...] }

This ensures frontend can always rely on a predictable response shape.
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response envelope."""

    success: bool = Field(default=True, description="Whether the request succeeded")
    message: str = Field(description="Human-readable success message")
    data: T = Field(description="Response payload")


class ErrorDetail(BaseModel):
    """Individual error detail within an error response."""

    field: str | None = Field(default=None, description="Field that caused the error")
    message: str = Field(description="Error description")
    code: str | None = Field(default=None, description="Machine-readable error code")


class ErrorResponse(BaseModel):
    """Standard error response envelope."""

    success: bool = Field(default=False, description="Always false for errors")
    message: str = Field(description="Human-readable error summary")
    errors: list[ErrorDetail] = Field(
        default_factory=list, description="Detailed error list"
    )


class PaginatedData(BaseModel, Generic[T]):
    """Paginated data wrapper."""

    items: list[T] = Field(description="Page of results")
    total: int = Field(ge=0, description="Total number of items")
    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, description="Items per page")
    total_pages: int = Field(ge=0, description="Total number of pages")


def success_response(
    data: Any,
    message: str = "Success.",
) -> dict[str, Any]:
    """
    Build a success response dictionary.

    Args:
        data: Response payload (will be serialized by FastAPI).
        message: Human-readable success message.

    Returns:
        Dictionary matching SuccessResponse schema.
    """
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(
    message: str = "An error occurred.",
    errors: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Build an error response dictionary.

    Args:
        message: Human-readable error summary.
        errors: List of detailed error objects.

    Returns:
        Dictionary matching ErrorResponse schema.
    """
    return {
        "success": False,
        "message": message,
        "errors": errors or [],
    }

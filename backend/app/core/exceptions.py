"""
Decision Twin AI — Custom Exception Hierarchy.

Structured exception classes with HTTP status codes and error payloads.
All exceptions are caught by the global exception handler and returned
as consistent error response envelopes.
"""

from __future__ import annotations

from typing import Any


class AppException(Exception):
    """
    Base application exception.

    All domain-specific exceptions inherit from this class.
    The global exception handler converts these into consistent error responses.
    """

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        status_code: int = 500,
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(self.message)


class NotFoundException(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(
        self,
        message: str = "Resource not found.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=404, errors=errors)


class UnauthorizedException(AppException):
    """Raised when authentication fails or is missing."""

    def __init__(
        self,
        message: str = "Authentication required.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=401, errors=errors)


class ForbiddenException(AppException):
    """Raised when the user lacks permission for an action."""

    def __init__(
        self,
        message: str = "Insufficient permissions.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=403, errors=errors)


class BadRequestException(AppException):
    """Raised when request syntax or validation fails."""

    def __init__(
        self,
        message: str = "Bad request.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=400, errors=errors)


class ValidationException(AppException):
    """Raised when input validation fails beyond Pydantic's defaults."""

    def __init__(
        self,
        message: str = "Validation failed.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=422, errors=errors)


class ConflictException(AppException):
    """Raised when a resource already exists or a constraint is violated."""

    def __init__(
        self,
        message: str = "Resource conflict.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=409, errors=errors)


class RateLimitExceededException(AppException):
    """Raised when rate limiting is triggered."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please try again later.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=429, errors=errors)


class ServiceUnavailableException(AppException):
    """Raised when a dependent service is unavailable."""

    def __init__(
        self,
        message: str = "Service temporarily unavailable.",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message=message, status_code=503, errors=errors)

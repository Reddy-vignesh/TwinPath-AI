"""
Decision Twin AI — Middleware Stack.

Production-grade middleware for:
- CORS (explicit origin allowlist)
- Request correlation IDs (traceability)
- Request timing (performance observability)
- Global exception handling (sanitised error responses)
- Rate limiting (in-memory token bucket for dev)
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.exceptions import AppException
from app.core.response import error_response

if TYPE_CHECKING:
    from starlette.middleware.base import RequestResponseEndpoint
    from starlette.responses import Response

    from app.config import Settings

logger = structlog.get_logger(__name__)


def register_middleware(app: FastAPI, settings: Settings) -> None:
    """
    Register all middleware on the FastAPI application.

    Order matters: middleware is executed in reverse registration order.
    Last registered = first executed on request.

    Args:
        app: FastAPI application instance.
        settings: Application settings.
    """
    # ── CORS (outermost — must handle preflight first) ─────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        # Explicit allowlist — never use ["*"] as it enables header injection
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Correlation-ID",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
        expose_headers=["X-Correlation-ID", "X-Process-Time"],
    )

    # ── Request Timing ─────────────────────────────────────────
    @app.middleware("http")
    async def timing_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
        return response

    # ── Security Response Headers ──────────────────────────────
    @app.middleware("http")
    async def security_headers_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        # HSTS — only set in production (not over HTTP in dev)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response

    # ── Correlation ID ─────────────────────────────────────────
    @app.middleware("http")
    async def correlation_id_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response

    # ── Rate Limiting (in-memory token bucket) ─────────────────
    rate_limiter = InMemoryRateLimiter(
        max_requests=settings.rate_limit_requests_per_minute,
        window_seconds=60,
    )

    @app.middleware("http")
    async def rate_limit_middleware(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate limiting for health checks
        if request.url.path.startswith("/api/v1/health") or request.url.path in ("/health", "/api/health"):
            return await call_next(request)

        # Use request.client.host directly — do NOT trust X-Forwarded-For
        # from the raw request as it is trivially spoofable by any client.
        # On Render/cloud, the trusted proxy IP is in client.host already.
        client_ip = request.client.host if request.client else "unknown"

        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=error_response(
                    message="Rate limit exceeded. Please try again later."
                ),
            )
        return await call_next(request)



def register_exception_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers for consistent error responses.

    Args:
        app: FastAPI application instance.
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(
            "Application error",
            status_code=exc.status_code,
            message=exc.message,
            path=str(request.url),
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.message,
                errors=exc.errors,
            ),
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        errors: list[dict[str, Any]] = [
            {
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "code": error["type"],
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response(
                message="Validation failed.",
                errors=errors,
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Log the full exception for debugging but never expose internals
        logger.exception(
            "Unhandled exception",
            path=str(request.url),
            method=request.method,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="An internal server error occurred."
            ),
        )


class InMemoryRateLimiter:
    """
    Simple in-memory sliding window rate limiter.

    Suitable for development and single-instance deployments.
    For production with multiple workers, use Redis-backed rate limiting.
    """

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        """
        Check if the client is within the rate limit.

        Args:
            client_id: Unique client identifier (e.g., IP address).

        Returns:
            True if the request is allowed, False if rate limited.
        """
        now = time.time()
        window_start = now - self._window_seconds

        # Remove expired entries
        self._requests[client_id] = [
            ts for ts in self._requests[client_id] if ts > window_start
        ]

        if len(self._requests[client_id]) >= self._max_requests:
            return False

        self._requests[client_id].append(now)
        return True

"""
Decision Twin AI — FastAPI Application Factory.

Creates and configures the FastAPI application with:
- Lifespan management (startup/shutdown)
- Middleware stack (CORS, timing, rate limiting, correlation IDs)
- Exception handlers (consistent error responses)
- API routers (versioned under /api/v1)
- OpenAPI documentation metadata
"""

from __future__ import annotations

from fastapi import FastAPI

from app.api.v1.router import v1_router
from app.config import get_settings
from app.core.middleware import register_exception_handlers, register_middleware
from app.lifespan import lifespan


def create_app() -> FastAPI:
    """
    Application factory that creates a fully configured FastAPI instance.

    Returns:
        Configured FastAPI application ready to serve requests.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Decision Twin AI — An AI-Powered Career Intelligence Platform. "
            "Provides career recommendations, salary predictions, "
            "skill gap analysis, and what-if simulations through "
            "a continuously evolving Digital Career Twin."
        ),
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
        lifespan=lifespan,
    )

    # ── Register Middleware ────────────────────────────────────
    register_middleware(app, settings)

    # ── Register Exception Handlers ────────────────────────────
    register_exception_handlers(app)

    # ── Register Routers ───────────────────────────────────────
    app.include_router(v1_router)

    # ── Root Health Check Aliases (Keep-Alive / Monitoring) ─────
    @app.get("/health", tags=["Health"], include_in_schema=False)
    @app.get("/api/health", tags=["Health"], include_in_schema=False)
    async def root_health_ping() -> dict[str, str]:
        """Lightweight root health ping endpoint for cloud keep-alive monitors."""
        return {"status": "ok", "service": "Decision Twin AI"}

    return app


# ── Application Instance ──────────────────────────────────────────
# Used by uvicorn: uvicorn app.main:app --reload
app = create_app()

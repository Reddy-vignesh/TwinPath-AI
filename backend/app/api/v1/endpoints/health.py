"""
Decision Twin AI — Health Check Endpoints.

Provides liveness and readiness probes for:
- Container orchestration (Docker, K8s)
- Load balancer health checks
- Monitoring systems
"""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.response import success_response
from app.db.session import get_db

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    summary="Liveness check",
    description="Returns 200 if the service is running. Does not check dependencies.",
)
async def health_check(
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Liveness probe — confirms the application process is alive."""
    return success_response(
        data={
            "status": "healthy",
            "version": settings.app_version,
            "environment": settings.app_env,
        },
        message="Service is healthy.",
    )


@router.get(
    "/ready",
    summary="Readiness check",
    description="Returns 200 if the service and all dependencies are ready.",
)
async def readiness_check(
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """
    Readiness probe — verifies all critical dependencies are available.

    Checks:
    - Database connectivity
    - ML models loaded (placeholder for Phase 3)
    """
    checks: dict[str, Any] = {}

    # ── Database Check ─────────────────────────────────────────
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = {"status": "connected"}
    except Exception as exc:
        logger.error("Database readiness check failed", error=str(exc))
        checks["database"] = {"status": "disconnected", "error": str(exc)}

    # ── ML Models Check (Phase 3 placeholder) ──────────────────
    checks["ml_models"] = {"status": "not_loaded", "note": "Phase 3"}

    # ── Overall Status ─────────────────────────────────────────
    all_healthy = all(
        check.get("status") in ("connected", "loaded", "not_loaded")
        for check in checks.values()
    )

    return success_response(
        data={
            "status": "ready" if all_healthy else "degraded",
            "version": settings.app_version,
            "checks": checks,
        },
        message="Readiness check completed.",
    )

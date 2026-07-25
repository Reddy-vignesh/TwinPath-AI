"""
Decision Twin AI — Analytics Endpoints.

Platform analytics and metrics (admin-only).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException
from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _require_admin(current_user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
    if current_user.role != "admin":
        raise ForbiddenException(message="Admin access required.")
    return current_user


def _get_service(session: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(session)


@router.get("/dashboard", summary="Full analytics dashboard")
async def get_dashboard(
    admin: TokenPayload = Depends(_require_admin),
    service: AnalyticsService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Complete analytics dashboard with:
    - Platform overview (users, profiles, careers)
    - User distribution by role
    - Twin completeness distribution
    - Top skills across the platform
    """
    result = await service.get_dashboard()
    return success_response(data=result, message="Dashboard generated.")


@router.get("/skills", summary="Skill analytics")
async def get_skill_analytics(
    admin: TokenPayload = Depends(_require_admin),
    service: AnalyticsService = Depends(_get_service),
) -> dict[str, Any]:
    """Detailed skill analytics: categories, popularity, and per-user averages."""
    result = await service.get_skill_analytics()
    return success_response(data=result, message="Skill analytics generated.")

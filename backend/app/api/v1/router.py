"""
Decision Twin AI — API v1 Router.

Aggregates all v1 endpoint routers under /api/v1.
New feature routers are added here as they are implemented.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.careers import router as careers_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.interests import router as interests_router
from app.api.v1.endpoints.profiles import router as profiles_router
from app.api.v1.endpoints.skills import router as skills_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.recommendations import router as recommendations_router
from app.api.v1.endpoints.simulations import router as simulations_router
from app.api.v1.endpoints.twin_data import (
    academics_router,
    certifications_router,
    projects_router,
)
from app.api.v1.endpoints.feedback import router as feedback_router
from app.api.v1.endpoints.resume import router as resume_router

# ── Aggregate Router ──────────────────────────────────────────────

v1_router = APIRouter(prefix="/api/v1")

# Phase 1 routers
v1_router.include_router(health_router)
v1_router.include_router(auth_router)

# Phase 2 routers — Digital Twin Data Layer
v1_router.include_router(profiles_router)
v1_router.include_router(skills_router)
v1_router.include_router(interests_router)
v1_router.include_router(academics_router)
v1_router.include_router(certifications_router)
v1_router.include_router(projects_router)
v1_router.include_router(careers_router)

# Phase 3 routers — ML & Recommendations
v1_router.include_router(recommendations_router)

# Phase 4 routers — Simulations & Predictions
v1_router.include_router(simulations_router)

# Phase 5 routers — Admin & Analytics
v1_router.include_router(admin_router)
v1_router.include_router(analytics_router)
v1_router.include_router(feedback_router)
v1_router.include_router(resume_router)

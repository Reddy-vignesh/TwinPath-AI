"""
Decision Twin AI — Simulation & Salary Endpoints.

What-If career simulation, salary prediction, and career comparison.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.schemas.simulation import (
    CareerComparisonRequest,
    SalaryPredictionRequest,
    SimulationRequest,
)
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["Simulations & Predictions"])


def _get_service(session: AsyncSession = Depends(get_db)) -> SimulationService:
    return SimulationService(session)


# ── What-If Simulation ───────────────────────────────────────────


@router.post("/simulations", summary="Run a what-if career simulation")
async def run_simulation(
    payload: SimulationRequest,
    current_user: TokenPayload = Depends(get_current_user),
    service: SimulationService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Simulate hypothetical profile changes and see their impact.

    Supported mutation types:
    - `add_skill`: Add a new skill (params: name, category, proficiency_level)
    - `upgrade_skill`: Upgrade existing skill (params: name, proficiency_level)
    - `remove_skill`: Remove a skill (params: name)
    - `add_certification`: Add certification (params: name, issuing_organization)
    - `change_goal`: Change career goals (params: career_goal_primary, preferred_industry)
    - `update_academic`: Update academic info (params: field, value)
    - `adjust_trait`: Adjust psychometric trait (params: trait, value 0.0-1.0)
    """
    mutations = [m.model_dump() for m in payload.mutations]

    result = await service.run_simulation(
        user_id=uuid.UUID(current_user.sub),
        mutations=mutations,
        top_k=payload.top_k,
    )

    return success_response(
        data=result,
        message=f"Simulation completed with {len(mutations)} mutations.",
    )


# ── Salary Prediction ────────────────────────────────────────────


@router.post("/salary-predictions", summary="Predict salary for careers")
async def predict_salary(
    payload: SalaryPredictionRequest | None = None,
    current_user: TokenPayload = Depends(get_current_user),
    service: SimulationService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Predict expected salary for a student across multiple careers.

    If career_ids are provided, predicts for those careers.
    Otherwise uses the student's top recommended careers.
    """
    params = payload or SalaryPredictionRequest()

    result = await service.predict_salary(
        user_id=uuid.UUID(current_user.sub),
        career_ids=params.career_ids or None,
        top_k=params.top_k,
    )

    return success_response(
        data=result,
        message=result.get("summary", "Salary predictions generated."),
    )


# ── Career Comparison ────────────────────────────────────────────


@router.post("/career-comparison", summary="Compare careers side-by-side")
async def compare_careers(
    payload: CareerComparisonRequest,
    current_user: TokenPayload = Depends(get_current_user),
    service: SimulationService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Compare 2-5 careers side-by-side with skill gaps,
    salary predictions, and strengths/weaknesses.
    """
    result = await service.compare_careers(
        user_id=uuid.UUID(current_user.sub),
        career_ids=payload.career_ids,
    )

    return success_response(
        data=result,
        message=f"Compared {result['careers_compared']} careers.",
    )


# ── Learning Roadmap ─────────────────────────────────────────────


@router.post("/learning-roadmap", summary="Generate learning roadmap")
async def generate_learning_roadmap(
    career_id: str,
    hours_per_week: int = 10,
    current_user: TokenPayload = Depends(get_current_user),
    service: SimulationService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Generate a personalized learning roadmap for a target career.

    Analyzes skill gaps and produces phased learning plan with
    time estimates, milestones, and resource suggestions.
    """
    result = await service.generate_learning_roadmap(
        user_id=uuid.UUID(current_user.sub),
        career_id=career_id,
        hours_per_week=hours_per_week,
    )

    return success_response(
        data=result,
        message=result.get("summary", "Learning roadmap generated."),
    )

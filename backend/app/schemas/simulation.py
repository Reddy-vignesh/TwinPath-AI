"""
Decision Twin AI — Simulation Schemas.

Pydantic schemas for What-If simulations and salary predictions.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


# ── What-If Simulation ───────────────────────────────────────────


class SimulationMutation(BaseModel):
    """A single mutation to apply in a what-if simulation."""

    type: str = Field(
        description=(
            "Mutation type: add_skill, upgrade_skill, remove_skill, "
            "add_certification, change_goal, update_academic, adjust_trait"
        )
    )
    params: dict[str, Any] = Field(
        default_factory=dict,
        description="Mutation-specific parameters",
    )


class SimulationRequest(BaseModel):
    """Request to run a what-if career simulation."""

    mutations: list[SimulationMutation] = Field(
        min_length=1,
        max_length=20,
        description="List of hypothetical changes to simulate",
    )
    top_k: int = Field(default=10, ge=1, le=50)


class SimulationImpactSummary(BaseModel):
    """Summary of simulation impact."""

    careers_gained: int = 0
    careers_lost: int = 0
    careers_improved: int = 0
    careers_declined: int = 0


class SimulationResponse(BaseModel):
    """Full simulation response."""

    mutations_applied: list[dict[str, Any]]
    baseline: dict[str, Any]
    simulated: dict[str, Any]
    impact: dict[str, Any]
    vector_diff: dict[str, Any]


# ── Salary Prediction ────────────────────────────────────────────


class SalaryPredictionRequest(BaseModel):
    """Request salary prediction for specific careers."""

    career_ids: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="Career IDs to predict salary for. Empty = use top recommendations.",
    )
    top_k: int = Field(default=5, ge=1, le=20)


class SalaryPredictionResult(BaseModel):
    """Salary prediction for a single career."""

    career_title: str
    career_id: str
    predicted_salary_low: int
    predicted_salary_mid: int
    predicted_salary_high: int
    career_range: dict[str, int]
    composite_score: float
    confidence: str
    factors: dict[str, float]
    explanation: str
    data_quality: float


class SalaryComparisonResponse(BaseModel):
    """Multiple salary predictions for comparison."""

    predictions: list[dict[str, Any]]
    highest_potential: str
    summary: str


# ── Career Comparison ─────────────────────────────────────────────


class CareerComparisonRequest(BaseModel):
    """Request to compare multiple careers side-by-side."""

    career_ids: list[str] = Field(
        min_length=2,
        max_length=5,
        description="Career IDs to compare (2-5)",
    )


class CareerComparisonItem(BaseModel):
    """Single career in a comparison."""

    career_id: str
    title: str
    category: str
    similarity_score: float
    skill_gap: dict[str, Any]
    salary_prediction: dict[str, Any]
    strengths: list[str]
    weaknesses: list[str]

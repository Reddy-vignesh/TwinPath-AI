"""
Decision Twin AI — Recommendation Schemas.

Pydantic schemas for recommendation API responses.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class CareerRecommendation(BaseModel):
    """A single career recommendation."""

    rank: int
    career_id: str
    similarity_score: float
    career: CareerInfo
    skill_gap: SkillGapResult | None = None
    explanation: ExplanationResult | None = None


class CareerInfo(BaseModel):
    """Lightweight career info in recommendations."""

    title: str
    category: str
    description: str | None = None
    median_salary_usd: int | None = None
    market_demand: str | None = None
    growth_rate_percent: float | None = None


class SkillGapResult(BaseModel):
    """Skill gap analysis for a career-student pair."""

    match_score: float
    required_met: int
    required_total: int
    preferred_met: int
    preferred_total: int
    strengths: list[dict[str, Any]] = []
    gaps: list[dict[str, Any]] = []
    priority_learning: list[dict[str, Any]] = []
    bonus_skills: list[dict[str, Any]] = []


class ExplanationResult(BaseModel):
    """Explainable recommendation reasons."""

    top_reasons: list[str] = []
    feature_contributions: dict[str, float] = {}
    suggestions_to_improve: list[str] = []
    confidence_level: str = "medium"


class RecommendationRequest(BaseModel):
    """Request parameters for career recommendations."""

    top_k: int = Field(default=10, ge=1, le=50)
    include_skill_gap: bool = True
    include_explanation: bool = True


class RecommendationResponse(BaseModel):
    """Full recommendation response."""

    recommendations: list[dict[str, Any]]
    diagnostics: dict[str, Any]


class VectorDiagnostics(BaseModel):
    """Feature vector diagnostics for the current user."""

    norm: float
    non_zero_features: int
    total_features: int
    sparsity: float


# Fix forward reference
CareerRecommendation.model_rebuild()

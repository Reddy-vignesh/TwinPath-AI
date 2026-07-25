"""
Decision Twin AI — Analytics Schemas.

Pydantic schemas for platform analytics and metrics.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class PlatformOverview(BaseModel):
    """High-level platform metrics."""

    total_users: int = 0
    active_users: int = 0
    total_profiles: int = 0
    profiles_with_skills: int = 0
    avg_completeness: float = 0.0
    total_careers: int = 0
    total_skills_catalog: int = 0
    total_interests_catalog: int = 0


class UserDistribution(BaseModel):
    """User distribution by role."""

    students: int = 0
    counselors: int = 0
    admins: int = 0


class CompletenessDistribution(BaseModel):
    """Twin completeness score distribution across users."""

    excellent: int = 0       # >= 0.8
    good: int = 0            # >= 0.6
    moderate: int = 0        # >= 0.4
    needs_work: int = 0      # >= 0.2
    minimal: int = 0         # < 0.2
    avg_score: float = 0.0
    median_score: float = 0.0


class SkillPopularity(BaseModel):
    """Most popular skills across the platform."""

    skill_name: str
    category: str
    user_count: int
    avg_proficiency: float


class CareerDemandMetrics(BaseModel):
    """Career browsing and recommendation metrics."""

    career_title: str
    category: str
    recommendation_count: int = 0
    avg_similarity: float = 0.0


class GrowthMetrics(BaseModel):
    """Platform growth over time."""

    period: str
    new_users: int = 0
    new_profiles: int = 0
    recommendations_generated: int = 0


class AnalyticsDashboard(BaseModel):
    """Complete analytics dashboard response."""

    overview: PlatformOverview
    user_distribution: UserDistribution
    completeness_distribution: CompletenessDistribution
    top_skills: list[SkillPopularity] = []
    generated_at: datetime

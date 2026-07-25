"""
Decision Twin AI — Simulation Service.

Orchestrates What-If simulations and salary predictions
by wiring DB data access to the ML pipeline.
"""

from __future__ import annotations

import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.ml.recommender import RecommendationEngine
from app.ml.salary_predictor import SalaryPredictor
from app.ml.seed_data import CAREER_SEED_DATA
from app.ml.simulator import WhatIfSimulator
from app.ml.skill_gap import SkillGapAnalyzer
from app.repositories.twin_repositories import CareerRepository
from app.services.recommendation_service import (
    RecommendationService,
    ensure_index_built,
    get_recommendation_engine,
)

logger = structlog.get_logger(__name__)


class SimulationService:
    """Service layer for What-If simulations and salary predictions."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.rec_service = RecommendationService(session)
        self.engine = get_recommendation_engine()
        self.simulator = WhatIfSimulator(self.engine)
        self.salary_predictor = SalaryPredictor()
        self.skill_gap_analyzer = SkillGapAnalyzer()
        self.career_repo = CareerRepository(session)

    async def run_simulation(
        self,
        user_id: uuid.UUID,
        mutations: list[dict[str, Any]],
        top_k: int = 10,
    ) -> dict[str, Any]:
        """
        Run a what-if simulation for a user.

        Loads the user's current Digital Twin data, applies hypothetical
        mutations, and compares recommendation outcomes.
        """
        await ensure_index_built(self.session)

        # Load current profile data
        profile_data = await self.rec_service._load_twin_data(user_id)

        # Run simulation
        result = self.simulator.simulate(
            base_profile=profile_data,
            mutations=mutations,
            top_k=top_k,
        )

        logger.info(
            "Simulation completed",
            user_id=str(user_id),
            mutations=len(mutations),
            careers_gained=result["impact"]["summary"]["careers_gained"],
            careers_improved=result["impact"]["summary"]["careers_improved"],
        )

        return result

    async def predict_salary(
        self,
        user_id: uuid.UUID,
        career_ids: list[str] | None = None,
        top_k: int = 5,
    ) -> dict[str, Any]:
        """
        Predict salary for a user across multiple careers.

        If career_ids are provided, predicts for those specific careers.
        Otherwise uses the user's top recommendations.
        """
        await ensure_index_built(self.session)

        # Load profile data
        profile_data = await self.rec_service._load_twin_data(user_id)

        # Get careers to predict for
        if career_ids:
            careers = await self._get_careers_by_ids(career_ids)
        else:
            # Use top recommended careers
            recs = self.engine.recommend(
                profile_data, top_k=top_k,
                include_skill_gap=True, include_explanation=False,
            )
            careers = [
                r.get("metadata", r.get("career", {}))
                for r in recs.get("recommendations", [])
            ]

        # Run salary predictions
        user_skills = self._extract_skill_info(profile_data)
        skill_gaps = []
        for career in careers:
            gap = self.skill_gap_analyzer.analyze(user_skills, career)
            skill_gaps.append(gap)

        predictions = self.salary_predictor.predict_multiple(
            profile_data=profile_data,
            careers=careers,
            skill_gaps=skill_gaps,
        )

        # Summary
        if predictions:
            highest = max(predictions, key=lambda x: x["predicted_salary_mid"])
            summary = (
                f"Highest earning potential: {highest['career_title']} "
                f"(${highest['predicted_salary_mid']:,}/yr estimated)"
            )
        else:
            highest = {"career_title": "N/A"}
            summary = "No salary predictions available."

        return {
            "predictions": predictions,
            "highest_potential": highest["career_title"],
            "summary": summary,
        }

    async def compare_careers(
        self,
        user_id: uuid.UUID,
        career_ids: list[str],
    ) -> dict[str, Any]:
        """
        Compare multiple careers side-by-side for a user.

        For each career, computes:
        - Similarity score
        - Skill gap analysis
        - Salary prediction
        - Strengths and weaknesses
        """
        await ensure_index_built(self.session)

        profile_data = await self.rec_service._load_twin_data(user_id)
        careers = await self._get_careers_by_ids(career_ids)
        user_skills = self._extract_skill_info(profile_data)

        comparisons = []
        for career in careers:
            # Skill gap
            gap = self.skill_gap_analyzer.analyze(user_skills, career)

            # Salary prediction
            salary = self.salary_predictor.predict(profile_data, career, gap)

            # Determine strengths/weaknesses
            strengths = []
            weaknesses = []

            if gap["match_score"] >= 0.7:
                strengths.append("Strong skill alignment")
            elif gap["match_score"] < 0.3:
                weaknesses.append("Significant skill gaps")

            if salary["confidence"] == "high":
                strengths.append("High salary confidence")
            if salary.get("factors", {}).get("education", 0) >= 1.1:
                strengths.append("Education exceeds requirements")
            elif salary.get("factors", {}).get("education", 0) < 0.9:
                weaknesses.append("May need additional education")

            demand = (career.get("market_demand") or "").lower()
            if demand == "high":
                strengths.append("High market demand")
            elif demand == "low":
                weaknesses.append("Low market demand")

            growth = career.get("growth_rate_percent", 0) or 0
            if growth >= 20:
                strengths.append(f"Fast growing field ({growth}%)")
            elif growth < 5:
                weaknesses.append("Slow growth outlook")

            risk = career.get("automation_risk_percent", 0) or 0
            if risk >= 25:
                weaknesses.append(f"High automation risk ({risk}%)")
            elif risk <= 10:
                strengths.append("Low automation risk")

            comparisons.append({
                "career_id": str(career.get("id", "")),
                "title": career.get("title", ""),
                "category": career.get("category", ""),
                "skill_gap": gap,
                "salary_prediction": salary,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "market_data": {
                    "median_salary": career.get("median_salary_usd"),
                    "market_demand": career.get("market_demand"),
                    "growth_rate": career.get("growth_rate_percent"),
                    "automation_risk": career.get("automation_risk_percent"),
                },
            })

        return {
            "careers_compared": len(comparisons),
            "comparisons": comparisons,
        }

    async def _get_careers_by_ids(
        self, career_ids: list[str]
    ) -> list[dict[str, Any]]:
        """Load careers from DB by IDs, falling back to seed data."""
        careers: list[dict[str, Any]] = []

        for cid in career_ids:
            try:
                career_uuid = uuid.UUID(cid)
                db_career = await self.career_repo.get_by_id(career_uuid)
                if db_career:
                    careers.append({
                        "id": str(db_career.id),
                        "title": db_career.title,
                        "category": db_career.category,
                        "description": db_career.description,
                        "short_description": db_career.short_description,
                        "median_salary_usd": db_career.median_salary_usd,
                        "salary_range_low": db_career.salary_range_low,
                        "salary_range_high": db_career.salary_range_high,
                        "growth_rate_percent": db_career.growth_rate_percent,
                        "automation_risk_percent": db_career.automation_risk_percent,
                        "market_demand": db_career.market_demand,
                        "required_skills": db_career.required_skills or {},
                        "preferred_skills": db_career.preferred_skills or {},
                        "required_education": db_career.required_education,
                        "typical_experience_years": db_career.typical_experience_years,
                        "required_certifications": db_career.required_certifications or [],
                        "work_environment": db_career.work_environment,
                    })
            except (ValueError, AttributeError):
                # If UUID is invalid, try matching by title in seed data
                for seed in CAREER_SEED_DATA:
                    if seed.get("title", "").lower() == cid.lower():
                        careers.append(seed)
                        break

        if not careers:
            raise NotFoundException(message="No careers found for the provided IDs.")

        return careers

    def _extract_skill_info(self, profile_data: dict) -> list[dict]:
        """Helper to extract skill info from profile data for gap analysis."""
        return [
            {
                "name": s.get("name", ""),
                "proficiency_level": s.get("proficiency_level", 0),
                "category": s.get("category", ""),
            }
            for s in profile_data.get("skills", [])
        ]

    async def generate_learning_roadmap(
        self,
        user_id: uuid.UUID,
        career_id: str,
        hours_per_week: int = 10,
    ) -> dict[str, Any]:
        """
        Generate a learning roadmap for a target career.

        Analyzes the user's skill gaps against the career requirements
        and produces a phased learning plan.
        """
        from app.ml.learning_roadmap import LearningRoadmapGenerator

        await ensure_index_built(self.session)

        profile_data = await self.rec_service._load_twin_data(user_id)
        careers = await self._get_careers_by_ids([career_id])
        career = careers[0]

        user_skills = self._extract_skill_info(profile_data)
        gap = self.skill_gap_analyzer.analyze(user_skills, career)

        generator = LearningRoadmapGenerator()
        roadmap = generator.generate(
            skill_gaps=gap.get("gaps", []),
            career_title=career.get("title", ""),
            hours_per_week=hours_per_week,
        )

        roadmap["skill_gap_summary"] = {
            "match_score": gap.get("match_score", 0),
            "required_met": gap.get("required_met", 0),
            "required_total": gap.get("required_total", 0),
        }

        return roadmap

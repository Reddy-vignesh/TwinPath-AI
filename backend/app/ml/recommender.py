"""
Decision Twin AI — Recommendation Engine.

Orchestrates the full recommendation pipeline:
1. Extract profile data → 2. Build 216D vector →
3. FAISS similarity search → 4. Skill gap analysis →
5. Explainable ranking → 6. Response assembly

This is the core intelligence of the Digital Career Twin.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import structlog

from app.ml.explainer import RecommendationExplainer
from app.ml.feature_engineering import FeatureEngineer
from app.ml.skill_gap import SkillGapAnalyzer
from app.ml.vector_store import CareerVectorStore

logger = structlog.get_logger(__name__)


class RecommendationEngine:
    """
    End-to-end career recommendation pipeline.

    Takes raw profile data, produces ranked, explainable
    career recommendations with skill gap analysis.
    """

    def __init__(
        self,
        vector_store: CareerVectorStore | None = None,
    ) -> None:
        self.feature_engineer = FeatureEngineer()
        self.vector_store = vector_store or CareerVectorStore()
        self.skill_gap_analyzer = SkillGapAnalyzer()
        self.explainer = RecommendationExplainer()

    def recommend(
        self,
        profile_data: dict[str, Any],
        top_k: int = 10,
        include_skill_gap: bool = True,
        include_explanation: bool = True,
    ) -> dict[str, Any]:
        """
        Generate career recommendations for a student.

        Args:
            profile_data: Complete Digital Twin data dict
            top_k: Number of recommendations to return
            include_skill_gap: Include skill gap analysis per career
            include_explanation: Include explainability breakdown

        Returns:
            Dict with recommendations, vector metadata, and diagnostics.
        """
        # Step 1: Build feature vector
        student_vector = self.feature_engineer.build_vector(profile_data)

        logger.info(
            "Feature vector built",
            vector_norm=float(np.linalg.norm(student_vector)),
            non_zero_dims=int(np.count_nonzero(student_vector)),
            total_dims=len(student_vector),
        )

        # Step 2: FAISS similarity search
        if not self.vector_store.is_loaded:
            logger.warning("Vector store not loaded, using empty results")
            raw_results = []
        else:
            raw_results = self.vector_store.search(student_vector, top_k=top_k)

        # Step 3: Enrich each result
        recommendations = []
        user_skills = self._extract_skill_dicts(profile_data)

        for result in raw_results:
            career_meta = result.get("metadata", {})
            rec: dict[str, Any] = {
                "rank": result["rank"],
                "career_id": result["career_id"],
                "similarity_score": round(result["similarity_score"], 4),
                "career": {
                    "title": career_meta.get("title", "Unknown"),
                    "category": career_meta.get("category", ""),
                    "description": career_meta.get("short_description", ""),
                    "median_salary_usd": career_meta.get("median_salary_usd"),
                    "market_demand": career_meta.get("market_demand"),
                    "growth_rate_percent": career_meta.get("growth_rate_percent"),
                },
            }

            # Step 3a: Skill gap analysis
            if include_skill_gap:
                gap = self.skill_gap_analyzer.analyze(user_skills, career_meta)
                rec["skill_gap"] = gap

            # Step 3b: Explainability
            if include_explanation:
                career_vector = career_meta.get("_vector")
                if career_vector is not None:
                    explanation = self.explainer.explain(
                        student_vector=student_vector,
                        career_vector=np.array(career_vector, dtype=np.float32),
                        career_metadata=career_meta,
                        skill_gap=rec.get("skill_gap"),
                    )
                    rec["explanation"] = explanation

            recommendations.append(rec)

        # Step 4: Diagnostics
        diagnostics = {
            "vector_stats": {
                "norm": round(float(np.linalg.norm(student_vector)), 4),
                "non_zero_features": int(np.count_nonzero(student_vector)),
                "total_features": len(student_vector),
                "sparsity": round(
                    1 - np.count_nonzero(student_vector) / len(student_vector), 4
                ),
            },
            "index_size": self.vector_store.size,
            "results_returned": len(recommendations),
        }

        return {
            "recommendations": recommendations,
            "diagnostics": diagnostics,
        }

    def _extract_skill_dicts(
        self, profile_data: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Extract flat skill dicts from profile data for gap analysis."""
        skills = profile_data.get("skills", [])
        flat = []
        for s in skills:
            skill_info = s.get("skill", s)
            flat.append({
                "name": skill_info.get("name", s.get("name", "")),
                "proficiency_level": s.get("proficiency_level", 0),
                "category": skill_info.get("category", s.get("category", "")),
            })
        return flat

    def build_career_index(
        self, careers: list[dict[str, Any]]
    ) -> int:
        """
        Build the FAISS index from a list of career dicts.

        Each career is converted into a synthetic 216D vector
        based on its required skills, education, and category.

        Returns the number of careers indexed.
        """
        if not careers:
            logger.warning("No careers to index")
            return 0

        vectors = []
        career_ids = []
        career_metadata = []

        for career in careers:
            vector = self._career_to_vector(career)
            vectors.append(vector)
            career_ids.append(str(career.get("id", "")))

            # Store metadata + vector for explainability
            meta = {**career}
            meta["_vector"] = vector.tolist()
            career_metadata.append(meta)

        vectors_np = np.array(vectors, dtype=np.float32)
        self.vector_store.build_index(vectors_np, career_ids, career_metadata)

        logger.info("Career index built", n_careers=len(careers))
        return len(careers)

    def _career_to_vector(self, career: dict[str, Any]) -> np.ndarray:
        """
        Convert a career definition into a 216D vector.

        Uses the career's required skills, education, category,
        and work environment to build a representative vector.
        """
        from app.core.constants import TOTAL_FEATURE_DIM

        vector = np.zeros(TOTAL_FEATURE_DIM, dtype=np.float32)

        # Academic dimension: encode required education
        start_acad = 0
        edu = (career.get("required_education") or "").lower()
        edu_map = {
            "high school": 0.2, "associate": 0.4, "bachelor": 0.6,
            "bachelors": 0.6, "master": 0.8, "masters": 0.8,
            "phd": 1.0, "doctorate": 1.0,
        }
        for key, val in edu_map.items():
            if key in edu:
                vector[start_acad + 1] = val
                break

        exp_years = career.get("typical_experience_years", 0) or 0
        vector[start_acad + 4] = min(exp_years / 20.0, 1.0)

        # Skill dimension: encode required skills
        start_skill = 32
        required = career.get("required_skills") or {}
        preferred = career.get("preferred_skills") or {}
        all_skills = {**preferred, **required}

        # Hash skills into category buckets
        skill_cats = FeatureEngineer.SKILL_CATEGORIES
        for skill_name, level in all_skills.items():
            # Assign to a category bucket via hashing
            bucket = hash(skill_name.lower()) % len(skill_cats)
            lvl = int(level) if isinstance(level, (int, float)) else 5
            norm_level = lvl / 10.0
            vector[start_skill + bucket] = max(
                vector[start_skill + bucket], norm_level
            )
            vector[start_skill + 10 + bucket] = max(
                vector[start_skill + 10 + bucket], norm_level
            )

        # Skill count signal
        vector[start_skill + 50] = min(len(all_skills) / 20.0, 1.0)
        if all_skills:
            levels = [
                int(v) / 10.0 if isinstance(v, (int, float)) else 0.5
                for v in all_skills.values()
            ]
            vector[start_skill + 51] = float(np.mean(levels))

        # Career goal dimension: encode category
        start_goal = 120
        category = (career.get("category") or "").lower()
        if category:
            idx = hash(category) % 8
            vector[start_goal + idx] = 1.0

        # Work environment
        work_env = (career.get("work_environment") or "").lower()
        if "remote" in work_env:
            vector[start_goal + 14] = 0.2
        elif "hybrid" in work_env:
            vector[start_goal + 14] = 0.5
        else:
            vector[start_goal + 14] = 0.8

        # L2 normalize
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector

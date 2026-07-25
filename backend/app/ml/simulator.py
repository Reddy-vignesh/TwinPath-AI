"""
Decision Twin AI — What-If Career Simulator.

Lets students simulate hypothetical changes to their Digital Twin
and instantly see how those changes affect career recommendations.

Supported simulations:
- Add/remove/upgrade skills
- Add certifications
- Change career goals
- Modify academic credentials
- Adjust psychometric traits

The simulator creates a shadow copy of the profile, applies mutations,
re-runs the recommendation engine, and diffs the results against
the current baseline.
"""

from __future__ import annotations

import copy
from typing import Any

import numpy as np
import structlog

from app.ml.recommender import RecommendationEngine

logger = structlog.get_logger(__name__)


class WhatIfSimulator:
    """
    Simulates hypothetical profile changes and their impact
    on career recommendations.
    """

    def __init__(self, engine: RecommendationEngine) -> None:
        self.engine = engine

    def simulate(
        self,
        base_profile: dict[str, Any],
        mutations: list[dict[str, Any]],
        top_k: int = 10,
    ) -> dict[str, Any]:
        """
        Run a what-if simulation.

        Args:
            base_profile: Current Digital Twin data dict
            mutations: List of mutation operations to apply
            top_k: Number of recommendations to compare

        Returns:
            Dict with baseline results, simulated results, and impact analysis.
        """
        # Step 1: Get baseline recommendations
        baseline = self.engine.recommend(
            base_profile, top_k=top_k,
            include_skill_gap=True, include_explanation=False,
        )

        # Step 2: Apply mutations to create shadow profile
        shadow_profile = copy.deepcopy(base_profile)
        applied_mutations: list[dict[str, Any]] = []

        for mutation in mutations:
            result = self._apply_mutation(shadow_profile, mutation)
            applied_mutations.append(result)

        # Step 3: Get simulated recommendations
        simulated = self.engine.recommend(
            shadow_profile, top_k=top_k,
            include_skill_gap=True, include_explanation=True,
        )

        # Step 4: Diff the results
        impact = self._compute_impact(baseline, simulated)

        # Step 5: Build feature vector comparison
        base_vector = self.engine.feature_engineer.build_vector(base_profile)
        sim_vector = self.engine.feature_engineer.build_vector(shadow_profile)
        vector_diff = self._vector_diff(base_vector, sim_vector)

        return {
            "mutations_applied": applied_mutations,
            "baseline": {
                "top_careers": self._extract_summary(baseline),
                "diagnostics": baseline.get("diagnostics", {}),
            },
            "simulated": {
                "top_careers": self._extract_summary(simulated),
                "recommendations": simulated.get("recommendations", []),
                "diagnostics": simulated.get("diagnostics", {}),
            },
            "impact": impact,
            "vector_diff": vector_diff,
        }

    def _apply_mutation(
        self, profile: dict[str, Any], mutation: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Apply a single mutation to the shadow profile.

        Mutation format:
        {
            "type": "add_skill" | "upgrade_skill" | "remove_skill" |
                    "add_certification" | "change_goal" |
                    "update_academic" | "adjust_trait",
            "params": { ... mutation-specific parameters ... }
        }
        """
        mut_type = mutation.get("type", "")
        params = mutation.get("params", {})
        applied = {"type": mut_type, "status": "applied", "details": ""}

        try:
            if mut_type == "add_skill":
                self._mut_add_skill(profile, params)
                applied["details"] = (
                    f"Added skill '{params.get('name', '')}' "
                    f"at proficiency {params.get('proficiency_level', 5)}"
                )

            elif mut_type == "upgrade_skill":
                self._mut_upgrade_skill(profile, params)
                applied["details"] = (
                    f"Upgraded '{params.get('name', '')}' "
                    f"to proficiency {params.get('proficiency_level', 0)}"
                )

            elif mut_type == "remove_skill":
                self._mut_remove_skill(profile, params)
                applied["details"] = f"Removed skill '{params.get('name', '')}'"

            elif mut_type == "add_certification":
                self._mut_add_certification(profile, params)
                applied["details"] = (
                    f"Added certification '{params.get('name', '')}' "
                    f"from {params.get('issuing_organization', '')}"
                )

            elif mut_type == "change_goal":
                self._mut_change_goal(profile, params)
                applied["details"] = (
                    f"Changed career goal to '{params.get('career_goal_primary', '')}'"
                )

            elif mut_type == "update_academic":
                self._mut_update_academic(profile, params)
                applied["details"] = (
                    f"Updated academic: {params.get('field', '')} "
                    f"→ {params.get('value', '')}"
                )

            elif mut_type == "adjust_trait":
                self._mut_adjust_trait(profile, params)
                applied["details"] = (
                    f"Adjusted {params.get('trait', '')} "
                    f"to {params.get('value', 0)}"
                )

            else:
                applied["status"] = "skipped"
                applied["details"] = f"Unknown mutation type: {mut_type}"

        except Exception as exc:
            applied["status"] = "error"
            applied["details"] = str(exc)
            logger.warning("Mutation failed", type=mut_type, error=str(exc))

        return applied

    # ── Mutation Implementations ──────────────────────────────────

    def _mut_add_skill(self, profile: dict, params: dict) -> None:
        skills = profile.setdefault("skills", [])
        skills.append({
            "name": params.get("name", "Unknown"),
            "category": params.get("category", "other"),
            "proficiency_level": params.get("proficiency_level", 5),
            "years_experience": params.get("years_experience", 0),
            "is_primary": params.get("is_primary", False),
        })

    def _mut_upgrade_skill(self, profile: dict, params: dict) -> None:
        name = params.get("name", "").lower()
        new_level = params.get("proficiency_level", 0)
        for skill in profile.get("skills", []):
            if skill.get("name", "").lower() == name:
                if new_level:
                    skill["proficiency_level"] = new_level
                if params.get("years_experience") is not None:
                    skill["years_experience"] = params["years_experience"]
                return
        # Skill not found — add it as a new skill (graceful fallback)
        self._mut_add_skill(profile, params)


    def _mut_remove_skill(self, profile: dict, params: dict) -> None:
        name = params.get("name", "").lower()
        skills = profile.get("skills", [])
        profile["skills"] = [
            s for s in skills if s.get("name", "").lower() != name
        ]

    def _mut_add_certification(self, profile: dict, params: dict) -> None:
        from datetime import date
        certs = profile.setdefault("certifications", [])
        certs.append({
            "name": params.get("name", "Unknown"),
            "issuing_organization": params.get("issuing_organization", ""),
            "issue_date": date.today(),
            "is_verified": False,
        })

    def _mut_change_goal(self, profile: dict, params: dict) -> None:
        prof = profile.setdefault("profile", {})
        if params.get("career_goal_primary"):
            prof["career_goal_primary"] = params["career_goal_primary"]
        if params.get("career_goal_secondary"):
            prof["career_goal_secondary"] = params["career_goal_secondary"]
        if params.get("preferred_industry"):
            prof["preferred_industry"] = params["preferred_industry"]

    def _mut_update_academic(self, profile: dict, params: dict) -> None:
        prof = profile.setdefault("profile", {})
        field = params.get("field", "")
        value = params.get("value")
        valid_fields = {
            "current_cgpa", "highest_degree", "current_major",
            "graduation_year", "current_university",
        }
        if field in valid_fields:
            prof[field] = value

    def _mut_adjust_trait(self, profile: dict, params: dict) -> None:
        psychometrics = profile.get("psychometrics", [])
        if not psychometrics:
            psychometrics = [{"assessment_type": "big_five"}]
            profile["psychometrics"] = psychometrics
        trait = params.get("trait", "")
        value = max(0.0, min(1.0, float(params.get("value", 0.5))))
        psychometrics[-1][trait] = value

    # ── Impact Analysis ───────────────────────────────────────────

    def _compute_impact(
        self, baseline: dict, simulated: dict
    ) -> dict[str, Any]:
        """Compute the impact of mutations on recommendations."""
        base_careers = {
            r["career_id"]: r
            for r in baseline.get("recommendations", [])
        }
        sim_careers = {
            r["career_id"]: r
            for r in simulated.get("recommendations", [])
        }

        # New careers that appeared
        new_entries = [
            {
                "career_id": cid,
                "title": r["career"].get("title", ""),
                "new_rank": r["rank"],
                "similarity": r["similarity_score"],
            }
            for cid, r in sim_careers.items()
            if cid not in base_careers
        ]

        # Careers that disappeared
        dropped = [
            {
                "career_id": cid,
                "title": r["career"].get("title", ""),
                "old_rank": r["rank"],
            }
            for cid, r in base_careers.items()
            if cid not in sim_careers
        ]

        # Rank changes for careers in both
        rank_changes = []
        for cid in base_careers:
            if cid in sim_careers:
                old_rank = base_careers[cid]["rank"]
                new_rank = sim_careers[cid]["rank"]
                old_score = base_careers[cid]["similarity_score"]
                new_score = sim_careers[cid]["similarity_score"]
                if old_rank != new_rank or abs(old_score - new_score) > 0.001:
                    rank_changes.append({
                        "career_id": cid,
                        "title": sim_careers[cid]["career"].get("title", ""),
                        "old_rank": old_rank,
                        "new_rank": new_rank,
                        "rank_delta": old_rank - new_rank,
                        "score_delta": round(new_score - old_score, 4),
                    })

        # Skill gap improvements
        skill_improvements = []
        for cid in sim_careers:
            if cid in base_careers:
                old_gap = base_careers[cid].get("skill_gap", {})
                new_gap = sim_careers[cid].get("skill_gap", {})
                old_match = old_gap.get("match_score", 0)
                new_match = new_gap.get("match_score", 0)
                if new_match > old_match:
                    skill_improvements.append({
                        "career_id": cid,
                        "title": sim_careers[cid]["career"].get("title", ""),
                        "old_match": round(old_match, 4),
                        "new_match": round(new_match, 4),
                        "improvement": round(new_match - old_match, 4),
                    })

        return {
            "new_entries": new_entries,
            "dropped": dropped,
            "rank_changes": sorted(
                rank_changes, key=lambda x: abs(x["rank_delta"]), reverse=True
            ),
            "skill_improvements": sorted(
                skill_improvements, key=lambda x: x["improvement"], reverse=True
            ),
            "summary": {
                "careers_gained": len(new_entries),
                "careers_lost": len(dropped),
                # Count both rank improvements AND score improvements (>0.3% boost)
                "careers_improved": len([
                    r for r in rank_changes
                    if r["rank_delta"] > 0 or r["score_delta"] > 0.003
                ]),
                "careers_declined": len([
                    r for r in rank_changes if r["rank_delta"] < 0
                ]),
                # Extra: total score delta across all shared careers
                "total_score_delta": round(sum(
                    r["score_delta"] for r in rank_changes
                ), 4),
                "skill_gaps_closed": len(skill_improvements),
            },
        }


    def _extract_summary(
        self, result: dict
    ) -> list[dict[str, Any]]:
        """Extract lightweight career summaries from recommendations."""
        return [
            {
                "rank": r["rank"],
                "career_id": r["career_id"],
                "title": r["career"].get("title", ""),
                "similarity_score": r["similarity_score"],
                "skill_match": r.get("skill_gap", {}).get("match_score", 0),
            }
            for r in result.get("recommendations", [])
        ]

    def _vector_diff(
        self, base: np.ndarray, simulated: np.ndarray
    ) -> dict[str, Any]:
        """Compute per-feature-group vector differences."""
        from app.core.constants import FEATURE_GROUP_RANGES

        diff = simulated - base
        group_changes = {}

        for group, (start, end) in FEATURE_GROUP_RANGES.items():
            group_diff = diff[start:end]
            magnitude = float(np.linalg.norm(group_diff))
            mean_change = float(np.mean(np.abs(group_diff)))
            group_changes[group] = {
                "magnitude": round(magnitude, 6),
                "mean_absolute_change": round(mean_change, 6),
                "dims_changed": int(np.count_nonzero(group_diff)),
            }

        return {
            "total_change_magnitude": round(float(np.linalg.norm(diff)), 6),
            "dims_changed": int(np.count_nonzero(diff)),
            "group_changes": group_changes,
        }

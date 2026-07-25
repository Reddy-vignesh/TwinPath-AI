"""
Decision Twin AI — Recommendation Explainer.

Generates human-readable explanations for why a career
was recommended to a student. Transparency builds trust.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from app.core.constants import FEATURE_GROUP_RANGES, RECOMMENDATION_WEIGHTS


class RecommendationExplainer:
    """
    Produces explainable recommendation reasoning.

    Analyzes which feature groups contributed most to a career match
    and translates that into actionable, student-friendly explanations.
    """

    FEATURE_DESCRIPTIONS: dict[str, str] = {
        "skill": "Your skills closely align with this career's requirements",
        "interest": "Your interests match well with this career domain",
        "academic": "Your academic background supports this career path",
        "project": "Your project experience is relevant to this role",
        "certification": "Your certifications strengthen your candidacy",
        "psychometric": "Your personality traits align with this work style",
        "career_goal": "This career matches your stated goals",
        "behavior": "Your exploration patterns suggest interest in this area",
        "resume": "Your overall profile supports this recommendation",
    }

    def explain(
        self,
        student_vector: np.ndarray,
        career_vector: np.ndarray,
        career_metadata: dict[str, Any],
        skill_gap: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate an explanation for a career recommendation.

        Args:
            student_vector: Student's 216D feature vector
            career_vector: Career's 216D feature vector
            career_metadata: Career details (title, category, etc.)
            skill_gap: Optional skill gap analysis result

        Returns:
            Explanation dict with reasons, contribution scores, and suggestions.
        """
        # Calculate per-group contribution to similarity
        contributions: dict[str, float] = {}
        total_contribution = 0.0

        for group_name, (start, end) in FEATURE_GROUP_RANGES.items():
            student_slice = student_vector[start:end]
            career_slice = career_vector[start:end]

            # Dot product contribution (unnormalized)
            contribution = float(np.dot(student_slice, career_slice))
            contributions[group_name] = contribution
            total_contribution += abs(contribution)

        # Normalize contributions to percentages
        if total_contribution > 0:
            contributions = {
                k: round(v / total_contribution, 4)
                for k, v in contributions.items()
            }

        # Sort by contribution (highest first)
        sorted_contributions = sorted(
            contributions.items(), key=lambda x: x[1], reverse=True
        )

        # Generate top reasons
        top_reasons: list[str] = []
        for group, score in sorted_contributions[:4]:
            if score > 0.05:  # Only include meaningful contributions
                reason = self.FEATURE_DESCRIPTIONS.get(group, "")
                if reason:
                    top_reasons.append(f"{reason} ({score:.0%} match)")

        # Add skill gap insights
        if skill_gap:
            match_score = skill_gap.get("match_score", 0)
            if match_score >= 0.8:
                top_reasons.append(
                    f"You already meet {skill_gap['required_met']}/{skill_gap['required_total']} "
                    f"required skills"
                )
            elif skill_gap.get("priority_learning"):
                top_skills = [
                    s["skill"] for s in skill_gap["priority_learning"][:3]
                ]
                top_reasons.append(
                    f"Focus on learning: {', '.join(top_skills)} to strengthen your fit"
                )

        # Growth suggestions
        suggestions: list[str] = []
        weakest = sorted_contributions[-3:]
        for group, score in weakest:
            if score < 0.1:
                suggestions.append(
                    self._get_suggestion(group, career_metadata)
                )

        return {
            "top_reasons": top_reasons,
            "feature_contributions": dict(sorted_contributions),
            "suggestions_to_improve": [s for s in suggestions if s],
            "confidence_level": self._classify_confidence(
                sum(s for _, s in sorted_contributions[:3])
            ),
        }

    def _classify_confidence(self, top3_sum: float) -> str:
        """Classify recommendation confidence based on top-3 feature alignment."""
        if top3_sum >= 0.7:
            return "high"
        elif top3_sum >= 0.4:
            return "medium"
        return "low"

    def _get_suggestion(self, group: str, career: dict) -> str:
        """Generate a targeted improvement suggestion for a weak feature group."""
        suggestions_map: dict[str, str] = {
            "skill": f"Build skills relevant to {career.get('title', 'this career')}",
            "interest": "Explore interests related to this career domain",
            "academic": "Consider coursework or certifications in this field",
            "project": "Work on projects related to this career area",
            "certification": f"Pursue certifications for {career.get('category', 'this field')}",
            "psychometric": "Complete a psychometric assessment to improve matching",
            "career_goal": "Update your career goals to help us refine recommendations",
            "behavior": "Explore more career content to improve behavioral signals",
        }
        return suggestions_map.get(group, "")

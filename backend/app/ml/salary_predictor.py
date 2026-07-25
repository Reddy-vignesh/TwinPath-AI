"""
Decision Twin AI — Salary Predictor.

Estimates expected salary for a student-career pairing based on:
- Student's skill match and proficiency levels
- Academic credentials (degree, GPA)
- Experience years
- Certifications held
- Career market data (median, range)
- Location and work style factors

Uses a transparent, rules-based model (not a black-box ML model)
so predictions are fully explainable.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import structlog

logger = structlog.get_logger(__name__)


class SalaryPredictor:
    """
    Predicts expected salary range for a student-career pairing.

    Uses a multi-factor scoring model with transparent weights
    so every prediction is fully explainable.
    """

    # Factor weights (sum to 1.0)
    WEIGHTS = {
        "skill_match": 0.30,
        "education": 0.20,
        "experience": 0.20,
        "certifications": 0.10,
        "gpa": 0.10,
        "market_adjustment": 0.10,
    }

    DEGREE_MULTIPLIERS = {
        "high school": 0.70,
        "diploma": 0.75,
        "associate": 0.80,
        "bachelor": 1.00,
        "bachelors": 1.00,
        "b.tech": 1.00,
        "b.sc": 0.95,
        "b.e": 1.00,
        "master": 1.15,
        "masters": 1.15,
        "m.tech": 1.15,
        "m.sc": 1.10,
        "mba": 1.20,
        "mca": 1.05,
        "phd": 1.30,
        "doctorate": 1.30,
    }

    DEMAND_MULTIPLIERS = {
        "high": 1.10,
        "medium": 1.00,
        "low": 0.90,
    }

    def predict(
        self,
        profile_data: dict[str, Any],
        career: dict[str, Any],
        skill_gap: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Predict salary for a student-career pairing.

        Returns predicted range, confidence, and factor breakdown.
        """
        median = career.get("median_salary_usd") or 0
        range_low = career.get("salary_range_low") or int(median * 0.6)
        range_high = career.get("salary_range_high") or int(median * 1.6)

        if median == 0:
            return {
                "predicted_salary_low": 0,
                "predicted_salary_mid": 0,
                "predicted_salary_high": 0,
                "confidence": "unavailable",
                "factors": {},
                "explanation": "Salary data not available for this career.",
            }

        # Calculate each factor score (0.0 - 1.0)
        factors = {}

        # 1. Skill match factor
        if skill_gap:
            factors["skill_match"] = skill_gap.get("match_score", 0.5)
        else:
            factors["skill_match"] = 0.5

        # 2. Education factor
        degree = (profile_data.get("profile", {}).get("highest_degree") or "").lower()
        req_edu = (career.get("required_education") or "").lower()
        user_mult = self._degree_score(degree)
        req_mult = self._degree_score(req_edu)
        factors["education"] = min(user_mult / max(req_mult, 0.7), 1.3)

        # 3. Experience factor
        skills = profile_data.get("skills", [])
        avg_experience = 0.0
        if skills:
            experiences = [s.get("years_experience", 0) or 0 for s in skills]
            avg_experience = np.mean(experiences) if experiences else 0
        req_years = career.get("typical_experience_years", 2) or 2
        factors["experience"] = min(avg_experience / max(req_years, 1), 1.5)

        # 4. Certifications factor
        certs = profile_data.get("certifications", [])
        req_certs = career.get("required_certifications") or []
        if req_certs:
            cert_match = min(len(certs) / len(req_certs), 1.0)
        else:
            cert_match = min(len(certs) / 3.0, 1.0)  # Bonus for any certs
        factors["certifications"] = cert_match

        # 5. GPA factor
        cgpa = profile_data.get("profile", {}).get("current_cgpa", 0) or 0
        factors["gpa"] = min(cgpa / 10.0, 1.0)

        # 6. Market demand adjustment
        demand = (career.get("market_demand") or "medium").lower()
        factors["market_adjustment"] = self.DEMAND_MULTIPLIERS.get(demand, 1.0)

        # Compute weighted composite score
        composite = sum(
            factors[k] * self.WEIGHTS[k] for k in self.WEIGHTS
        )

        # Map composite to salary range position
        # 0.0 → range_low, 0.5 → median, 1.0 → range_high
        if composite >= 0.5:
            # Upper half: median → range_high
            position = (composite - 0.5) / 0.5
            predicted_mid = int(median + position * (range_high - median))
        else:
            # Lower half: range_low → median
            position = composite / 0.5
            predicted_mid = int(range_low + position * (median - range_low))

        # Confidence interval (±10-20% based on data quality)
        data_quality = self._assess_data_quality(profile_data, career)
        margin = 0.10 if data_quality > 0.7 else (0.15 if data_quality > 0.4 else 0.20)

        predicted_low = int(predicted_mid * (1 - margin))
        predicted_high = int(predicted_mid * (1 + margin))

        # Confidence level
        if data_quality > 0.7 and composite > 0.4:
            confidence = "high"
        elif data_quality > 0.4:
            confidence = "medium"
        else:
            confidence = "low"

        # Generate explanation
        explanation_parts = []
        if factors["skill_match"] >= 0.7:
            explanation_parts.append("Strong skill alignment pushes salary upward")
        elif factors["skill_match"] < 0.3:
            explanation_parts.append("Skill gaps may limit initial salary")

        if factors["education"] >= 1.1:
            explanation_parts.append("Your education level exceeds typical requirements")
        elif factors["education"] < 0.9:
            explanation_parts.append("Additional education could increase earning potential")

        if factors["experience"] >= 0.8:
            explanation_parts.append("Your experience level supports competitive compensation")
        elif factors["experience"] < 0.3:
            explanation_parts.append("More experience would strengthen salary negotiations")

        if demand == "high":
            explanation_parts.append("High market demand increases earning potential")

        return {
            "predicted_salary_low": predicted_low,
            "predicted_salary_mid": predicted_mid,
            "predicted_salary_high": predicted_high,
            "career_range": {
                "low": range_low,
                "median": median,
                "high": range_high,
            },
            "composite_score": round(composite, 4),
            "confidence": confidence,
            "factors": {k: round(v, 4) for k, v in factors.items()},
            "factor_weights": self.WEIGHTS,
            "explanation": " | ".join(explanation_parts) if explanation_parts else (
                "Prediction based on profile-career alignment"
            ),
            "data_quality": round(data_quality, 4),
        }

    def predict_multiple(
        self,
        profile_data: dict[str, Any],
        careers: list[dict[str, Any]],
        skill_gaps: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        """Predict salary for multiple careers at once."""
        results = []
        for i, career in enumerate(careers):
            gap = skill_gaps[i] if skill_gaps and i < len(skill_gaps) else None
            prediction = self.predict(profile_data, career, gap)
            prediction["career_title"] = career.get("title", "Unknown")
            prediction["career_id"] = str(career.get("id", ""))
            results.append(prediction)

        return sorted(results, key=lambda x: x["predicted_salary_mid"], reverse=True)

    def _degree_score(self, degree_str: str) -> float:
        """Map a degree string to a score multiplier."""
        for key, mult in self.DEGREE_MULTIPLIERS.items():
            if key in degree_str:
                return mult
        return 0.9  # Default for unrecognized

    def _assess_data_quality(
        self, profile: dict, career: dict
    ) -> float:
        """
        Assess how much data we have for a reliable prediction.

        Returns 0.0 - 1.0 score.
        """
        checks = [
            bool(profile.get("skills")),
            bool(profile.get("profile", {}).get("current_cgpa")),
            bool(profile.get("profile", {}).get("highest_degree")),
            bool(profile.get("certifications")),
            bool(profile.get("academics")),
            bool(career.get("median_salary_usd")),
            bool(career.get("required_skills")),
            bool(career.get("salary_range_low")),
        ]
        return sum(checks) / len(checks)

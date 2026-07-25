"""
Decision Twin AI — Skill Gap Analyzer.

Compares a student's skill profile against career requirements
to identify gaps, strengths, and learning priorities.
"""

from __future__ import annotations

from typing import Any

import structlog

logger = structlog.get_logger(__name__)


class SkillGapAnalyzer:
    """
    Analyzes the gap between a student's current skills and
    the skills required/preferred for a target career.
    """

    def analyze(
        self,
        user_skills: list[dict[str, Any]],
        career: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Compute skill gap analysis for a student-career pair.

        Args:
            user_skills: List of user skills with name & proficiency_level
            career: Career dict with required_skills and preferred_skills

        Returns:
            Dict with strengths, gaps, match_score, and priority learning paths.
        """
        # Build user skill map: name.lower() -> proficiency_level
        user_skill_map: dict[str, int] = {}
        for skill in user_skills:
            name = skill.get("name", "").lower()
            prof = skill.get("proficiency_level", 0)
            if name:
                user_skill_map[name] = prof

        required = career.get("required_skills") or {}
        preferred = career.get("preferred_skills") or {}

        # Analyze required skills
        strengths: list[dict[str, Any]] = []
        gaps: list[dict[str, Any]] = []

        for skill_name, required_level in required.items():
            skill_lower = skill_name.lower()
            user_level = user_skill_map.get(skill_lower, 0)
            required_int = int(required_level) if isinstance(required_level, (int, float)) else 5

            entry = {
                "skill": skill_name,
                "required_level": required_int,
                "current_level": user_level,
                "gap": max(0, required_int - user_level),
                "is_required": True,
            }

            if user_level >= required_int:
                strengths.append(entry)
            else:
                gaps.append(entry)

        # Analyze preferred skills
        preferred_gaps: list[dict[str, Any]] = []
        preferred_strengths: list[dict[str, Any]] = []

        for skill_name, pref_level in preferred.items():
            skill_lower = skill_name.lower()
            if skill_lower in {s.lower() for s in required}:
                continue  # Already covered

            user_level = user_skill_map.get(skill_lower, 0)
            pref_int = int(pref_level) if isinstance(pref_level, (int, float)) else 3

            entry = {
                "skill": skill_name,
                "preferred_level": pref_int,
                "current_level": user_level,
                "gap": max(0, pref_int - user_level),
                "is_required": False,
            }

            if user_level >= pref_int:
                preferred_strengths.append(entry)
            else:
                preferred_gaps.append(entry)

        # Calculate match score
        total_required = len(required)
        met_required = len(strengths)
        required_score = (met_required / total_required) if total_required > 0 else 1.0

        total_preferred = len(preferred) - len([
            s for s in preferred if s.lower() in {r.lower() for r in required}
        ])
        met_preferred = len(preferred_strengths)
        preferred_score = (met_preferred / total_preferred) if total_preferred > 0 else 1.0

        # Weighted match: 70% required, 30% preferred
        match_score = 0.7 * required_score + 0.3 * preferred_score

        # Priority learning (sorted by gap size, required first)
        priority_learning = sorted(
            gaps + preferred_gaps,
            key=lambda x: (not x.get("is_required", False), -x["gap"]),
        )[:10]

        # Extra skills the user has beyond requirements
        all_required_lower = {s.lower() for s in required}
        all_preferred_lower = {s.lower() for s in preferred}
        bonus_skills = [
            {"skill": name, "proficiency": level}
            for name, level in user_skill_map.items()
            if name not in all_required_lower and name not in all_preferred_lower
        ]

        return {
            "match_score": round(match_score, 4),
            "required_met": met_required,
            "required_total": total_required,
            "preferred_met": met_preferred,
            "preferred_total": total_preferred,
            "strengths": strengths + preferred_strengths,
            "gaps": gaps + preferred_gaps,
            "priority_learning": priority_learning,
            "bonus_skills": bonus_skills[:10],
        }

"""
Decision Twin AI — Learning Roadmap Generator.

Given skill gaps for a target career, generates an ordered
learning roadmap with estimated timelines and milestones.
"""

from __future__ import annotations

from typing import Any

import structlog

logger = structlog.get_logger(__name__)

# Time estimates per skill category (weeks for moderate proficiency)
SKILL_TIME_ESTIMATES: dict[str, dict[str, int]] = {
    "programming_language": {"beginner": 8, "intermediate": 16, "advanced": 30},
    "framework": {"beginner": 4, "intermediate": 10, "advanced": 20},
    "database": {"beginner": 3, "intermediate": 8, "advanced": 16},
    "devops": {"beginner": 4, "intermediate": 10, "advanced": 20},
    "cloud": {"beginner": 4, "intermediate": 12, "advanced": 24},
    "data_science": {"beginner": 6, "intermediate": 16, "advanced": 30},
    "soft_skill": {"beginner": 4, "intermediate": 12, "advanced": 24},
    "domain_knowledge": {"beginner": 6, "intermediate": 16, "advanced": 30},
    "tool": {"beginner": 2, "intermediate": 6, "advanced": 12},
    "other": {"beginner": 4, "intermediate": 10, "advanced": 20},
}

RESOURCE_SUGGESTIONS: dict[str, list[dict[str, str]]] = {
    "programming_language": [
        {"type": "course", "name": "FreeCodeCamp / Codecademy"},
        {"type": "practice", "name": "LeetCode / HackerRank"},
        {"type": "project", "name": "Build a portfolio project"},
    ],
    "framework": [
        {"type": "docs", "name": "Official documentation + tutorials"},
        {"type": "course", "name": "Udemy / Pluralsight courses"},
        {"type": "project", "name": "Build a full app with the framework"},
    ],
    "database": [
        {"type": "course", "name": "SQLZoo / Khan Academy SQL"},
        {"type": "practice", "name": "StrataScratch / DataLemur"},
        {"type": "project", "name": "Design a multi-table schema"},
    ],
    "data_science": [
        {"type": "course", "name": "Andrew Ng ML Course / fast.ai"},
        {"type": "practice", "name": "Kaggle competitions"},
        {"type": "project", "name": "End-to-end ML project on GitHub"},
    ],
    "cloud": [
        {"type": "cert", "name": "Official cloud certification track"},
        {"type": "practice", "name": "Hands-on labs (Qwiklabs, Cloud Guru)"},
        {"type": "project", "name": "Deploy a multi-service app"},
    ],
    "devops": [
        {"type": "course", "name": "DevOps with Docker/K8s courses"},
        {"type": "practice", "name": "Set up CI/CD for a project"},
        {"type": "cert", "name": "CKA / AWS DevOps certification"},
    ],
    "soft_skill": [
        {"type": "book", "name": "Relevant books & articles"},
        {"type": "practice", "name": "Toastmasters / volunteering"},
        {"type": "course", "name": "LinkedIn Learning soft skills"},
    ],
}


class LearningRoadmapGenerator:
    """Generates personalized learning roadmaps from skill gaps."""

    def generate(
        self,
        skill_gaps: list[dict[str, Any]],
        career_title: str = "",
        hours_per_week: int = 10,
    ) -> dict[str, Any]:
        """
        Generate a learning roadmap from skill gap analysis.

        Args:
            skill_gaps: List of skill gap dicts with name, gap, category, is_required
            career_title: Target career name (for context)
            hours_per_week: Learner's available hours per week

        Returns:
            Ordered roadmap with phases, milestones, and time estimates.
        """
        if not skill_gaps:
            return {
                "career_target": career_title,
                "total_weeks": 0,
                "phases": [],
                "summary": "No skill gaps detected — you're career-ready!",
            }

        # Sort: required first, then by gap size (largest first)
        sorted_gaps = sorted(
            skill_gaps,
            key=lambda x: (
                not x.get("is_required", False),
                -x.get("gap", 0),
            ),
        )

        # Group into phases
        phases = self._create_phases(sorted_gaps, hours_per_week)

        total_weeks = sum(p["estimated_weeks"] for p in phases)

        # Milestones
        milestones = self._create_milestones(phases)

        return {
            "career_target": career_title,
            "hours_per_week": hours_per_week,
            "total_weeks": total_weeks,
            "total_months": round(total_weeks / 4.3, 1),
            "phases": phases,
            "milestones": milestones,
            "summary": (
                f"To become a {career_title}, complete {len(phases)} learning phases "
                f"over ~{round(total_weeks / 4.3, 0):.0f} months "
                f"({hours_per_week}hrs/week)."
            ),
        }

    def _create_phases(
        self,
        gaps: list[dict[str, Any]],
        hours_per_week: int,
    ) -> list[dict[str, Any]]:
        """Group skills into learning phases."""
        phases: list[dict[str, Any]] = []

        # Phase 1: Critical required skills (highest gap)
        required = [g for g in gaps if g.get("is_required", False)]
        preferred = [g for g in gaps if not g.get("is_required", False)]

        if required:
            # Split into foundation (larger gaps) and intermediate
            foundation = [g for g in required if g.get("gap", 0) >= 4]
            intermediate = [g for g in required if g.get("gap", 0) < 4]

            if foundation:
                phase_skills = self._build_phase_skills(foundation, hours_per_week)
                phases.append({
                    "phase_number": len(phases) + 1,
                    "name": "Foundation — Core Required Skills",
                    "description": "Build foundational proficiency in critical skills",
                    "priority": "critical",
                    "skills": phase_skills,
                    "estimated_weeks": sum(s["estimated_weeks"] for s in phase_skills),
                })

            if intermediate:
                phase_skills = self._build_phase_skills(intermediate, hours_per_week)
                phases.append({
                    "phase_number": len(phases) + 1,
                    "name": "Growth — Required Skill Strengthening",
                    "description": "Deepen proficiency in required skills",
                    "priority": "high",
                    "skills": phase_skills,
                    "estimated_weeks": sum(s["estimated_weeks"] for s in phase_skills),
                })

        if preferred:
            phase_skills = self._build_phase_skills(preferred[:5], hours_per_week)
            phases.append({
                "phase_number": len(phases) + 1,
                "name": "Enhancement — Preferred Skills",
                "description": "Learn preferred skills to stand out",
                "priority": "medium",
                "skills": phase_skills,
                "estimated_weeks": sum(s["estimated_weeks"] for s in phase_skills),
            })

        return phases

    def _build_phase_skills(
        self, gaps: list[dict[str, Any]], hours_per_week: int
    ) -> list[dict[str, Any]]:
        """Build detailed skill learning items for a phase."""
        skills = []
        for gap in gaps:
            skill_name = gap.get("skill", "Unknown")
            gap_size = gap.get("gap", 3)
            category = gap.get("category", "other")
            current = gap.get("current_level", 0)
            target = current + gap_size

            # Estimate time based on gap and category
            level = "beginner" if current < 3 else ("intermediate" if current < 6 else "advanced")
            time_map = SKILL_TIME_ESTIMATES.get(category, SKILL_TIME_ESTIMATES["other"])
            base_weeks = time_map.get(level, 10)

            # Adjust for gap size and hours available
            adjusted_weeks = int(base_weeks * (gap_size / 5) * (10 / max(hours_per_week, 1)))
            adjusted_weeks = max(1, min(adjusted_weeks, 52))

            # Resources
            resources = RESOURCE_SUGGESTIONS.get(
                category, RESOURCE_SUGGESTIONS.get("other", [])
            )

            skills.append({
                "skill_name": skill_name,
                "current_level": current,
                "target_level": target,
                "gap": gap_size,
                "category": category,
                "estimated_weeks": adjusted_weeks,
                "learning_level": level,
                "is_required": gap.get("is_required", False),
                "suggested_resources": resources or [],
            })

        return skills

    def _create_milestones(
        self, phases: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Create milestone checkpoints from phases."""
        milestones = []
        cumulative_weeks = 0

        for phase in phases:
            cumulative_weeks += phase["estimated_weeks"]
            milestones.append({
                "week": cumulative_weeks,
                "title": f"Complete {phase['name']}",
                "description": (
                    f"Master {len(phase['skills'])} skills: "
                    + ", ".join(s["skill_name"] for s in phase["skills"][:3])
                    + ("..." if len(phase["skills"]) > 3 else "")
                ),
                "checkpoint": (
                    "Build a project demonstrating these skills"
                    if phase["priority"] in ("critical", "high")
                    else "Add skills to your profile"
                ),
            })

        return milestones

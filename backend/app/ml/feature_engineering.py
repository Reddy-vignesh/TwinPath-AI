"""
Decision Twin AI — Feature Engineering.

Transforms raw Digital Twin profile data into a dense 216-dimensional
feature vector for career similarity search and ranking.

Vector layout (216D total):
  [0:32]    Academic features
  [32:96]   Skill features
  [96:120]  Interest features
  [120:136] Career goal features
  [136:156] Project features
  [156:168] Certification features
  [168:186] Behavior features
  [186:206] Psychometric features
  [206:216] Resume features (placeholder)
"""

from __future__ import annotations

from typing import Any

import numpy as np
import structlog

from app.core.constants import (
    ACADEMIC_FEATURE_DIM,
    BEHAVIOR_FEATURE_DIM,
    CAREER_GOAL_FEATURE_DIM,
    CERTIFICATION_FEATURE_DIM,
    FEATURE_GROUP_RANGES,
    INTEREST_FEATURE_DIM,
    PROFICIENCY_MAX,
    PROJECT_FEATURE_DIM,
    PSYCHOMETRIC_FEATURE_DIM,
    RESUME_FEATURE_DIM,
    SKILL_FEATURE_DIM,
    TOTAL_FEATURE_DIM,
)

logger = structlog.get_logger(__name__)


class FeatureEngineer:
    """
    Constructs a 216D feature vector from a student's Digital Twin data.

    Each feature group uses a specific encoding strategy:
    - Skills/Interests: Normalized proficiency/intensity + category encoding
    - Academics: GPA normalization + degree encoding + temporal features
    - Projects: Count, diversity, recency, technology breadth
    - Certifications: Count, recency, issuer diversity
    - Psychometric: Normalized trait scores
    - Behavior: Engagement frequency, diversity, recency
    """

    # ── Skill category to index mapping ────────────────────────
    SKILL_CATEGORIES = [
        "programming_language", "framework", "database", "devops",
        "cloud", "data_science", "soft_skill", "domain_knowledge",
        "tool", "other",
    ]

    INTEREST_CATEGORIES = [
        "technology", "business", "creative", "science",
        "healthcare", "education", "social", "engineering", "other",
    ]

    DEGREE_LEVELS = {
        "high school": 0.2, "diploma": 0.3, "associate": 0.4,
        "bachelor": 0.6, "bachelors": 0.6, "b.tech": 0.6, "b.sc": 0.6,
        "b.e": 0.6, "bca": 0.5, "bba": 0.5,
        "master": 0.8, "masters": 0.8, "m.tech": 0.8, "m.sc": 0.8,
        "mba": 0.8, "mca": 0.75,
        "phd": 1.0, "doctorate": 1.0,
    }

    def build_vector(self, profile_data: dict[str, Any]) -> np.ndarray:
        """
        Build the full 216D feature vector from profile data.

        Args:
            profile_data: Dictionary containing all Digital Twin data
                with keys: profile, skills, interests, academics,
                certifications, projects, psychometrics, behaviors

        Returns:
            np.ndarray of shape (216,) with float32 values
        """
        vector = np.zeros(TOTAL_FEATURE_DIM, dtype=np.float32)

        # Build each feature group
        self._encode_academics(vector, profile_data.get("academics", []),
                               profile_data.get("profile", {}))
        self._encode_skills(vector, profile_data.get("skills", []))
        self._encode_interests(vector, profile_data.get("interests", []))
        self._encode_career_goals(vector, profile_data.get("profile", {}))
        self._encode_projects(vector, profile_data.get("projects", []))
        self._encode_certifications(vector, profile_data.get("certifications", []))
        self._encode_behaviors(vector, profile_data.get("behaviors", []))
        self._encode_psychometrics(vector, profile_data.get("psychometrics", []))
        # Resume features are placeholder zeros for Phase 3

        # L2 normalize the full vector for cosine similarity compatibility
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector

    def _encode_academics(
        self,
        vector: np.ndarray,
        academics: list[dict],
        profile: dict,
    ) -> None:
        """
        Academic features (32D):
        [0:1]  Normalized CGPA (0-1)
        [1:2]  Degree level encoding
        [2:3]  Number of academic records (capped at 5, normalized)
        [3:4]  Is current student flag
        [4:5]  Years since graduation (normalized)
        [5:15] Major category one-hot (10 categories)
        [15:25] Institution tier proxy (length-based, placeholder)
        [25:32] Course diversity score + padding
        """
        start, end = FEATURE_GROUP_RANGES["academic"]

        # CGPA normalization
        cgpa = profile.get("current_cgpa", 0) or 0
        vector[start] = min(cgpa / 10.0, 1.0)

        # Degree level
        degree = (profile.get("highest_degree") or "").lower()
        vector[start + 1] = self.DEGREE_LEVELS.get(degree, 0.3)

        # Number of records
        vector[start + 2] = min(len(academics) / 5.0, 1.0)

        # Is current student
        vector[start + 3] = 1.0 if any(
            a.get("is_current", False) for a in academics
        ) else 0.0

        # Graduation year recency
        grad_year = profile.get("graduation_year")
        if grad_year:
            from datetime import datetime
            years_since = max(0, datetime.now().year - grad_year)
            vector[start + 4] = max(0, 1.0 - years_since / 20.0)

        # Major encoding (simplified hash-based distribution)
        major = (profile.get("current_major") or "").lower()
        if major:
            idx = hash(major) % 10
            vector[start + 5 + idx] = 1.0

        # Course diversity from academic records
        all_courses = []
        for record in academics:
            for grade in record.get("course_grades", []):
                all_courses.append(grade.get("course_name", ""))
        unique_subjects = len(set(c.split()[0] for c in all_courses if c))
        vector[start + 25] = min(unique_subjects / 20.0, 1.0)

    def _encode_skills(
        self, vector: np.ndarray, skills: list[dict]
    ) -> None:
        """
        Skill features (64D):
        [0:10]  Category distribution (10 categories, normalized counts)
        [10:20] Category max proficiency (10 categories)
        [20:30] Top-10 skill proficiencies (sorted desc, normalized)
        [30:40] Skill experience years (top-10, normalized)
        [40:50] Primary skill indicators (top-10)
        [50:55] Aggregate stats: count, mean, median, std, max proficiency
        [55:64] Skill breadth/depth metrics + padding
        """
        start, end = FEATURE_GROUP_RANGES["skill"]

        if not skills:
            return

        # Category distribution and max proficiency
        cat_counts: dict[str, int] = {}
        cat_max_prof: dict[str, float] = {}
        proficiencies = []

        for s in skills:
            cat = s.get("category", "other")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
            prof = s.get("proficiency_level", 1) / PROFICIENCY_MAX
            cat_max_prof[cat] = max(cat_max_prof.get(cat, 0), prof)
            proficiencies.append(prof)

        total = max(len(skills), 1)
        for i, cat in enumerate(self.SKILL_CATEGORIES):
            vector[start + i] = cat_counts.get(cat, 0) / total
            vector[start + 10 + i] = cat_max_prof.get(cat, 0)

        # Top-10 proficiencies
        sorted_prof = sorted(proficiencies, reverse=True)[:10]
        for i, p in enumerate(sorted_prof):
            vector[start + 20 + i] = p

        # Experience years (top-10)
        exp_years = sorted(
            [s.get("years_experience", 0) or 0 for s in skills],
            reverse=True,
        )[:10]
        for i, y in enumerate(exp_years):
            vector[start + 30 + i] = min(y / 10.0, 1.0)

        # Primary indicators
        primaries = [1.0 if s.get("is_primary") else 0.0 for s in skills][:10]
        for i, p in enumerate(primaries):
            vector[start + 40 + i] = p

        # Aggregate stats
        arr = np.array(proficiencies)
        vector[start + 50] = min(len(skills) / 20.0, 1.0)  # count normalized
        vector[start + 51] = float(np.mean(arr))
        vector[start + 52] = float(np.median(arr))
        vector[start + 53] = float(np.std(arr)) if len(arr) > 1 else 0.0
        vector[start + 54] = float(np.max(arr))

        # Breadth (unique categories) and depth (avg proficiency)
        vector[start + 55] = len(cat_counts) / len(self.SKILL_CATEGORIES)
        vector[start + 56] = float(np.mean(arr))
        # Specialization ratio (max / mean)
        vector[start + 57] = (
            float(np.max(arr) / np.mean(arr))
            if np.mean(arr) > 0 else 0.0
        )

    def _encode_interests(
        self, vector: np.ndarray, interests: list[dict]
    ) -> None:
        """
        Interest features (24D):
        [0:9]   Category intensity distribution
        [9:18]  Category presence flags
        [18:21] Aggregate: count, mean intensity, std
        [21:24] Diversity metrics
        """
        start, _ = FEATURE_GROUP_RANGES["interest"]

        if not interests:
            return

        cat_intensity: dict[str, list[float]] = {}
        for i in interests:
            cat = i.get("category", "other")
            intensity = (i.get("intensity_level", 1) or 1) / 10.0
            cat_intensity.setdefault(cat, []).append(intensity)

        for idx, cat in enumerate(self.INTEREST_CATEGORIES):
            intensities = cat_intensity.get(cat, [])
            if intensities:
                vector[start + idx] = np.mean(intensities)
                vector[start + 9 + idx] = 1.0

        all_intensities = [
            (i.get("intensity_level", 1) or 1) / 10.0 for i in interests
        ]
        arr = np.array(all_intensities)
        vector[start + 18] = min(len(interests) / 10.0, 1.0)
        vector[start + 19] = float(np.mean(arr))
        vector[start + 20] = float(np.std(arr)) if len(arr) > 1 else 0.0

        vector[start + 21] = len(cat_intensity) / len(self.INTEREST_CATEGORIES)

    def _encode_career_goals(
        self, vector: np.ndarray, profile: dict
    ) -> None:
        """
        Career goal features (16D):
        [0:8]  Primary goal hash encoding
        [8:12] Industry hash encoding
        [12:13] Has secondary goal flag
        [13:14] Willing to relocate
        [14:16] Work style encoding
        """
        start, _ = FEATURE_GROUP_RANGES["career_goal"]

        primary = (profile.get("career_goal_primary") or "").lower()
        if primary:
            idx = hash(primary) % 8
            vector[start + idx] = 1.0

        industry = (profile.get("preferred_industry") or "").lower()
        if industry:
            idx = hash(industry) % 4
            vector[start + 8 + idx] = 1.0

        vector[start + 12] = 1.0 if profile.get("career_goal_secondary") else 0.0
        vector[start + 13] = 1.0 if profile.get("willing_to_relocate") else 0.0

        work_style = (profile.get("preferred_work_style") or "").lower()
        style_map = {"remote": 0.2, "hybrid": 0.5, "onsite": 0.8, "on-site": 0.8}
        vector[start + 14] = style_map.get(work_style, 0.5)

    def _encode_projects(
        self, vector: np.ndarray, projects: list[dict]
    ) -> None:
        """
        Project features (20D):
        [0:1]  Project count (normalized)
        [1:2]  Avg team size (normalized)
        [2:3]  Solo project ratio
        [3:4]  Ongoing project count
        [4:14] Technology frequency (top-10 hash buckets)
        [14:18] Role diversity
        [18:20] Recency + duration
        """
        start, _ = FEATURE_GROUP_RANGES["project"]

        if not projects:
            return

        vector[start] = min(len(projects) / 10.0, 1.0)

        team_sizes = [p.get("team_size", 1) or 1 for p in projects]
        vector[start + 1] = min(np.mean(team_sizes) / 10.0, 1.0)
        vector[start + 2] = sum(1 for t in team_sizes if t == 1) / len(projects)
        vector[start + 3] = sum(
            1 for p in projects if p.get("is_ongoing")
        ) / len(projects)

        # Technology encoding
        tech_counts: dict[int, int] = {}
        for p in projects:
            for tech in (p.get("technologies") or []):
                bucket = hash(tech.lower()) % 10
                tech_counts[bucket] = tech_counts.get(bucket, 0) + 1

        total_tech = max(sum(tech_counts.values()), 1)
        for i in range(10):
            vector[start + 4 + i] = tech_counts.get(i, 0) / total_tech

        # Role diversity
        roles = set(
            (p.get("role") or "").lower()
            for p in projects if p.get("role")
        )
        vector[start + 14] = min(len(roles) / 5.0, 1.0)

    def _encode_certifications(
        self, vector: np.ndarray, certs: list[dict]
    ) -> None:
        """
        Certification features (12D):
        [0:1]  Count (normalized)
        [1:2]  Verified ratio
        [2:3]  Active (non-expired) ratio
        [3:8]  Issuer diversity (top-5 hash buckets)
        [8:12] Recency + temporal spread
        """
        start, _ = FEATURE_GROUP_RANGES["certification"]

        if not certs:
            return

        vector[start] = min(len(certs) / 10.0, 1.0)
        vector[start + 1] = sum(
            1 for c in certs if c.get("is_verified")
        ) / len(certs)

        from datetime import date
        today = date.today()
        active = sum(
            1 for c in certs
            if not c.get("expiry_date") or c["expiry_date"] > today
        )
        vector[start + 2] = active / len(certs)

        issuers: dict[int, int] = {}
        for c in certs:
            org = (c.get("issuing_organization") or "").lower()
            bucket = hash(org) % 5
            issuers[bucket] = issuers.get(bucket, 0) + 1
        for i in range(5):
            vector[start + 3 + i] = min(issuers.get(i, 0) / len(certs), 1.0)

    def _encode_behaviors(
        self, vector: np.ndarray, behaviors: list[dict]
    ) -> None:
        """
        Behavior features (18D):
        [0:8]  Event type frequency distribution
        [8:9]  Total event count (normalized)
        [9:10] Unique event types
        [10:14] Session diversity
        [14:18] Temporal engagement
        """
        start, _ = FEATURE_GROUP_RANGES["behavior"]

        if not behaviors:
            return

        event_types = [
            "login", "career_view", "skill_update", "interest_update",
            "profile_update", "recommendation_view", "simulation_run", "search",
        ]
        type_counts: dict[str, int] = {}
        for b in behaviors:
            et = b.get("event_type", "")
            type_counts[et] = type_counts.get(et, 0) + 1

        total = max(len(behaviors), 1)
        for i, et in enumerate(event_types):
            vector[start + i] = type_counts.get(et, 0) / total

        vector[start + 8] = min(total / 100.0, 1.0)
        vector[start + 9] = len(type_counts) / len(event_types)

        sessions = set(b.get("session_id") for b in behaviors if b.get("session_id"))
        vector[start + 10] = min(len(sessions) / 20.0, 1.0)

    def _encode_psychometrics(
        self, vector: np.ndarray, assessments: list[dict]
    ) -> None:
        """
        Psychometric features (20D):
        [0:5]  Big Five traits
        [5:10] Additional traits (risk, creativity, leadership, analytical, communication)
        [10:15] Trait interactions (O*C, E*A, etc.)
        [15:20] Assessment metadata
        """
        start, _ = FEATURE_GROUP_RANGES["psychometric"]

        if not assessments:
            return

        # Use the most recent assessment
        latest = assessments[-1]

        traits = [
            ("openness", 0), ("conscientiousness", 1), ("extraversion", 2),
            ("agreeableness", 3), ("neuroticism", 4),
        ]
        trait_values = []
        for trait_name, idx in traits:
            val = latest.get(trait_name, 0) or 0
            vector[start + idx] = val
            trait_values.append(val)

        additional = [
            ("risk_tolerance", 5), ("creativity_score", 6),
            ("leadership_score", 7), ("analytical_score", 8),
            ("communication_score", 9),
        ]
        for trait_name, idx in additional:
            val = latest.get(trait_name, 0) or 0
            vector[start + idx] = val

        # Trait interactions
        if len(trait_values) >= 5:
            vector[start + 10] = trait_values[0] * trait_values[1]  # O*C
            vector[start + 11] = trait_values[2] * trait_values[3]  # E*A
            vector[start + 12] = 1.0 - trait_values[4]  # Stability
            vector[start + 13] = (trait_values[0] + trait_values[2]) / 2  # Openness+Extraversion
            vector[start + 14] = (trait_values[1] + trait_values[3]) / 2  # C+A

        vector[start + 15] = min(len(assessments) / 3.0, 1.0)

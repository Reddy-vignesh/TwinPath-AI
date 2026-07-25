"""
Decision Twin AI — Application Constants.

All magic numbers, enums, and dimension constants are defined here.
No magic numbers should exist anywhere else in the codebase.
"""

from __future__ import annotations

from enum import StrEnum

# ====================================================================
# Feature Vector Dimensions (216 total)
# ====================================================================
# Each group occupies a defined range within the 216D feature vector.

ACADEMIC_FEATURE_DIM: int = 32
SKILL_FEATURE_DIM: int = 64
INTEREST_FEATURE_DIM: int = 24
CAREER_GOAL_FEATURE_DIM: int = 16
PROJECT_FEATURE_DIM: int = 20
CERTIFICATION_FEATURE_DIM: int = 12
BEHAVIOR_FEATURE_DIM: int = 18
PSYCHOMETRIC_FEATURE_DIM: int = 20
RESUME_FEATURE_DIM: int = 10

TOTAL_FEATURE_DIM: int = (
    ACADEMIC_FEATURE_DIM
    + SKILL_FEATURE_DIM
    + INTEREST_FEATURE_DIM
    + CAREER_GOAL_FEATURE_DIM
    + PROJECT_FEATURE_DIM
    + CERTIFICATION_FEATURE_DIM
    + BEHAVIOR_FEATURE_DIM
    + PSYCHOMETRIC_FEATURE_DIM
    + RESUME_FEATURE_DIM
)

assert TOTAL_FEATURE_DIM == 216, f"Feature dimensions must sum to 216, got {TOTAL_FEATURE_DIM}"  # noqa: S101

# Feature group index ranges (start, end) — half-open intervals
FEATURE_GROUP_RANGES: dict[str, tuple[int, int]] = {
    "academic": (0, ACADEMIC_FEATURE_DIM),
    "skill": (ACADEMIC_FEATURE_DIM, ACADEMIC_FEATURE_DIM + SKILL_FEATURE_DIM),
    "interest": (
        ACADEMIC_FEATURE_DIM + SKILL_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM + SKILL_FEATURE_DIM + INTEREST_FEATURE_DIM,
    ),
    "career_goal": (
        ACADEMIC_FEATURE_DIM + SKILL_FEATURE_DIM + INTEREST_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM,
    ),
    "project": (
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM,
    ),
    "certification": (
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM,
    ),
    "behavior": (
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM
        + BEHAVIOR_FEATURE_DIM,
    ),
    "psychometric": (
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM
        + BEHAVIOR_FEATURE_DIM,
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM
        + BEHAVIOR_FEATURE_DIM
        + PSYCHOMETRIC_FEATURE_DIM,
    ),
    "resume": (
        ACADEMIC_FEATURE_DIM
        + SKILL_FEATURE_DIM
        + INTEREST_FEATURE_DIM
        + CAREER_GOAL_FEATURE_DIM
        + PROJECT_FEATURE_DIM
        + CERTIFICATION_FEATURE_DIM
        + BEHAVIOR_FEATURE_DIM
        + PSYCHOMETRIC_FEATURE_DIM,
        TOTAL_FEATURE_DIM,
    ),
}


# ====================================================================
# Recommendation Weights
# ====================================================================

RECOMMENDATION_WEIGHTS: dict[str, float] = {
    "skills": 0.40,
    "interests": 0.25,
    "academic_performance": 0.15,
    "projects_certifications": 0.10,
    "psychometric_alignment": 0.10,
}

assert abs(sum(RECOMMENDATION_WEIGHTS.values()) - 1.0) < 1e-9, "Weights must sum to 1.0"  # noqa: S101


# ====================================================================
# Enums
# ====================================================================


class UserRole(StrEnum):
    """User roles for RBAC."""

    STUDENT = "student"
    COUNSELOR = "counselor"
    ADMIN = "admin"


class SkillCategory(StrEnum):
    """Skill taxonomy categories."""

    PROGRAMMING_LANGUAGE = "programming_language"
    FRAMEWORK = "framework"
    DATABASE = "database"
    DEVOPS = "devops"
    CLOUD = "cloud"
    DATA_SCIENCE = "data_science"
    SOFT_SKILL = "soft_skill"
    DOMAIN_KNOWLEDGE = "domain_knowledge"
    TOOL = "tool"
    OTHER = "other"


class InterestCategory(StrEnum):
    """Interest taxonomy categories."""

    TECHNOLOGY = "technology"
    BUSINESS = "business"
    CREATIVE = "creative"
    SCIENCE = "science"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    SOCIAL = "social"
    ENGINEERING = "engineering"
    OTHER = "other"


class CareerCategory(StrEnum):
    """Career taxonomy categories."""

    SOFTWARE_ENGINEERING = "software_engineering"
    DATA_SCIENCE = "data_science"
    PRODUCT_MANAGEMENT = "product_management"
    DESIGN = "design"
    MARKETING = "marketing"
    FINANCE = "finance"
    CONSULTING = "consulting"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    RESEARCH = "research"
    ENGINEERING = "engineering"
    ENTREPRENEURSHIP = "entrepreneurship"
    OTHER = "other"


class BehaviorEventType(StrEnum):
    """Tracked user behavior event types."""

    LOGIN = "login"
    CAREER_VIEW = "career_view"
    SKILL_UPDATE = "skill_update"
    INTEREST_UPDATE = "interest_update"
    PROFILE_UPDATE = "profile_update"
    RECOMMENDATION_VIEW = "recommendation_view"
    SIMULATION_RUN = "simulation_run"
    SEARCH = "search"


class AssessmentType(StrEnum):
    """Psychometric assessment types."""

    BIG_FIVE = "big_five"
    MBTI = "mbti"
    HOLLAND_CODE = "holland_code"
    CUSTOM = "custom"


# ====================================================================
# Validation Constants
# ====================================================================

PASSWORD_MIN_LENGTH: int = 8
PASSWORD_MAX_LENGTH: int = 128
NAME_MAX_LENGTH: int = 100
EMAIL_MAX_LENGTH: int = 255
BIO_MAX_LENGTH: int = 2000
TITLE_MAX_LENGTH: int = 200
DESCRIPTION_MAX_LENGTH: int = 5000
URL_MAX_LENGTH: int = 2048
CGPA_MIN: float = 0.0
CGPA_MAX: float = 10.0
PROFICIENCY_MIN: int = 1
PROFICIENCY_MAX: int = 10
INTENSITY_MIN: int = 1
INTENSITY_MAX: int = 10

# ====================================================================
# Pagination
# ====================================================================

DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 100

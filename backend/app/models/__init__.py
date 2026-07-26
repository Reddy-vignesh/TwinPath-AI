# Decision Twin AI — Models Package
# All models must be imported here so SQLAlchemy can resolve relationships.

from app.models.base import Base  # noqa: F401
from app.models.user import User, RefreshToken  # noqa: F401
from app.models.profile import StudentProfile  # noqa: F401
from app.models.skill import UserSkill, Skill  # noqa: F401
from app.models.interest import UserInterest, Interest  # noqa: F401
from app.models.academic import AcademicRecord, CourseGrade  # noqa: F401
from app.models.certification import Certification  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.psychometric import PsychometricAssessment  # noqa: F401
from app.models.career import Career  # noqa: F401
from app.models.behavior import BehaviorEvent  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.feedback import FeedbackReport  # noqa: F401
from app.models.otp import OTPVerification  # noqa: F401


"""
SQLAlchemy Model for User Feedback & Bug Reports.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class FeedbackReport(Base, UUIDMixin, TimestampMixin):
    """
    Stores user feedback, ratings, bug reports, and career requests.
    """
    __tablename__ = "feedback_reports"

    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)

    report_type = Column(String(50), nullable=False, default="feedback", index=True)  # feedback, bug_report, feature_request
    category = Column(String(100), nullable=True)  # general, ui, recommendations, simulator, login, other
    rating = Column(Integer, nullable=True)  # 1 to 5 stars
    message = Column(Text, nullable=False)
    page_url = Column(String(500), nullable=True)

    user = relationship("User", backref="feedback_reports")

    def __repr__(self) -> str:
        return f"<FeedbackReport id={self.id} type='{self.report_type}' email='{self.user_email}'>"

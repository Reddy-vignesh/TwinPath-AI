"""
SQLAlchemy Model for Email OTP Verifications.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, TimestampMixin, UUIDMixin


def default_otp_expiry():
    return datetime.now(timezone.utc) + timedelta(minutes=10)


class OTPVerification(Base, UUIDMixin, TimestampMixin):
    """
    Stores 6-digit OTP codes for email registration and password resets.
    """
    __tablename__ = "otp_verifications"

    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False, default="registration")  # registration, password_reset
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), default=default_otp_expiry, nullable=False)

    def is_valid(self) -> bool:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return not self.is_used and expires_at > now

    def __repr__(self) -> str:
        return f"<OTPVerification email='{self.email}' purpose='{self.purpose}' used={self.is_used}>"

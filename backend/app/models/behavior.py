"""
Decision Twin AI — Behavior Event Model.

Tracks user behavioral signals for the behavior feature dimensions.
Events are append-only and contribute to the Digital Twin's
understanding of user engagement and interests.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import BehaviorEventType
from app.models.base import Base, UUIDMixin


class BehaviorEvent(UUIDMixin, Base):
    """
    Behavioral signal captured from user interactions.

    Append-only table. Used for behavior feature engineering.
    Examples: career views, skill updates, search queries.
    """

    __tablename__ = "behavior_events"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    event_data: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_behavior_user_type", "user_id", "event_type"),
        Index("ix_behavior_timestamp", "timestamp"),
        Index("ix_behavior_event_type", "event_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<BehaviorEvent(user={self.user_id}, "
            f"type={self.event_type})>"
        )

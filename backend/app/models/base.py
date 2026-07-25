"""
Decision Twin AI — SQLAlchemy Base Classes and Mixins.

Provides:
- DeclarativeBase with UUID primary keys
- TimestampMixin for created_at/updated_at
- SoftDeleteMixin for logical deletion
- Shared metadata instance for Alembic

All models MUST inherit from Base and apply TimestampMixin.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    MappedAsDataclass,
    mapped_column,
)


class Base(DeclarativeBase):
    """
    Declarative base for all SQLAlchemy models.

    Provides:
    - Shared metadata for Alembic autogenerate
    - Type annotation support for mapped columns
    """

    pass


class UUIDMixin:
    """Mixin that provides a UUID primary key column."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        sort_order=-100,
    )


class TimestampMixin:
    """Mixin that provides created_at and updated_at columns with server defaults."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        sort_order=90,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        sort_order=91,
    )


class SoftDeleteMixin:
    """Mixin that provides soft-delete via a nullable deleted_at timestamp."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        sort_order=92,
    )

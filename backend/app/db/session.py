"""
Decision Twin AI — Async Database Session Management.

Provides:
- Async SQLAlchemy engine with connection pooling
- Async session factory
- FastAPI dependency for request-scoped sessions
- Engine lifecycle management

All database access MUST use AsyncSession. Synchronous sessions are
never permitted inside async endpoints.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import TYPE_CHECKING

# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

if TYPE_CHECKING:
    # pyrefly: ignore [missing-import]
    from sqlalchemy.ext.asyncio import AsyncEngine

# ── Engine & Session Factory ──────────────────────────────────────
# These are created lazily and reused across the application lifecycle.

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """
    Get or create the async SQLAlchemy engine.

    Uses connection pooling with pre-ping to detect stale connections.

    Returns:
        The shared async engine instance.
    """
    global _engine  # noqa: PLW0603

    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_dsn,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_pre_ping=settings.db_pool_pre_ping,
            echo=settings.app_debug,
            pool_recycle=3600,
            connect_args={"statement_cache_size": 0},
        )

    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the async session factory.

    Returns:
        The shared session factory bound to the engine.
    """
    global _session_factory  # noqa: PLW0603

    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a request-scoped database session.

    The session is automatically committed on success and rolled back
    on exception. Always closed after the request completes.

    Yields:
        An AsyncSession for the duration of the request.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """
    Dispose the engine and close all connections.

    Called during application shutdown to cleanly release resources.
    """
    global _engine, _session_factory  # noqa: PLW0603

    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None

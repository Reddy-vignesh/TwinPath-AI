"""
Decision Twin AI — Test Configuration and Fixtures.

Provides:
- Async test database session
- FastAPI test client
- User factories for test data
- Auth helper for authenticated requests
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import Settings, get_settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.main import create_app
from app.models.base import Base


# ── Test Settings ──────────────────────────────────────────────────


def get_test_settings() -> Settings:
    """Override settings for test environment."""
    return Settings(
        app_env="testing",
        app_debug=True,
        postgres_host="localhost",
        postgres_port=5432,
        postgres_user="decisiontwin",
        postgres_password="changeme_in_production",
        postgres_db="decisiontwin_test_db",
        jwt_secret_key="test-secret-key-that-is-at-least-32-characters-long",
        log_level="WARNING",
    )


# ── Event Loop ─────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Database Engine & Session ──────────────────────────────────────


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine (session-scoped)."""
    settings = get_test_settings()
    engine = create_async_engine(
        settings.database_dsn,
        echo=False,
        pool_pre_ping=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional database session that rolls back after each test."""
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with session_factory() as session:
        yield session
        await session.rollback()


# ── FastAPI Test Client ────────────────────────────────────────────


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP test client with overridden dependencies."""
    app = create_app()

    # Override database dependency
    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_settings] = get_test_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Auth Helpers ──────────────────────────────────────────────────


def make_auth_headers(
    user_id: str | None = None,
    role: str = "student",
) -> dict[str, str]:
    """
    Create authorization headers with a valid JWT for testing.

    Args:
        user_id: User UUID string. Generated if not provided.
        role: User role for the token.

    Returns:
        Dictionary with Authorization header.
    """
    if user_id is None:
        user_id = str(uuid.uuid4())

    settings = get_test_settings()
    token = create_access_token(
        subject=user_id,
        role=role,
        settings=settings,
    )
    return {"Authorization": f"Bearer {token}"}

"""
Decision Twin AI — Application Lifespan Manager.

Handles startup and shutdown lifecycle events:
- Startup: verify DB connection, log configuration
- Shutdown: dispose DB engine, cleanup resources

ML models and vector indexes will be loaded here in Phase 3.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.config import get_settings
from app.core.logging_config import configure_logging
from app.core.disposable_email import load_blocklist
from app.db.session import dispose_engine, get_engine

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.

    Executes startup logic before the app begins serving requests,
    and shutdown logic after the app stops.

    Startup:
    - Configure structured logging
    - Verify database connectivity
    - Log application configuration
    - (Phase 3) Load ML models and FAISS index

    Shutdown:
    - Dispose database engine and connection pool
    - (Phase 3) Cleanup ML resources
    """
    settings = get_settings()

    # ── Startup ────────────────────────────────────────────────
    configure_logging(settings.log_level)
    logger.info(
        "Starting TwinPath AI",
        version=settings.app_version,
        environment=settings.app_env,
        debug=settings.app_debug,
    )

    # Verify database connection
    engine = get_engine()
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        logger.info("Database connection verified", host=settings.postgres_host)
    except Exception as exc:
        logger.warning("PostgreSQL connection unavailable, initializing local SQLite database fallback", error=str(exc))
        from app.db.session import set_sqlite_engine
        engine = await set_sqlite_engine()
        async with engine.begin() as conn:
            from app.models.base import Base
            import app.models  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local SQLite database initialized and schema created successfully")

    # Phase 3: Load ML models into app.state
    # app.state.career_ranker = load_career_ranker()
    # app.state.faiss_index = load_faiss_index()
    # app.state.salary_predictor = load_salary_predictor()

    # Load disposable email blocklist into memory
    load_blocklist()

    logger.info("Application startup complete")

    yield

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down Decision Twin AI")
    await dispose_engine()
    logger.info("Database engine disposed, shutdown complete")

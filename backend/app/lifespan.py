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

    # Auto-seed careers and skills catalogs if database is unseeded
    try:
        from app.db.session import async_session_factory
        import uuid
        from sqlalchemy import select, func
        from app.models.career import Career
        from app.models.skill import Skill
        from app.ml.seed_data import CAREER_SEED_DATA
        from seed_skills import SKILL_SEED

        async with async_session_factory() as db:
            career_count = await db.scalar(select(func.count(Career.id)))
            if not career_count or career_count == 0:
                for c_data in CAREER_SEED_DATA:
                    career = Career(
                        id=uuid.UUID(c_data["id"]) if isinstance(c_data.get("id"), str) and len(c_data.get("id")) == 36 else uuid.uuid4(),
                        title=c_data["title"],
                        category=c_data.get("category", "software_engineering"),
                        short_description=c_data.get("short_description"),
                        description=c_data.get("description"),
                        median_salary_usd=c_data.get("median_salary_usd"),
                        salary_range_low=c_data.get("salary_range_low"),
                        salary_range_high=c_data.get("salary_range_high"),
                        market_demand=c_data.get("market_demand", "high"),
                        growth_rate_percent=c_data.get("growth_rate_percent", 15.0),
                        automation_risk_percent=c_data.get("automation_risk_percent", 10.0),
                        required_skills=c_data.get("required_skills", {}),
                        preferred_skills=c_data.get("preferred_skills", {}),
                        required_education=c_data.get("required_education", "Bachelor's"),
                        typical_experience_years=c_data.get("typical_experience_years", 2),
                        is_active=True,
                    )
                    db.add(career)
                await db.commit()
                logger.info("Auto-seeded career catalog", count=len(CAREER_SEED_DATA))

            skill_count = await db.scalar(select(func.count(Skill.id)))
            if not skill_count or skill_count == 0:
                for name, category, desc in SKILL_SEED:
                    sk = Skill(name=name, category=category, description=desc)
                    db.add(sk)
                await db.commit()
                logger.info("Auto-seeded skills catalog", count=len(SKILL_SEED))
    except Exception as seed_err:
        logger.warning("Auto-seed catalog check info", error=str(seed_err))

    # Phase 3: Load ML models into app.state
    # app.state.career_ranker = load_career_ranker()
    # app.state.faiss_index = load_faiss_index()
    # app.state.salary_predictor = load_salary_predictor()

    # Load disposable email blocklist into memory
    load_blocklist()

    # Launch automated daily database backup task
    import asyncio
    from app.services.backup_service import start_periodic_backups
    backup_task = asyncio.create_task(start_periodic_backups())

    logger.info("Application startup complete")

    yield

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down Decision Twin AI")
    backup_task.cancel()
    try:
        await backup_task
    except (asyncio.CancelledError, Exception):
        pass
    await dispose_engine()
    logger.info("Database engine disposed, shutdown complete")

"""
Decision Twin AI — Alembic Environment Configuration.

Async Alembic setup that:
- Loads database URL from application settings (never hardcoded)
- Imports all models for autogenerate support
- Supports both online (async) and offline migration mode
"""

from __future__ import annotations

import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

# ── Ensure the backend directory is on sys.path ───────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings  # noqa: E402

# ── Import ALL models so Alembic autogenerate can detect them ─────
from app.models.base import Base  # noqa: E402
from app.models.user import User, RefreshToken  # noqa: E402, F401
from app.models.audit_log import AuditLog  # noqa: E402, F401
from app.models.profile import StudentProfile  # noqa: E402, F401
from app.models.skill import Skill, UserSkill  # noqa: E402, F401
from app.models.interest import Interest, UserInterest  # noqa: E402, F401
from app.models.academic import AcademicRecord, CourseGrade  # noqa: E402, F401
from app.models.certification import Certification  # noqa: E402, F401
from app.models.project import Project  # noqa: E402, F401
from app.models.career import Career  # noqa: E402, F401
from app.models.psychometric import PsychometricAssessment  # noqa: E402, F401
from app.models.behavior import BehaviorEvent  # noqa: E402, F401

# ── Alembic Config ────────────────────────────────────────────────
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_dsn)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:  # noqa: ANN001
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

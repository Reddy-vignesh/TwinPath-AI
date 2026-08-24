"""
Decision Twin AI — Automated Database Backup Service.

Performs transactional, gzip-compressed database snapshots with automated
7-day rolling retention management.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, UTC
import gzip
import os
import shutil
import sqlite3
from pathlib import Path
from typing import Any

import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

# Backup retention settings
BACKUP_DIR_NAME = "backups"
MAX_BACKUP_RETENTION = 7  # Retain last 7 snapshots
BACKUP_INTERVAL_HOURS = 24  # Run backup every 24 hours


def get_backup_directory() -> Path:
    """Return the absolute path to the backup storage directory, creating if needed."""
    settings = get_settings()
    # If in backend directory or root
    base_dir = Path(os.getcwd())
    if (base_dir / "backend").exists():
        backup_dir = base_dir / "backend" / BACKUP_DIR_NAME
    else:
        backup_dir = base_dir / BACKUP_DIR_NAME

    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


def create_database_backup() -> str | None:
    """
    Create a transactional, compressed database snapshot.
    Supports SQLite and local files with zero downtime.

    Returns:
        Path to the generated compressed backup file, or None if failed.
    """
    settings = get_settings()
    backup_dir = get_backup_directory()
    now_str = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")

    # Locate sqlite database file
    db_candidates = [
        Path("decisiontwin.db"),
        Path("backend/decisiontwin.db"),
        Path("../decisiontwin.db"),
    ]

    source_db: Path | None = None
    for candidate in db_candidates:
        if candidate.exists() and candidate.is_file():
            source_db = candidate.resolve()
            break

    # In production with cloud PostgreSQL, snapshots are managed natively by Render/cloud provider
    if settings.database_url and ("postgres" in settings.database_url or "postgresql" in settings.database_url):
        logger.info(
            "automated_backup_managed_externally",
            db_type="postgresql",
            message="Cloud PostgreSQL backups are handled by provider snapshots."
        )
        return None

    if not source_db or not source_db.exists():
        logger.info(
            "automated_backup_skipped_no_local_file",
            message="Local SQLite database file not present on disk."
        )
        return None

    temp_snapshot = backup_dir / f"snapshot_{now_str}.db"
    compressed_backup = backup_dir / f"backup_{now_str}.db.gz"

    try:
        # 1. Use SQLite Online Backup API for 100% transactional consistency
        source_conn = sqlite3.connect(str(source_db))
        dest_conn = sqlite3.connect(str(temp_snapshot))
        
        with dest_conn:
            source_conn.backup(dest_conn)
            
        dest_conn.close()
        source_conn.close()

        # 2. Compress with gzip for compact storage
        with open(temp_snapshot, "rb") as f_in:
            with gzip.open(compressed_backup, "wb", compresslevel=9) as f_out:
                shutil.copyfileobj(f_in, f_out)

        # 3. Clean up uncompressed snapshot
        if temp_snapshot.exists():
            temp_snapshot.unlink()

        backup_size_kb = round(compressed_backup.stat().st_size / 1024, 2)
        logger.info(
            "database_backup_created",
            backup_file=compressed_backup.name,
            size_kb=backup_size_kb,
            source_db=str(source_db),
        )

        # 4. Prune old backups exceeding retention limit
        _purge_old_backups(backup_dir, MAX_BACKUP_RETENTION)

        return str(compressed_backup)

    except Exception as e:
        logger.error("database_backup_failed", error=str(e))
        if temp_snapshot.exists():
            temp_snapshot.unlink(missing_ok=True)
        return None


def _purge_old_backups(backup_dir: Path, max_retention: int) -> None:
    """Retain only the latest N backups, deleting older ones."""
    try:
        backups = sorted(
            backup_dir.glob("backup_*.db.gz"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        if len(backups) > max_retention:
            for old_backup in backups[max_retention:]:
                old_backup.unlink(missing_ok=True)
                logger.info("old_backup_pruned", file=old_backup.name)
    except Exception as e:
        logger.warning("backup_prune_error", error=str(e))


async def start_periodic_backups() -> None:
    """Background task to run automated daily database backups."""
    logger.info("automated_backup_service_initialized", retention_days=MAX_BACKUP_RETENTION)
    
    # Defer initial snapshot by 30 seconds so container boot and initial logins are instantaneous
    await asyncio.sleep(30)
    await asyncio.to_thread(create_database_backup)

    # Periodic 24-hour backup loop
    while True:
        try:
            await asyncio.sleep(BACKUP_INTERVAL_HOURS * 3600)
            await asyncio.to_thread(create_database_backup)
        except asyncio.CancelledError:
            logger.info("backup_service_cancelled")
            break
        except Exception as e:
            logger.error("periodic_backup_error", error=str(e))
            await asyncio.sleep(600)  # Retry in 10 minutes on error

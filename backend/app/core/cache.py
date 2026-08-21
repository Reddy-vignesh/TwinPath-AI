"""
Decision Twin AI — High-Speed In-Memory TTL Cache.

Thread-safe, lightweight in-memory caching engine for career catalog lookups,
recommendation rankings, and vector similarity calculations.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, UTC
from functools import wraps
from typing import Any, Callable, TypeVar
import structlog

logger = structlog.get_logger(__name__)

T = TypeVar("T")


class InMemoryTTLCache:
    """Thread-safe in-memory cache with time-to-live expiration."""

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self._store: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl_seconds
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        """Retrieve cached value if not expired."""
        async with self._lock:
            if key not in self._store:
                return None

            value, expire_at = self._store[key]
            now = datetime.now(UTC).timestamp()

            if now > expire_at:
                del self._store[key]
                return None

            return value

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Store value with expiration timestamp."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expire_at = datetime.now(UTC).timestamp() + ttl
        async with self._lock:
            self._store[key] = (value, expire_at)

    async def invalidate(self, key_prefix: str = "") -> None:
        """Invalidate all keys matching a prefix or entire cache if empty."""
        async with self._lock:
            if not key_prefix:
                self._store.clear()
            else:
                keys_to_del = [k for k in self._store if k.startswith(key_prefix)]
                for k in keys_to_del:
                    del self._store[k]

    def size(self) -> int:
        """Return number of active entries."""
        return len(self._store)


# Global Cache Singletons
catalog_cache = InMemoryTTLCache(default_ttl_seconds=600)  # 10 minutes for career catalog
simulation_cache = InMemoryTTLCache(default_ttl_seconds=300)  # 5 minutes for simulation runs

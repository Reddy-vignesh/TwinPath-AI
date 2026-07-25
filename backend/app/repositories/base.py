"""
Decision Twin AI — Base Repository.

Generic async CRUD repository using SQLAlchemy AsyncSession.
All entity repositories inherit from this class to avoid
duplicating data access logic.

Key guarantees:
- All operations are async
- Never uses lazy loading
- Supports pagination
- Returns typed results via generics
"""

from __future__ import annotations

import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Generic async CRUD repository.

    Provides standard data access operations for any SQLAlchemy model.
    Subclasses should add entity-specific queries.

    Args:
        model: The SQLAlchemy model class.
        session: An async database session.
    """

    def __init__(self, model: type[T], session: AsyncSession) -> None:
        self._model = model
        self._session = session
        self.session = session

    async def get_by_id(self, entity_id: uuid.UUID) -> T | None:
        """
        Fetch an entity by its UUID primary key.

        Args:
            entity_id: The entity's UUID.

        Returns:
            The entity instance or None if not found.
        """
        return await self._session.get(self._model, entity_id)

    async def get_all(
        self,
        offset: int = 0,
        limit: int = 20,
        order_by: Any | None = None,
    ) -> list[T]:
        """
        Fetch a paginated list of entities.

        Args:
            offset: Number of records to skip.
            limit: Maximum number of records to return.
            order_by: Optional column or expression to order by.

        Returns:
            List of entity instances.
        """
        stmt = select(self._model)

        if order_by is not None:
            stmt = stmt.order_by(order_by)
        else:
            # Default ordering by created_at descending if column exists
            if hasattr(self._model, "created_at"):
                stmt = stmt.order_by(self._model.created_at.desc())

        stmt = stmt.offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        """
        Count total number of entities.

        Returns:
            Total entity count.
        """
        stmt = select(func.count()).select_from(self._model)
        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def create(self, entity: T) -> T:
        """
        Persist a new entity.

        Args:
            entity: The entity instance to create.

        Returns:
            The persisted entity with generated fields (id, timestamps).
        """
        self._session.add(entity)
        await self._session.flush()
        await self._session.refresh(entity)
        return entity

    async def update(self, entity: T, update_data: dict[str, Any]) -> T:
        """
        Update an existing entity with new values.

        Args:
            entity: The entity instance to update.
            update_data: Dictionary of field names to new values.
                Only non-None values are applied.

        Returns:
            The updated entity.
        """
        for key, value in update_data.items():
            if value is not None and hasattr(entity, key):
                setattr(entity, key, value)

        await self._session.flush()
        await self._session.refresh(entity)
        return entity

    async def delete(self, entity: T) -> None:
        """
        Hard-delete an entity from the database.

        Args:
            entity: The entity to delete.
        """
        await self._session.delete(entity)
        await self._session.flush()

    async def exists(self, entity_id: uuid.UUID) -> bool:
        """
        Check if an entity exists by ID.

        Args:
            entity_id: The entity's UUID.

        Returns:
            True if the entity exists.
        """
        stmt = (
            select(func.count())
            .select_from(self._model)
            .where(self._model.id == entity_id)  # type: ignore[attr-defined]
        )
        result = await self._session.execute(stmt)
        return result.scalar_one() > 0

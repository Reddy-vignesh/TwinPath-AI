"""
Decision Twin AI — User Repository.

Data access layer for User and RefreshToken entities.
Extends BaseRepository with user-specific queries.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import RefreshToken, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User entity operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        """
        Fetch a user by email address.

        Args:
            email: The user's email address.

        Returns:
            The User instance or None if not found.
        """
        stmt = select(User).where(User.email == email)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """
        Check if an email address is already registered.

        Args:
            email: The email address to check.

        Returns:
            True if the email is already in use.
        """
        user = await self.get_by_email(email)
        return user is not None

    async def update_last_login(self, user_id: uuid.UUID) -> None:
        """
        Update the user's last login timestamp.

        Args:
            user_id: The user's UUID.
        """
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(UTC))
        )
        await self._session.execute(stmt)


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for RefreshToken entity operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RefreshToken, session)

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        """
        Fetch a refresh token by its JWT ID (jti claim).

        Args:
            jti: The unique JWT identifier.

        Returns:
            The RefreshToken instance or None if not found.
        """
        stmt = select(RefreshToken).where(RefreshToken.token_jti == jti)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_by_jti(self, jti: str) -> None:
        """
        Revoke a specific refresh token.

        Args:
            jti: The JWT ID of the token to revoke.
        """
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token_jti == jti)
            .values(is_revoked=True)
        )
        await self._session.execute(stmt)

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """
        Revoke all refresh tokens for a user (logout everywhere).

        Args:
            user_id: The user's UUID.
        """
        stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked.is_(False),
            )
            .values(is_revoked=True)
        )
        await self._session.execute(stmt)

    async def create_token(
        self,
        user_id: uuid.UUID,
        jti: str,
        expires_at: datetime,
    ) -> RefreshToken:
        """
        Store a new refresh token record.

        Args:
            user_id: The user's UUID.
            jti: The JWT ID for this token.
            expires_at: When the token expires.

        Returns:
            The created RefreshToken instance.
        """
        token = RefreshToken(
            user_id=user_id,
            token_jti=jti,
            expires_at=expires_at,
        )
        return await self.create(token)

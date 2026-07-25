"""
Decision Twin AI — Authentication Service.

Business logic for user registration, login, token refresh, and logout.
All bcrypt operations are CPU-bound and delegated to run_in_threadpool().

Security guarantees:
- Passwords hashed with bcrypt (12 rounds)
- Refresh tokens are single-use with rotation
- Token revocation on logout
- Timing-safe credential verification
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import structlog
from fastapi.concurrency import run_in_threadpool

from app.config import Settings
from app.core.constants import UserRole
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import RefreshTokenRepository, UserRepository
from app.schemas.auth import TokenResponse

logger = structlog.get_logger(__name__)


class AuthService:
    """
    Authentication service handling registration, login, refresh, and logout.

    All operations are async-safe. CPU-bound bcrypt calls run in a thread pool.
    """

    def __init__(
        self,
        user_repo: UserRepository,
        refresh_token_repo: RefreshTokenRepository,
        settings: Settings,
    ) -> None:
        self._user_repo = user_repo
        self._refresh_token_repo = refresh_token_repo
        self._settings = settings

    async def register(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> TokenResponse:
        """
        Register a new user account.

        Args:
            email: User's email address.
            password: Raw password (will be hashed).
            first_name: User's first name.
            last_name: User's last name.

        Returns:
            JWT token pair (access + refresh).

        Raises:
            ConflictException: If the email is already registered.
        """
        # Check for existing email
        if await self._user_repo.email_exists(email):
            raise ConflictException(
                message="An account with this email already exists."
            )

        # Hash password in thread pool (CPU-bound)
        hashed = await run_in_threadpool(hash_password, password)

        # Create user
        user = User(
            email=email,
            hashed_password=hashed,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.STUDENT.value,
            is_active=True,
            email_verified=False,
        )
        user = await self._user_repo.create(user)

        # Create initial StudentProfile to prevent 404s on dashboard load
        from app.models.profile import StudentProfile

        profile = StudentProfile(
            user_id=user.id,
            twin_completeness_score=0.0,
        )
        self._user_repo._session.add(profile)
        await self._user_repo._session.flush()

        logger.info("User registered", user_id=str(user.id), email=email)

        # Generate tokens
        return await self._generate_token_pair(user)

    async def login(self, email: str, password: str) -> TokenResponse:
        """
        Authenticate a user and return tokens.

        Args:
            email: User's email address.
            password: Raw password to verify.

        Returns:
            JWT token pair (access + refresh).

        Raises:
            UnauthorizedException: If credentials are invalid.
        """
        # Fetch user
        user = await self._user_repo.get_by_email(email)
        if user is None:
            raise UnauthorizedException(message="Invalid email or password.")

        # Check account status
        if not user.is_active:
            raise UnauthorizedException(message="Account is deactivated.")

        # Verify password in thread pool (CPU-bound)
        is_valid = await run_in_threadpool(
            verify_password, password, user.hashed_password
        )
        if not is_valid:
            raise UnauthorizedException(message="Invalid email or password.")

        # Update last login
        await self._user_repo.update_last_login(user.id)

        logger.info("User logged in", user_id=str(user.id))

        # Generate tokens
        return await self._generate_token_pair(user)

    async def guest_login(self, name: str) -> TokenResponse:
        """
        Authenticate a guest user. Generates a new transient user and profile.
        """
        import uuid
        from app.models.profile import StudentProfile

        # Generate unique guest email
        guest_uuid = uuid.uuid4().hex[:12]
        email = f"guest_{guest_uuid}@example.com"

        # Generate placeholder password
        raw_password = f"GuestPass_{uuid.uuid4().hex[:8]}"
        hashed = await run_in_threadpool(hash_password, raw_password)

        # Create guest user
        user = User(
            email=email,
            hashed_password=hashed,
            first_name=name,
            last_name="(Guest)",
            role=UserRole.STUDENT.value,
            is_active=True,
            email_verified=False,
        )
        user = await self._user_repo.create(user)

        # Create guest's StudentProfile immediately to prevent 404s
        profile = StudentProfile(
            user_id=user.id,
            twin_completeness_score=0.0,
        )
        self._user_repo._session.add(profile)
        await self._user_repo._session.flush()

        logger.info("Guest user registered and profile created", user_id=str(user.id), email=email)

        # Generate tokens
        return await self._generate_token_pair(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Refresh an access token using a valid refresh token.

        Implements token rotation: the old refresh token is revoked
        and a new one is issued.

        Args:
            refresh_token: The current refresh token.

        Returns:
            New JWT token pair.

        Raises:
            UnauthorizedException: If the refresh token is invalid or revoked.
        """
        # Decode and validate
        payload = decode_token(refresh_token, self._settings)

        if payload.get("type") != "refresh":
            raise UnauthorizedException(message="Invalid token type.")

        jti = payload.get("jti", "")

        # Check token in database
        token_record = await self._refresh_token_repo.get_by_jti(jti)
        if token_record is None:
            raise UnauthorizedException(message="Refresh token not found.")

        if token_record.is_revoked:
            # Potential token replay — revoke all tokens for this user
            await self._refresh_token_repo.revoke_all_for_user(token_record.user_id)
            logger.warning(
                "Refresh token replay detected, all tokens revoked",
                user_id=str(token_record.user_id),
            )
            raise UnauthorizedException(
                message="Token has been revoked. Please log in again."
            )

        # Revoke the used refresh token (single-use rotation)
        await self._refresh_token_repo.revoke_by_jti(jti)

        # Fetch user
        user = await self._user_repo.get_by_id(token_record.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException(message="User account not found or inactive.")

        logger.info("Token refreshed", user_id=str(user.id))

        # Generate new token pair
        return await self._generate_token_pair(user)

    async def logout(self, refresh_token: str) -> None:
        """
        Logout by revoking the refresh token.

        Args:
            refresh_token: The refresh token to revoke.
        """
        try:
            payload = decode_token(refresh_token, self._settings)
            jti = payload.get("jti", "")
            await self._refresh_token_repo.revoke_by_jti(jti)
            logger.info("User logged out", jti=jti)
        except UnauthorizedException:
            # Token already expired or invalid — treat as successful logout
            pass

    async def logout_all(self, user_id: str) -> None:
        """
        Revoke all refresh tokens for a user (logout everywhere).

        Args:
            user_id: The user's UUID as a string.
        """
        import uuid

        uid = uuid.UUID(user_id)
        await self._refresh_token_repo.revoke_all_for_user(uid)
        logger.info("All tokens revoked for user", user_id=user_id)

    # ── Private Methods ───────────────────────────────────────────

    async def _generate_token_pair(self, user: User) -> TokenResponse:
        """
        Generate an access + refresh token pair and store the refresh token.

        Args:
            user: The authenticated user.

        Returns:
            TokenResponse with both tokens and metadata.
        """
        # Create access token
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
            settings=self._settings,
        )

        # Create refresh token
        refresh_token = create_refresh_token(
            subject=str(user.id),
            settings=self._settings,
        )

        # Decode refresh token to get JTI and expiry for storage
        refresh_payload = decode_token(refresh_token, self._settings)
        expires_at = datetime.fromtimestamp(refresh_payload["exp"], tz=UTC)

        # Store refresh token in database
        await self._refresh_token_repo.create_token(
            user_id=user.id,
            jti=refresh_payload["jti"],
            expires_at=expires_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=self._settings.access_token_expire_minutes * 60,
        )

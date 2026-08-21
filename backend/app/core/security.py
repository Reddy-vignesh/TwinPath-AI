"""
Decision Twin AI — Security Module.

Handles password hashing (bcrypt), JWT token creation/verification,
and authentication dependencies for FastAPI.

Security Notes:
- bcrypt is CPU-bound and must be called via run_in_threadpool() in async contexts.
- JWT tokens are signed with HS256 and include expiration claims.
- Refresh tokens support rotation to prevent replay attacks.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import jwt
from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.core.constants import UserRole
from app.core.exceptions import ForbiddenException, UnauthorizedException

if TYPE_CHECKING:
    pass

import bcrypt

def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    NOTE: This is CPU-bound. Call via run_in_threadpool() in async code.

    Args:
        plain_password: The raw password string.

    Returns:
        The bcrypt hash string.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.

    NOTE: This is CPU-bound. Call via run_in_threadpool() in async code.

    Args:
        plain_password: The raw password to verify.
        hashed_password: The stored bcrypt hash.

    Returns:
        True if the password matches the hash.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        return False


# ── JWT Token Management ──────────────────────────────────────────


def create_access_token(
    subject: str,
    role: str,
    settings: Settings | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: Token subject (typically user ID as string).
        role: User role for RBAC.
        settings: Application settings. Uses default if not provided.
        extra_claims: Additional claims to include in the token.

    Returns:
        Encoded JWT string.
    """
    if settings is None:
        settings = get_settings()

    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": expire,
        "jti": str(uuid4()),
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    subject: str,
    settings: Settings | None = None,
) -> str:
    """
    Create a signed JWT refresh token.

    Args:
        subject: Token subject (typically user ID as string).
        settings: Application settings. Uses default if not provided.

    Returns:
        Encoded JWT string.
    """
    if settings is None:
        settings = get_settings()

    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.refresh_token_expire_days)

    payload: dict[str, Any] = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": expire,
        "jti": str(uuid4()),
    }

    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(
    token: str,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Args:
        token: The encoded JWT string.
        settings: Application settings. Uses default if not provided.

    Returns:
        Decoded token payload.

    Raises:
        UnauthorizedException: If the token is invalid or expired.
    """
    if settings is None:
        settings = get_settings()

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "type"]},
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException(message="Token has expired.")
    except jwt.InvalidTokenError:
        raise UnauthorizedException(message="Invalid token.")

    return payload


# ── FastAPI Dependencies ──────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)


class TokenPayload:
    """Parsed and validated JWT token payload."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.sub: str = payload.get("sub", "")
        self.role: str = payload.get("role", "")
        self.token_type: str = payload.get("type", "")
        self.jti: str = payload.get("jti", "")
        self.exp: int = payload.get("exp", 0)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> TokenPayload:
    """
    FastAPI dependency that extracts and validates the current user from JWT.

    Args:
        credentials: Bearer token from Authorization header.
        settings: Application settings.

    Returns:
        Validated TokenPayload with user identity.

    Raises:
        UnauthorizedException: If token is missing, invalid, or expired.
    """
    if credentials is None:
        raise UnauthorizedException(message="Authentication required.")

    payload = decode_token(credentials.credentials, settings)

    if payload.get("type") != "access":
        raise UnauthorizedException(message="Invalid token type.")

    return TokenPayload(payload)


def require_role(*allowed_roles: UserRole):  # noqa: ANN201
    """
    FastAPI dependency factory that enforces role-based access control.

    Args:
        *allowed_roles: Roles permitted to access the endpoint.

    Returns:
        A dependency function that validates the user's role.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(UserRole.ADMIN))])
    """

    async def _role_checker(
        current_user: TokenPayload = Depends(get_current_user),
    ) -> TokenPayload:
        if current_user.role not in [role.value for role in allowed_roles]:
            raise ForbiddenException(
                message=f"Role '{current_user.role}' is not authorized for this resource."
            )
        return current_user

    return _role_checker

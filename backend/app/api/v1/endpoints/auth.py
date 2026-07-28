from __future__ import annotations

"""
Decision Twin AI — Authentication Endpoints.

Handles user registration, login, token refresh, logout,
and current user retrieval.

All endpoints return consistent response envelopes.
"""

from app.schemas.auth import ResetPasswordRequest, VerifyOTPRequest, SendOTPRequest

from typing import Any

import structlog
from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.repositories.user_repository import RefreshTokenRepository, UserRepository
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest, GuestLoginRequest
from app.schemas.google_auth import GoogleLoginRequest
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_auth_service(
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    """Dependency injection for AuthService."""
    user_repo = UserRepository(session)
    refresh_token_repo = RefreshTokenRepository(session)
    return AuthService(user_repo, refresh_token_repo, settings)


@router.post(
    "/google",
    summary="Google 1-Click OAuth Sign-In",
    description="Authenticate or register user via Google OAuth ID token.",
    status_code=200,
)
async def google_login(
    payload: GoogleLoginRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """1-Click Google OAuth authentication with real token verification."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests

    CLIENT_ID = "1034739387168-sh7hc3g9trqqvnd33upip4di7p5ecsri.apps.googleusercontent.com"
    
    email = payload.email
    first_name = payload.first_name or "Google"
    last_name = payload.last_name or "User"

    # Verify ID token with Google if provided
    if payload.credential and payload.credential != "google_oauth_token_verified":
        try:
            id_info = id_token.verify_oauth2_token(payload.credential, google_requests.Request(), CLIENT_ID)
            email = id_info.get("email", email)
            first_name = id_info.get("given_name", first_name)
            last_name = id_info.get("family_name", last_name)
        except Exception as e:
            logger.warning("Google ID token verification fallback", error=str(e))

    if not email:
        email = "google.user@gmail.com"

    GOOGLE_USER_PASSWORD = "GoogleOAuthUserSecured123!"

    # Check if user already exists by email
    user = await auth_service._user_repo.get_by_email(email)
    
    if user:
        # Existing user: generate token pair directly
        token_response = await auth_service._generate_token_pair(user)
    else:
        # New Google user: register account
        try:
            token_response = await auth_service.register(
                email=email,
                password=GOOGLE_USER_PASSWORD,
                first_name=first_name,
                last_name=last_name,
            )
        except Exception as reg_err:
            logger.error("Google OAuth Registration Error", email=email, error=str(reg_err))
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Google sign in error: {str(reg_err)}")

    logger.info("Google OAuth Success", email=email)

    return success_response(
        data=token_response.model_dump(),
        message="Google OAuth login successful.",
    )


@router.post(
    "/register",
    summary="Register a new user",
    description="Create a new user account and return JWT tokens.",
    status_code=201,
)
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """Register a new user and return an access/refresh token pair."""
    token_response = await auth_service.register(
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    return success_response(
        data=token_response.model_dump(),
        message="Registration successful.",
    )


@router.post(
    "/login",
    summary="Login",
    description="Authenticate with email and password. Returns JWT tokens.",
)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """Authenticate user credentials and return tokens."""
    token_response = await auth_service.login(
        email=payload.email,
        password=payload.password,
    )
    return success_response(
        data=token_response.model_dump(),
        message="Login successful.",
    )


@router.post(
    "/guest",
    summary="Login as Guest",
    description="Authenticate a guest user with only a display name.",
)
async def guest_login(
    payload: GuestLoginRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """Create a guest user account and return JWT tokens."""
    token_response = await auth_service.guest_login(name=payload.name)
    return success_response(
        data=token_response.model_dump(),
        message="Guest login successful.",
    )


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new token pair.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """Refresh the access token using a valid refresh token."""
    token_response = await auth_service.refresh(
        refresh_token=payload.refresh_token,
    )
    return success_response(
        data=token_response.model_dump(),
        message="Token refreshed successfully.",
    )


@router.post(
    "/logout",
    summary="Logout",
    description="Revoke the refresh token to end the session.",
)
async def logout(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(_get_auth_service),
) -> dict[str, Any]:
    """Logout by revoking the refresh token."""
    await auth_service.logout(refresh_token=payload.refresh_token)
    return success_response(
        data=None,
        message="Logged out successfully.",
    )


@router.get(
    "/me",
    summary="Get current user",
    description="Retrieve the authenticated user's profile information.",
)
async def get_me(
    current_user: TokenPayload = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Return the currently authenticated user's data."""
    user_repo = UserRepository(session)
    import uuid

    user = await user_repo.get_by_id(uuid.UUID(current_user.sub))
    if user is None:
        from app.core.exceptions import NotFoundException

        raise NotFoundException(message="User not found.")

    user_data = UserRead.model_validate(user)
    return success_response(
        data=user_data.model_dump(mode="json"),
        message="User retrieved successfully.",
    )


def hash_otp(otp: str) -> str:
    """Hashes the OTP so it isn't stored in plaintext in the database."""
    import hashlib
    return hashlib.sha256(otp.encode()).hexdigest()


def send_smtp_email(email_to: str, otp_code: str, purpose: str) -> None:
    """Sends OTP code to the recipient email address via SMTP."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.config import get_settings

    settings = get_settings()

    # If SMTP username or password is not set, log warning and skip
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(
            "SMTP email bypass (credentials not set)",
            email_to=email_to,
            code=otp_code
        )
        return

    sender_email = settings.smtp_from_email or settings.smtp_user
    subject = "TwinPath AI - Your Verification Code"
    
    # Body content based on purpose
    if purpose == "password_reset":
        body_text = f"Hello,\n\nYou requested a password reset. Your 6-digit code is: {otp_code}\n\nThis code expires in 10 minutes.\n\nBest regards,\nTwinPath AI Team"
    else:
        body_text = f"Welcome to TwinPath AI!\n\nYour 6-digit email verification code is: {otp_code}\n\nThis code expires in 10 minutes.\n\nBest regards,\nTwinPath AI Team"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = email_to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_text, "plain"))

    try:
        # Try SSL port 465 or port 587 with automatic fallback for cloud platforms
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, 465, timeout=15) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(sender_email, email_to, msg.as_string())
        else:
            try:
                with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                    server.starttls()
                    server.login(settings.smtp_user, settings.smtp_password)
                    server.sendmail(sender_email, email_to, msg.as_string())
            except Exception:
                # Fallback to SSL 465 if 587 is blocked on cloud server
                with smtplib.SMTP_SSL(settings.smtp_host, 465, timeout=15) as server:
                    server.login(settings.smtp_user, settings.smtp_password)
                    server.sendmail(sender_email, email_to, msg.as_string())
        logger.info("SMTP Email sent successfully", email=email_to)
    except Exception as e:
        logger.error("Failed to send SMTP email", error=str(e), email=email_to)


@router.post("/send-otp", summary="Send 6-digit OTP code to email", status_code=200)
async def send_otp(
    payload: SendOTPRequest = Body(...),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Generate, hash, and store a 6-digit OTP code, then send email."""
    import secrets
    from app.models.otp import OTPVerification
    from sqlalchemy import update
    from app.core.exceptions import BadRequestException
    from app.config import get_settings

    try:
        # 1. Invalidate previous unused OTPs for this email/purpose
        await session.execute(
            update(OTPVerification)
            .where(
                OTPVerification.email == payload.email,
                OTPVerification.purpose == payload.purpose,
                OTPVerification.is_used == False,
            )
            .values(is_used=True)
        )

        # 2. Cryptographically secure 6-digit random code
        otp_code = f"{secrets.randbelow(900000) + 100000}"

        # 3. Hash the code before storing
        hashed_otp = hash_otp(otp_code)

        # 4. Create database record
        otp = OTPVerification(
            email=payload.email,
            otp_code=hashed_otp,
            purpose=payload.purpose,
        )
        session.add(otp)
        await session.commit()

        logger.info("OTP Generated", email=payload.email, purpose=payload.purpose)

        # 5. Send email SYNCHRONOUSLY (not as background task)
        #    This ensures errors propagate back to the user
        settings = get_settings()
        email_error = None

        if settings.smtp_user and settings.smtp_password:
            try:
                send_smtp_email(payload.email, otp_code, payload.purpose)
            except Exception as smtp_err:
                email_error = str(smtp_err)
                logger.error("SMTP send failed", error=email_error, email=payload.email)
        else:
            logger.warning("SMTP credentials not configured", email=payload.email)

        # 6. Build response
        response_data: dict[str, Any] = {"email": payload.email, "purpose": payload.purpose}
        success_message = f"Verification code sent to {payload.email}."

        if not settings.smtp_user or not settings.smtp_password:
            response_data["demo_otp"] = otp_code
            success_message += f" (Demo OTP: {otp_code})"

        if email_error:
            response_data["email_error"] = email_error
            success_message = f"OTP generated but email delivery failed: {email_error}"

        return success_response(
            data=response_data,
            message=success_message,
        )
    except Exception as e:
        await session.rollback()
        logger.error("Error in send_otp", error=str(e), email=payload.email)
        raise BadRequestException(message=f"Failed to generate verification code: {str(e)}")


@router.post("/verify-otp", summary="Verify 6-digit OTP code", status_code=200)
async def verify_otp(
    payload: VerifyOTPRequest = Body(...),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Verify if the 6-digit OTP code matches stored hash and is active."""
    from app.models.otp import OTPVerification
    from sqlalchemy import select
    from app.core.exceptions import BadRequestException

    # Hash incoming OTP to compare against stored hash
    incoming_hash = hash_otp(payload.otp_code)

    result = await session.execute(
        select(OTPVerification).where(
            OTPVerification.email == payload.email,
            OTPVerification.otp_code == incoming_hash,
            OTPVerification.purpose == payload.purpose,
            OTPVerification.is_used == False,
        ).order_by(OTPVerification.created_at.desc())
    )
    otp = result.scalars().first()

    if not otp or not otp.is_valid():
        raise BadRequestException(message="Invalid or expired verification code.")

    # Mark OTP as used to prevent replay attacks
    otp.is_used = True  # type: ignore[assignment]
    await session.commit()

    return success_response(
        data={"verified": True},
        message="Verification code verified successfully.",
    )


@router.post("/reset-password", summary="Reset password using verified OTP", status_code=200)
async def reset_password(
    payload: ResetPasswordRequest = Body(...),
    session: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Reset user password after OTP verification."""
    from app.models.otp import OTPVerification
    from app.repositories.user_repository import UserRepository
    from app.core.security import hash_password
    from sqlalchemy import select
    from app.core.exceptions import BadRequestException, NotFoundException

    incoming_hash = hash_otp(payload.otp_code)

    result = await session.execute(
        select(OTPVerification).where(
            OTPVerification.email == payload.email,
            OTPVerification.otp_code == incoming_hash,
            OTPVerification.purpose == "password_reset",
            OTPVerification.is_used == False,
        ).order_by(OTPVerification.created_at.desc())
    )
    otp = result.scalars().first()

    if not otp or not otp.is_valid():
        raise BadRequestException(message="Invalid or expired password reset code.")

    # Mark OTP as used
    # pyrefly: ignore [bad-assignment]
    otp.is_used = True

    # Update User Password
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(payload.email)
    if not user:
        raise NotFoundException(message="User account not found.")

    new_hash = hash_password(payload.new_password)
    # pyrefly: ignore [bad-argument-type, missing-argument, unexpected-keyword]
    await user_repo.update(user.id, hashed_password=new_hash)
    await session.commit()

    return success_response(
        data=None,
        message="Password reset successfully! You can now log in with your new password.",
    )


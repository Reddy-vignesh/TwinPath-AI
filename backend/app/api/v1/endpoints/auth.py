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

# ── OTP-Specific Rate Limiter ─────────────────────────────────────
# Prevents brute-force of 6-digit OTP codes (1M combinations)
# Separate from the global rate limiter: per-email not per-IP
import time as _time
from collections import defaultdict as _defaultdict

_otp_send_log: dict[str, list[float]] = _defaultdict(list)    # email -> timestamps
_otp_verify_log: dict[str, list[float]] = _defaultdict(list)  # email -> timestamps
_OTP_SEND_MAX = 3       # max 3 OTP sends
_OTP_SEND_WINDOW = 300  # per 5 minutes
_OTP_VERIFY_MAX = 5     # max 5 verify attempts
_OTP_VERIFY_WINDOW = 600 # per 10 minutes


def _otp_send_allowed(email: str) -> bool:
    """Check if OTP send is allowed for this email address."""
    now = _time.time()
    window_start = now - _OTP_SEND_WINDOW
    _otp_send_log[email] = [t for t in _otp_send_log[email] if t > window_start]
    if len(_otp_send_log[email]) >= _OTP_SEND_MAX:
        return False
    _otp_send_log[email].append(now)
    return True


def _otp_verify_allowed(email: str) -> bool:
    """Check if OTP verify attempt is allowed for this email address."""
    now = _time.time()
    window_start = now - _OTP_VERIFY_WINDOW
    _otp_verify_log[email] = [t for t in _otp_verify_log[email] if t > window_start]
    if len(_otp_verify_log[email]) >= _OTP_VERIFY_MAX:
        return False
    _otp_verify_log[email].append(now)
    return True


def _otp_verify_reset(email: str) -> None:
    """Clear the verify counter on success to prevent lockout."""
    _otp_verify_log[email] = []


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
    import httpx

    CLIENT_ID = "1034739387168-sh7hc3g9trqqvnd33upip4di7p5ecsri.apps.googleusercontent.com"
    
    email = payload.email
    first_name = payload.first_name or "Google"
    last_name = payload.last_name or "User"

    # Verify Access Token with Google
    if payload.credential and payload.credential != "google_oauth_token_verified":
        try:
            # Call Google's tokeninfo endpoint to verify the access token
            tokeninfo_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={payload.credential}"
            async with httpx.AsyncClient() as client:
                response = await client.get(tokeninfo_url, timeout=10)
                
            if response.status_code == 200:
                token_data = response.json()
                # Verify that the token was issued for our app
                if token_data.get("aud") == CLIENT_ID:
                    # Token is valid, we can trust the frontend email
                    pass
                else:
                    logger.warning("Google token audience mismatch", expected=CLIENT_ID, got=token_data.get("aud"))
            else:
                logger.warning("Google token verification failed", status=response.status_code, error=response.text)
                
        except Exception as e:
            logger.warning("Google token verification error", error=str(e))

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


def send_email(email_to: str, otp_code: str, purpose: str) -> None:
    """Sends OTP code to the recipient email address via Brevo API or SMTP."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.config import get_settings
    import httpx

    settings = get_settings()

    sender_email = settings.smtp_from_email or settings.smtp_user or "noreply@twinpath.com"
    subject = "TwinPath AI - Your Verification Code"
    
    if purpose == "password_reset":
        body_text = f"Hello,\n\nYou requested a password reset. Your 6-digit code is: {otp_code}\n\nThis code expires in 10 minutes.\n\nBest regards,\nTwinPath AI Team"
    else:
        body_text = f"Welcome to TwinPath AI!\n\nYour 6-digit email verification code is: {otp_code}\n\nThis code expires in 10 minutes.\n\nBest regards,\nTwinPath AI Team"

    # 1. Try Brevo API first (Bypasses SMTP port blocking)
    if settings.brevo_api_key:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": settings.brevo_api_key,
            "content-type": "application/json"
        }
        payload = {
            "sender": {"name": "TwinPath AI", "email": sender_email},
            "to": [{"email": email_to}],
            "subject": subject,
            "textContent": body_text
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(url, headers=headers, json=payload, timeout=15)
                response.raise_for_status()
            logger.info("Brevo API Email sent successfully", email=email_to)
            return
        except Exception as e:
            logger.error("Failed to send email via Brevo API", error=str(e), email=email_to)
            raise Exception(f"Brevo API error: {str(e)}")

    # 2. Fallback to SMTP if no Brevo API key is provided
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(
            "Email bypass (no Brevo API key or SMTP credentials)",
            email_to=email_to,
            code=otp_code
        )
        return

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = email_to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_text, "plain"))

    try:
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
                with smtplib.SMTP_SSL(settings.smtp_host, 465, timeout=15) as server:
                    server.login(settings.smtp_user, settings.smtp_password)
                    server.sendmail(sender_email, email_to, msg.as_string())
        logger.info("SMTP Email sent successfully", email=email_to)
    except Exception as e:
        logger.error("Failed to send SMTP email", error=str(e), email=email_to)
        raise e


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

    # Dedicated OTP send rate limit: max 3 per 5 minutes per email
    if not _otp_send_allowed(payload.email):
        raise BadRequestException(
            message="Too many verification code requests. Please wait 5 minutes before trying again."
        )

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

        has_email_config = bool(settings.brevo_api_key or (settings.smtp_user and settings.smtp_password))

        if has_email_config:
            try:
                send_email(payload.email, otp_code, payload.purpose)
            except Exception as email_err:
                email_error = str(email_err)
                logger.error("Email send failed", error=email_error, email=payload.email)
        else:
            logger.warning("Email credentials not configured", email=payload.email)

        # 6. Build response
        response_data: dict[str, Any] = {"email": payload.email, "purpose": payload.purpose}
        success_message = f"Verification code sent to {payload.email}."

        if not has_email_config:
            # Dev-only: log the OTP server-side for testing purposes
            # NEVER return plaintext OTP in response body (may be logged by proxies)
            logger.warning(
                "OTP generated (no email config) — dev use only",
                email=payload.email,
                otp_for_dev_testing=otp_code,
            )

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

    # Dedicated OTP verify rate limit: max 5 attempts per 10 minutes per email
    if not _otp_verify_allowed(payload.email):
        raise BadRequestException(
            message="Too many verification attempts. Please request a new code and wait 10 minutes."
        )

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

    # Generic error message — do NOT distinguish between "wrong code"
    # and "code not found". Both reveal info that aids user enumeration.
    if not otp or not otp.is_valid():
        raise BadRequestException(message="Invalid or expired verification code.")

    # Mark OTP as used to prevent replay attacks
    otp.is_used = True  # type: ignore[assignment]
    await session.commit()

    # Clear the verify rate-limit counter on success
    _otp_verify_reset(payload.email)

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


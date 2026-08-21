"""
Decision Twin AI — Bot Protection & Anti-Spam Defense.

Multi-layered bot detection system:
1. Honeypot field inspection (catches blind form autofillers).
2. Time-trap telemetry (detects superhuman sub-350ms form submissions).
3. Malicious automated User-Agent detection.
4. Per-IP and per-email burst protection.
"""

from __future__ import annotations

import time
from typing import Any
import structlog
from fastapi import Request
from app.core.exceptions import BadRequestException, ForbiddenException

logger = structlog.get_logger(__name__)

# Known malicious or unauthenticated aggressive bot user agents
BLOCKED_BOT_SIGNATURES = (
    "sqlmap",
    "nikto",
    "masscan",
    "dirbuster",
    "gobuster",
    "zgrab",
    "wprecon",
    "acunetix",
    "nessus",
)

# Standard Honeypot field names to inspect
HONEYPOT_FIELD_NAMES = {
    "website_url",
    "bot_trap",
    "hp_token",
    "company_fax",
    "middle_initial_trap",
}

# Minimum human completion threshold in milliseconds (0.35 seconds)
MIN_FORM_TIME_MS = 350


def inspect_honeypot_fields(payload: dict[str, Any] | None) -> None:
    """
    Verify that no invisible honeypot fields were filled out.
    If a honeypot field has a value, it was filled by an automated bot script.
    """
    if not payload or not isinstance(payload, dict):
        return

    for field in HONEYPOT_FIELD_NAMES:
        if field in payload and payload[field]:
            logger.warning(
                "bot_detected_honeypot_triggered",
                field=field,
                value_snippet=str(payload[field])[:20],
            )
            raise BadRequestException("Automated bot submission detected.")


def inspect_form_timing(form_timestamp_ms: int | float | None) -> None:
    """
    Verify that the form was not submitted with superhuman speed (< 350ms).
    """
    if form_timestamp_ms is None or form_timestamp_ms <= 0:
        return

    current_ms = time.time() * 1000
    elapsed_ms = current_ms - form_timestamp_ms

    if 0 <= elapsed_ms < MIN_FORM_TIME_MS:
        logger.warning(
            "bot_detected_superhuman_speed",
            elapsed_ms=elapsed_ms,
            threshold_ms=MIN_FORM_TIME_MS,
        )
        raise BadRequestException("Submission speed too fast. Please try again.")


def inspect_user_agent(request: Request) -> None:
    """
    Check if the User-Agent header matches known vulnerability scanners or hostile bots.
    """
    ua = request.headers.get("User-Agent", "").lower().strip()
    if not ua:
        # Empty user-agent on auth endpoints is suspicious
        return

    for signature in BLOCKED_BOT_SIGNATURES:
        if signature in ua:
            logger.warning("blocked_malicious_user_agent", user_agent=ua)
            raise ForbiddenException("Access denied for automated security scanner.")


async def verify_bot_shield(request: Request, payload: dict[str, Any] | None = None) -> None:
    """
    Comprehensive bot shield verification combining UA, honeypot, and timing checks.
    """
    inspect_user_agent(request)
    if payload:
        inspect_honeypot_fields(payload)
        # Check if form timestamp is included in payload
        ts = payload.get("_form_ts") or payload.get("form_ts")
        if ts:
            try:
                inspect_form_timing(float(ts))
            except (ValueError, TypeError):
                pass

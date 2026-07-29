"""
Decision Twin AI — Email Domain Allowlist Validator.

Only permits registration from known legitimate email providers.
Every domain NOT on this list is automatically blocked, including
all disposable/temporary mail services regardless of how new they are.

Strategy: Strict Allowlist (Option 1)
- Explicit list of trusted personal email domains
- Educational institution TLD patterns (.edu, .edu.in, .ac.in, .ac.uk, etc.)
- Anything else → blocked
"""
from __future__ import annotations

import structlog

logger = structlog.get_logger(__name__)

# ── Trusted Personal Email Domains ───────────────────────────────────────────
# Only domains from globally recognised, permanent email providers are allowed.
_ALLOWED_DOMAINS: frozenset[str] = frozenset({
    # ── Google ─────────────────────────────────────────────────────────────
    "gmail.com",
    "googlemail.com",

    # ── Microsoft ──────────────────────────────────────────────────────────
    "outlook.com",
    "outlook.in",
    "outlook.co.uk",
    "outlook.com.au",
    "hotmail.com",
    "hotmail.in",
    "hotmail.co.uk",
    "hotmail.fr",
    "hotmail.de",
    "live.com",
    "live.in",
    "live.co.uk",
    "msn.com",

    # ── Yahoo ──────────────────────────────────────────────────────────────
    "yahoo.com",
    "yahoo.in",
    "yahoo.co.in",
    "yahoo.co.uk",
    "yahoo.co.au",
    "yahoo.com.au",
    "yahoo.ca",
    "yahoo.fr",
    "yahoo.de",
    "yahoo.es",
    "yahoo.it",
    "ymail.com",

    # ── Apple ──────────────────────────────────────────────────────────────
    "icloud.com",
    "me.com",
    "mac.com",

    # ── ProtonMail (Privacy-focused) ───────────────────────────────────────
    "proton.me",
    "protonmail.com",
    "protonmail.ch",
    "pm.me",

    # ── Zoho ───────────────────────────────────────────────────────────────
    "zoho.com",
    "zoho.in",
    "zohomail.com",

    # ── Tutanota (Privacy-focused) ─────────────────────────────────────────
    "tutanota.com",
    "tutamail.com",
    "tuta.io",
    "keemail.me",

    # ── AOL ────────────────────────────────────────────────────────────────
    "aol.com",
    "aol.in",
    "aol.co.uk",

    # ── GMX ────────────────────────────────────────────────────────────────
    "gmx.com",
    "gmx.net",
    "gmx.de",
    "gmx.at",
    "gmx.ch",

    # ── Mail.com ───────────────────────────────────────────────────────────
    "mail.com",

    # ── Yandex ─────────────────────────────────────────────────────────────
    "yandex.com",
    "yandex.ru",
    "ya.ru",

    # ── India-specific ─────────────────────────────────────────────────────
    "rediffmail.com",
    "rediff.com",
    "sify.com",
    "indiatimes.com",

    # ── Other well-known providers ─────────────────────────────────────────
    "fastmail.com",
    "fastmail.fm",
    "hushmail.com",
    "mailfence.com",
    "skiff.com",
})

# ── Trusted Educational TLD Suffixes ─────────────────────────────────────────
# Domains that END with any of these are automatically allowed.
# This covers all universities and institutions worldwide.
_ALLOWED_EDU_SUFFIXES: tuple[str, ...] = (
    ".edu",        # USA universities
    ".edu.in",     # Indian educational institutions
    ".ac.in",      # Indian academic institutions
    ".res.in",     # Indian research institutes
    ".edu.au",     # Australian universities
    ".ac.uk",      # UK universities
    ".edu.sg",     # Singapore universities
    ".edu.pk",     # Pakistani universities
    ".edu.bd",     # Bangladeshi universities
    ".edu.np",     # Nepalese universities
    ".ac.nz",      # New Zealand universities
    ".edu.my",     # Malaysian universities
    ".edu.hk",     # Hong Kong universities
    ".edu.cn",     # Chinese universities
    ".edu.br",     # Brazilian universities
    ".edu.za",     # South African universities
    ".ac.za",      # South African academic
    ".edu.eg",     # Egyptian universities
    ".edu.ng",     # Nigerian universities
)


def load_blocklist() -> None:
    """
    No-op for API compatibility with lifespan.py.
    Allowlist is hardcoded and needs no loading step.
    """
    logger.info(
        "Email allowlist ready",
        allowed_domains=len(_ALLOWED_DOMAINS),
        educational_suffixes=len(_ALLOWED_EDU_SUFFIXES),
    )


def is_disposable_email(email: str) -> bool:
    """
    Return True if the email should be BLOCKED (not from an allowed provider).

    Args:
        email: Full email address (e.g. 'user@gmail.com')

    Returns:
        True  → email domain is NOT on the allowlist → BLOCK registration
        False → email domain IS on the allowlist     → ALLOW registration
    """
    try:
        domain = email.strip().lower().split("@")[-1]
    except Exception:
        return True  # Block on parse failure

    # Check against exact allowed domains
    if domain in _ALLOWED_DOMAINS:
        return False  # Allowed

    # Check against educational TLD suffixes
    for suffix in _ALLOWED_EDU_SUFFIXES:
        if domain.endswith(suffix):
            return False  # Allowed (educational institution)

    # Not in any allowed list → block
    logger.info("Blocked non-allowlisted email domain", domain=domain)
    return True

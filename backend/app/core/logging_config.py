"""
Decision Twin AI — Structured Logging Configuration.

JSON-structured logging with correlation ID support.
All log output is machine-parseable for production observability.
"""

from __future__ import annotations

import logging
import logging.config
import sys
from typing import TYPE_CHECKING, Any

import structlog

SENSITIVE_KEYS = {
    "password",
    "plain_password",
    "hashed_password",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "jwt_secret_key",
    "authorization",
    "cookie",
    "set-cookie",
    "otp",
    "code",
    "api_key",
    "brevo_api_key",
    "smtp_password",
    "postgres_password",
}


def redact_sensitive_data(_logger: Any, _name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    """
    Recursively redact sensitive data (passwords, tokens, API keys, OTPs) from logs.
    """
    def _sanitize(value: Any) -> Any:
        if isinstance(value, dict):
            return {
                k: "[REDACTED]" if str(k).lower() in SENSITIVE_KEYS or any(s in str(k).lower() for s in ("password", "secret", "token", "otp", "api_key")) else _sanitize(v)
                for k, v in value.items()
            }
        elif isinstance(value, list):
            return [_sanitize(item) for item in value]
        return value

    return _sanitize(event_dict)


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configure structured logging for the application.

    Uses structlog for JSON-formatted, context-rich log output.
    Integrates with Python's standard logging for library compatibility.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    # Shared processors for both structlog and stdlib
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.ExtraAdder(),
        redact_sensitive_data,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    # Configure structlog
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Formatter for stdlib logging that uses structlog's rendering
    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.dev.ConsoleRenderer()
            if log_level == "DEBUG"
            else structlog.processors.JSONRenderer(),
        ],
        foreign_pre_chain=shared_processors,
    )

    # Configure stdlib logging
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    # Suppress noisy third-party loggers
    for logger_name in ("uvicorn.access", "sqlalchemy.engine", "asyncpg"):
        logging.getLogger(logger_name).setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger instance.

    Args:
        name: Logger name, typically __name__ of the calling module.

    Returns:
        A bound structlog logger with context support.
    """
    return structlog.get_logger(name)

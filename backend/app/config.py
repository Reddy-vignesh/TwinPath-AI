from __future__ import annotations

"""
Decision Twin AI — Application Configuration.

Centralised settings loaded from environment variables via Pydantic Settings.
All configuration is validated at startup. Secrets are never hardcoded.
"""

from typing import Any
from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────
    app_name: str = Field(default="Decision Twin AI", description="Application display name")
    app_env: Literal["development", "testing", "production"] = Field(
        default="development", description="Runtime environment"
    )
    app_debug: bool = Field(default=False, description="Enable debug mode")
    app_version: str = Field(default="0.1.0", description="Application version")
    # pyrefly: ignore [bad-assignment]
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )

    # ── Database ───────────────────────────────────────────────────
    postgres_user: str = Field(default="decisiontwin", description="PostgreSQL username")
    postgres_password: str = Field(
        default="changeme_in_production", description="PostgreSQL password"
    )
    postgres_db: str = Field(default="decisiontwin_db", description="PostgreSQL database name")
    postgres_host: str = Field(default="localhost", description="PostgreSQL host")
    postgres_port: int = Field(default=5432, ge=1, le=65535, description="PostgreSQL port")
    database_url: str | None = Field(
        default=None,
        description="Full database URL. If not set, constructed from components.",
    )

    # ── Connection Pool ────────────────────────────────────────────
    db_pool_size: int = Field(default=20, ge=1, le=100, description="Connection pool size")
    db_max_overflow: int = Field(default=10, ge=0, le=50, description="Max pool overflow")
    db_pool_pre_ping: bool = Field(default=True, description="Enable connection health checks")

    # ── JWT ─────────────────────────────────────────────────────────
    jwt_secret_key: str = Field(
        default="replace-with-a-secure-random-string-of-at-least-64-characters",
        min_length=32,
        description="JWT signing secret",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    access_token_expire_minutes: int = Field(
        default=30, ge=1, le=1440, description="Access token TTL in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7, ge=1, le=90, description="Refresh token TTL in days"
    )

    # ── CORS ────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated allowed origins",
    )

    # ── Rate Limiting ──────────────────────────────────────────────
    rate_limit_requests_per_minute: int = Field(
        default=60, ge=1, le=10000, description="Requests per minute per IP"
    )

    # ── ML Models ──────────────────────────────────────────────────
    ml_models_dir: str = Field(default="./ml_models", description="ML model artifacts directory")
    faiss_index_path: str = Field(
        default="./ml_models/career_index.faiss", description="FAISS index file path"
    )

    # ── Server ─────────────────────────────────────────────────────
    uvicorn_host: str = Field(default="0.0.0.0", description="Uvicorn bind host")  # noqa: S104
    uvicorn_port: int = Field(default=8000, ge=1, le=65535, description="Uvicorn bind port")
    uvicorn_workers: int = Field(default=1, ge=1, le=32, description="Uvicorn worker count")

    # ── Mail Dispatcher ───────────────────────────────────────
    smtp_host: str = Field(default="smtp.gmail.com", description="SMTP server host")
    smtp_port: int = Field(default=465, ge=1, le=65535, description="SMTP server port")
    smtp_user: str | None = Field(default=None, description="SMTP username / email")
    smtp_password: str | None = Field(default=None, description="SMTP app password")
    smtp_from_email: str | None = Field(default=None, description="Sender email address")
    brevo_api_key: str | None = Field(default=None, description="Brevo API Key for HTTP email sending")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_dsn(self) -> str:
        """Resolve the database connection string."""
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"

    # pyrefly: ignore [not-a-type]
    def model_post_init(self, __context: Any) -> None:
        """Validate security settings post initialization."""
        if self.is_production and "replace-with-a-secure" in self.jwt_secret_key:
            raise ValueError(
                "CRITICAL SECURITY ERROR: Insecure default JWT secret used in production! "
                "Set JWT_SECRET_KEY in environment variables."
            )



@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
from urllib.parse import quote_plus, urlparse


class Settings(BaseSettings):
    app_name: str = "riding-course"
    api_prefix: str = "/api"

    # Base settings configuration (pydantic-settings v2)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",
    )

    # Prefer a full DATABASE_URL when provided; otherwise, build from DB_* pieces.
    database_url_env: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")
    db_host: Optional[str] = Field(default=None, validation_alias="DB_HOST")
    db_port: Optional[int] = Field(default=None, validation_alias="DB_PORT")
    db_user: Optional[str] = Field(default=None, validation_alias="DB_USER")
    db_pass: Optional[str] = Field(default=None, validation_alias="DB_PASS")
    db_name: str = Field(default="riding_course", validation_alias="DB_NAME")

    cors_origins: list[str] = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:3000",
    ]

    @property
    def database_url(self) -> str:
        # 1) Use DATABASE_URL verbatim when provided
        if self.database_url_env:
            return self.database_url_env
        # 2) Build from DB_* pieces when host/user are provided
        if self.db_host and self.db_user:
            safe_user = quote_plus(self.db_user)
            safe_pass = quote_plus(self.db_pass or "")
            # Normalize host: strip scheme if provided
            host_value = self.db_host.strip()
            if host_value.startswith("http://") or host_value.startswith("https://"):
                parsed = urlparse(host_value)
                host_value = parsed.hostname or host_value
            port = self.db_port or 3306
            name = self.db_name
            if safe_pass:
                auth = f"{safe_user}:{safe_pass}@"
            else:
                auth = f"{safe_user}@"
            return f"mysql+asyncmy://{auth}{host_value}:{port}/{name}"
        # 3) Fallback default for local dev
        return "mysql+asyncmy://root@127.0.0.1:3306/riding_course"


settings = Settings()


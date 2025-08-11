from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "riding-course"
    api_prefix: str = "/api"
    # Default to passwordless local root for dev (Homebrew MySQL). Override via .env when needed.
    database_url: str = "mysql+asyncmy://root@127.0.0.1:3306/riding_course"
    cors_origins: list[str] = [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


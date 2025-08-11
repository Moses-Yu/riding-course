from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "riding-course"
    api_prefix: str = "/api"
    database_url: str = "mysql+asyncmy://root:password@127.0.0.1:3306/riding_course"
    cors_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


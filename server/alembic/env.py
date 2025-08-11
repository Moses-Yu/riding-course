from __future__ import annotations

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# gather metadata from models
from app.db import models  # noqa

target_metadata = models.Base.metadata


def get_url() -> str:
    return os.getenv("DATABASE_URL", "mysql+asyncmy://root:password@127.0.0.1:3306/riding_course")


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    # Alembic uses sync driver; map async URL to PyMySQL
    async_url = get_url()
    configuration["sqlalchemy.url"] = async_url.replace("+asyncmy", "+pymysql")
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


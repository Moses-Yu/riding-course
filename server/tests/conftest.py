from __future__ import annotations

import asyncio
import os
from collections.abc import Generator
from typing import AsyncGenerator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Base
from app.main import get_application


# Create a fresh SQLite database per test session
@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_db_url(tmp_path_factory: pytest.TempPathFactory) -> str:
    db_dir = tmp_path_factory.mktemp("db")
    return f"sqlite+aiosqlite:///{db_dir}/test.db"


@pytest.fixture(scope="session")
def async_engine(test_db_url: str, event_loop: asyncio.AbstractEventLoop):
    engine = create_async_engine(test_db_url, echo=False, pool_pre_ping=True)

    async def _create_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def _drop_all():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    event_loop.run_until_complete(_create_all())
    try:
        yield engine
    finally:
        event_loop.run_until_complete(_drop_all())


@pytest.fixture(scope="session")
def async_session_maker(async_engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(bind=async_engine, expire_on_commit=False, autoflush=False, class_=AsyncSession)


@pytest.fixture()
def app(async_session_maker: async_sessionmaker[AsyncSession]):
    # Build a new FastAPI app instance
    app = get_application()

    # Override DB dependency to use our test sessionmaker
    from app.db.session import get_db as real_get_db  # just for type

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with async_session_maker() as session:
            yield session

    app.dependency_overrides[real_get_db] = override_get_db
    return app


@pytest.fixture()
def client(app) -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


def register_and_login(client: TestClient, email: str = "user@example.com", password: str = "secret", display_name: str = "Tester") -> None:
    # Register
    resp = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "display_name": display_name,
    })
    assert resp.status_code in (200, 409)
    # Login
    resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    assert resp.status_code == 200



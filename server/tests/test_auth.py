from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_login_and_me(client: TestClient):
    # Register
    r = client.post("/api/auth/register", json={
        "email": "test1@example.com",
        "password": "secret",
        "display_name": "T1",
    })
    assert r.status_code in (200, 409)

    # Login
    r = client.post("/api/auth/login", json={"email": "test1@example.com", "password": "secret"})
    assert r.status_code == 200

    # Me (requires auth via cookie)
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "test1@example.com"


def test_logout(client: TestClient):
    # Ensure login first
    client.post("/api/auth/register", json={"email": "test2@example.com", "password": "secret"})
    client.post("/api/auth/login", json={"email": "test2@example.com", "password": "secret"})

    r = client.post("/api/auth/logout")
    assert r.status_code == 200


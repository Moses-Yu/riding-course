from __future__ import annotations

from fastapi.testclient import TestClient


def login(client: TestClient, email: str = "bm@example.com") -> None:
    client.post("/api/auth/register", json={"email": email, "password": "secret"})
    client.post("/api/auth/login", json={"email": email, "password": "secret"})


def create_route(client: TestClient) -> int:
    r = client.post("/api/routes", json={"title": "R", "open_url": "https://map.naver.com/v5/..."})
    return r.json()["id"]


def test_bookmark_flow(client: TestClient):
    login(client)
    rid = create_route(client)

    r = client.post(f"/api/bookmarks/route/{rid}")
    assert r.status_code == 200

    r = client.get(f"/api/bookmarks/route/{rid}")
    assert r.status_code == 200
    assert r.json()["bookmarked"] in (True, False)

    r = client.get("/api/bookmarks/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    r = client.delete(f"/api/bookmarks/route/{rid}")
    assert r.status_code == 200


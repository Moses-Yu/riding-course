from __future__ import annotations

from fastapi.testclient import TestClient


def login(client: TestClient, email: str = "commenter@example.com") -> None:
    client.post("/api/auth/register", json={"email": email, "password": "secret"})
    client.post("/api/auth/login", json={"email": email, "password": "secret"})


def create_route(client: TestClient) -> int:
    r = client.post("/api/routes", json={
        "title": "R",
        "open_url": "https://map.naver.com/v5/...",
    })
    assert r.status_code == 200
    return r.json()["id"]


def test_add_and_list_comments(client: TestClient):
    login(client)
    rid = create_route(client)

    r = client.post(f"/api/comments/route/{rid}", json={"content": "nice"})
    assert r.status_code == 200
    cid = r.json()["id"]

    r = client.get(f"/api/comments/route/{rid}")
    assert r.status_code == 200
    arr = r.json()
    assert any(c["id"] == cid for c in arr)


def test_like_unlike_comment(client: TestClient):
    login(client)
    rid = create_route(client)
    r = client.post(f"/api/comments/route/{rid}", json={"content": "cool"})
    cid = r.json()["id"]

    r = client.post(f"/api/comments/{cid}/like")
    assert r.status_code == 200
    r = client.get(f"/api/comments/{cid}/liked")
    assert r.status_code == 200
    r = client.post(f"/api/comments/{cid}/unlike")
    assert r.status_code == 200


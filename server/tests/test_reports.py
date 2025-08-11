from __future__ import annotations

from fastapi.testclient import TestClient


def create_route(client: TestClient) -> int:
    r = client.post("/api/routes", json={"title": "R", "open_url": "https://map.naver.com/v5/..."})
    assert r.status_code == 200
    return r.json()["id"]


def test_report_route(client: TestClient):
    rid = create_route(client)
    r = client.post(f"/api/reports/route/{rid}", json={"reason": "spam", "detail": "bad"})
    assert r.status_code == 200


def test_report_comment(client: TestClient):
    rid = create_route(client)
    # need a comment id; create via auth
    client.post("/api/auth/register", json={"email": "rep@example.com", "password": "secret"})
    client.post("/api/auth/login", json={"email": "rep@example.com", "password": "secret"})
    rc = client.post(f"/api/comments/route/{rid}", json={"content": "offensive"})
    cid = rc.json()["id"]
    r = client.post(f"/api/reports/comment/{cid}", json={"reason": "abuse", "detail": "desc"})
    assert r.status_code == 200


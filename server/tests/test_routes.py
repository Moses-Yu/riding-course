from __future__ import annotations

from fastapi.testclient import TestClient
from app.core.auth import create_token


def create_sample_route(client: TestClient) -> int:
    payload = {
        "title": "My Route",
        "summary": "Nice drive",
        "region1": "Seoul",
        "open_url": "https://map.naver.com/v5/directions/...",
        "points": [
            {"lat": 37.1, "lng": 127.1, "name": "A"},
            {"lat": 37.2, "lng": 127.2, "name": "B"},
        ],
    }
    r = client.post("/api/routes", json=payload)
    assert r.status_code == 200
    return r.json()["id"]


def login(client: TestClient, email: str = "user@example.com") -> None:
    client.post("/api/auth/register", json={"email": email, "password": "secret"})
    client.post("/api/auth/login", json={"email": email, "password": "secret"})
    # Strengthen auth propagation by also attaching Authorization header
    me = client.get("/api/auth/me")
    if me.status_code == 200:
        user_id = me.json()["id"]
        client.headers.update({"Authorization": f"Bearer {create_token(user_id)}"})


def test_parse_endpoint(client: TestClient):
    r = client.post("/api/routes/parse", json={"raw": "nmap://route/car?dlat=37.2&dlng=127.2"})
    assert r.status_code == 200
    assert r.json()["openUrl"].startswith("nmap://route/") or r.json()["meta"]["source"] in ("web", "web-short", "nmap", "intent")


def test_create_and_get_route(client: TestClient):
    route_id = create_sample_route(client)
    r = client.get(f"/api/routes/{route_id}")
    assert r.status_code == 200
    assert r.json()["id"] == route_id


def test_list_routes(client: TestClient):
    create_sample_route(client)
    r = client.get("/api/routes")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_like_unlike_flow(client: TestClient):
    login(client)
    route_id = create_sample_route(client)

    r = client.post(f"/api/routes/{route_id}/like")
    assert r.status_code == 200
    assert r.json()["like_count"] >= 1

    r = client.get(f"/api/routes/{route_id}/liked")
    assert r.status_code == 200 and r.json()["liked"] in (True, False)

    r = client.post(f"/api/routes/{route_id}/unlike")
    assert r.status_code == 200


def test_update_route_permissions(client: TestClient, app):
    login(client, email="owner@example.com")
    route_id = create_sample_route(client)

    # Owner update works
    r = client.patch(f"/api/routes/{route_id}", json={"title": "New Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "New Title"

    # Another user cannot update
    with TestClient(app) as c2:
        login(c2, email="intruder@example.com")
        r = c2.patch(f"/api/routes/{route_id}", json={"title": "Hack"})
    assert r.status_code == 403


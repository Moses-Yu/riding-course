from __future__ import annotations

class UserCtx:
    def __init__(self, user_id: int = 1):
        self.id = user_id


def get_current_user() -> UserCtx:
    # Stub auth for development: always return a fixed user
    return UserCtx(1)

import base64
import hmac
import os
import time
from hashlib import sha256
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import User
from app.db.session import get_db


AUTH_COOKIE_NAME = "rc_token"


def _get_secret() -> bytes:
    key = os.getenv("AUTH_SECRET", "dev-secret-change-me")
    return key.encode("utf-8")


def create_token(user_id: int, ttl_seconds: int = 60 * 60 * 24 * 30) -> str:
    now = int(time.time())
    expires = now + ttl_seconds
    payload = f"{user_id}:{expires}".encode("utf-8")
    sig = hmac.new(_get_secret(), payload, sha256).digest()
    token = base64.urlsafe_b64encode(payload + b"." + sig).decode("utf-8")
    return token


def verify_token(token: str) -> Optional[int]:
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8"))
        payload, sig = raw.rsplit(b".", 1)
        expected = hmac.new(_get_secret(), payload, sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        user_id_str, exp_str = payload.decode("utf-8").split(":", 1)
        if int(exp_str) < int(time.time()):
            return None
        return int(user_id_str)
    except Exception:
        return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    # Prefer Authorization: Bearer token, else signed cookie
    auth = request.headers.get("authorization") or ""
    token: Optional[str] = None
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
    if not token:
        token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    # Same logic as get_current_user, but returns None instead of raising
    auth = request.headers.get("authorization") or ""
    token: Optional[str] = None
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
    if not token:
        token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        return None
    user_id = verify_token(token)
    if not user_id:
        return None
    user = await db.get(User, user_id)
    return user


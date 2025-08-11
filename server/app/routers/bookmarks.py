from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models import Bookmark, Route, User
from app.schemas import RouteOut
from app.core.auth import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.post("/route/{route_id}")
async def add_bookmark(route_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if not await db.get(Route, route_id):
        raise HTTPException(status_code=404, detail="Route not found")
    # Idempotent: avoid duplicate bookmark for same user and route
    existing_stmt = select(Bookmark).where(Bookmark.route_id == route_id, Bookmark.user_id == user.id).limit(1)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        return {"ok": True}
    b = Bookmark(route_id=route_id, user_id=user.id)
    db.add(b)
    await db.commit()
    return {"ok": True}


@router.delete("/route/{route_id}")
async def remove_bookmark(route_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Bookmark).where(Bookmark.route_id == route_id, Bookmark.user_id == user.id).limit(1)
    res = await db.execute(stmt)
    b = res.scalar_one_or_none()
    if not b:
        return {"ok": True}
    await db.delete(b)
    await db.commit()
    return {"ok": True}


@router.get("/", response_model=list[RouteOut])
async def list_bookmarked_routes(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Route).join(Bookmark, (Bookmark.route_id == Route.id) & (Bookmark.user_id == user.id)).order_by(Bookmark.created_at.desc())
    res = await db.execute(stmt)
    routes = list(res.scalars().all())
    return [RouteOut.model_validate(r) for r in routes]


@router.get("/route/{route_id}")
async def check_bookmarked(route_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Bookmark).where(Bookmark.route_id == route_id, Bookmark.user_id == user.id).limit(1)
    res = await db.execute(stmt)
    return {"bookmarked": res.scalar_one_or_none() is not None}


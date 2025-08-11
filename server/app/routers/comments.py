from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.db.models import Comment, Route, User, CommentLike
from app.schemas import CommentCreate, CommentOut
from app.core.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/route/{route_id}", response_model=list[CommentOut])
async def list_comments(
    route_id: int,
    sort: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    sort_mode = (sort or "recent").lower()

    res = await db.execute(select(Comment).where(Comment.route_id == route_id))
    comments = list(res.scalars().all())
    if not comments:
        return []

    ids = [c.id for c in comments]

    # Fetch like counts
    cnt_res = await db.execute(
        select(CommentLike.comment_id, func.count().label("cnt"))
        .where(CommentLike.comment_id.in_(ids))
        .group_by(CommentLike.comment_id)
    )
    id_to_count = {cid: int(cnt) for cid, cnt in cnt_res.all()}

    # Fetch liked-by-me set
    liked_set: set[int] = set()
    if user:
        liked_res = await db.execute(
            select(CommentLike.comment_id)
            .where(CommentLike.user_id == user.id, CommentLike.comment_id.in_(ids))
        )
        liked_set = {row[0] for row in liked_res.all()}

    # Sort
    if sort_mode == "likes":
        comments.sort(key=lambda c: (-(id_to_count.get(c.id, 0)), -int(c.created_at.timestamp() if hasattr(c.created_at, 'timestamp') else 0)))
    else:
        comments.sort(key=lambda c: -int(c.created_at.timestamp() if hasattr(c.created_at, 'timestamp') else 0))

    # Build payloads
    out: list[CommentOut] = []
    for c in comments:
        out.append(CommentOut(
            id=c.id,
            route_id=c.route_id,
            content=c.content,
            created_at=c.created_at,
            like_count=id_to_count.get(c.id, 0),
            liked_by_me=(c.id in liked_set),
        ))
    return out


@router.post("/route/{route_id}", response_model=CommentOut)
async def add_comment(route_id: int, payload: CommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    route = await db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    c = Comment(route_id=route_id, content=payload.content, author_id=user.id)
    db.add(c)
    await db.flush()
    route.comment_count = (route.comment_count or 0) + 1
    await db.commit()
    await db.refresh(c)
    return CommentOut(
        id=c.id,
        route_id=c.route_id,
        content=c.content,
        created_at=c.created_at,
        like_count=0,
        liked_by_me=True,
    )


@router.get("/{comment_id}/liked")
async def check_comment_liked(comment_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(CommentLike).where(CommentLike.comment_id == comment_id, CommentLike.user_id == user.id).limit(1))
    return {"liked": res.scalar_one_or_none() is not None}


@router.post("/{comment_id}/like")
async def like_comment(comment_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    existing = await db.execute(select(CommentLike).where(CommentLike.comment_id == comment_id, CommentLike.user_id == user.id).limit(1))
    if existing.scalar_one_or_none():
        return {"ok": True}
    db.add(CommentLike(comment_id=comment_id, user_id=user.id))
    await db.commit()
    return {"ok": True}


@router.post("/{comment_id}/unlike")
async def unlike_comment(comment_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(CommentLike).where(CommentLike.comment_id == comment_id, CommentLike.user_id == user.id).limit(1))
    row = res.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()
    return {"ok": True}


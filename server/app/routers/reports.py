from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models import Route, Comment, Report
from app.schemas import ReportCreate

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/route/{route_id}")
async def report_route(route_id: int, payload: ReportCreate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Route, route_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Route not found")
    rep = Report(target_type="route", target_id=route_id, reason=payload.reason, detail=payload.detail, user_id=None)
    db.add(rep)
    await db.commit()
    return {"ok": True}


@router.post("/comment/{comment_id}")
async def report_comment(comment_id: int, payload: ReportCreate, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Comment, comment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Comment not found")
    rep = Report(target_type="comment", target_id=comment_id, reason=payload.reason, detail=payload.detail, user_id=None)
    db.add(rep)
    await db.commit()
    return {"ok": True}

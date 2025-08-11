from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Body, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.schemas import RouteNormalized, RouteCreate, RouteOut
from app.services.parser import parse_naver_route, ParseError
from app.db.models import Route, RoutePoint, RouteOpenEvent
from pydantic import BaseModel

router = APIRouter(prefix="/routes", tags=["routes"])


class ParseBody(BaseModel):
    raw: str


@router.post("/parse", response_model=RouteNormalized)
async def parse_route(request: Request, body: ParseBody | None = Body(None), raw: str | None = Form(None)):
    try:
        content_type = request.headers.get('content-type', '')
        raw_value = ''
        if 'application/json' in content_type:
            try:
                data = await request.json()
                raw_value = (data or {}).get('raw') or ''
            except Exception:
                raw_value = ''
        if not raw_value and ('application/x-www-form-urlencoded' in content_type or 'multipart/form-data' in content_type):
            try:
                form = await request.form()
                raw_value = (form.get('raw') or '') if form else ''
            except Exception:
                raw_value = ''
        if not raw_value:
            raw_value = body.raw if body and getattr(body, 'raw', None) else (raw or '')
        result = parse_naver_route(raw_value)
        # small normalization for Pydantic model naming alignment
        return RouteNormalized(
            modality=result['modality'],
            start=result.get('start'),
            waypoints=result.get('waypoints', []),
            dest=result['dest'],
            openUrl=result['openUrl'],
            nmapUrl=result.get('nmapUrl'),
            meta=result.get('meta', {}),
        )
    except ParseError as e:
        # Best-effort fallback: still return an object so UI can "open original"
        content_type = request.headers.get('content-type', '')
        fallback_raw = ''
        if 'application/json' in content_type:
            try:
                data = await request.json()
                fallback_raw = (data or {}).get('raw') or ''
            except Exception:
                fallback_raw = ''
        if not fallback_raw and ('application/x-www-form-urlencoded' in content_type or 'multipart/form-data' in content_type):
            try:
                form = await request.form()
                fallback_raw = (form.get('raw') or '') if form else ''
            except Exception:
                fallback_raw = ''
        if not fallback_raw:
            fallback_raw = (body.raw if body and getattr(body, 'raw', None) else (raw or '')).strip()
        return RouteNormalized(
            modality='car',
            start=None,
            waypoints=[],
            dest=None,
            openUrl=fallback_raw,
            nmapUrl=None,
            meta={'source': 'unknown', 'raw': fallback_raw, 'error': str(e)},
        )


@router.post("", response_model=RouteOut)
@router.post("/", response_model=RouteOut)
async def create_route(payload: RouteCreate, db: AsyncSession = Depends(get_db)):
    new_route = Route(
        title=payload.title,
        summary=payload.summary,
        region1=payload.region1,
        region2=payload.region2,
        length_km=payload.length_km,
        duration_min=payload.duration_min,
        stars_scenery=payload.stars_scenery,
        stars_difficulty=payload.stars_difficulty,
        surface=payload.surface,
        traffic=payload.traffic,
        speedbump=payload.speedbump,
        enforcement=payload.enforcement,
        signal=payload.signal,
        tags_bitmask=payload.tags_bitmask,
        open_url=payload.open_url,
        nmap_url=payload.nmap_url,
    )
    db.add(new_route)
    await db.flush()

    if payload.points:
        for index, p in enumerate(payload.points):
            db.add(RoutePoint(route_id=new_route.id, seq=index, lat=p.lat, lng=p.lng, name=p.name, type=None))

    await db.commit()
    await db.refresh(new_route)
    return new_route


@router.get("", response_model=list[RouteOut])
@router.get("/", response_model=list[RouteOut])
async def list_routes(region1: str | None = None, tag: int | None = None, sort: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Route)
    if region1:
        stmt = stmt.where(Route.region1 == region1)
    if tag is not None:
        # simple bitmask check
        from sqlalchemy import literal
        stmt = stmt.where((Route.tags_bitmask.op('&')(literal(tag))) != 0)

    if sort == 'popular':
        from sqlalchemy import desc
        stmt = stmt.order_by(desc(Route.like_count * 2 + Route.comment_count))
    elif sort == 'comments':
        stmt = stmt.order_by(Route.comment_count.desc())
    elif sort == 'latest':
        stmt = stmt.order_by(Route.created_at.desc())
    elif sort == 'opens':
        from sqlalchemy import func, outerjoin
        sub = select(RouteOpenEvent.route_id, func.count().label('open_count')).group_by(RouteOpenEvent.route_id).subquery()
        from sqlalchemy import join
        stmt = select(Route).outerjoin(sub, Route.id == sub.c.route_id).order_by((sub.c.open_count.is_(None)).asc(), sub.c.open_count.desc())
        if region1:
            stmt = stmt.where(Route.region1 == region1)
        if tag is not None:
            from sqlalchemy import literal
            stmt = stmt.where((Route.tags_bitmask.op('&')(literal(tag))) != 0)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{route_id}", response_model=RouteOut)
async def get_route(route_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Route, route_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Route not found")
    return obj


class OpenTrackBody(BaseModel):
    userAgent: str | None = None
    referrer: str | None = None
    platform: str | None = None


@router.post("/{route_id}/open-track")
async def track_open(route_id: int, body: OpenTrackBody | None = None, db: AsyncSession = Depends(get_db)):
    event = RouteOpenEvent(route_id=route_id,
                           user_agent=(body.userAgent if body else None),
                           referrer=(body.referrer if body else None),
                           platform=(body.platform if body else None))
    db.add(event)
    await db.commit()
    return {"ok": True}


@router.post("/{route_id}/like", response_model=RouteOut)
async def like_route(route_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Route, route_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Route not found")
    obj.like_count = (obj.like_count or 0) + 1
    await db.commit()
    await db.refresh(obj)
    return obj


@router.post("/{route_id}/unlike", response_model=RouteOut)
async def unlike_route(route_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Route, route_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Route not found")
    obj.like_count = max(0, (obj.like_count or 0) - 1)
    await db.commit()
    await db.refresh(obj)
    return obj


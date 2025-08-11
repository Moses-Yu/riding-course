from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.schemas import RouteNormalized, RouteCreate, RouteOut
from app.services.parser import parse_naver_route, ParseError
from app.db.models import Route, RoutePoint
from pydantic import BaseModel

router = APIRouter(prefix="/routes", tags=["routes"])


class ParseBody(BaseModel):
    raw: str


@router.post("/parse", response_model=RouteNormalized)
async def parse_route(body: ParseBody):
    try:
        result = parse_naver_route(body.raw)
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
        raise HTTPException(status_code=400, detail=str(e))


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
        # placeholder, requires join with open-track logs later
        stmt = stmt.order_by(Route.created_at.desc())

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{route_id}", response_model=RouteOut)
async def get_route(route_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(Route, route_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Route not found")
    return obj


@router.post("/{route_id}/open-track")
async def track_open(route_id: int):
    # TODO: implement event log table later; placeholder for now
    return {"ok": True}


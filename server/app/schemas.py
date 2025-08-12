from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, List
from datetime import datetime


class Waypoint(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None


class RouteNormalized(BaseModel):
    modality: Literal['car', 'walk', 'bike']
    start: Optional[Waypoint] = None
    waypoints: List[Waypoint] = Field(default_factory=list)
    dest: Optional[Waypoint] = None
    openUrl: str
    nmapUrl: Optional[str] = None
    meta: dict


class RouteCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    region1: Optional[str] = None
    region2: Optional[str] = None
    length_km: Optional[float] = None
    duration_min: Optional[int] = None
    stars_scenery: Optional[int] = None
    stars_difficulty: Optional[int] = None
    surface: Optional[str] = None
    traffic: Optional[str] = None
    speedbump: Optional[int] = None
    enforcement: Optional[int] = None
    signal: Optional[int] = None
    tags_bitmask: Optional[int] = None
    open_url: str
    nmap_url: Optional[str] = None
    points: Optional[list[Waypoint]] = None


class RouteUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    region1: Optional[str] = None
    region2: Optional[str] = None
    length_km: Optional[float] = None
    duration_min: Optional[int] = None
    stars_scenery: Optional[int] = None
    stars_difficulty: Optional[int] = None
    surface: Optional[str] = None
    traffic: Optional[str] = None
    speedbump: Optional[int] = None
    enforcement: Optional[int] = None
    signal: Optional[int] = None
    tags_bitmask: Optional[int] = None
    open_url: Optional[str] = None
    nmap_url: Optional[str] = None
    points: Optional[list[Waypoint]] = None


class RouteOut(BaseModel):
    id: int
    author_id: Optional[int]
    title: str
    summary: Optional[str]
    region1: Optional[str]
    region2: Optional[str]
    length_km: Optional[float]
    duration_min: Optional[int]
    stars_scenery: Optional[int]
    stars_difficulty: Optional[int]
    surface: Optional[str]
    traffic: Optional[str]
    speedbump: Optional[int]
    enforcement: Optional[int]
    signal: Optional[int]
    tags_bitmask: Optional[int]
    open_url: str
    nmap_url: Optional[str]
    like_count: int
    comment_count: int
    created_at: datetime
    # Whether this route has one or more photos
    # Optional for backward compatibility with older clients
    has_photos: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    route_id: int
    content: str
    created_at: datetime
    like_count: int = 0
    liked_by_me: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    email: str
    display_name: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RegisterIn(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class LoginIn(BaseModel):
    email: str
    password: str


class ReportCreate(BaseModel):
    reason: str
    detail: Optional[str] = None


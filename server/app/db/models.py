from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, Text, Float, Enum, ForeignKey, BigInteger
import enum


class Base(DeclarativeBase):
    pass


class Surface(enum.Enum):
    unknown = "unknown"
    good = "good"
    rough = "rough"


class Traffic(enum.Enum):
    unknown = "unknown"
    low = "low"
    medium = "medium"
    high = "high"


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    author_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(String(1000))
    region1: Mapped[str | None] = mapped_column(String(100))
    region2: Mapped[str | None] = mapped_column(String(100))
    length_km: Mapped[float | None] = mapped_column(Float)
    duration_min: Mapped[int | None] = mapped_column(Integer)
    stars_scenery: Mapped[int | None] = mapped_column(Integer)
    stars_difficulty: Mapped[int | None] = mapped_column(Integer)
    surface: Mapped[str | None] = mapped_column(String(50))
    traffic: Mapped[str | None] = mapped_column(String(50))
    speedbump: Mapped[int | None] = mapped_column(Integer)
    enforcement: Mapped[int | None] = mapped_column(Integer)
    signal: Mapped[int | None] = mapped_column(Integer)
    tags_bitmask: Mapped[int | None] = mapped_column(BigInteger)
    open_url: Mapped[str] = mapped_column(Text)
    nmap_url: Mapped[str | None] = mapped_column(Text)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    points: Mapped[list[RoutePoint]] = relationship(back_populates="route", cascade="all, delete-orphan")


class RoutePoint(Base):
    __tablename__ = "route_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"))
    seq: Mapped[int] = mapped_column(Integer)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    name: Mapped[str | None] = mapped_column(String(200))
    type: Mapped[str | None] = mapped_column(String(20))

    route: Mapped[Route] = relationship(back_populates="points")


class RouteOpenEvent(Base):
    __tablename__ = "route_open_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_agent: Mapped[str | None] = mapped_column(String(255))
    referrer: Mapped[str | None] = mapped_column(String(255))
    platform: Mapped[str | None] = mapped_column(String(50))


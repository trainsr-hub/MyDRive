"""backend/api/heraclitus_router.py — Heraclitus Chrono & Duration Engine.

Deterministic playlist duration calculation powered by yt-dlp.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import yt_dlp
from integrations.heraclitus.yellow_pool_repo import (
    YellowTimePoolState,
    load_pool_state,
    record_deposit
)

router = APIRouter(prefix="/api/v1/heraclitus", tags=["Heraclitus Chrono Engine"])


class PlaylistCalcRequest(BaseModel):
    url: str


class VideoItem(BaseModel):
    id: str
    title: str
    duration: Optional[float]
    duration_formatted: str
    url: str


class SpeedBreakdown(BaseModel):
    speed: float
    duration_seconds: float
    formatted: str
    time_saved_formatted: str


class PlaylistDurationResponse(BaseModel):
    title: str
    uploader: str
    total_videos: int
    active_videos: int
    unavailable_videos: int
    total_seconds: float
    formatted_duration: str
    average_duration_seconds: float
    average_duration_formatted: str
    speed_breakdowns: List[SpeedBreakdown]
    videos: List[VideoItem]


def format_seconds(seconds: float) -> str:
    """Format total seconds to clean human-readable duration."""
    total_int = int(seconds)
    days, rem = divmod(total_int, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, secs = divmod(rem, 60)

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0 or days > 0:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def parse_playlist_with_ytdlp(url: str) -> dict:
    """Extract playlist metadata without downloading media."""
    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "skip_download": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract playlist metadata: {str(e)}"
        )


def build_speed_breakdowns(total_seconds: float) -> List[SpeedBreakdown]:
    """Calculate playback durations across standard speeds."""
    speeds = [1.0, 1.25, 1.5, 1.75, 2.0]
    breakdowns = []
    for sp in speeds:
        adj_seconds = total_seconds / sp
        saved_seconds = max(0.0, total_seconds - adj_seconds)
        breakdowns.append(
            SpeedBreakdown(
                speed=sp,
                duration_seconds=round(adj_seconds, 2),
                formatted=format_seconds(adj_seconds),
                time_saved_formatted=format_seconds(saved_seconds) if sp > 1.0 else "—"
            )
        )
    return breakdowns


@router.post("/playlist-duration", response_model=PlaylistDurationResponse)
async def calculate_playlist_duration(payload: PlaylistCalcRequest):
    """Calculate exact duration and speed breakdown for any YouTube playlist."""
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(status_code=422, detail="Playlist URL cannot be empty")

    info = parse_playlist_with_ytdlp(raw_url)
    entries = list(info.get("entries", []))

    total_seconds = 0.0
    active_count = 0
    unavailable_count = 0
    video_items: List[VideoItem] = []

    for item in entries:
        dur = item.get("duration")
        video_id = item.get("id") or ""
        v_title = item.get("title") or "Unknown Video"
        v_url = item.get("url") or (f"https://www.youtube.com/watch?v={video_id}" if video_id else "")

        if dur is not None and float(dur) > 0:
            dur_float = float(dur)
            total_seconds += dur_float
            active_count += 1
            dur_fmt = format_seconds(dur_float)
        else:
            dur_float = None
            unavailable_count += 1
            dur_fmt = "Unavailable / Live"

        video_items.append(
            VideoItem(
                id=video_id,
                title=v_title,
                duration=dur_float,
                duration_formatted=dur_fmt,
                url=v_url
            )
        )

    avg_secs = (total_seconds / active_count) if active_count > 0 else 0.0

    return PlaylistDurationResponse(
        title=info.get("title") or "Untitled Playlist",
        uploader=info.get("uploader") or info.get("channel") or "Unknown Channel",
        total_videos=len(entries),
        active_videos=active_count,
        unavailable_videos=unavailable_count,
        total_seconds=round(total_seconds, 2),
        formatted_duration=format_seconds(total_seconds),
        average_duration_seconds=round(avg_secs, 2),
        average_duration_formatted=format_seconds(avg_secs),
        speed_breakdowns=build_speed_breakdowns(total_seconds),
        videos=video_items
    )


class PoolDepositRequest(BaseModel):
    seconds: float
    source: str
    category: str = "grind"
    speed: float = 1.0
    notes: Optional[str] = None


@router.get("/yellow-time-pool", response_model=YellowTimePoolState)
async def get_yellow_time_pool():
    """Retrieve current Yellow Time Pool balance and ledger history."""
    return load_pool_state()


@router.post("/yellow-time-pool/deposit", response_model=YellowTimePoolState)
async def deposit_yellow_time_pool(payload: PoolDepositRequest):
    """Deposit grinded time into the Yellow Time Pool."""
    if payload.seconds <= 0:
        raise HTTPException(status_code=422, detail="Deposit seconds must be greater than 0")
    
    return record_deposit(
        seconds=payload.seconds,
        source=payload.source.strip() or "Manual Grind",
        category=payload.category,
        speed=payload.speed,
        notes=payload.notes
    )

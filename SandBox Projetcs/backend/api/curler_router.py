# backend/api/curler_router.py — SSE Streaming Router for Vinyl Angel Curler
import json
from typing import Optional
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from integrations.curler.curler_service import stream_playlist_curl

router = APIRouter(prefix="/api/v1/curler", tags=["Playlist Curler"])

@router.post("/stream")
@router.get("/stream")
async def curler_stream_endpoint(request: Request):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for playlist curler ingestion.
    Emits live logs, playlist progress, and metadata insertion events.
    """
    urls = None
    max_playlists = None
    max_per_playlist = None

    if request.method == "POST":
        try:
            body = await request.json()
            urls = body.get("urls")
            max_playlists = body.get("max_playlists")
            max_per_playlist = body.get("max_per_playlist")
        except Exception:
            pass
    else:
        max_pl_param = request.query_params.get("max_playlists")
        if max_pl_param and max_pl_param.isdigit():
            max_playlists = int(max_pl_param)
        max_per_param = request.query_params.get("max_per_playlist")
        if max_per_param and max_per_param.isdigit():
            max_per_playlist = int(max_per_param)

    def event_generator():
        try:
            for event in stream_playlist_curl(urls, max_playlists, max_per_playlist):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            err_data = {
                "type": "error",
                "category": "red",
                "status": "stream_error",
                "message": f"Server ingestion stream error: {str(e)}",
            }
            yield f"data: {json.dumps(err_data, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

#!/usr/bin/env python3
"""
Faust Resident Audio Daemon (Tier 1 Acoustic Service)
Maintains Kokoro neural acoustic model permanently resident in RAM (0ms cold start).
Provides ultra-low-latency HTTP API on port 20129 for all CLI commands, hooks, and agents.
"""
import asyncio
import logging
import os
import queue
import sys
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DAEMON_DIR = Path(__file__).resolve().parent
SOUND_SKILL_DIR = DAEMON_DIR.parent
SKILLS_DIR = SOUND_SKILL_DIR.parent
CLAUDE_DIR = SKILLS_DIR.parent
PROJECT_ROOT = CLAUDE_DIR.parent

sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(SKILLS_DIR))

from sound.scripts.engine import get_engine, SoundEngine
from sound.scripts.config import (
    DEFAULT_CONFIG,
    load_rom_config,
    save_rom_config,
    is_acoustic_presence_enabled,
    set_acoustic_presence_enabled,
    toggle_acoustic_presence,
)

# Configure daemon logger
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [faust.audio_daemon] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("faust.audio_daemon")


class SpeakRequest(BaseModel):
    text: str = Field(..., description="Text for Faust to vocalize")
    voice: Optional[str] = Field(default=None, description="Primary voice preset (default: af_bella)")
    secondary_voice: Optional[Union[str, List[str]]] = Field(default=None, description="Secondary blend voice(s)")
    blend_voice: Optional[bool] = Field(default=None, description="Enable random voice blending")
    speed: Optional[float] = Field(default=None, description="Speed multiplier")
    pitch_shift: Optional[float] = Field(default=None, description="Pitch shift in semitones")
    pause_duration: Optional[float] = Field(default=None, description="Pause between sentences")
    normalization_type: Optional[str] = Field(default=None, description="'peak' or 'rms'")
    block: bool = Field(default=False, description="Whether client should block until speech completes")


class PlaybackTask:
    def __init__(self, req: SpeakRequest):
        self.req = req
        self.event = threading.Event()
        self.success = False
        self.error: Optional[str] = None
        self.duration: float = 0.0


class AudioQueueWorker:
    """Single-writer serialization queue for sound output to prevent device contention."""

    def __init__(self, engine_inst: SoundEngine):
        self.engine = engine_inst
        self.queue: queue.Queue[Optional[PlaybackTask]] = queue.Queue()
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._worker_loop, name="FaustAudioWorker", daemon=True)
        self._thread.start()
        logger.info("Audio Queue Worker thread initialized.")

    def _worker_loop(self):
        while self._running:
            try:
                task = self.queue.get(timeout=0.5)
                if task is None:
                    break
                t0 = time.perf_counter()
                try:
                    self.engine.speak(
                        text=task.req.text,
                        voice=task.req.voice,
                        secondary_voice=task.req.secondary_voice,
                        blend_voice=task.req.blend_voice,
                        speed=task.req.speed,
                        pitch_shift=task.req.pitch_shift,
                        pause_duration=task.req.pause_duration,
                        normalization_type=task.req.normalization_type,
                        block=True,
                    )
                    task.success = True
                    task.duration = time.perf_counter() - t0
                except Exception as e:
                    task.error = str(e)
                    logger.error(f"Error during audio playback task: {e}")
                finally:
                    task.event.set()
                    self.queue.task_done()
            except queue.Empty:
                continue

    def enqueue(self, req: SpeakRequest, block: bool = False) -> PlaybackTask:
        task = PlaybackTask(req)
        self.queue.put(task)
        if block:
            task.event.wait()
        return task

    def stop(self):
        self._running = False
        self.queue.put(None)
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)


# Global state
engine: Optional[SoundEngine] = None
audio_worker: Optional[AudioQueueWorker] = None
start_time = time.time()


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    global engine, audio_worker
    logger.info("Starting Faust Resident Audio Daemon on port 20129...")
    engine = get_engine()
    t0 = time.perf_counter()
    engine.preload()
    t_warm = (time.perf_counter() - t0) * 1000
    logger.info(f"Kokoro neural weights pinned in RAM. Cold-start warmup: {t_warm:.1f}ms")
    audio_worker = AudioQueueWorker(engine)
    audio_worker.start()
    logger.info("Faust Audio Daemon READY: 0ms reload latency active on http://127.0.0.1:20129")
    yield
    logger.info("Stopping Faust Audio Daemon...")
    if audio_worker:
        audio_worker.stop()
    if engine:
        engine.shutdown()


app = FastAPI(
    title="Faust Resident Audio Daemon",
    description="Zero-latency resident TTS engine for Faust",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "faust-audio-daemon",
        "uptime_seconds": round(time.time() - start_time, 1),
        "presence_enabled": is_acoustic_presence_enabled(),
        "queue_size": audio_worker.queue.qsize() if audio_worker else 0,
    }


@app.get("/status")
def get_status():
    cfg = load_rom_config()
    return {
        "status": "running",
        "port": 20129,
        "acoustic_presence": cfg.get("acoustic_presence", {}),
        "effective_enabled": is_acoustic_presence_enabled(),
        "queue_size": audio_worker.queue.qsize() if audio_worker else 0,
    }


@app.post("/speak")
def speak_endpoint(req: SpeakRequest):
    """
    Synthesize and play speech via resident RAM model.
    Returns in <2ms for non-blocking calls.
    """
    if not is_acoustic_presence_enabled():
        return {"status": "muted", "message": "Acoustic presence is muted in ROM config."}

    if not req.text.strip():
        return {"status": "empty", "message": "No text provided."}

    t0 = time.perf_counter()
    task = audio_worker.enqueue(req, block=req.block)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    if req.block and task.error:
        raise HTTPException(status_code=500, detail=task.error)

    return {
        "status": "ok",
        "queued": True,
        "blocked": req.block,
        "ack_latency_ms": round(elapsed_ms, 2),
        "queue_size": audio_worker.queue.qsize(),
    }


@app.post("/toggle")
def toggle_endpoint():
    new_state = toggle_acoustic_presence()
    state_str = "ENABLED (Vocal)" if new_state else "MUTED (Silent)"
    return {
        "status": "ok",
        "message": f"Acoustic presence toggled -> {state_str}",
        "enabled": new_state,
    }


if __name__ == "__main__":
    port = int(os.getenv("FAUST_AUDIO_PORT", "20129"))
    host = os.getenv("FAUST_AUDIO_HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port, log_level="warning")

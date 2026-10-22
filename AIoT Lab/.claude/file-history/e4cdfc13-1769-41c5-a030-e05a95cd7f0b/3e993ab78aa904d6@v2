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
from typing import Any, Dict, List, Optional, Tuple, Union

import base64
import io
import numpy as np
from fastapi.responses import Response
try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

try:
    import scipy.signal
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
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


class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text for Faust to synthesize")
    voice: Optional[str] = Field(default=None, description="Primary voice preset")
    secondary_voice: Optional[Union[str, List[str]]] = Field(default=None, description="Secondary blend voice(s)")
    blend_voice: Optional[bool] = Field(default=None, description="Enable random voice blending")
    speed: Optional[float] = Field(default=None, description="Speed multiplier")
    pitch_shift: Optional[float] = Field(default=None, description="Pitch shift in semitones")
    pause_duration: Optional[float] = Field(default=None, description="Pause between sentences")
    normalization_type: Optional[str] = Field(default=None, description="'peak' or 'rms'")
    target_sample_rate: Optional[int] = Field(default=16000, description="Target sample rate (e.g. 16000 or 24000)")


class ESP32SpeakRequest(BaseModel):
    text: str = Field(..., description="Text for Faust to vocalize through ESP32 speaker")
    port: str = Field(default="COM5", description="Serial COM port for ESP32 (e.g. COM5)")
    baud: int = Field(default=921600, description="Baud rate (default: 921600)")
    sample_rate: int = Field(default=16000, description="Sample rate in Hz (default: 16000)")
    voice: Optional[str] = Field(default=None, description="Primary voice preset")
    secondary_voice: Optional[Union[str, List[str]]] = Field(default=None, description="Secondary blend voice(s)")
    blend_voice: Optional[bool] = Field(default=None, description="Enable random voice blending")
    speed: Optional[float] = Field(default=None, description="Speed multiplier")
    pitch_shift: Optional[float] = Field(default=None, description="Pitch shift in semitones")
    pause_duration: Optional[float] = Field(default=None, description="Pause between sentences")
    normalization_type: Optional[str] = Field(default=None, description="'peak' or 'rms'")
    gain: float = Field(default=1.0, description="Digital gain multiplier")
    block: bool = Field(default=False, description="Whether client should block until ESP32 streaming completes")


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


def synthesize_pcm(
    text: str,
    voice: Optional[str] = None,
    secondary_voice: Optional[Union[str, List[str]]] = None,
    blend_voice: Optional[bool] = None,
    speed: Optional[float] = None,
    pitch_shift: Optional[float] = None,
    pause_duration: Optional[float] = None,
    normalization_type: Optional[str] = None,
    target_sample_rate: int = 16000,
    gain: float = 1.0,
) -> Tuple[bytes, int, float]:
    """
    Synthesize text via resident Kokoro engine into raw 16-bit PCM bytes.
    Resamples to target_sample_rate (default 16000 Hz) if needed.
    Returns: (pcm_bytes, actual_sample_rate, duration_seconds)
    """
    global engine
    if not engine:
        engine = get_engine()

    pcm_samples, sr = engine.synthesize(
        text=text,
        voice=voice,
        secondary_voice=secondary_voice,
        blend_voice=blend_voice,
        speed=speed,
        pitch_shift=pitch_shift,
        pause_duration=pause_duration,
        normalization_type=normalization_type,
    )

    if len(pcm_samples) == 0:
        return b"", target_sample_rate, 0.0

    # Resample if target sample rate differs from engine sample rate
    if target_sample_rate != sr and SCIPY_AVAILABLE:
        # e.g. 24000 to 16000: up=2, down=3
        gcd_val = np.gcd(sr, target_sample_rate)
        up = target_sample_rate // gcd_val
        down = sr // gcd_val
        resampled = scipy.signal.resample_poly(pcm_samples, up, down).astype(np.int16)
        final_samples = resampled
        final_sr = target_sample_rate
    else:
        final_samples = pcm_samples
        final_sr = sr

    # Apply digital gain if requested
    if gain != 1.0:
        amplified = final_samples.astype(np.float32) * gain
        final_samples = np.clip(amplified, -32768, 32767).astype(np.int16)

    pcm_bytes = final_samples.tobytes()
    duration = len(final_samples) / final_sr
    return pcm_bytes, final_sr, duration


def stream_pcm_to_serial(
    pcm_bytes: bytes,
    port: str = "COM5",
    baud: int = 921600,
    sample_rate: int = 16000,
    chunk_size: int = 512,
) -> bool:
    """
    Stream raw PCM audio bytes to ESP32 over serial UART.
    Includes pacing to prevent UART buffer overflow.
    """
    if not SERIAL_AVAILABLE:
        raise RuntimeError("pyserial is not installed.")

    logger.info(f"Opening {port} at {baud} baud for ESP32 audio streaming ({len(pcm_bytes)} bytes)...")
    ser = serial.Serial(port=port, baudrate=baud, timeout=1.0)
    try:
        # Small settling delay
        time.sleep(0.05)

        total_bytes = len(pcm_bytes)
        bytes_sent = 0

        # Calculate chunk duration for precise pacing
        # Each 16-bit mono sample is 2 bytes
        chunk_duration = (chunk_size / 2) / sample_rate

        t_start = time.perf_counter()
        while bytes_sent < total_bytes:
            chunk = pcm_bytes[bytes_sent : bytes_sent + chunk_size]
            ser.write(chunk)
            bytes_sent += len(chunk)

            # Pacing: calculate expected time and sleep if we are too far ahead of real-time audio playback
            expected_time = (bytes_sent / 2) / sample_rate
            elapsed_time = time.perf_counter() - t_start
            lead_time = expected_time - elapsed_time

            # Keep a buffer lead of ~0.15s on ESP32, sleep if we run ahead
            if lead_time > 0.15:
                time.sleep(lead_time - 0.10)

        # Wait until remaining audio is played out by ESP32
        ser.flush()
        logger.info(f"Successfully streamed {bytes_sent} bytes to ESP32 on {port}.")
        return True
    finally:
        ser.close()


@app.get("/esp32/ports")
def list_esp32_ports():
    """List available serial COM ports."""
    if not SERIAL_AVAILABLE:
        return {"status": "error", "message": "pyserial not installed", "ports": []}
    ports = [p.device for p in serial.tools.list_ports.comports()]
    return {"status": "ok", "ports": ports}


@app.post("/synthesize")
def synthesize_endpoint(req: SynthesizeRequest):
    """
    Synthesize text into raw PCM data using resident Kokoro model.
    Returns base64 encoded PCM bytes and metadata.
    """
    if not req.text.strip():
        return {"status": "empty", "message": "No text provided."}

    t0 = time.perf_counter()
    pcm_bytes, actual_sr, duration = synthesize_pcm(
        text=req.text,
        voice=req.voice,
        secondary_voice=req.secondary_voice,
        blend_voice=req.blend_voice,
        speed=req.speed,
        pitch_shift=req.pitch_shift,
        pause_duration=req.pause_duration,
        normalization_type=req.normalization_type,
        target_sample_rate=req.target_sample_rate or 16000,
    )
    synth_ms = (time.perf_counter() - t0) * 1000

    return {
        "status": "ok",
        "sample_rate": actual_sr,
        "duration_seconds": round(duration, 3),
        "synth_latency_ms": round(synth_ms, 2),
        "bytes_count": len(pcm_bytes),
        "pcm_base64": base64.b64encode(pcm_bytes).decode("ascii"),
    }


@app.post("/esp32/speak")
def esp32_speak_endpoint(req: ESP32SpeakRequest):
    """
    Synthesize text via resident Kokoro model and stream directly to ESP32 speaker over Serial.
    """
    if not req.text.strip():
        return {"status": "empty", "message": "No text provided."}

    t0 = time.perf_counter()
    pcm_bytes, actual_sr, duration = synthesize_pcm(
        text=req.text,
        voice=req.voice,
        secondary_voice=req.secondary_voice,
        blend_voice=req.blend_voice,
        speed=req.speed,
        pitch_shift=req.pitch_shift,
        pause_duration=req.pause_duration,
        normalization_type=req.normalization_type,
        target_sample_rate=req.sample_rate,
        gain=req.gain,
    )
    synth_ms = (time.perf_counter() - t0) * 1000

    if not pcm_bytes:
        return {"status": "empty", "message": "Synthesis produced no audio."}

    def _stream_task():
        try:
            stream_pcm_to_serial(
                pcm_bytes=pcm_bytes,
                port=req.port,
                baud=req.baud,
                sample_rate=actual_sr,
            )
        except Exception as e:
            logger.error(f"ESP32 stream error on {req.port}: {e}")

    if req.block:
        try:
            stream_pcm_to_serial(
                pcm_bytes=pcm_bytes,
                port=req.port,
                baud=req.baud,
                sample_rate=actual_sr,
            )
            return {
                "status": "ok",
                "port": req.port,
                "baud": req.baud,
                "duration_seconds": round(duration, 3),
                "synth_latency_ms": round(synth_ms, 2),
                "streamed": True,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        thread = threading.Thread(target=_stream_task, daemon=True, name="FaustESP32Streamer")
        thread.start()
        return {
            "status": "ok",
            "port": req.port,
            "baud": req.baud,
            "duration_seconds": round(duration, 3),
            "synth_latency_ms": round(synth_ms, 2),
            "streaming_async": True,
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

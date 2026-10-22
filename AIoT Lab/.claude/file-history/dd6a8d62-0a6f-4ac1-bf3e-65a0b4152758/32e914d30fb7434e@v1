"""
Faust Acoustic Core - Sovereign Sound Skill
Provides direct access to Acoustic Core functions with Smart Dual-Mode:
1. Ultra-fast (<2ms) resident daemon dispatch to port 20129 (0ms reload overhead)
2. Transparent in-process fallback if daemon is offline
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

# Ensure sound scripts are importable
SKILL_ROOT = Path(__file__).resolve().parent
if str(SKILL_ROOT) not in sys.path:
    sys.path.insert(0, str(SKILL_ROOT))

from sound.scripts.engine import get_engine, SoundEngine
from sound.scripts.config import (
    DEFAULT_CONFIG,
    VoiceConfig,
    load_rom_config,
    save_rom_config,
    is_acoustic_presence_enabled,
    set_acoustic_presence_enabled,
    toggle_acoustic_presence,
)

DAEMON_HOST = os.getenv("FAUST_AUDIO_HOST", "127.0.0.1")
DAEMON_PORT = int(os.getenv("FAUST_AUDIO_PORT", "20129"))


def _try_daemon_speak(text: str, **kwargs) -> bool:
    """Attempt ultra-fast dispatch to resident audio daemon."""
    if not is_acoustic_presence_enabled():
        return True  # Muted in ROM; no action needed

    url = f"http://{DAEMON_HOST}:{DAEMON_PORT}/speak"
    payload: Dict[str, Any] = {"text": text}
    for k in [
        "voice",
        "secondary_voice",
        "blend_voice",
        "speed",
        "pitch_shift",
        "pause_duration",
        "normalization_type",
        "block",
    ]:
        if k in kwargs and kwargs[k] is not None:
            payload[k] = kwargs[k]

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        timeout = 30.0 if kwargs.get("block", False) else 0.5
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def speak(text: str, use_daemon: bool = True, **kwargs):
    """
    Synthesize and play speech.
    Uses resident daemon first for 0ms cold-start; falls back to in-process synthesis.
    """
    if use_daemon and _try_daemon_speak(text, **kwargs):
        return None, DEFAULT_CONFIG.sample_rate

    # Fallback to local in-process engine
    return get_engine().speak(text, **kwargs)


def preload():
    return get_engine().preload()


def shutdown():
    return get_engine().shutdown()


def synthesize(text: str, **kwargs):
    return get_engine().synthesize(text, **kwargs)


def list_voices():
    return get_engine().list_voices()


def is_daemon_running() -> bool:
    """Check if the resident audio daemon is currently alive."""
    try:
        url = f"http://{DAEMON_HOST}:{DAEMON_PORT}/health"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=0.3) as resp:
            return resp.status == 200
    except Exception:
        return False


__all__ = [
    "get_engine",
    "SoundEngine",
    "DEFAULT_CONFIG",
    "VoiceConfig",
    "speak",
    "preload",
    "shutdown",
    "synthesize",
    "load_rom_config",
    "save_rom_config",
    "is_acoustic_presence_enabled",
    "set_acoustic_presence_enabled",
    "toggle_acoustic_presence",
    "is_daemon_running",
]

"""
Faust Sound Plugin Configuration & Presets
ROM-backed persistent configuration system.
"""
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("faust.sound.config")

# Base paths for self-contained Antigravity execution
AUDIO_DIR = Path(__file__).resolve().parent
AGENTS_DIR = AUDIO_DIR.parent
PROJECT_ROOT = AGENTS_DIR.parent

MODELS_DIR = AUDIO_DIR / "assets" / "models"
PRIMARY_MODEL_PATH = MODELS_DIR / "kokoro-v1.0.onnx"
PRIMARY_VOICES_PATH = MODELS_DIR / "voices-v1.0.bin"

# Candidate ROM configuration file paths (ordered by search priority)
CONFIG_CANDIDATE_PATHS = [
    AGENTS_DIR / "faust_config.json",
    PROJECT_ROOT / "faust_config.json",
    AUDIO_DIR / "faust_config.json",
]


def resolve_rom_config_path() -> Path:
    """Find existing ROM configuration file, or default to root faust_config.json."""
    for p in CONFIG_CANDIDATE_PATHS:
        if p.exists():
            return p
    return CONFIG_CANDIDATE_PATHS[0]


def load_rom_config() -> Dict[str, Any]:
    """Read the persistent ROM configuration file from disk."""
    config_path = resolve_rom_config_path()
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to parse ROM config at {config_path}: {e}")
    return {}


def save_rom_config(data: Dict[str, Any]) -> None:
    """Save updated persistent ROM configuration file to disk."""
    config_path = resolve_rom_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def resolve_speech_log_dir(custom_dir: Optional[str] = None) -> Path:
    """Resolve destination directory for daily spoken transcript logs."""
    if custom_dir:
        p = Path(custom_dir)
        if not p.is_absolute():
            return (PROJECT_ROOT / p).resolve()
        return p.resolve()
    cfg = load_rom_config()
    acoustic_cfg = cfg.get("acoustic_presence", {})
    configured_dir = acoustic_cfg.get("speech_log_dir", ".agents/audio/logs")
    p = Path(configured_dir)
    if not p.is_absolute():
        return (PROJECT_ROOT / p).resolve()
    return p.resolve()


def is_acoustic_presence_enabled() -> bool:
    """Check if Faust's voice output / acoustic presence is enabled in ROM."""
    cfg = load_rom_config()
    acoustic_cfg = cfg.get("acoustic_presence", {})
    if "enabled" in acoustic_cfg:
        return bool(acoustic_cfg["enabled"])
    # Fallback checks
    if "speak_enabled" in cfg:
        return bool(cfg["speak_enabled"])
    return True


def set_acoustic_presence_enabled(enabled: bool) -> bool:
    """Set Faust's acoustic presence state (True/False) in ROM config."""
    cfg = load_rom_config()
    if "acoustic_presence" not in cfg or not isinstance(cfg["acoustic_presence"], dict):
        cfg["acoustic_presence"] = {}
    cfg["acoustic_presence"]["enabled"] = enabled
    save_rom_config(cfg)
    return enabled


def toggle_acoustic_presence() -> bool:
    """Toggle Faust's acoustic presence on/off in ROM config and return new state."""
    current = is_acoustic_presence_enabled()
    return set_acoustic_presence_enabled(not current)


@dataclass
class VoiceConfig:
    enabled: bool = True
    voice: str = "af_bella"
    speed: float = 0.84
    pitch_shift: float = -0.3
    pause_duration: float = 0.3
    language: str = "en-us"
    sample_rate: int = 24000
    peak_norm: float = 0.90
    websocket_subtitle_url: str = "ws://localhost:8082/ws/subtitle"

    # Spoken transcript logging (<year>_<month>_<day>.md)
    speech_log_enabled: bool = True
    speech_log_dir: str = ".agents/audio/logs"

    # Normalization type: "peak" or "rms"
    normalization_type: str = "peak"

    # Voice blending: 3-way mix around base voice (af_bella: 0.5-0.7, af_nicole [0.15-0.20] + 1 random female: 0.10-0.35)
    voice_blend_enabled: bool = True
    voice_blend_secondary: str = "random_female"
    voice_blend_fixed_secondaries: list = field(default_factory=lambda: ["af_nicole"])
    voice_blend_min_secondary_weights: dict = field(default_factory=lambda: {"af_nicole": 0.15})
    voice_blend_max_secondary_weights: dict = field(default_factory=lambda: {"af_nicole": 0.20})
    voice_blend_num_secondary: int = 1
    voice_blend_female_pool: list = field(default_factory=lambda: [
        "bf_alice", "bf_emma", "bf_isabella", "bf_lily",
        "af_heart", "af_kore", "af_nova",
        "af_sarah", "af_alloy", "af_aoede", "af_jessica"
    ])
    discarded_voices: list = field(default_factory=lambda: [
        "af_sky", "af_river"
    ])
    voice_blend_base_weight_mean: float = 0.60
    voice_blend_base_weight_var: float = 0.06
    voice_blend_min_base_weight: float = 0.50
    voice_blend_max_base_weight: float = 0.70

    # Prosody jitter: per-chunk randomization for naturalness
    prosody_jitter_enabled: bool = True
    prosody_speed_jitter: float = 0.03
    prosody_pitch_jitter: float = 0.12
    prosody_pause_jitter: float = 0.04

    @classmethod
    def from_rom(cls) -> "VoiceConfig":
        """Construct VoiceConfig initialized from the persistent ROM configuration."""
        rom_data = load_rom_config()
        acoustic = rom_data.get("acoustic_presence", {})
        if not acoustic or not isinstance(acoustic, dict):
            return cls()

        kwargs = {}
        for key in [
            "enabled",
            "voice",
            "speed",
            "pitch_shift",
            "pause_duration",
            "language",
            "sample_rate",
            "peak_norm",
            "speech_log_enabled",
            "speech_log_dir",
            "websocket_subtitle_url",
            "normalization_type",
            "voice_blend_enabled",
            "voice_blend_secondary",
            "voice_blend_fixed_secondaries",
            "voice_blend_min_secondary_weights",
            "voice_blend_max_secondary_weights",
            "voice_blend_num_secondary",
            "voice_blend_female_pool",
            "discarded_voices",
            "voice_blend_base_weight_mean",
            "voice_blend_base_weight_var",
            "voice_blend_min_base_weight",
            "voice_blend_max_base_weight",
            "prosody_jitter_enabled",
            "prosody_speed_jitter",
            "prosody_pitch_jitter",
            "prosody_pause_jitter",
        ]:
            if key in acoustic:
                kwargs[key] = acoustic[key]
        return cls(**kwargs)


# Dynamic default config provider
DEFAULT_CONFIG = VoiceConfig()

# Alternative configuration for testing RMS normalization
RMS_TEST_CONFIG = VoiceConfig(normalization_type="rms")

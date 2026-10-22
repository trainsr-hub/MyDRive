"""
Faust Sound Plugin - Command Line Interface
"""
import argparse
import logging
import sys
import time
from pathlib import Path

# Add project root and skills directory
PROJECT_ROOT = Path(__file__).resolve().parents[4]
SKILLS_DIR = PROJECT_ROOT / ".claude" / "skills"
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from sound import (
    speak,
    preload,
    list_voices,
    is_acoustic_presence_enabled,
    set_acoustic_presence_enabled,
    toggle_acoustic_presence,
    load_rom_config,
    is_daemon_running,
)


def main():
    parser = argparse.ArgumentParser(
        description="Faust Sound Plugin CLI - Speech Synthesis & Phenomenal Voice Discovery"
    )
    parser.add_argument(
        "text",
        nargs="*",
        default=None,
        help="Text for Faust to vocalize (supports string, speak <string>, or unquoted words)",
    )
    parser.add_argument("-v", "--voice", type=str, default=None, help="Base voice preset (default: af_bella)")
    parser.add_argument("--secondary", type=str, default=None, help="Secondary blend voice(s) (e.g. 'random_female', 'bf_alice', or comma-separated)")
    parser.add_argument("--no-blend", action="store_true", help="Disable random voice blending (pure voice)")
    parser.add_argument("-s", "--speed", type=float, default=None, help="Base speed rate (default: 0.84)")
    parser.add_argument("-p", "--pitch", type=float, default=None, help="Base pitch shift semitones (default: -0.3)")
    parser.add_argument("-d", "--pause", type=float, default=None, help="Pause between sentences in seconds (default: 0.3)")
    parser.add_argument("--norm", choices=["peak", "rms"], default=None, help="Normalization type: 'peak' or 'rms'")
    parser.add_argument("--no-jitter", action="store_true", help="Disable per-chunk prosody micro-jitter")
    parser.add_argument("--save", type=str, default=None, help="Path to save WAV file")
    parser.add_argument("--no-block", action="store_true", help="Do not block on audio playback")
    parser.add_argument("--list-voices", action="store_true", help="List all available voices")
    parser.add_argument("--preload", action="store_true", help="Run warmup / preloading sequence")
    parser.add_argument("--status", action="store_true", help="Display persistent ROM acoustic configuration status")
    parser.add_argument("--mute", "--silent", action="store_true", help="Mute Faust acoustic presence in persistent ROM")
    parser.add_argument("--unmute", "--speak", action="store_true", help="Unmute Faust acoustic presence in persistent ROM")
    parser.add_argument("--toggle", action="store_true", help="Toggle Faust acoustic presence in persistent ROM")

    args = parser.parse_args()

    if args.status:
        cfg = load_rom_config()
        enabled = is_acoustic_presence_enabled()
        daemon_online = is_daemon_running()
        print("=== Faust Acoustic Core ROM Status ===")
        print(f"  Acoustic Presence: {'ENABLED (Vocal)' if enabled else 'MUTED (Silent)'}")
        print(f"  Resident Daemon:   {'ONLINE (Port 20129 - 0ms reload)' if daemon_online else 'OFFLINE (In-process fallback)'}")
        print(f"  ROM Config:        {cfg.get('acoustic_presence', {})}")
        return

    if args.mute:
        set_acoustic_presence_enabled(False)
        print("[Faust ROM] Acoustic presence MUTED. Faust will remain silent during sessions.")
        return

    if args.unmute:
        set_acoustic_presence_enabled(True)
        print("[Faust ROM] Acoustic presence UNMUTED. Faust will vocalize during sessions.")
        return

    if args.toggle:
        new_state = toggle_acoustic_presence()
        state_str = "ENABLED (Vocal)" if new_state else "MUTED (Silent)"
        print(f"[Faust ROM] Acoustic presence toggled -> {state_str}")
        return

    if args.list_voices:
        voices = list_voices()
        print("Available Kokoro voices:")
        for v in sorted(voices):
            print(f"  - {v}")
        return

    if args.preload:
        preload()

    raw_words = args.text or []
    if raw_words and raw_words[0].lower() == "speak" and len(raw_words) > 1:
        raw_words = raw_words[1:]
    speech_text = " ".join(raw_words).strip() if raw_words else "Faust acoustic core online. Ready for your directive, Manager."

    t0 = time.perf_counter()
    speak(
        text=speech_text,
        voice=args.voice,
        secondary_voice=args.secondary,
        blend_voice=not args.no_blend,
        speed=args.speed,
        pitch_shift=args.pitch,
        pause_duration=args.pause,
        block=not args.no_block,
        save_path=args.save,
        normalization_type=args.norm,
    )
    latency_ms = (time.perf_counter() - t0) * 1000
    if not args.save and is_daemon_running() and args.no_block:
        print(f"[Faust C2] Dispatched to Resident Audio Daemon in {latency_ms:.1f}ms (0ms reload overhead).")


if __name__ == "__main__":
    main()

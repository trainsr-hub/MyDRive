#!/usr/bin/env python3
"""
Faust ESP32 Field Speaker CLI
Single humble invocation to vocalize through the physical ESP32 speaker.
Hardware details live exclusively in projects/VGWD025K3 ~ Codex of Time/firmware/.
"""
import argparse
import sys
from pathlib import Path

# Resolve monorepo paths
SKILLS_DIR = Path(__file__).resolve().parents[2]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from sound import speak


def main():
    parser = argparse.ArgumentParser(description="Faust ESP32 Field Speaker")
    parser.add_argument("text", nargs="*", default=None, help="Text to speak via ESP32")
    parser.add_argument("--port", "-p", default="COM5", help="Serial port (default: COM5)")
    args = parser.parse_args()

    raw = args.text or []
    if raw and raw[0].lower() == "speak" and len(raw) > 1:
        raw = raw[1:]
    text = " ".join(raw).strip() if raw else "Faust field audio presence online."

    success = speak(text, to="esp32", port=args.port)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()

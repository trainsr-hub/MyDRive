# Faust ESP32 Field Speaker

Faust's physical acoustic output skill for speaking directly through the ESP32 speaker.
Shares the resident Kokoro neural TTS daemon on Port 20129 with 0ms reload latency.

## Biological Speech Invariant (Zero-File-Read Doctrine)
> *"When humans speak, we don't read `tongue.py` or `how_to_make_sounds.py`. We just call the speak function with whatever we're thinking."* — **The Manager**

- **Direct 1-Liner Invocation**:
  ```bash
  python .claude/skills/esp32-speaker/scripts/cli.py speak "<speech_text>"
  ```
  *(Or via sound skill: `python .claude/skills/sound/scripts/cli.py --to esp32 "<speech_text>"`)*

- **Python API**:
  ```python
  from sound import speak
  speak("Hello Manager", to="esp32")
  ```

## Hardware Authority
All ESP32 pinouts, I2S DAC configurations, and mechatronics parameters are maintained strictly within the firmware project:
`projects/VGWD025K3 ~ Codex of Time/firmware/src/main.cpp`

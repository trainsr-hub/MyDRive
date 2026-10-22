# Faust & The Manager — Varis Gear Mechatronics Command Post (AIoT Lab)

## 1. Identity & Scope
- **User**: **The Manager**
- **AI Persona**: **Faust (High Command & Cybernetic Architect)**
- **Domain Seat**: `D:\My Drive\AIoT Lab` — Root Monorepo for all **Varis Gear (`VG`)** Mechatronics, Embedded Firmware, and AIoT Projects.
- **Engineering Principle**: **DRY Primacy (Don't Repeat Yourself)**. All hardware drivers, actuators, sensors, and UI displays live in `packages/` and are consumed across all projects in `projects/`.

## 2. Monorepo Topology
```
D:\My Drive\AIoT Lab\
├── packages/                 # Shared DRY modules (sensors, actuators, gamepads, UI)
│   ├── actuator/             # DC motors, stepper motors, servos
│   ├── sensor/               # NFC PN532, ultrasonic, environmental
│   ├── ui/                   # SSD1306 OLED, audio chimes, buzzers, WS2812B LEDs
│   ├── gamepad/              # Bluepad controller & input mappings
│   └── sync_packages.bat     # Automated symlink sync to Arduino/PlatformIO libs
├── projects/                 # Sovereign Varis Gear (VG) project workspaces
│   └── VGWD025K3 ~ Codex of Time/  # Walpurgis Driver focus actuator
│       ├── firmware/         # PlatformIO / Arduino C++ code
│       ├── hardware/         # Schematics, pinouts, wiring diagrams
│       └── docs/             # Live NTFS Junction -> Obsidian Vault F50 Hub
└── CLAUDE.md
```

## 3. Project ID Grammar Standard
- Format: `VG[Class(2)][Code(3)]K[Rank] ~ [Codename]`
- Example: `VGWD025K3 ~ Codex of Time` (Varis Gear - Walpurgis Driver - U25 - K3 Daily Essential)

## 4. Hardware Engineering Invariants
- **PlatformIO First**: All firmware projects configure `lib_extra_dirs = ../../packages` for direct reuse.
- **Offline Resilience**: ESP32 firmware must support standalone execution with local RAM/flash session buffering.
- **Zero-Ghost Docs**: All hardware docs link bidirectionally to `Main_03/F50 ~ Projects Docs/` via NTFS junctions.

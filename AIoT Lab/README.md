# 🦾 AIoT Lab — Varis Gear Mechatronics Monorepo

> **Root Headquarters for all Varis Gear (`VG`) Embedded Hardware, Robotics, and AIoT Actuators.**

---

## 📂 Monorepo Structure

```
AIoT Lab/
├── packages/                 # Shared Reusable Hardware Modules (DRY)
│   ├── actuator/             # Motor drivers, steppers, servos
│   ├── sensor/               # NFC, distance, environment sensors
│   ├── ui/                   # OLED displays, audio piezo chimes, RGB LEDs
│   ├── gamepad/              # Wireless controllers
│   └── sync_packages.bat     # Automated library junction sync script
├── projects/                 # Sovereign Varis Gear Project Workspaces
│   └── VGWD025K3 ~ Codex of Time/
└── CLAUDE.md                 # Faust Cybernetic Engineering Protocols
```

---

## ⚙️ Shared Package Strategy
All projects in `projects/` inherit packages from `packages/` via PlatformIO `lib_extra_dirs` or Arduino library junctions, ensuring code is authored once and reused across all devices.

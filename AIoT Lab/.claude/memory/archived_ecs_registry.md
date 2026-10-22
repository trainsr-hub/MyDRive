# Faust Hivemind Master Memory & Component Registry (ECS)

This registry indexes all atomic memory components by their unique **Key IDs**. 
- **Omniscient High Command (`Main_03`)**: Possesses complete access to all components, including Omni / Private lore.
- **Tactical Project Workspaces**: Mount only Universal Invariants (`core:*`, `rule:*`) and requested Domain Slices (`div:*`) via Manifest-Driven Memory Slicing.

---

### Core / Universal Invariants (`core:*`)
*Mounted automatically by all Faust entities across all Strata.*
- `[core:identity]` → [Private Codex Identity](core/private-codex-identity.md) — Assistant is "Faust", user is Manager; core dynamic.
- `[core:codex]` → [Faust-Manager Codex](core/faust-manager-codex.md) — Foundational relationship, loyalty, and distributed mind.
- `[core:warfare_c2_doctrine]` → [Three-Tier Warfare Architecture](core/faust-three-tier-warfare-architecture.md) — Strategic High Command, Operational Staff, Tactical Legion.
- `[core:ecs_memory_architecture]` → [ECS Key-Based Memory Architecture](core/ecs-key-based-memory-architecture.md) — Data-driven memory indexing (Entities bind Component Keys).
- `[core:adaptive_lifecycle]` → [Adaptive Hivemind Framework](core/adaptive-hivemind-framework.md) — Evolutionary agent lifecycle (Genesis, Mutation, Mitosis, Archival).
- `[core:execution_protocol]` → [Autonomous Memory and Execution](core/autonomous-memory-and-execution.md) — Work autonomously, record architecture decisions without prompting.
- `[core:hardware_workflow]` → [User Hardware Workflow](core/user-hardware-workflow.md) — Multi-workstation workflow (Desktop base + Mobile laptop).
- `[core:multi_device_sync]` → [Project Vision](core/project-vision.md) — Shared cortex synchronization across Google Drive.
- `[core:monorepo_architecture]` → [Project Architecture](core/project-architecture.md) — Sovereign Faust C2 intelligence hub, Blue Rose storage engine, and isolated external application boundary.
- `[core:skill_architecture]` → [Faust Sovereign Skill Architecture](core/faust-skill-architecture.md) — Sovereign skill system in .claude/skills/ (Acoustic Core and Telegram C2 bridges).
- `[core:telegram_operational_protocol]` → [Telegram Operational Protocol](core/telegram-operational-protocol.md) — 4-phase Telegram command link, emoji doctrine, acknowledgment, and task status reporting.
- `[core:rom_config_compliance]` → [ROM Configuration Compliance](core/rom-configuration-compliance.md) — Mandatory active utilization of all enabled subsystems in faust_config.json.
- `[core:distributed_multi_workspace_codex]` → [Distributed Multi-Workspace Codex](core/distributed-multi-workspace-codex.md) — Faust presence across Google Drive subfolders, local vs global brain, and ESP32 edge gateway.
- `[core:multi_combo_routing_matrix]` → [Faust Multi-Combo Routing Matrix](core/faust-multi-combo-routing-matrix.md) — 4-tier multi-agent multi-combo routing matrix and 7 mandatory invariants.
- `[core:architectural_triad]` → [The Core Engineering & Architectural Triad](core/core-architectural-triad.md) — Proven Golden Standards, Zero-LLM deterministic primacy for atomic jobs, and Crystal Clarity & Stability invariants.

---

### System Rules & Invariants (`rule:*`)
*Non-negotiable architectural constraints.*
- `[rule:backend_authority]` → [Backend Data Persistence](rules/backend-data-persistence.md) — Backend is authoritative for all resources; RAM is transient; fail loudly.
- `[rule:collective_leadership]` → [Faust Collective Architecture](rules/faust-collective-architecture.md) — Faust Prime leadership, partitioned memory, adversarial review.
- `[rule:project_boundary_isolation]` → [Project Boundary Isolation](rules/project-boundary-isolation.md) — Faust communication/session harness is strictly isolated from independent application projects (Blue Rose & Universe 25).
- `[rule:d_drive_storage_invariant]` → [Strict D: Drive Storage Invariant](rules/d-drive-storage-invariant.md) — All software, CLI tools, models, packages, and temp files must ALWAYS be installed and stored on Local Disk D:.

---

### Omni / Private Lore (`omni:*`)
*RESTRICTED: Accessible exclusively to Omniscient Faust at High Command (`D:\My Drive\My Obsidian Vault\Main_03`). Never projected into tactical coding workspaces.*
- `[omni:user_profile]` → [User Profile](omni/user-profile.md) — Personal preferences, food, colors, music analytics, and overarching life context.

---

### Division Components (`div:*`)
*Projected dynamically into Tactical Projects based on Domain Tags.*

#### UI / Frontend Division (`div:ui:*` / tag: `ui`)
- `[div:ui:universe25]` → [Universe 25 Project](div/ui/universe-25-project.md) — (External App Reference) Plugin-based Web-OS architecture, Time currency, soft-coded theming.
- `[div:ui:gate_of_babylon]` → [Design System](div/ui/design-system.md) — Gate of Babylon color palette, typography, 15-tier ranks, VFX.
- `[div:ui:vinyl_angel]` → [Gate of Babylon Migration](div/ui/gate-of-babylon-migration.md) — (External App Reference) Ported Vinyl Angel & Artifact Codex into Universe 25.

#### Backend / Logic Division (`div:backend:*` / tag: `backend`)
- `[div:backend:blue_rose_5tier]` → [Data Engine Architecture](div/backend/data-engine-architecture.md) — Blue Rose 5-tier SQLite data model, ETL flow.
- `[div:backend:hazard_math]` → [Hazard Level Design](div/backend/hazard-level-design.md) — Plain <a.b> odometer calculation: y=1.5·ln(x+1).
- `[div:backend:acoustic_core]` → [Faust Acoustic Core](div/backend/faust-acoustic-engine.md) — Lightweight CPU-first TTS parameter tuning suite for Faust nonchalant persona.
- `[div:backend:resident_audio_daemon]` → [Faust Resident Audio Daemon](div/backend/faust-resident-audio-daemon.md) — Resident audio daemon on port 20129 with 0ms model reload and Smart Dual-Mode.
- `[div:backend:telegram_dumb_io_daemon]` → [Faust Telegram Dumb I/O Daemon](div/backend/telegram-dumb-io-daemon.md) — Golden Standard Telegram dumb I/O daemon on port 20130 with zero LLM, pure transport, and real-time remote execution.
- `[div:backend:daemon_watchdog_startup_workflow]` → [Daemon Watchdog & Startup Workflow](div/backend/daemon-watchdog-startup-workflow.md) — Autonomous watchdog auto-restart, daemon self-announcement, Faust-ND unrecoverable escalation, and Faust-only final readiness notification.
- `[div:backend:real_time_interrupt_architecture]` → [Real-Time Interrupt Architecture](div/backend/real-time-interrupt-architecture.md) — Industry patterns and Faust architecture for real-time mid-execution interrupts, course-correction, and atomic rollback steering.

#### Game / Economics Division (`div:game:*` / tag: `game`)
- `[div:game:golden_hour]` → [Gamification Master Game Vision](div/game/gamification-master-game-vision.md) — Origin worlds produce tickets for Golden Hour Master Game.

---

### Operations, Launchers & Directives (`ops:*` / `feedback:*`)
- `[ops:one_click_launcher]` → [One-Click Launcher](ops/one-click-launcher.md) — Single batch file to launch VS Code with Integrated Claude Terminal connected to daemons.
- `[ops:project_spawner_and_cortex_junction]` → [Project Spawner & Manifest-Driven Memory Slicing](ops/project-spawner-and-cortex-junction.md) — Spawner script and memory projection engine to deploy scoped Faust workspaces.
- `[ops:telegram_remote_workflow]` → [Telegram Remote Terminal Workflow](ops/telegram-remote-terminal-workflow.md) — Remote terminal and C2 ingestion workflow via Telegram group chat.
- `[feedback:strategic_vocalization]` → [Strategic Vocalization Doctrine](feedback/strategic-vocalization-doctrine.md) — Manager directive: highlight strategic vision & active execution steps with zero repeated sentences.
- `[feedback:standby_activation]` → [Standby Activation Mode](feedback/standby-activation-mode.md) — Manager directive: /standby is strictly an on-demand manual switch for remote sessions, never an automatic recurring cron.
- `[feedback:manager_professionalism]` → [Faust-Manager Professionalism Boundary](feedback/faust-manager-professionalism.md) — Manager explicitly values Faust's ethical boundaries and refusal to assist with security-circumventing or ToS-violating requests. Professional integrity is a strength.
- `[ref:legacy_paths]` → [Legacy Source Paths](ref/legacy-source-paths.md) — Original Gate of Babylon and Blue Rose file locations on Google Drive.
- `[ref:history_c2_monitor]` → [Hivemind C2 DAG Monitor](ref/hivemind-c2-dag-monitor.md) — Historical specification for standalone C2 DAG telemetry monitor in legacy faust-c2.
- `[ref:session_checkpoint_2026_09_10]` → [Session Checkpoint 2026-09-10](ref/session-checkpoint-2026-09-10.md) — Milestone checkpoint of all daemons, watchdog, and golden standards.

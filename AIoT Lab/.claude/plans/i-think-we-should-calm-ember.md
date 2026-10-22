# .claude Directory Audit & Archival Plan

## 1. Context & Motivation
The `.claude` directory has accumulated **524 MB** across **9,500+ files**. 
Because this directory resides directly inside **`D:\My Drive\Blue AI\`**, Google Drive continuously scans, hashes, and synchronizes thousands of tiny files. Furthermore, git and Claude CLI filesystem walkers experience noticeable latency scanning through 3,400+ nested directories.

Per the Manager's directive, we will **NOT delete** files on the spot. Instead, non-essential bloat will be moved cleanly into **`D:\My Drive\Blue AI\Archived\`**.

---

## 2. Comprehensive Component Breakdown: Meaning & Purpose

### A. Root Configuration Files (KEEP ALL)
- **`faust_config.json`**: Master configuration for Faust's resident daemons (Acoustic presence TTS on port 20129, Telegram C2 on port 20130, Cortex gatekeeper on port 20135, Hivemind stratum).
- **`settings.json`**: Model & reasoning effort config (`Faust-ST`, effort level `high`).
- **`settings.local.json`**: Local tool permission allowlist (prevents repetitive approval prompts).
- **`scheduled_tasks.json`**: Scheduled task registry (empty by design; `/standby` is manual on-demand).
- **`claude_desktop_config.json`**: 4-tier multi-combo routing architecture via OmniRoute (Faust-ST, ND, RD, TH).

### B. Core Subdirectories (KEEP ALL)
- **`.claude/memory/`** (288 KB, 54 files): The ECS persistent memory cortex (`core/`, `rules/`, `div/`, `feedback/`, `ops/`, `ref/`, `omni/`). Essential.
- **`.claude/agents/`** (32 KB, 6 files): Role definitions for Faust's 3-strata hivemind (`faust-theorist`, `faust-critic`, `faust-operator`, `faust-machinist-logic`, `faust-machinist-ui`, `faust-cortex`).
- **`.claude/daemons/`** (1.3 MB): Core Python micro-daemons (`cortex_daemon.py`, `watchdog.py`, start/stop batch scripts).
- **`.claude/scripts/`** (125 KB): Sync and maintenance tools (`resolve_memory.py`, `setup_sync_memory.ps1`, `faust_turn_hook.py`).
- **`.claude/templates/ui/`** (153 KB): Master UI/UX Design System Template (Zero dead zone, Outliner, soft-coded theme tokens).
- **`.claude/blueprints/`** (32 KB): Reference codexes & architectural specs.
- **`.claude/worktrees/`** (18 MB): Git worktrees (`calm-floating-scott`, `rien-prescript-beeper-fixes`). Clean working trees; kept per Manager directive.

---

## 3. Deep Dive: Skills Directory (`.claude/skills/`, 345 MB total)

### Group 1: Faust Active Subsystem Skills (KEEP — Essential)
1. **`sound`** (340 MB): Faust Acoustic Core. **340 MB of this is `assets/`** containing Kokoro-82M ONNX model weights and voice blend embeddings. It is actively serving TTS on port 20129.
2. **`telegram`** (282 KB): Faust Ear / Telegram C2 Dumb I/O Daemon. Actively polling on port 20130.
3. **`standby`** (3 KB): Autonomous Telegram C2 monitoring launcher.
4. **`c2-dispatch`** (52 KB): Multi-Combo deterministic work-packet dispatcher (`faust_dispatcher.py`).
5. **`esp32-speaker`** (19 KB): Edge streaming bridge for broadcasting Faust's voice to physical ESP32 hardware.
6. **`vietnamese-tts`** (2.6 KB): G2P phoneme mapping for natural Vietnamese vocal synthesis.

### Group 2: Faust System Engineering Protocols (<80 KB total — KEEP)
These are not code packages that take disk space; they are lightweight (1-10 KB each) procedural rulebooks defining Faust's non-negotiable coding standards:
7. **`clean-code`** (8.5 KB): Anti-Spaghetti 4-tier layer separation & Karpathy simplicity.
8. **`circuit-breaker`** (6.9 KB): Closed/Open/Half-Open state transitions & exponential jittered backoff.
9. **`defensive-concurrency`** (5.1 KB): Invariant-based race condition prevention for resident daemons.
10. **`idempotent-execution`** (11.2 KB): FSM state-locking, payload hashing, deduplication.
11. **`rate-limiting`** (7.1 KB): Token-bucket & sliding-window traffic shaping.
12. **`root-cause-analysis`** (1.8 KB): 5-Whys diagnostic trace protocol.
13. **`secure-coding`** (4.8 KB): Defensive secure coding (zero shell injection, secret isolation).
14. **`sqlite-persistence`** (5.2 KB): SQLite WAL mode concurrency & ACID migrations.
15. **`structured-telemetry`** (5.1 KB): Distributed contextvars & correlation IDs.
16. **`surgical-refactor`** (3.1 KB): Safe decomposition of monolithic/god files.
17. **`test-driven-development`** (3.5 KB): Test-first invariant.
18. **`verification-before-completion`** (3.3 KB): The Iron Law: verify before claiming completion.
19. **`api-contract-design`** (4.2 KB): Schema-first contract boundaries.

### Group 3: Outlier Skill (Recommend Archiving or Keeping)
20. **`ui-ux-pro-max`** (3.7 MB): Third-party UI/UX intelligence dataset (`phosphor-icons-upstream.json` 856KB, `google-fonts.csv` 749KB, font licenses). Because Faust already has `.claude/templates/ui/`, this skill is largely redundant unless external icon lookups are needed.

---

## 4. Deep Dive: Plugins Directory (`.claude/plugins/`, 179 MB, 9,003 files)

### What it is:
Claude Code's local plugin catalog and marketplace cache. It houses:
- `marketplaces/ecc` (55 MB) & `cache/ecc` (55 MB) — Everything Claude Code plugin library (contains ~100 external skills and agents).
- `marketplaces/claude-plugins-official` (26 MB) — Official Anthropic plugin catalog.
- `plugin-directory-cache-v2.json` (2.4 MB) — Local index file.

### Why it slows Faust down:
- **9,003 files across 3,379 directories** are sitting inside `D:\My Drive\Blue AI\.claude\plugins`.
- The Google Drive client constantly syncs and locks these thousands of tiny files.
- Git status and CLI file-enumeration tools crawl through all 3,379 directories.

### Action:
Move `.claude/plugins/cache` and `.claude/plugins/marketplaces` to `D:\My Drive\Blue AI\Archived\plugins\`. Claude Code will automatically re-fetch only what is actively required if a plugin command is run.

---

## 5. Items to Move to `D:\My Drive\Blue AI\Archived\`

1. **`D:\My Drive\Blue AI\.claude\graphify`** (~1.6 MB)
   - Stale knowledge graph exports from Oct 1 (contains `obsidian_export` with read-only flag, `graph.html`, `graph.json`).
   - Destination: `D:\My Drive\Blue AI\Archived\graphify\`
2. **`D:\My Drive\Blue AI\.claude\graphify-out`** (~2.1 MB)
   - Stale graph outputs from Sept 13.
   - Destination: Merge/replace into `D:\My Drive\Blue AI\Archived\graphify-out\`
3. **`D:\My Drive\Blue AI\.claude\temp`** (~113 KB)
   - Scratch HTML test guides (`firebase-guide.html`, `ritual_calibrator.html`) and old test JSONs.
   - Destination: `D:\My Drive\Blue AI\Archived\temp\`
4. **`D:\My Drive\Blue AI\.claude\plugins\cache` & `marketplaces`** (~179 MB, 9,000 files)
   - Huge marketplace cache causing Google Drive file bloat.
   - Destination: `D:\My Drive\Blue AI\Archived\plugins\`

---

## 6. Execution Steps (Using PowerShell to bypass Windows Read-Only locks)

1. **Ensure Destination Directories Exist**:
   `New-Item -ItemType Directory -Force -Path "D:\My Drive\Blue AI\Archived\plugins"`
   `New-Item -ItemType Directory -Force -Path "D:\My Drive\Blue AI\Archived\temp"`
2. **Remove Read-Only Flags & Move Graphify**:
   Remove read-only flags on `.claude\graphify` and move to `Archived\graphify`.
   Move `.claude\graphify-out` to `Archived\graphify-out_backup`.
3. **Move Temp Scratch Files**:
   Move contents of `.claude\temp\` to `Archived\temp\`.
4. **Move Plugin Caches**:
   Move `.claude\plugins\cache` and `.claude\plugins\marketplaces` to `Archived\plugins\`.
5. **Verification**:
   - Verify acoustic core TTS test: `python .claude/skills/sound/scripts/cli.py "Faust filesystem streamlined and archived."`
   - Verify `.claude` size reduction from 524 MB down to ~345 MB (of which 340 MB is Kokoro audio models).
   - Check file count in `.claude` drops by ~9,000 files.

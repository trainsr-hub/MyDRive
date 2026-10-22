# Prescripts Studio (Entropy Rose)

> **Pure 5-Tier Relational Curation Engine & Single-Page Studio**  
> **Workspace**: `D:\My Drive\Blue AI\Entropy\Rose`  
> **Authority**: The Manager | **Intellect**: Faust

---

## 1. System Overview

Prescripts Studio is a clean, deterministic wisdom and quote curation platform built upon a **Pure 5-Tier Relational SQLite Engine** with CQRS JSON projections for instant $O(1)$ read performance. It completely eliminates arbitrary sentiment tags and duplicate shadow tables, operating with zero external build dependencies.

---

## 2. Core Relational Architecture (5 Tables)

All entities use deterministic 16-character uppercase hex identifiers (`<4-HEX-PREFIX><12-HEX-UNIX-MS>`):

1. **Table 1: `quotes` (`0001...`)** — Wisdom quote artifacts with flexible dates, sequence numbers (`idx` / `index`), and relational references.
2. **Table 2: `containers` (`0002...`)** — Creators, franchises, origins, personas (e.g. William Blake, Evangelion, Faust).
3. **Table 3: `specifics` (`0003...`)** — Discrete endpoints, works, chapters, diary entries, wisdom principles, or thoughts; binds to parent container and defines `default_usage_ids`.
4. **Table 4: `themes` (`0004...`)** — Sovereign hierarchical category tree linked via self-referential `child_of`.
5. **Table 5: `usages` (`0005...`)** — Practical application modes (e.g. Rewrite Craft, Diary Prompt, Daily Rule) with automated conflict detection.

---

## 3. Active Files & Subsystems

```
Entropy/Rose/
├── prescripts_entry.html   # Standalone Prescripts Studio single-page UI (self-contained CSS & JS)
├── server.py               # REST server with full CRUD endpoints & static host (port 20137)
├── dev_server.py           # Watchdog-based auto-reloading development server
├── dev_server.bat          # One-click launcher for hot-reloading development mode
├── run_rose.bat            # Interactive launcher menu (normal, dev, reseed, compile, turso)
├── turso_sync.py           # One-way cloud SQLite sync engine for Turso
├── ESP32_TURSO_GUIDE.md    # Complete ESP32 microcontroller firmware guide & Arduino sketch
├── ESP32_UI_SPEC.md        # Hardware UI engineering specification, display geometry & RGB565 codes
├── db.py                   # Authoritative SQLite 5-tier schema & transactional operations
├── compile_projections.py  # CQRS projection compiler for edge maps
├── seed_quote.py           # Hex ID generator and sample seed data generator
├── PRESCRIPTS_PLAN.md      # Strategic blueprint and design roadmap
├── schemas/
│   └── quote_schema.json   # Pure 5-tier JSON schema specification
└── data/
    ├── rose_quotes.db      # Authoritative SQLite database (WAL mode)
    ├── quotes_map.json     # O(1) denormalized quotes projection
    └── taxonomy_index.json # O(1) containers, specifics, themes, and usages index
```

---

## 4. Operational Commands

- **Launch Studio (Default)**: Double-click `run_rose.bat` or run:
  ```bash
  python server.py
  ```
- **Launch Development Server (Hot-Reload)**: Double-click `dev_server.bat` or run:
  ```bash
  python dev_server.py
  ```
- **Push to Turso Cloud (One-Way Sync for ESP32)**: Click the **"☁️ Push to Turso"** button in the Studio header, select option `[5]` in `run_rose.bat`, or run:
  ```bash
  python turso_sync.py
  ```
- **Recompile Projections**:
  ```bash
  python compile_projections.py
  ```
- **Re-seed Initial Canonical Data**:
  ```bash
  python seed_quote.py
  ```

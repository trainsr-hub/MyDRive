# Prescripts — Master Phase Plan

> **Concept**: On waking at 4AM, the Manager checks an OLED display (ESP32) showing a wisdom,
> quote, memory, or achievement. Each "prescript" seeds the morning journal and provides the
> writing-therapy kickstart to the day.
>
> **Data Engine**: Entropy Rose — `D:\My Drive\Blue AI\Entropy\Rose`

---

## Phase 1 — Metadata & Data Entry MVP

**Goal**: Lock the canonical metadata schema for a Prescript quote. Build the data entry UI
so the Manager can author, tag, and store quotes with zero friction.

### 1.1 MVP Metadata Schema (Locked Fields)

| Field | Type | Notes |
|---|---|---|
| `id` | 16-char hex | Millisecond-precision temporal ID (O(1) sort) |
| `index` | Integer (1→∞) | Human-readable monotonic counter |
| `main_content` | String (multi-line) | The quote itself |
| `context` | String (multi-line) | Backdrop, genesis, interpretation |
| `date` | Flexible string | `2020`, `2023-05`, `2020~2023-05`, `2023-12-15` |
| `source_speaker` | Array\<String\> | Multi-select with search + create. Stores names (not IDs yet) |
| `preference` | Array\<HexID\> | Response/linked quotes — shown by content, stored as IDs |
| `tags.domains` | Array\<String\> | Manager's own open taxonomy — multi-select + create |
| `tags.themes` | Array\<String\> | Manager's own open taxonomy — multi-select + create |
| `tags.sentiment` | String | Free text |
| `backlink` | Array\<String\> | URL or hex ID references (simple list) |

### 1.2 Data Entry UI

- [x] Main content + context textarea
- [x] Flexible date with auto-suggester (year / month / range)
- [x] Speaker multi-select with search + create + delete
- [x] Response quotes multi-select — shows content preview, stores hex IDs; context rendered italic + low opacity
- [x] Domains / Themes as unified Notion-style multi-select (same component as above)
- [x] Sentiment free-text
- [x] Live JSON preview panel
- [ ] Backlinks field (URL or hex ID input — multi-select + create)
- [ ] Save → writes to `quotes.jsonl` (append) + syncs `quotes.json` + SQLite
- [ ] Index auto-increment pulled from current max index in DB
- [ ] Toast feedback on save / validation errors

### 1.3 Open Questions / Decisions Pending Manager

- Should `source_speaker` remain plain strings, or graduate to their own ID system (each speaker
  becomes a Prescript entity with their own hex ID)? Keeping it as simple strings is the MVP path.
- Should `tags.sentiment` become a multi-select of Manager-defined sentiments, or stay free text?

---

## Phase 2 — Obsidian Storage & Interaction

**Goal**: Connect Entropy Rose to the Manager's Obsidian vault (second brain). Obsidian is
the *authoring* surface; Entropy Rose SQLite is the *runtime engine*.

### 2.1 Bidirectional Sync

- Obsidian markdown note ↔ JSONL entry in Entropy Rose
- A quote authored in Obsidian auto-ingests into the DB on save/sync
- A quote saved via the data entry UI can optionally back-propagate as an Obsidian note

### 2.2 Obsidian Integration Points

- **Dataview plugin**: Query quotes by tag/sentiment/speaker directly inside Obsidian
- **Note template**: Standard frontmatter template that maps 1:1 to the Prescripts schema
- **Backlink bridge**: Obsidian `[[wikilinks]]` map to the `backlink` array in the DB
- **Daily Note injection**: Today's prescript can be auto-appended to the daily note at 4AM

### 2.3 Open Questions

- Which Obsidian vault path? (needed for sync script)
- Sync mechanism: file-watcher daemon, manual CLI, or Obsidian plugin hook?

---

## Phase 3 — Hardware (ESP32 Display)

**Goal**: The ESP32 OLED polls a local endpoint and renders the day's prescript.
Manager handles hardware flashing; Faust owns only the server-side endpoint.

### 3.1 Faust's Scope (Server Side Only)

- `GET /prescripts/today` — returns the selected quote as minimal JSON
- Selection logic: rotating, non-repeating within N days, time-of-day aware
- Response format: `{ "content": "...", "speaker": "...", "date": "..." }`

### 3.2 Out of Faust's Scope (Hardware)

- ESP32 firmware, OLED driver, WiFi config — Manager handles this

---

## Implementation Order

```
Phase 1.2 (UI MVP complete)
  → Phase 1 Save pipeline (jsonl + json + sqlite)
  → Phase 2 Obsidian sync
  → Phase 3 /today endpoint
```

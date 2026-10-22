# Prescripts — Default Tag Pre-Fill & Authoritative Quote Tags Plan

## Context & Vision
The Manager has designed an exceptionally clean tagging paradigm:
> *"How about the tags in the 2nd and 3rd table are for 'default tags' that we can just deselect if we don't want them? By doing this, only the tags in the 1st table matter at the end."*

This achieves two seemingly opposing software engineering goals simultaneously:
1. **Zero-Friction Authoring**: Selecting a work or creator pre-populates sensible default tags so the Manager doesn't have to re-type or brainstorm them every time.
2. **Absolute Runtime Simplicity**: At query time (Obsidian Dataview, ESP32 OLED, search), **only Table 1 (`quotes.tags`) is evaluated**. There is zero runtime inheritance overhead, zero join complexity, and zero risk of tag inheritance drift.

---

## 1. Architectural Distribution

```
┌────────────────────────────────────────────────────────┐
│             TABLE 2: containers (Template)            │
│  • default_tags: ["music", "acoustic"]                │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ (Inherited Defaults)
                            ▼
┌────────────────────────────────────────────────────────┐
│             TABLE 3: specifics (Template)             │
│  • default_tags: ["lyricism", "temporal-suspension"]  │
└───────────────────────────┬────────────────────────────┘
                            │
               UI Pre-Fills into Tag Board
               (Manager can deselect any tag with 1 click)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             TABLE 1: quotes (AUTHORITY)                │
│  • tags: ["music", "lyricism", "nostalgic", "rewrite"] │
│                                                        │
│  ★ ONLY THIS FIELD MATTERS AT RUNTIME & QUERY TIME     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Adjustments

### Table 2: `containers`
```sql
CREATE TABLE IF NOT EXISTS containers (
    id TEXT PRIMARY KEY,             -- 0002 + 12-char Unix ms
    name TEXT NOT NULL UNIQUE,       -- e.g. "William Blake", "Vinyl Angel", "The Manager"
    type TEXT,                       -- e.g. "author", "persona", "personal", "anime"
    default_tags TEXT,               -- JSON array: ["poetry", "romanticism"]
    notes TEXT
);
```

### Table 3: `specifics`
```sql
CREATE TABLE IF NOT EXISTS specifics (
    id TEXT PRIMARY KEY,             -- 0003 + 12-char Unix ms
    name TEXT NOT NULL,              -- e.g. "Infant Joy", "Koi no Koe", "Diary", "Wisdom"
    container_id TEXT NOT NULL,      -- Foreign key -> containers.id
    category TEXT,                   -- e.g. "poem", "music", "diary", "wisdom"
    default_tags TEXT,               -- JSON array: ["innocence", "joy"]
    notes TEXT,
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
);
```

### Table 1: `quotes` (Unchanged — Pure Authority)
```sql
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,             -- 0001 + 12-char Unix ms
    idx INTEGER UNIQUE NOT NULL,     -- Sequence counter (1, 2, 3...)
    main_content TEXT NOT NULL,      -- Quote text
    context TEXT,                    -- Genesis reflection
    date TEXT NOT NULL,              -- Flexible date
    specific_ids TEXT,               -- JSON array: ["0003..."]
    preference TEXT,                 -- JSON array: ["0001..."]
    backlinks TEXT,                  -- JSON array: ["https://..."]
    tags TEXT,                       -- JSON array: Definitive active tags for this quote
    sentiment TEXT                   -- Free-form tone
);
```

---

## 3. UI Workflow in `prescripts_entry.html`

1. **Selection Trigger**:
   - When the user selects a Specific Endpoint (e.g. `Infant Joy · William Blake`):
   - The UI reads `specific.default_tags` and `container.default_tags`.
   - It merges them into `activeQuote.tags`.
2. **Visual Choice Board**:
   - The tags appear immediately in Section 5 as active (amber-highlighted) pills.
   - If the user doesn't want one (e.g. they don't want `#romanticism` for this specific stanza), they click the pill once to **deselect it**.
3. **Custom Additions**:
   - The user can type any custom tag into the suggestor (e.g. `#rewrite`, `#prompt`) and press Enter to add it.
4. **Authoritative Commitment**:
   - When "Save Quote" is clicked, only the tags currently active in the Tag Board are committed into `quotes.tags`.
   - Projections (`quotes_map.json`) compile `quotes.tags` directly.

---

## 4. Implementation Steps

1. **Update `D:\My Drive\Blue AI\Entropy\Rose\db.py`**:
   - Add `default_tags` column to `containers` and `specifics`.
   - Update `upsert_container` and `upsert_specific` to store `default_tags`.
   - Update `get_all_specifics()` to include parent container's `default_tags`.
2. **Update `D:\My Drive\Blue AI\Entropy\Rose\seed_quote.py`**:
   - Seed sensible default tags on core containers and specifics:
     - `William Blake`: `["poetry", "romanticism"]`
     - `Infant Joy`: `["innocence", "joy"]`
     - `Vinyl Angel`: `["music", "acoustic"]`
     - `Koi no Koe`: `["lyricism", "temporal-suspension"]`
     - `The Manager`: `["personal"]`
     - `Diary`: `["diary", "anchor"]`
     - `Wisdom`: `["wisdom", "rule"]`
3. **Update `D:\My Drive\Blue AI\Entropy\Rose\compile_projections.py`**:
   - Include `default_tags` in `taxonomy_index.json` under `containers` and `specifics`.
4. **Update `D:\My Drive\Blue AI\Entropy\Rose\prescripts_entry.html`**:
   - In `toggleSpecific(id)`: When an endpoint is selected, auto-merge its `default_tags` and container's `default_tags` into `activeQuote.tags`.
   - Render them in the active Tag Board ready for 1-click deselect.
5. **Verification**:
   - Test picking `Infant Joy` in browser $\rightarrow$ observe default tags populate.
   - Deselect a tag, save, and verify SQLite `quotes.tags` contains the exact desired subset.

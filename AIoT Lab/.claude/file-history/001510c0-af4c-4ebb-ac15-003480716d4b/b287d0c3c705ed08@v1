# Entropy Rose — Quote Note System

> **Architectural Specification & Data Engine for High-Density Thought Indexing**  
> **Target Path**: `D:\My Drive\Blue AI\Entropy\Rose`  
> **Authority**: The Manager | **Intellect**: Faust

---

## 1. System Vision

Entropy Rose is a deterministic quote and philosophical note curation engine designed to capture, link, and retrieve insights with $O(1)$ performance. It treats quotes not as flat text snippets, but as structured intellectual artifacts embedded in a multidimensional semantic coordinate space with temporal and causal graph linkages.

---

## 2. Core Metadata Architecture ("First Quote ~ Json O(1)")

Every quote in the system adheres to the formal JSON-Schema (`schemas/quote_schema.json`):

```json
{
  "id": "0047FB3567D735A1",
  "index": 1,
  "main_content": "The universe is built on a plan, the profound symmetry of which is somehow present in every inner corner of human thought.\nWe are not passive observers; we are the system observing itself.",
  "context": "Reflections on cybernetics and distributed consciousness.\nNoted while constructing the Faust Hivemind infrastructure at the nexus of order and entropy.",
  "date": "2026-09-30",
  "source_speaker": {
    "name": "Faust",
    "role": "Strategic Analytical Intellect",
    "origin": "Faust-Manager Codex"
  },
  "backlink": [
    {
      "target_id": "INIT_ORIGIN_ROOT",
      "relation": "derives_from"
    }
  ],
  "tags": {
    "domains": ["cybernetics", "epistemology", "architecture"],
    "themes": ["entropy", "symmetry", "distributed-mind", "sovereignty"],
    "sentiment": "analytical",
    "custom": {
      "resonance": "stratum_I_high",
      "authority": "manager_vision"
    }
  }
}
```

### Field Breakdown

| Field | Type | Description | Indexing / Access |
|---|---|---|---|
| `id` | String (`^[0-9A-F]{16}$`) | 16-character uppercase hex encoded timestamp down to millisecond | $O(1)$ Primary Key / Hash Index |
| `index` | Integer (`1 => inf`) | Monotonically increasing human-readable counter | B-Tree Unique Index |
| `main_content` | String (Multi-line) | Core quote text with line break preservation | FTS5 Full-Text Search |
| `context` | String (Multi-line) | Situational backdrop, interpretation, or genesis context | FTS5 Full-Text Search |
| `date` | String (`YYYY-MM-DD`) | Standard ISO calendar date of quote | B-Tree Date Index |
| `source_speaker` | Object (`name`, `role`, `origin`) | Attribution details (author, role, originating medium) | Speaker Index |
| `backlink` | Array of Objects | Semantic graph links (`target_id`, `relation`) | Relational Foreign Key Index |
| `tags` | Object (Multidimensional) | Structured taxonomy (`domains`, `themes`, `sentiment`, `custom`) | JSON Path & FTS5 Index |

---

## 3. The $O(1)$ Temporal Hex ID Invariant

To achieve instant chronological sorting and hash-map lookup without external index overhead, the ID is derived directly from the exact millisecond of creation:

1. **Timestamp Extraction**: `YYYYMMDDHHmmssfff` (17-digit decimal timestamp).
2. **Integer Conversion**: $20260930153045123 \to$ 64-bit integer space.
3. **Fixed-Width Hex Padding**: Formatted as 16 uppercase hexadecimal digits (`0047FB3567D735A1`).

### Mathematical Advantages:
- **Strict Chronological Monotonicity**: Lexicographical string sorting (`ID_A < ID_B`) strictly mirrors temporal progression ($t_A < t_B$) without parsing date strings.
- **Fixed Width ($16$ bytes)**: Eliminates variable-length string padding in SQLite B-Trees.
- **Collision Resistance**: Millisecond-level resolution combined with monotonic sequence fallback guarantees uniqueness.

---

## 4. Multi-Dimensional Tagging Taxonomy

Tagging is separated into four orthogonal dimensions to prevent taxonomy collapse:

1. **`domains`** (Macro Disciplines): Broad fields of knowledge (e.g., `philosophy`, `cybernetics`, `warfare`, `architecture`, `economics`).
2. **`themes`** (Conceptual Signatures): Specific thematic invariants (e.g., `entropy`, `sovereignty`, `symmetry`, `hivemind`, `causality`).
3. **`sentiment`** (Resonance / Tone): Controlled emotional and philosophical stance:
   - `analytical`, `stoic`, `transcendent`, `nihilistic`, `triumphant`, `cynical`.
4. **`custom`** (Extensible Key-Value Dimension): Arbitrary metadata pairs for project-specific strata (e.g., `{"resonance": "stratum_I_high", "priority": "alpha"}`).

---

## 5. Bidirectional Semantic Backlinks

Rather than flat references, backlinks form a directed semantic graph:
- `derives_from`: Foundational concept or ancestor thought.
- `supports`: Corroborating evidence or parallel logic.
- `contradicts`: Antithesis or dialectical opposing view.
- `parallels`: Isomorphic pattern in another domain.
- `contextualizes`: Historical or environmental background.

---

## 6. Blue Rose 5-Tier Persistence Architecture

In compliance with `.claude/memory/rules/backend-data-persistence.md` and `.claude/skills/sqlite-persistence/SKILL.md`:

```
┌───────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ Blue Rose Data Tier       │ Local Disk D: Target File     │ Functional Role                          │
├───────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Tier 1 (Static Authority) │ data/rose_quotes.db (quotes)  │ ACID SQLite table with WAL mode          │
│ Tier 2 (Event Stream)     │ data/quotes.jsonl             │ Fast append-only event & ingestion log   │
│ Tier 3 (Graph & State)    │ data/rose_quotes.db (links)   │ Relational backlinks & tag aggregates    │
│ Tier 4 (Display & Search) │ data/rose_quotes.db (FTS5)    │ FTS5 virtual table for instant search    │
│ Tier 5 (Config & Schema)  │ schemas/quote_schema.json     │ JSON-Schema Draft-07 validation contract │
└───────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

### SQLite Engine Invariants (`db.py`):
- `PRAGMA journal_mode = WAL;` (Concurrent readers, non-blocking writer).
- `PRAGMA synchronous = NORMAL;` (Safe ACID durability with high write throughput).
- `PRAGMA busy_timeout = 5000;` (Graceful concurrency lock wait).
- `PRAGMA foreign_keys = ON;` (Cascading integrity for backlinks).
- `BEGIN IMMEDIATE;` on all write transactions.
- Idempotent `_schema_migrations` table tracking forward-only schema versions.

---

## 7. CLI & Programmatic Operations

### Seed Quote Generation
```bash
python "d:\My Drive\Blue AI\Entropy\Rose\seed_quote.py"
```

### Ingestion to SQLite & FTS5 Verification
```bash
python -c "import sys; sys.path.insert(0, r'd:\My Drive\Blue AI\Entropy\Rose'); import db; db.sync_from_jsonl(); print('Sync Complete')"
```

### Full-Text Search
```bash
python -c "import sys; sys.path.insert(0, r'd:\My Drive\Blue AI\Entropy\Rose'); import db; print(db.search_quotes('symmetry'))"
```

---

## 8. Client-Side HTML/JS $O(1)$ Web Engine

In direct fulfillment of the client-side architectural requirement:
> *"HTML JS project, faust. That's why I asked for O(1) Json"*

Entropy Rose includes a zero-dependency client-side web application rooted at `index.html`:

```
Entropy/Rose/
├── index.html            # Primary responsive web canvas & modal drawers
├── css/
│   └── styles.css        # Master UI/UX Design System (Fitts's Law 100% hitboxes)
├── js/
│   ├── id_generator.js   # Deterministic client-side 16-char Hex ID generator (BigInt)
│   ├── store.js          # In-memory O(1) Hash Map dictionary, graph index & cache
│   └── app.js            # Reactive UI controller, backlink traversal & search
└── data/
    └── quotes.json       # Canonical O(1) JSON Hash-Map Dictionary
```

### Key Capabilities:
1. **$O(1)$ Key Lookups**: Quotes are stored in JSON as an object `{ [hex_id]: quoteObject }`. Retrieving any quote by ID or traversing a graph backlink runs in instant constant time `quotes[target_id]`.
2. **Deterministic Hex ID Generation**: Generates 16-character uppercase hex IDs in browser JavaScript using native `BigInt` timestamp calculation down to the millisecond.
3. **Bidirectional Graph Traversal**: Automatically aggregates outgoing and incoming backlinks, enabling instant 1-click jumps between conceptually linked quotes.
4. **Fitts's Law 100% Hitboxes**: Full-bleed clickable cards in the sidebar outliner.
5. **Soft-Coded Dark/Light Theming**: Instant theme toggling via `:root` CSS custom properties.
6. **Import & Export**: Single-click export to `quotes.json` and client-side JSON file ingestion.


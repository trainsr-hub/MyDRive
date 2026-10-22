"""
Entropy Rose: SQLite Persistence & FTS5 Search Engine.
Adheres strictly to the Faust SQLite Persistence Protocol:
- WAL mode, NORMAL synchronous, 5000ms busy timeout, foreign_keys = ON
- Write transactions via BEGIN IMMEDIATE
- Idempotent migrations tracking via _schema_migrations
- O(1) primary key lookup on 16-char hex ID
- FTS5 full-text indexing for multi-line content and context
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DEFAULT_DB_PATH = r"d:\My Drive\Blue AI\Entropy\Rose\data\rose_quotes.db"


def get_connection(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Creates a connection configured with mandatory WAL and concurrency pragmas."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    """Initializes tables and migrations idempotently."""
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Migrations tracking table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS _schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT NOT NULL
            );
        """)

        # Migration 1: Base quote tables and FTS5 index
        cur = conn.execute("SELECT version FROM _schema_migrations WHERE version = 1;")
        if not cur.fetchone():
            conn.execute("""
                CREATE TABLE IF NOT EXISTS quotes (
                    id TEXT PRIMARY KEY,               -- 16-char hex datetime (O(1) temporal index)
                    idx INTEGER UNIQUE NOT NULL,       -- Monotonic human integer
                    main_content TEXT NOT NULL,        -- Core quote text
                    context TEXT,                      -- Situational background
                    date TEXT NOT NULL,                -- YYYY-MM-DD
                    speaker_name TEXT,                 -- Speaker/Author
                    speaker_role TEXT,                 -- Role/Title
                    speaker_origin TEXT,               -- Medium of origin
                    tags_json TEXT,                    -- Full serialized tag dictionary
                    sentiment TEXT,                    -- Extracted sentiment for fast index
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_idx ON quotes(idx);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_speaker ON quotes(speaker_name);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_sentiment ON quotes(sentiment);")

            # Backlinks table for knowledge graph traversal
            conn.execute("""
                CREATE TABLE IF NOT EXISTS backlinks (
                    source_id TEXT NOT NULL,
                    target_id TEXT NOT NULL,
                    relation TEXT NOT NULL,
                    PRIMARY KEY (source_id, target_id, relation),
                    FOREIGN KEY (source_id) REFERENCES quotes(id) ON DELETE CASCADE
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_backlinks_target ON backlinks(target_id);")

            # FTS5 Full-Text Search Table matching content='quotes'
            conn.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS quotes_fts USING fts5(
                    id UNINDEXED,
                    main_content,
                    context,
                    speaker_name,
                    tags_json,
                    content='quotes',
                    content_rowid='rowid'
                );
            """)

            # Triggers to keep FTS5 synchronized with quotes table
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS quotes_ai AFTER INSERT ON quotes BEGIN
                    INSERT INTO quotes_fts(rowid, id, main_content, context, speaker_name, tags_json)
                    VALUES (new.rowid, new.id, new.main_content, new.context, new.speaker_name, new.tags_json);
                END;
            """)
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS quotes_ad AFTER DELETE ON quotes BEGIN
                    INSERT INTO quotes_fts(quotes_fts, rowid, id, main_content, context, speaker_name, tags_json)
                    VALUES('delete', old.rowid, old.id, old.main_content, old.context, old.speaker_name, old.tags_json);
                END;
            """)
            conn.execute("""
                CREATE TRIGGER IF NOT EXISTS quotes_au AFTER UPDATE ON quotes BEGIN
                    INSERT INTO quotes_fts(quotes_fts, rowid, id, main_content, context, speaker_name, tags_json)
                    VALUES('delete', old.rowid, old.id, old.main_content, old.context, old.speaker_name, old.tags_json);
                    INSERT INTO quotes_fts(rowid, id, main_content, context, speaker_name, tags_json)
                    VALUES (new.rowid, new.id, new.main_content, new.context, new.speaker_name, new.tags_json);
                END;
            """)

            conn.execute("INSERT INTO _schema_migrations (version, description) VALUES (1, 'Initial schema with quotes, backlinks, and FTS5');")

        # Migration 2: Add preference_json column (one-directional response IDs)
        cur = conn.execute("SELECT version FROM _schema_migrations WHERE version = 2;")
        if not cur.fetchone():
            conn.execute("ALTER TABLE quotes ADD COLUMN preference_json TEXT;")
            conn.execute("INSERT INTO _schema_migrations (version, description) VALUES (2, 'Add preference_json for one-directional response quote links');")

    conn.close()


def upsert_quote(quote: Dict[str, Any], db_path: str = DEFAULT_DB_PATH) -> None:
    """
    Inserts or updates a quote document in the SQLite database.
    Supports both legacy dict format and new streamlined list format:
      - source_speaker: ["hexIDs"] or {name, role, origin}
      - backlink: ["url_link"] or [{target_id, relation}]
    """
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Handle source_speaker: list of hex IDs or dict
        speaker = quote.get("source_speaker", {})
        if isinstance(speaker, list):
            # New streamlined format: list of author hex IDs
            speaker_name = ", ".join(speaker) if speaker else None
            speaker_role = None
            speaker_origin = None
        elif isinstance(speaker, dict):
            # Legacy format
            speaker_name = speaker.get("name")
            speaker_role = speaker.get("role")
            speaker_origin = speaker.get("origin")
        else:
            speaker_name = None
            speaker_role = None
            speaker_origin = None

        tags = quote.get("tags", {})
        sentiment = tags.get("sentiment") if isinstance(tags, dict) else None
        preference = quote.get("preference", [])

        # Clean up any stale record holding the same index with a different ID
        conn.execute("DELETE FROM quotes WHERE idx = ? AND id != ?;", (quote["index"], quote["id"]))

        conn.execute("""
            INSERT INTO quotes (
                id, idx, main_content, context, date,
                speaker_name, speaker_role, speaker_origin,
                tags_json, sentiment, preference_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                idx = excluded.idx,
                main_content = excluded.main_content,
                context = excluded.context,
                date = excluded.date,
                speaker_name = excluded.speaker_name,
                speaker_role = excluded.speaker_role,
                speaker_origin = excluded.speaker_origin,
                tags_json = excluded.tags_json,
                sentiment = excluded.sentiment,
                preference_json = excluded.preference_json;
        """, (
            quote["id"],
            quote["index"],
            quote["main_content"],
            quote.get("context", ""),
            quote["date"],
            speaker_name,
            speaker_role,
            speaker_origin,
            json.dumps(tags, ensure_ascii=False),
            sentiment,
            json.dumps(preference, ensure_ascii=False)
        ))

        # Clear and rewrite backlinks for this quote
        conn.execute("DELETE FROM backlinks WHERE source_id = ?;", (quote["id"],))
        backlink = quote.get("backlink", [])

        # Handle backlink: list of URLs/IDs or list of dicts
        for link in backlink:
            if isinstance(link, str):
                # New streamlined format: URL or hex ID
                relation = "references" if link.startswith("http") else "related_to"
                conn.execute("""
                    INSERT OR IGNORE INTO backlinks (source_id, target_id, relation)
                    VALUES (?, ?, ?);
                """, (quote["id"], link, relation))
            elif isinstance(link, dict):
                # Legacy format
                conn.execute("""
                    INSERT OR IGNORE INTO backlinks (source_id, target_id, relation)
                    VALUES (?, ?, ?);
                """, (quote["id"], link.get("target_id"), link.get("relation", "relates_to")))

    conn.close()


def get_quote(quote_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """O(1) lookup of a quote by its hex ID."""
    conn = get_connection(db_path)
    cur = conn.execute("SELECT * FROM quotes WHERE id = ?;", (quote_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    # Fetch backlinks
    links_cur = conn.execute("SELECT target_id, relation FROM backlinks WHERE source_id = ?;", (quote_id,))
    backlinks = [{"target_id": r["target_id"], "relation": r["relation"]} for r in links_cur.fetchall()]
    conn.close()

    return {
        "id": row["id"],
        "index": row["idx"],
        "main_content": row["main_content"],
        "context": row["context"],
        "date": row["date"],
        "source_speaker": {
            "name": row["speaker_name"],
            "role": row["speaker_role"],
            "origin": row["speaker_origin"]
        },
        "backlink": backlinks,
        "preference": json.loads(row["preference_json"]) if ("preference_json" in row.keys() and row["preference_json"]) else [],
        "tags": json.loads(row["tags_json"]) if row["tags_json"] else {}
    }


def search_quotes(query: str, db_path: str = DEFAULT_DB_PATH, limit: int = 20) -> List[Dict[str, Any]]:
    """Performs FTS5 search across content, context, speaker, and tags."""
    conn = get_connection(db_path)
    cur = conn.execute("""
        SELECT q.*, rank
        FROM quotes_fts f
        JOIN quotes q ON f.id = q.id
        WHERE quotes_fts MATCH ?
        ORDER BY rank
        LIMIT ?;
    """, (query, limit))
    rows = cur.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "index": r["idx"],
            "main_content": r["main_content"],
            "context": r["context"],
            "date": r["date"],
            "speaker_name": r["speaker_name"],
            "sentiment": r["sentiment"],
            "preference": json.loads(r["preference_json"]) if ("preference_json" in r.keys() and r["preference_json"]) else [],
            "tags": json.loads(r["tags_json"]) if r["tags_json"] else {}
        })
    conn.close()
    return results


def sync_from_jsonl(jsonl_path: str = r"d:\My Drive\Blue AI\Entropy\Rose\data\quotes.jsonl", db_path: str = DEFAULT_DB_PATH) -> int:
    """Ingests all records from quotes.jsonl into SQLite."""
    if not os.path.exists(jsonl_path):
        return 0
    init_db(db_path)
    count = 0
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            upsert_quote(record, db_path)
            count += 1
    return count

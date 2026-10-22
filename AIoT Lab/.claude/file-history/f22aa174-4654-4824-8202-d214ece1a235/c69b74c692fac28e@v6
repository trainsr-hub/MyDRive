"""
Entropy Rose / Prescripts: Pure 5-Tier Relational SQLite Engine.
Establishes the definitive schema:
  1. 'quotes'     (0001... : Wisdom Quote Artifact, stores specific_id, theme_ids, usage_ids)
  2. 'containers' (0002... : Origin / Franchise / Creator / Persona)
  3. 'specifics'  (0003... : Specific Endpoint / Work / Character / Diary / Wisdom / Thought on)
                    Holds default_usage_ids to auto-select usage options.
  4. 'themes'     (0004... : Sovereign Hierarchical Tree with child_of parent link)
  5. 'usages'     (0005... : Niche Usage Modes with Conflict Matrix)
Zero sentiment field, zero redundant shadow tables, zero duplicate timestamps.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "rose_quotes.db")


def get_connection(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Creates a connection configured with WAL and concurrency pragmas."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    """Initializes the pure 5-table relational schema."""
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Table 2: containers (0002...)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS containers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                type TEXT,
                notes TEXT
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_containers_name ON containers(name);")

        # Table 3: specifics (0003...) with date & default_usage_ids
        conn.execute("""
            CREATE TABLE IF NOT EXISTS specifics (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                container_id TEXT NOT NULL,
                category TEXT,
                date TEXT,
                default_usage_ids TEXT,
                notes TEXT,
                FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_specifics_container ON specifics(container_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_specifics_name ON specifics(name);")

        s_cols = [r["name"] for r in conn.execute("PRAGMA table_info(specifics);").fetchall()]
        if s_cols:
            if "default_usage_ids" not in s_cols:
                conn.execute("ALTER TABLE specifics ADD COLUMN default_usage_ids TEXT;")
            if "date" not in s_cols:
                conn.execute("ALTER TABLE specifics ADD COLUMN date TEXT;")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_specifics_date ON specifics(date);")

        # Table 4: themes (0004... with child_of tree relation)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS themes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                child_of TEXT,
                notes TEXT,
                FOREIGN KEY (child_of) REFERENCES themes(id) ON DELETE SET NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_themes_child_of ON themes(child_of);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name);")

        # Table 5: usages (0005... with conflict matrix)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS usages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                conflicts_with TEXT
            );
        """)

        # Table 1: quotes (0001... — zero sentiment field)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS quotes (
                id TEXT PRIMARY KEY,
                idx INTEGER UNIQUE NOT NULL,
                main_content TEXT NOT NULL,
                context TEXT,
                date TEXT NOT NULL,
                specific_id TEXT,
                theme_ids TEXT,
                usage_ids TEXT,
                preference TEXT,
                backlinks TEXT,
                scores TEXT,
                average_score REAL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_idx ON quotes(idx);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);")

        q_cols = [r["name"] for r in conn.execute("PRAGMA table_info(quotes);").fetchall()]
        if q_cols:
            if "theme_ids" not in q_cols:
                conn.execute("ALTER TABLE quotes ADD COLUMN theme_ids TEXT;")
            if "usage_ids" not in q_cols:
                conn.execute("ALTER TABLE quotes ADD COLUMN usage_ids TEXT;")
            if "specific_id" not in q_cols:
                conn.execute("ALTER TABLE quotes ADD COLUMN specific_id TEXT;")
            if "scores" not in q_cols:
                conn.execute("ALTER TABLE quotes ADD COLUMN scores TEXT DEFAULT '[]';")
            if "average_score" not in q_cols:
                conn.execute("ALTER TABLE quotes ADD COLUMN average_score REAL;")

    conn.close()


# ==============================================================================
# TABLE 2: CONTAINERS (0002...) — CRUD
# ==============================================================================

def upsert_container(container: Dict[str, Any], db_path: str = DEFAULT_DB_PATH) -> None:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        name = container["name"].strip()
        cid = container["id"]
        c_type = container.get("type", "")
        notes = container.get("notes", "")
        conn.execute("""
            INSERT INTO containers (id, name, type, notes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                type = excluded.type,
                notes = excluded.notes;
        """, (cid, name, c_type, notes))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def get_container(container_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cur = conn.execute("SELECT id, name, type, notes FROM containers WHERE id = ?;", (container_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["id"], "name": row["name"], "type": row["type"] or "", "notes": row["notes"] or ""}


def get_all_containers(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("SELECT id, name, type, notes FROM containers ORDER BY name ASC;")
    rows = cur.fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "type": r["type"] or "", "notes": r["notes"] or ""} for r in rows]


def delete_container(container_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM containers WHERE id = ?;", (container_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    try:
        from compile_projections import compile_projections
        compile_projections(db_path)
    except Exception:
        pass
    return True


# ==============================================================================
# TABLE 3: SPECIFICS (0003...) — CRUD
# ==============================================================================

def upsert_specific(specific: Dict[str, Any], db_path: str = DEFAULT_DB_PATH) -> None:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        name = specific["name"].strip()
        cid = specific["container_id"]
        date_str = str(specific.get("date", "")).strip() if specific.get("date") else ""
        usage_ids = specific.get("default_usage_ids", [])
        usage_json = json.dumps(usage_ids if isinstance(usage_ids, list) else [], ensure_ascii=False)
        sid = specific["id"]
        category = specific.get("category", "")
        notes = specific.get("notes", "")

        conn.execute("""
            INSERT INTO specifics (id, name, container_id, category, date, default_usage_ids, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                container_id = excluded.container_id,
                category = excluded.category,
                date = excluded.date,
                default_usage_ids = excluded.default_usage_ids,
                notes = excluded.notes;
        """, (sid, name, cid, category, date_str, usage_json, notes))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def get_specific(specific_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cur = conn.execute("""
        SELECT s.id, s.name, s.container_id, s.category, s.date, s.default_usage_ids, s.notes,
               c.name as container_name, c.type as container_type
        FROM specifics s
        JOIN containers c ON s.container_id = c.id
        WHERE s.id = ?;
    """, (specific_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    usages = json.loads(row["default_usage_ids"]) if row["default_usage_ids"] else []
    return {
        "id": row["id"],
        "name": row["name"],
        "container_id": row["container_id"],
        "container_name": row["container_name"],
        "container_type": row["container_type"] or "",
        "category": row["category"] or "",
        "date": row["date"] or "",
        "default_usage_ids": usages,
        "notes": row["notes"] or ""
    }


def get_all_specifics(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("""
        SELECT s.id, s.name, s.container_id, s.category, s.date, s.default_usage_ids, s.notes,
               c.name as container_name, c.type as container_type
        FROM specifics s
        JOIN containers c ON s.container_id = c.id
        ORDER BY s.name ASC;
    """)
    rows = cur.fetchall()
    conn.close()
    results = []
    for r in rows:
        usages = json.loads(r["default_usage_ids"]) if r["default_usage_ids"] else []
        results.append({
            "id": r["id"],
            "name": r["name"],
            "container_id": r["container_id"],
            "container_name": r["container_name"],
            "container_type": r["container_type"] or "",
            "category": r["category"] or "",
            "date": r["date"] or "",
            "default_usage_ids": usages,
            "notes": r["notes"] or ""
        })
    return results


def delete_specific(specific_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM specifics WHERE id = ?;", (specific_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    try:
        from compile_projections import compile_projections
        compile_projections(db_path)
    except Exception:
        pass
    return True


# ==============================================================================
# TABLE 4: THEMES (0004...) — HIERARCHICAL TREE CRUD
# ==============================================================================

def upsert_theme(theme: Dict[str, Any], db_path: str = DEFAULT_DB_PATH) -> None:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        name = theme["name"].strip()
        child_of = theme.get("child_of") or None
        tid = theme["id"]
        notes = theme.get("notes", "")

        conn.execute("""
            INSERT INTO themes (id, name, child_of, notes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                child_of = excluded.child_of,
                notes = excluded.notes;
        """, (tid, name, child_of, notes))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def get_theme(theme_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cur = conn.execute("SELECT id, name, child_of, notes FROM themes WHERE id = ?;", (theme_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["id"], "name": row["name"], "child_of": row["child_of"], "notes": row["notes"] or ""}


def get_all_themes(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("""
        SELECT t.id, t.name, t.child_of, t.notes, p.name as parent_name
        FROM themes t
        LEFT JOIN themes p ON t.child_of = p.id
        ORDER BY t.name ASC;
    """)
    rows = cur.fetchall()
    conn.close()
    return [{
        "id": r["id"],
        "name": r["name"],
        "child_of": r["child_of"],
        "parent_name": r["parent_name"] or "",
        "notes": r["notes"] or ""
    } for r in rows]


def delete_theme(theme_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM themes WHERE id = ?;", (theme_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    try:
        from compile_projections import compile_projections
        compile_projections(db_path)
    except Exception:
        pass
    return True


# ==============================================================================
# TABLE 5: USAGES (0005...) — CRUD
# ==============================================================================

def upsert_usage(usage: Dict[str, Any], db_path: str = DEFAULT_DB_PATH) -> None:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        name = usage["name"].strip()
        conflicts = usage.get("conflicts_with", [])
        conflicts_json = json.dumps(conflicts if isinstance(conflicts, list) else [], ensure_ascii=False)
        uid = usage["id"]
        desc = usage.get("description", "")
        icon = usage.get("icon", "")

        conn.execute("""
            INSERT INTO usages (id, name, description, icon, conflicts_with)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                icon = excluded.icon,
                conflicts_with = excluded.conflicts_with;
        """, (uid, name, desc, icon, conflicts_json))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def get_usage(usage_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cur = conn.execute("SELECT id, name, description, icon, conflicts_with FROM usages WHERE id = ?;", (usage_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    conflicts = json.loads(row["conflicts_with"]) if row["conflicts_with"] else []
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"] or "",
        "icon": row["icon"] or "",
        "conflicts_with": conflicts
    }


def get_all_usages(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("SELECT id, name, description, icon, conflicts_with FROM usages ORDER BY name ASC;")
    rows = cur.fetchall()
    conn.close()
    results = []
    for r in rows:
        conflicts = json.loads(r["conflicts_with"]) if r["conflicts_with"] else []
        results.append({
            "id": r["id"],
            "name": r["name"],
            "description": r["description"] or "",
            "icon": r["icon"] or "",
            "conflicts_with": conflicts
        })
    return results


def delete_usage(usage_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM usages WHERE id = ?;", (usage_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    try:
        from compile_projections import compile_projections
        compile_projections(db_path)
    except Exception:
        pass
    return True


# ==============================================================================
# TABLE 1: QUOTES (0001...) — CRUD (ZERO SENTIMENT)
# ==============================================================================

def get_next_index(db_path: str = DEFAULT_DB_PATH) -> int:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("SELECT COALESCE(MAX(idx), 0) + 1 AS next_idx FROM quotes;")
    row = cur.fetchone()
    conn.close()
    return row["next_idx"] if row else 1


def upsert_quote(quote: Dict[str, Any], db_path: str = DEFAULT_DB_PATH, compile_after: bool = True) -> None:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        sid = quote.get("specific_id")
        if not sid and quote.get("specific_ids"):
            sids = quote["specific_ids"]
            sid = sids[0] if isinstance(sids, list) and sids else str(sids)

        raw_themes = quote.get("theme_ids", [])
        theme_ids_json = json.dumps(raw_themes if isinstance(raw_themes, list) else [], ensure_ascii=False)

        raw_usage = quote.get("usage_ids", quote.get("usage", []))
        usage_json = json.dumps(raw_usage if isinstance(raw_usage, list) else [], ensure_ascii=False)

        preference = quote.get("preference", [])
        preference_json_str = json.dumps(preference if isinstance(preference, list) else [], ensure_ascii=False)

        backlinks = quote.get("backlink", quote.get("backlinks", []))
        backlinks_json_str = json.dumps(backlinks if isinstance(backlinks, list) else [], ensure_ascii=False)

        # Process scores (list of numbers e.g. [5, 6, 4, 7, 5])
        raw_scores = quote.get("scores")
        if raw_scores is None:
            raw_scores = quote.get("score_list")

        clean_scores = None
        if raw_scores is not None:
            if isinstance(raw_scores, str):
                try:
                    parsed = json.loads(raw_scores)
                    if isinstance(parsed, list):
                        raw_scores = parsed
                    else:
                        raw_scores = [parsed]
                except Exception:
                    clean_str = raw_scores.strip().strip("[]")
                    raw_scores = [x.strip() for x in clean_str.split(",") if x.strip()]

            clean_scores = []
            if isinstance(raw_scores, list):
                for s in raw_scores:
                    try:
                        num = float(s)
                        clean_scores.append(int(num) if num.is_integer() else round(num, 2))
                    except (ValueError, TypeError):
                        pass

        # If scores was omitted in partial update, retain existing scores from DB
        if clean_scores is None:
            existing_record = get_quote(quote["id"], db_path)
            if existing_record and existing_record.get("scores") is not None:
                clean_scores = existing_record.get("scores", [])
            else:
                clean_scores = []

        scores_json = json.dumps(clean_scores, ensure_ascii=False)

        # Average score (numeric mean e.g. 5.4)
        avg_score = quote.get("average_score")
        if avg_score is None:
            avg_score = quote.get("avg_score")

        if avg_score is not None and avg_score != "":
            try:
                avg_score = round(float(avg_score), 2)
            except (ValueError, TypeError):
                avg_score = None
        else:
            avg_score = None

        # Auto-compute average if scores is present and avg_score was not explicitly specified
        if avg_score is None and clean_scores:
            calculated = sum(clean_scores) / len(clean_scores)
            avg_score = round(calculated, 2)

        idx = quote.get("idx") or quote.get("index")
        if not idx:
            existing = get_quote(quote["id"], db_path)
            if existing:
                idx = existing.get("idx") or existing.get("index")
            else:
                idx = get_next_index(db_path)
        idx = int(idx)

        conn.execute("DELETE FROM quotes WHERE idx = ? AND id != ?;", (idx, quote["id"]))

        conn.execute("""
            INSERT INTO quotes (
                id, idx, main_content, context, date,
                specific_id, theme_ids, usage_ids, preference, backlinks,
                scores, average_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                idx = excluded.idx,
                main_content = excluded.main_content,
                context = excluded.context,
                date = excluded.date,
                specific_id = excluded.specific_id,
                theme_ids = excluded.theme_ids,
                usage_ids = excluded.usage_ids,
                preference = excluded.preference,
                backlinks = excluded.backlinks,
                scores = excluded.scores,
                average_score = excluded.average_score;
        """, (
            quote["id"],
            idx,
            quote["main_content"].strip(),
            quote.get("context", "").strip(),
            str(quote["date"]).strip(),
            sid,
            theme_ids_json,
            usage_json,
            preference_json_str,
            backlinks_json_str,
            scores_json,
            avg_score
        ))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()

    if compile_after:
        try:
            from compile_projections import compile_projections
            compile_projections(db_path)
        except Exception as e:
            print(f"[WARN] Projection compilation error: {e}")


def get_quote(quote_id: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    conn = get_connection(db_path)
    cur = conn.execute("SELECT * FROM quotes WHERE id = ?;", (quote_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    sid = row["specific_id"]
    themes = json.loads(row["theme_ids"]) if ("theme_ids" in row.keys() and row["theme_ids"]) else []
    usage = json.loads(row["usage_ids"]) if ("usage_ids" in row.keys() and row["usage_ids"]) else []
    preference = json.loads(row["preference"]) if row["preference"] else []
    backlinks = json.loads(row["backlinks"]) if row["backlinks"] else []
    scores = json.loads(row["scores"]) if ("scores" in row.keys() and row["scores"]) else []
    avg_score = row["average_score"] if ("average_score" in row.keys() and row["average_score"] is not None) else None
    if avg_score is None and scores:
        try:
            avg_score = round(sum(scores) / len(scores), 2)
        except Exception:
            avg_score = None

    conn.close()
    return {
        "id": row["id"],
        "idx": row["idx"],
        "index": row["idx"],
        "main_content": row["main_content"],
        "context": row["context"] or "",
        "date": row["date"],
        "specific_id": sid,
        "theme_ids": themes,
        "usage_ids": usage,
        "preference": preference,
        "backlinks": backlinks,
        "scores": scores,
        "average_score": avg_score,
        "avg_score": avg_score
    }


def get_all_quotes(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    cur = conn.execute("SELECT * FROM quotes ORDER BY idx DESC;")
    rows = cur.fetchall()
    results = []
    for row in rows:
        scores = json.loads(row["scores"]) if ("scores" in row.keys() and row["scores"]) else []
        avg_score = row["average_score"] if ("average_score" in row.keys() and row["average_score"] is not None) else None
        if avg_score is None and scores:
            try:
                avg_score = round(sum(scores) / len(scores), 2)
            except Exception:
                avg_score = None
        results.append({
            "id": row["id"],
            "idx": row["idx"],
            "index": row["idx"],
            "main_content": row["main_content"],
            "context": row["context"] or "",
            "date": row["date"],
            "specific_id": row["specific_id"],
            "theme_ids": json.loads(row["theme_ids"]) if ("theme_ids" in row.keys() and row["theme_ids"]) else [],
            "usage_ids": json.loads(row["usage_ids"]) if ("usage_ids" in row.keys() and row["usage_ids"]) else [],
            "preference": json.loads(row["preference"]) if row["preference"] else [],
            "backlinks": json.loads(row["backlinks"]) if row["backlinks"] else [],
            "scores": scores,
            "average_score": avg_score,
            "avg_score": avg_score
        })
    conn.close()
    return results


def delete_quote(quote_id: str, db_path: str = DEFAULT_DB_PATH) -> bool:
    init_db(db_path)
    conn = get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM quotes WHERE id = ?;", (quote_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    try:
        from compile_projections import compile_projections
        compile_projections(db_path)
    except Exception:
        pass
    return True


def search_quotes(query: str, db_path: str = DEFAULT_DB_PATH, limit: int = 20) -> List[Dict[str, Any]]:
    init_db(db_path)
    conn = get_connection(db_path)
    like_q = f"%{query}%"
    cur = conn.execute("""
        SELECT *
        FROM quotes
        WHERE main_content LIKE ? OR context LIKE ?
        ORDER BY idx ASC
        LIMIT ?;
    """, (like_q, like_q, limit))
    rows = cur.fetchall()
    results = []
    for row in rows:
        scores = json.loads(row["scores"]) if ("scores" in row.keys() and row["scores"]) else []
        avg_score = row["average_score"] if ("average_score" in row.keys() and row["average_score"] is not None) else None
        if avg_score is None and scores:
            try:
                avg_score = round(sum(scores) / len(scores), 2)
            except Exception:
                avg_score = None
        results.append({
            "id": row["id"],
            "index": row["idx"],
            "main_content": row["main_content"],
            "context": row["context"] or "",
            "date": row["date"],
            "specific_id": row["specific_id"],
            "preference": json.loads(row["preference"]) if row["preference"] else [],
            "backlinks": json.loads(row["backlinks"]) if row["backlinks"] else [],
            "scores": scores,
            "average_score": avg_score,
            "avg_score": avg_score
        })
    conn.close()
    return results

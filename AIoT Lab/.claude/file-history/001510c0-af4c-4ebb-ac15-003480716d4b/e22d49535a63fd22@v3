"""
Entropy Rose / Prescripts: Turso Cloud SQLite Synchronizer & ESP32 Bridge.
Connects the local 5-tier relational database to Turso Cloud SQLite over HTTP Pipeline v2.
Allows 24/7 serverless cloud hosting for ESP32 microcontrollers and mobile edge clients.
"""

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "rose_quotes.db")
ENV_PATH = os.path.join(BASE_DIR, ".env")


def load_env_credentials() -> Tuple[str, str]:
    """Loads Turso credentials from environment or .env file."""
    db_url = os.environ.get("TURSO_DATABASE_URL", "")
    auth_token = os.environ.get("TURSO_AUTH_TOKEN", "")

    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == "TURSO_DATABASE_URL" and not db_url:
                    db_url = v
                elif k == "TURSO_AUTH_TOKEN" and not auth_token:
                    auth_token = v

    if db_url.startswith("libsql://"):
        db_url = "https://" + db_url[len("libsql://"):]

    return db_url.rstrip("/"), auth_token


def execute_turso_pipeline(statements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes raw SQL statements on Turso via HTTP Pipeline API v2.
    Format of each stmt: {"sql": "...", "args": [...] (optional)}
    """
    db_url, auth_token = load_env_credentials()
    if not db_url or not auth_token:
        raise ValueError("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env")

    pipeline_url = f"{db_url}/v2/pipeline"
    requests_payload = []
    for s in statements:
        sql = s["sql"]
        raw_args = s.get("args", [])
        formatted_args = []
        for a in raw_args:
            if a is None:
                formatted_args.append({"type": "null"})
            elif isinstance(a, int):
                formatted_args.append({"type": "integer", "value": str(a)})
            elif isinstance(a, float):
                formatted_args.append({"type": "float", "value": a})
            else:
                formatted_args.append({"type": "text", "value": str(a)})

        stmt_obj = {"sql": sql}
        if formatted_args:
            stmt_obj["args"] = formatted_args

        requests_payload.append({"type": "execute", "stmt": stmt_obj})

    requests_payload.append({"type": "close"})

    body = json.dumps({"requests": requests_payload}).encode("utf-8")
    req = urllib.request.Request(
        pipeline_url,
        data=body,
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"Turso HTTP {e.code} Error: {err_body}") from e


def init_turso_schema() -> bool:
    """Initializes the identical 5-tier relational SQLite schema on Turso."""
    stmts = [
        # Table 2: containers
        {"sql": """
            CREATE TABLE IF NOT EXISTS containers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                type TEXT,
                notes TEXT
            );
        """},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_containers_name ON containers(name);"},

        # Table 3: specifics
        {"sql": """
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
        """},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_specifics_container ON specifics(container_id);"},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_specifics_name ON specifics(name);"},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_specifics_date ON specifics(date);"},

        # Table 4: themes
        {"sql": """
            CREATE TABLE IF NOT EXISTS themes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                child_of TEXT,
                notes TEXT,
                FOREIGN KEY (child_of) REFERENCES themes(id) ON DELETE SET NULL
            );
        """},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_themes_child_of ON themes(child_of);"},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name);"},

        # Table 5: usages
        {"sql": """
            CREATE TABLE IF NOT EXISTS usages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                conflicts_with TEXT
            );
        """},

        # Table 1: quotes
        {"sql": """
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
        """},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_quotes_idx ON quotes(idx);"},
        {"sql": "CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);"}
    ]

    execute_turso_pipeline(stmts)

    # Idempotent cloud schema migration check
    try:
        col_rows = query_turso("PRAGMA table_info(quotes);")
        col_names = [c.get("name") for c in col_rows if c.get("name")]
        alter_stmts = []
        if col_names:
            if "scores" not in col_names:
                alter_stmts.append({"sql": "ALTER TABLE quotes ADD COLUMN scores TEXT DEFAULT '[]';"})
            if "average_score" not in col_names:
                alter_stmts.append({"sql": "ALTER TABLE quotes ADD COLUMN average_score REAL;"})
        if alter_stmts:
            execute_turso_pipeline(alter_stmts)
    except Exception:
        pass

    print("[OK] Initialized Turso cloud schema (5 tables, 7 indices).")
    return True


def sync_all_to_turso(db_path: str = DEFAULT_DB_PATH) -> Dict[str, int]:
    """Syncs all containers, specifics, themes, usages, and quotes from local SQLite to Turso."""
    init_turso_schema()

    if not os.path.exists(db_path):
        print(f"[WARN] Local database {db_path} does not exist.")
        return {"containers": 0, "specifics": 0, "themes": 0, "usages": 0, "quotes": 0}

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    stmts = []

    # 1. Containers
    cur = conn.execute("SELECT id, name, type, notes FROM containers;")
    containers = cur.fetchall()
    for c in containers:
        stmts.append({
            "sql": """
                INSERT INTO containers (id, name, type, notes)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    type = excluded.type,
                    notes = excluded.notes;
            """,
            "args": [c["id"], c["name"], c["type"] or "", c["notes"] or ""]
        })

    # 2. Specifics
    cur = conn.execute("SELECT id, name, container_id, category, date, default_usage_ids, notes FROM specifics;")
    specifics = cur.fetchall()
    for s in specifics:
        stmts.append({
            "sql": """
                INSERT INTO specifics (id, name, container_id, category, date, default_usage_ids, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    container_id = excluded.container_id,
                    category = excluded.category,
                    date = excluded.date,
                    default_usage_ids = excluded.default_usage_ids,
                    notes = excluded.notes;
            """,
            "args": [s["id"], s["name"], s["container_id"], s["category"] or "", s["date"] or "", s["default_usage_ids"] or "[]", s["notes"] or ""]
        })

    # 3. Themes
    cur = conn.execute("SELECT id, name, child_of, notes FROM themes;")
    themes = cur.fetchall()
    for t in themes:
        stmts.append({
            "sql": """
                INSERT INTO themes (id, name, child_of, notes)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    child_of = excluded.child_of,
                    notes = excluded.notes;
            """,
            "args": [t["id"], t["name"], t["child_of"], t["notes"] or ""]
        })

    # 4. Usages
    cur = conn.execute("SELECT id, name, description, icon, conflicts_with FROM usages;")
    usages = cur.fetchall()
    for u in usages:
        stmts.append({
            "sql": """
                INSERT INTO usages (id, name, description, icon, conflicts_with)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    icon = excluded.icon,
                    conflicts_with = excluded.conflicts_with;
            """,
            "args": [u["id"], u["name"], u["description"] or "", u["icon"] or "", u["conflicts_with"] or "[]"]
        })

    # 5. Quotes
    cur = conn.execute("SELECT id, idx, main_content, context, date, specific_id, theme_ids, usage_ids, preference, backlinks, scores, average_score FROM quotes;")
    quotes = cur.fetchall()
    for q in quotes:
        stmts.append({
            "sql": """
                INSERT INTO quotes (id, idx, main_content, context, date, specific_id, theme_ids, usage_ids, preference, backlinks, scores, average_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            """,
            "args": [
                q["id"], q["idx"], q["main_content"], q["context"] or "", q["date"],
                q["specific_id"], q["theme_ids"] or "[]", q["usage_ids"] or "[]",
                q["preference"] or "[]", q["backlinks"] or "[]",
                q["scores"] or "[]", q["average_score"]
            ]
        })

    conn.close()

    if stmts:
        execute_turso_pipeline(stmts)

    counts = {
        "containers": len(containers),
        "specifics": len(specifics),
        "themes": len(themes),
        "usages": len(usages),
        "quotes": len(quotes)
    }
    print(f"[OK] Synced to Turso Cloud: {counts['quotes']} quotes, {counts['specifics']} specifics, {counts['containers']} containers, {counts['themes']} themes, {counts['usages']} usages.")
    return counts


def query_turso(sql: str, args: List[Any] = None) -> List[Dict[str, Any]]:
    """Runs a SELECT query on Turso and returns list of dictionaries."""
    res = execute_turso_pipeline([{"sql": sql, "args": args or []}])
    try:
        exec_res = res["results"][0]["response"]["result"]
        cols = [c["name"] for c in exec_res["cols"]]
        rows = []
        for r in exec_res["rows"]:
            row_dict = {}
            for idx, val_obj in enumerate(r):
                row_dict[cols[idx]] = val_obj.get("value")
            rows.append(row_dict)
        return rows
    except (KeyError, IndexError):
        return []


if __name__ == "__main__":
    print("=" * 60)
    print("  Prescripts / Entropy Rose — Turso Cloud Sync")
    print("=" * 60)
    sync_all_to_turso()
    print("\nVerifying live cloud queries:")
    latest_quotes = query_turso("SELECT idx, main_content, date FROM quotes ORDER BY idx DESC LIMIT 3;")
    for q in latest_quotes:
        print(f"  #{q.get('idx')}: {q.get('main_content', '')[:40]}... (date={q.get('date')})")

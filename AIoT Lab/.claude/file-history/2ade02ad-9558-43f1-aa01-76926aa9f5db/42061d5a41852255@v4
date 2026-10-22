"""
Rebased Worlds/Series Database: SQLite Hierarchical Tree Engine
Entropy Rose Tree Pattern (child_of self-referencing relationship).

Hierarchy:
  All (Root)
   └── Internet
        └── Vtuber
             └── Hololive
                  ├── HoloEN
                  │    └── HoloMyth
                  └── HoloJP
                       └── Gen 3

Hex ID Standards:
  - 1006: Worlds / Series Tree
"""

import sqlite3
import json
import os
import time
from typing import Dict, Any, List, Optional
import tournament_db as tdb

PREFIX_WORLD = "1006"


def init_world_schema(db_path: str = tdb.DEFAULT_DB_PATH) -> None:
    """Initializes the hierarchical worlds tree table."""
    conn = tdb.get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Table: worlds (1006...)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS worlds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                child_of TEXT,
                description TEXT DEFAULT '',
                rules TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                FOREIGN KEY (child_of) REFERENCES worlds(id) ON DELETE SET NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_worlds_child_of ON worlds(child_of);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_worlds_name ON worlds(name);")

    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()


def generate_world_hex_id(prefix: str = PREFIX_WORLD) -> str:
    """Generate 16-character hex ID: <4-char prefix><12-char monotonic unix ms>"""
    return tdb.generate_tournament_hex_id(prefix)


def upsert_world(world: Dict[str, Any], db_path: str = tdb.DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Upsert a world node in the hierarchical tree."""
    init_world_schema(db_path)
    conn = tdb.get_connection(db_path)
    name = world["name"].strip()
    child_of = world.get("child_of") or None
    description = world.get("description", "")
    rules = world.get("rules", [])
    rules_json = json.dumps(rules if isinstance(rules, list) else [], ensure_ascii=False)
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    with conn:
        conn.execute("BEGIN IMMEDIATE;")

        # Check existing by ID or (name + child_of)
        world_id = world.get("id")
        if not world_id:
            if child_of:
                cur = conn.execute("SELECT id FROM worlds WHERE name = ? AND child_of = ?;", (name, child_of))
            else:
                cur = conn.execute("SELECT id FROM worlds WHERE name = ? AND child_of IS NULL;", (name,))
            row = cur.fetchone()
            world_id = row["id"] if row else tdb.generate_tournament_hex_id(PREFIX_WORLD)

        conn.execute("""
            INSERT INTO worlds (id, name, child_of, description, rules, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                child_of = excluded.child_of,
                description = excluded.description,
                rules = excluded.rules;
        """, (world_id, name, child_of, description, rules_json, now_str))

    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    return get_world_by_id(world_id, db_path)


def get_world_by_id(world_id: str, db_path: str = tdb.DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Get a world node by its ID, joined with parent name."""
    init_world_schema(db_path)
    conn = tdb.get_connection(db_path)
    cur_check = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='characters';")
    has_chars = cur_check.fetchone() is not None

    char_subquery = "(SELECT COUNT(*) FROM characters c WHERE instr(c.series_ids, w.id) > 0)" if has_chars else "0"
    sql = f"""
        SELECT w.*, p.name as parent_name,
               {char_subquery} as character_count
        FROM worlds w
        LEFT JOIN worlds p ON w.child_of = p.id
        WHERE w.id = ?;
    """
    cur = conn.execute(sql, (world_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["rules"] = json.loads(d["rules"]) if d["rules"] else []
    return d


def get_world_by_name(name: str, parent_id: Optional[str] = None, db_path: str = tdb.DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Get a world by name (and optional parent), joined with parent name."""
    init_world_schema(db_path)
    conn = tdb.get_connection(db_path)
    if parent_id:
        cur = conn.execute("""
            SELECT w.*, p.name as parent_name
            FROM worlds w
            LEFT JOIN worlds p ON w.child_of = p.id
            WHERE w.name = ? AND w.child_of = ?;
        """, (name.strip(), parent_id))
    else:
        cur = conn.execute("""
            SELECT w.*, p.name as parent_name
            FROM worlds w
            LEFT JOIN worlds p ON w.child_of = p.id
            WHERE w.name = ?;
        """, (name.strip(),))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["rules"] = json.loads(d["rules"]) if d["rules"] else []
    return d


def get_all_worlds(db_path: str = tdb.DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """List all worlds with parent_name and character_count."""
    init_world_schema(db_path)
    conn = tdb.get_connection(db_path)
    cur_check = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='characters';")
    has_chars = cur_check.fetchone() is not None

    char_subquery = "(SELECT COUNT(*) FROM characters c WHERE instr(c.series_ids, w.id) > 0)" if has_chars else "0"
    sql = f"""
        SELECT w.*, p.name as parent_name,
               {char_subquery} as character_count
        FROM worlds w
        LEFT JOIN worlds p ON w.child_of = p.id
        ORDER BY CASE WHEN w.child_of IS NULL THEN 0 ELSE 1 END, w.name ASC;
    """
    cur = conn.execute(sql)
    rows = cur.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["rules"] = json.loads(d["rules"]) if d["rules"] else []
        results.append(d)
    return results


def get_world_tree(db_path: str = tdb.DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """Builds and returns the full hierarchical recursive tree from root."""
    all_worlds = get_all_worlds(db_path)
    by_id = {w["id"]: {**w, "children": []} for w in all_worlds}
    roots = []

    for w in all_worlds:
        node = by_id[w["id"]]
        parent_id = w["child_of"]
        if parent_id and parent_id in by_id:
            by_id[parent_id]["children"].append(node)
        else:
            roots.append(node)

    return roots


def delete_world(world_id: str, db_path: str = tdb.DEFAULT_DB_PATH) -> bool:
    """Delete a world node (children child_of set to NULL)."""
    init_world_schema(db_path)
    conn = tdb.get_connection(db_path)
    with conn:
        conn.execute("BEGIN IMMEDIATE;")
        conn.execute("DELETE FROM worlds WHERE id = ?;", (world_id,))
    conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
    conn.close()
    return True


def seed_default_world_tree(db_path: str = tdb.DEFAULT_DB_PATH) -> Dict[str, str]:
    """
    Seeds the authoritative tree according to Manager's Vision:
    'All' => Internet (Branch of Vtubers) => Vtuber => Hololive => HoloEN => HoloMyth
    Returns a dictionary mapping node names to their hex IDs.
    """
    init_world_schema(db_path)
    id_map: Dict[str, str] = {}

    def ensure_node(name: str, parent_name: Optional[str] = None, desc: str = "", rules: List[str] = None):
        pid = id_map.get(parent_name) if parent_name else None
        existing = get_world_by_name(name, pid, db_path)
        if existing:
            id_map[name] = existing["id"]
            return existing["id"]

        node = upsert_world({
            "name": name,
            "child_of": pid,
            "description": desc,
            "rules": rules or []
        }, db_path)
        id_map[name] = node["id"]
        return node["id"]

    # 1. Root
    ensure_node("All", None, "Universal root for all worlds and franchises", ["universal_scope"])

    # 2. Internet Branch (Vtubers & web culture)
    ensure_node("Internet", "All", "Branch of Vtubers and digital creator domains (not traditional Games or Anime)", ["digital_culture", "livestreaming"])
    ensure_node("Vtuber", "Internet", "Virtual YouTuber agencies, indies, and talent networks", ["virtual_avatar"])
    ensure_node("Hololive", "Vtuber", "Cover Corp Hololive Production agency", ["idol_agency", "cover_corp"])
    ensure_node("HoloEN", "Hololive", "Hololive English branch", ["english_branch"])
    ensure_node("HoloMyth", "HoloEN", "Hololive English -Myth- generation (Amelia, Gura, Ina, Calli, Kiara)", ["first_generation", "myth_lore"])

    ensure_node("HoloJP", "Hololive", "Hololive Japan branch", ["japanese_branch"])
    ensure_node("Gen 3", "HoloJP", "Hololive 3rd Gen / HoloFantasy (Pekora, Marine, Flare, Noel)", ["fantasy_lore"])

    # 3. Gaming Branch
    ensure_node("Gaming", "All", "Interactive video games and digital entertainment", ["interactive_media"])
    ensure_node("Honkai: Star Rail", "Gaming", "HoYoverse space fantasy RPG", ["space_fantasy", "hoyoverse"])
    ensure_node("NieR", "Gaming", "Square Enix / Yoko Taro post-apocalyptic universe", ["android_existentialism", "yoko_taro"])
    ensure_node("Azur Lane", "Gaming", "Manjuu naval warfare gacha", ["shipgirls", "naval_warfare"])
    ensure_node("StellaBlade", "Gaming", "Shift Up action sci-fi combat universe", ["stellar_combat", "shift_up"])

    # 4. Anime & Manga Branch
    ensure_node("Anime & Manga", "All", "Traditional serialized Japanese animation and comics", ["serialized_narrative"])
    ensure_node("One Piece", "Anime & Manga", "Eiichiro Oda pirate adventure epic", ["grand_line", "devil_fruits"])
    ensure_node("THE IDOLM@STER", "Anime & Manga", "Bandai Namco idol training franchise", ["idol_culture"])

    return id_map

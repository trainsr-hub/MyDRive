"""
Entropy Rose / Prescripts: Deterministic CQRS Projection Compiler.
Compiles the pure 5-table relational schema:
  quotes -> specifics -> containers + themes (child_of tree) + usages (conflict matrix)
into O(1) denormalized JSON projection maps for Obsidian and edge clients.
Zero sentiment field, completely clean relational mappings.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "data", "rose_quotes.db")
DEFAULT_OUT_DIR = os.path.join(BASE_DIR, "data")


def compile_projections(db_path: str = DEFAULT_DB_PATH, out_dir: str = DEFAULT_OUT_DIR) -> Dict[str, int]:
    """
    Reads authoritative SQLite tables and generates:
      1. quotes_map.json: { [hex_id]: QuoteObject } (Denormalized with Specifics, Containers, Themes, Usages)
      2. taxonomy_index.json: { containers: [...], specifics: [...], themes: [...], usages: [...] }
    """
    if not os.path.exists(db_path):
        return {"quotes": 0, "specifics": 0, "containers": 0, "themes": 0, "usages": 0}

    os.makedirs(out_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # 1. Fetch all containers (Table 2)
    containers_map = {}
    containers_list = []
    try:
        cur = conn.execute("SELECT id, name, type, notes FROM containers ORDER BY name ASC;")
        for r in cur.fetchall():
            c = {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"] or "",
                "notes": r["notes"] or ""
            }
            containers_map[r["id"]] = c
            containers_list.append(c)
    except sqlite3.OperationalError:
        pass

    # 2. Fetch all usages (Table 5) with conflict matrix
    usages_map = {}
    usages_list = []
    try:
        cur = conn.execute("SELECT id, name, description, icon, COALESCE(conflicts_with, '[]') as conflicts_with FROM usages ORDER BY name ASC;")
        for r in cur.fetchall():
            conflicts = json.loads(r["conflicts_with"]) if r["conflicts_with"] else []
            u = {
                "id": r["id"],
                "name": r["name"],
                "description": r["description"] or "",
                "icon": r["icon"] or "",
                "conflicts_with": conflicts
            }
            usages_map[r["id"]] = u
            usages_list.append(u)
    except sqlite3.OperationalError:
        pass

    # 3. Fetch all specifics (Table 3) pre-joined with containers, dates and default_usage_ids
    specifics_map = {}
    specifics_list = []
    try:
        cur = conn.execute("SELECT id, name, container_id, category, COALESCE(date, '') as date, COALESCE(default_usage_ids, '[]') as default_usage_ids, notes FROM specifics ORDER BY name ASC;")
        for r in cur.fetchall():
            cid = r["container_id"]
            parent_container = containers_map.get(cid, {"id": cid, "name": cid, "type": ""})
            u_ids = json.loads(r["default_usage_ids"]) if r["default_usage_ids"] else []
            s = {
                "id": r["id"],
                "name": r["name"],
                "category": r["category"] or "",
                "date": r["date"] or "",
                "default_usage_ids": u_ids,
                "notes": r["notes"] or "",
                "container": parent_container
            }
            specifics_map[r["id"]] = s
            specifics_list.append(s)
    except sqlite3.OperationalError:
        pass

    # 4. Fetch all themes (Table 4) with child_of tree relation
    themes_map = {}
    themes_list = []
    try:
        cur = conn.execute("""
            SELECT t.id, t.name, t.child_of, t.notes, p.name as parent_name
            FROM themes t
            LEFT JOIN themes p ON t.child_of = p.id
            ORDER BY t.name ASC;
        """)
        for r in cur.fetchall():
            th = {
                "id": r["id"],
                "name": r["name"],
                "child_of": r["child_of"],
                "parent_name": r["parent_name"] or "",
                "notes": r["notes"] or ""
            }
            themes_map[r["id"]] = th
            themes_list.append(th)
    except sqlite3.OperationalError:
        pass

    # 5. Fetch all quotes (Table 1) - ZERO sentiment
    quotes_map = {}

    try:
        cur = conn.execute("""
            SELECT id, idx, main_content, context, date, specific_id,
                   COALESCE(theme_ids, '[]') as theme_ids,
                   COALESCE(usage_ids, '[]') as usage_ids,
                   COALESCE(preference, '[]') as preference,
                   COALESCE(backlinks, '[]') as backlinks,
                   COALESCE(scores, '[]') as scores,
                   average_score
            FROM quotes
            ORDER BY idx ASC;
        """)

        for r in cur.fetchall():
            qid = r["id"]
            sid = r["specific_id"]
            resolved_specific = specifics_map.get(sid, None)

            theme_ids = json.loads(r["theme_ids"]) if r["theme_ids"] else []
            resolved_themes = [themes_map[tid] for tid in theme_ids if tid in themes_map]

            usage_ids = json.loads(r["usage_ids"]) if r["usage_ids"] else []
            resolved_usages = [usages_map[uid] for uid in usage_ids if uid in usages_map]

            preference = json.loads(r["preference"]) if r["preference"] else []
            backlinks = json.loads(r["backlinks"]) if r["backlinks"] else []

            scores = json.loads(r["scores"]) if ("scores" in r.keys() and r["scores"]) else []
            avg_score = r["average_score"] if ("average_score" in r.keys() and r["average_score"] is not None) else None
            if avg_score is None and scores:
                try:
                    avg_score = round(sum(scores) / len(scores), 2)
                except Exception:
                    avg_score = None

            effective_date = r["date"] or (resolved_specific.get("date") if resolved_specific else "") or ""

            quotes_map[qid] = {
                "id": qid,
                "idx": r["idx"],
                "index": r["idx"],
                "main_content": r["main_content"],
                "context": r["context"] or "",
                "date": r["date"],
                "effective_date": effective_date,
                "specific": resolved_specific,
                "themes": resolved_themes,
                "usages": resolved_usages,
                "preference": preference,
                "backlinks": backlinks,
                "scores": scores,
                "average_score": avg_score,
                "avg_score": avg_score
            }
    except sqlite3.OperationalError:
        pass

    conn.close()

    # Write quotes_map.json
    quotes_map_path = os.path.join(out_dir, "quotes_map.json")
    with open(quotes_map_path, "w", encoding="utf-8") as f:
        json.dump(quotes_map, f, ensure_ascii=False, indent=2)

    # Write taxonomy_index.json
    taxonomy = {
        "containers": containers_list,
        "specifics": specifics_list,
        "themes": themes_list,
        "usages": usages_list
    }
    taxonomy_path = os.path.join(out_dir, "taxonomy_index.json")
    with open(taxonomy_path, "w", encoding="utf-8") as f:
        json.dump(taxonomy, f, ensure_ascii=False, indent=2)

    return {
        "quotes": len(quotes_map),
        "specifics": len(specifics_list),
        "containers": len(containers_list),
        "themes": len(themes_list),
        "usages": len(usages_list)
    }


if __name__ == "__main__":
    stats = compile_projections()
    print(f"[OK] Compiled projections: {stats['quotes']} quotes, {stats['specifics']} specifics, {stats['containers']} containers, {stats['themes']} themes, {stats['usages']} usages.")

#!/usr/bin/env python3
"""
Ingest core character and world tree data into the Rebased SQLite database.
Aligns with Manager's Vision:
  1. characters: short_names, series_ids, hazard_rank (int), purged legacy fields
  2. character_variants: symmetrical to character, variant_names, character_id FK
  3. worlds: hierarchical tree from 'All' -> 'Internet' -> 'Vtuber' -> 'Hololive' -> 'HoloEN' -> 'HoloMyth'
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import character_db as cdb
import series_db as sdb
import sqlite3

DEFAULT_DB_PATH = cdb.tdb.DEFAULT_DB_PATH


def drop_and_recreate_identity_tables(db_path=DEFAULT_DB_PATH):
    """Drops old character and world tables to guarantee clean schema migration."""
    conn = sqlite3.connect(db_path)
    with conn:
        conn.execute("DROP TABLE IF EXISTS character_variants;")
        conn.execute("DROP TABLE IF EXISTS characters;")
        conn.execute("DROP TABLE IF EXISTS worlds;")
    conn.close()


def ingest_all():
    print("=" * 65)
    print("  REBASED IDENTITY ENGINE — REFACTORED INGESTION PIPELINE")
    print("=" * 65)

    print("\n[1/4] Dropping legacy tables and initializing clean schema...")
    drop_and_recreate_identity_tables()
    sdb.init_world_schema()
    cdb.init_character_schema()
    print("  [+] worlds schema (1006... tree with child_of)")
    print("  [+] characters schema (1004... with short_names, series_ids, hazard_rank)")
    print("  [+] character_variants schema (1005... symmetrical with variant_names)")

    print("\n[2/4] Seeding World Hierarchy Tree...")
    world_ids = sdb.seed_default_world_tree()
    print(f"  [+] Seeded {len(world_ids)} world tree nodes (Root: All -> Internet -> Vtuber -> Hololive -> HoloEN -> HoloMyth)")

    print("\n[3/4] Ingesting characters & variants...")
    char_count = cdb.seed_character_roster()
    print(f"  [+] Seeded {char_count} canonical characters with short names, series IDs, and variants")

    print("\n" + "=" * 65)
    print("  INGESTION COMPLETE")
    print("=" * 65)


def verify():
    print("\n" + "=" * 65)
    print("  DATABASE VERIFICATION")
    print("=" * 65)

    # 1. Check World Tree
    worlds = sdb.get_all_worlds()
    print(f"\n1. Worlds Tree ({len(worlds)} nodes):")
    for w in worlds:
        parent = f" -> child_of: {w['parent_name']}" if w['parent_name'] else " (Root)"
        print(f"   [{w['id']}] {w['name']:<22} {parent} (chars: {w.get('character_count', 0)})")

    # 2. Check Characters
    chars = cdb.get_all_characters_full()
    print(f"\n2. Characters Table ({len(chars)} entries):")
    for c in chars[:5]:
        print(f"   [{c['char_code']}] {c['canonical_name']:<18} short: {c['short_names']} series_ids: {c['series_ids']} rank: {c['hazard_rank']} variants: {c['variant_count']}")

    # 3. Check Variants
    variants = cdb.get_all_variants_full()
    print(f"\n3. Variants Table ({len(variants)} entries):")
    for v in variants:
        print(f"   [{v['id']}] Char: {v['char_code']} ({v['canonical_name']}) -> variant_names: {v['variant_names']} short: {v['short_names']}")

    # 4. Test Autocomplete Search
    ame_search = cdb.search_characters("Ame")
    print(f"\n4. Search test for 'Ame' (short name):")
    for s in ame_search:
        print(f"   Found: {s['char_code']} - {s['canonical_name']} (short: {s['short_names']})")


if __name__ == "__main__":
    ingest_all()
    verify()

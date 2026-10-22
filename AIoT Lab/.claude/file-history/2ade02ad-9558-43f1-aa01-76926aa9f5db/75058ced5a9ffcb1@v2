"""
Unit verification for Refactored Character, Variant, and World Tree Database.
Validates Manager's Vision:
  1. Characters Table: short_names, series_ids, hazard_rank (int), purged legacy blobs
  2. Character Variants: symmetrical to character, character_id FK, variant_names, no variant_key, no is_default
  3. Worlds: Hierarchical Tree with child_of self-referential FK, rules list
"""

import os
import sqlite3
import character_db as cdb
import series_db as sdb

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "data", "test_identity.db")


def run_tests():
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

    print("--- 1. Testing World Tree Initialization & Seeding ---")
    world_ids = sdb.seed_default_world_tree(TEST_DB_PATH)
    assert "All" in world_ids, "Root 'All' must exist"
    assert "Internet" in world_ids, "'Internet' node must exist"
    assert "Vtuber" in world_ids, "'Vtuber' node must exist"
    assert "Hololive" in world_ids, "'Hololive' node must exist"
    assert "HoloEN" in world_ids, "'HoloEN' node must exist"
    assert "HoloMyth" in world_ids, "'HoloMyth' node must exist"

    # Verify hierarchy
    myth = sdb.get_world_by_name("HoloMyth", world_ids["HoloEN"], TEST_DB_PATH)
    assert myth["child_of"] == world_ids["HoloEN"], f"HoloMyth parent must be HoloEN ({world_ids['HoloEN']})"
    assert myth["parent_name"] == "HoloEN"
    print(f"World Tree Seeded: HoloMyth ({myth['id']}) -> child_of: {myth['parent_name']} ({myth['child_of']})")

    tree = sdb.get_world_tree(TEST_DB_PATH)
    assert len(tree) == 1, "Should have 1 top root 'All'"
    assert tree[0]["name"] == "All"
    print(f"Root node '{tree[0]['name']}' has {len(tree[0]['children'])} primary branches: {[c['name'] for c in tree[0]['children']]}")

    print("\n--- 2. Testing Character Schema with Short Names & Series IDs ---")
    char_data = {
        "char_code": "A01",
        "canonical_name": "Amelia Watson",
        "short_names": ["Ame", "Watson"],
        "series_ids": [world_ids["HoloMyth"]],
        "hazard_rank": 3,
        "base_prompt": "watson amelia, blonde hair, blue eyes",
        "outfit": "deerstalker, plaid capelet, brown vest"
    }

    variants_data = [
        {
            "variant_names": ["The Casual Ame"],
            "short_names": ["Casual Ame"],
            "series_ids": [world_ids["HoloMyth"]],
            "hazard_rank": 3,
            "base_prompt": "amelia watson, short hair, bob cut",
            "outfit": "white shirt, brown vest"
        }
    ]

    saved_char = cdb.upsert_character(char_data, variants_data, TEST_DB_PATH)
    assert saved_char["char_code"] == "A01"
    assert saved_char["short_names"] == ["Ame", "Watson"], f"short_names must be list, got {saved_char['short_names']}"
    assert saved_char["series_ids"] == [world_ids["HoloMyth"]], f"series_ids must link to HoloMyth hex ID, got {saved_char['series_ids']}"
    assert saved_char["hazard_rank"] == 3, f"hazard_rank must be int 3, got {saved_char['hazard_rank']}"
    assert len(saved_char["variants"]) == 1, "Must have 1 variant attached"

    var = saved_char["variants"][0]
    assert var["variant_names"] == ["The Casual Ame"]
    assert "character_id" in var
    assert "variant_key" not in var, "variant_key must be purged"
    assert "is_default" not in var, "is_default must be purged"
    print(f"Character '{saved_char['canonical_name']}' ({saved_char['char_code']}) stored with short_names={saved_char['short_names']}, hazard_rank={saved_char['hazard_rank']}")
    print(f"Variant '{var['variant_names']}' stored with ID={var['id']}, character_id={var['character_id']}")

    print("\n--- 3. Testing Search Autocomplete across Codes, Names, and Short Names ---")
    # Search by code
    res1 = cdb.search_characters("A01", 5, TEST_DB_PATH)
    assert len(res1) == 1 and res1[0]["char_code"] == "A01"

    # Search by canonical name
    res2 = cdb.search_characters("Amelia", 5, TEST_DB_PATH)
    assert len(res2) == 1 and res2[0]["char_code"] == "A01"

    # Search by shortened name!
    res3 = cdb.search_characters("Ame", 5, TEST_DB_PATH)
    assert len(res3) == 1 and res3[0]["char_code"] == "A01"
    print("Search by short name 'Ame' successfully resolved character A01!")

    print("\n--- 4. Testing Cascading Foreign Key Integrity ---")
    conn = sqlite3.connect(TEST_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM character_variants;")
    assert cur.fetchone()[0] == 1, "Should have 1 variant before character deletion"
    conn.close()

    cdb.delete_character("A01", TEST_DB_PATH)
    conn = sqlite3.connect(TEST_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM character_variants;")
    assert cur.fetchone()[0] == 0, "Variants must be cascaded on character delete"
    conn.close()
    print("Cascading variant deletion verified.")

    # Cleanup
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

    print("\n[OK] All refactored schema and tree verification tests passed cleanly!")


if __name__ == "__main__":
    run_tests()

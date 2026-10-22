"""
Entropy Rose: Deterministic Quote ID Generator & Schema Seed Utility.
Generates millisecond-precision hex identifiers for O(1) temporal indexing.
"""

from datetime import datetime, timedelta
import json
import os

def generate_hex_id(dt: datetime = None) -> str:
    """
    Converts YYYYMMDDHHmmssfff (Year down to millisecond) into a compact 16-char hex string.
    Ensures O(1) chronological sortability and fixed deterministic length.
    """
    if dt is None:
        dt = datetime.now()
    # Format: YYYYMMDDHHmmssfff (e.g. 20260930153045123)
    time_str = dt.strftime("%Y%m%d%H%M%S%f")[:17]
    decimal_val = int(time_str)
    hex_val = f"{decimal_val:016X}"
    return hex_val

CANONICAL_ID_VINYL = "0047FB356CE62F42"
CANONICAL_ID_FAUST = "0047FB356CE65652"

def create_sample_quotes(deterministic: bool = True):
    if deterministic:
        id_vinyl = CANONICAL_ID_VINYL
        id_faust = CANONICAL_ID_FAUST
        date_str = "2026-09-30"
    else:
        now = datetime.now()
        t1 = now - timedelta(seconds=10)
        t2 = now
        id_vinyl = generate_hex_id(t1)
        id_faust = generate_hex_id(t2)
        date_str = t2.strftime("%Y-%m-%d")

    # First Quote: Vinyl Angel - Koi no Koe
    # Manager's refined schema:
    # - source_speaker: list of author hex IDs
    # - preference: list of responding quote hex IDs (one-directional)
    # - backlink: list of URL links
    # - tags: empty for now
    quote_1 = {
        "id": id_vinyl,
        "index": 1,
        "main_content": "Static hum, thrum—needle drops,\nSpinning echo, time just stops.\nFamiliar chords fill up the room,\nWrapped inside this faded tomb.",
        "context": "Lyricism from 'Koi no Koe' by Vinyl Angel. The needle touching groove marks the suspended temporal boundary where sound transcends decaying physical media—evoking acoustic memory and temporal suspension.",
        "date": date_str,
        "source_speaker": ["0047FB356CE62F42"],  # List of author hex IDs
        "preference": [],
        "backlink": [],  # List of URL links
        "tags": {}  # Empty for now
    }

    # Second Quote: Faust
    # Manager's refined schema:
    # - source_speaker: list of author hex IDs
    # - preference: list of responding quote hex IDs (one-directional)
    # - backlink: list of URL links
    # - tags: empty for now
    quote_2 = {
        "id": id_faust,
        "index": 2,
        "main_content": "The universe is built on a plan, the profound symmetry of which is somehow present in every inner corner of human thought.\nWe are not passive observers; we are the system observing itself.",
        "context": "Reflections on cybernetics and distributed consciousness.\nNoted while constructing the Faust Hivemind infrastructure at the nexus of order and entropy.",
        "date": date_str,
        "source_speaker": ["0047FB356CE65652"],  # List of author hex IDs
        "preference": [id_vinyl],  # Points to Quote #1 (Vinyl Angel)
        "backlink": [],  # List of URL links
        "tags": {}  # Empty for now
    }

    out_dir = r"d:\My Drive\Blue AI\Entropy\Rose\data"
    os.makedirs(out_dir, exist_ok=True)

    # 1. Primary O(1) Hash-Map Store (Keyed by 16-char Hex ID)
    json_path = os.path.join(out_dir, "quotes.json")
    quotes_map = {
        id_vinyl: quote_1,
        id_faust: quote_2
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(quotes_map, f, ensure_ascii=False, indent=2)

    # 2. Append-only event log
    jsonl_path = os.path.join(out_dir, "quotes.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(quote_1, ensure_ascii=False) + "\n")
        f.write(json.dumps(quote_2, ensure_ascii=False) + "\n")

    print(f"[OK] Seeded Quote #1 (Vinyl Angel) [{id_vinyl}]")
    print(f"[OK] Seeded Quote #2 (Faust) [{id_faust}]")
    print(f"[OK] Saved O(1) Hash Map to: {json_path}")
    print(f"[OK] Saved Event Log to: {jsonl_path}")

    # Synchronize to SQLite if available
    try:
        import sys
        sys.path.insert(0, r"d:\My Drive\Blue AI\Entropy\Rose")
        import db
        db.sync_from_jsonl()
        print("[OK] Synchronized SQLite rose_quotes.db and FTS5 search index")
    except Exception as e:
        print(f"[WARN] SQLite sync skipped: {e}")

if __name__ == "__main__":
    create_sample_quotes()

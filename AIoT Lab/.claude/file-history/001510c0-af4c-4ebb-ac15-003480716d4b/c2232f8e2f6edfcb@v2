"""
Entropy Rose / Prescripts: Deterministic Hex ID Generator & Schema Seed Utility.
Generates 16-character uppercase hex identifiers:
  <4 HEX PREFIX><12 HEX UNIX MILLISECONDS>
Prefixes:
  - 0001: Quotes
  - 0002: Containers (Origin / Franchise / Creator)
  - 0003: Specifics (Work / Character / Diary / Wisdom / Thought on) with default_usage_ids
  - 0004: Themes (Hierarchical Tree with child_of)
  - 0005: Usages (Usage Modes with Conflict Matrix)
"""

import time
from datetime import datetime
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PREFIX_QUOTE = "0001"
PREFIX_CONTAINER = "0002"
PREFIX_SPECIFIC = "0003"
PREFIX_THEME = "0004"
PREFIX_USAGE = "0005"

# Canonical fixed IDs for foundational seed entities (Prefixed with M- to clearly designate Mock Data)
CANONICAL_ID_VINYL_CONTAINER = "M-00020001A1088D80"
CANONICAL_ID_FAUST_CONTAINER = "M-00020001A1088D81"
CANONICAL_ID_MANAGER_CONTAINER = "M-00020001A1088D82"
CANONICAL_ID_MARCUS_CONTAINER = "M-00020001A1088D83"
CANONICAL_ID_BLAKE_CONTAINER = "M-00020001A1088D84"
CANONICAL_ID_EVA_CONTAINER = "M-00020001A1088D85"

# Canonical Usages (0005...) with Conflict Relationships (Mock Data)
CANONICAL_ID_USAGE_REWRITE = "M-00050001A1088D80"
CANONICAL_ID_USAGE_PROMPT = "M-00050001A1088D81"
CANONICAL_ID_USAGE_ANCHOR = "M-00050001A1088D82"
CANONICAL_ID_USAGE_RULE = "M-00050001A1088D83"
CANONICAL_ID_USAGE_PERSPECTIVE = "M-00050001A1088D84"

# Canonical Specifics (0003...) with default_usage_ids (Mock Data)
CANONICAL_ID_KOI_SPECIFIC = "M-00030001A1088D80"
CANONICAL_ID_FAUST_SPECIFIC = "M-00030001A1088D81"
CANONICAL_ID_DIARY_SPECIFIC = "M-00030001A1088D82"
CANONICAL_ID_WISDOM_SPECIFIC = "M-00030001A1088D83"
CANONICAL_ID_MEDITATIONS_SPECIFIC = "M-00030001A1088D84"
CANONICAL_ID_INFANT_JOY_SPECIFIC = "M-00030001A1088D85"
CANONICAL_ID_ASUKA_SPECIFIC = "M-00030001A1088D86"
CANONICAL_ID_THOUGHT_SPECIFIC = "M-00030001A1088D87"

# Canonical Themes (0004...) (Mock Data)
CANONICAL_ID_THEME_ORDER = "M-00040001A1088D80"
CANONICAL_ID_THEME_DECAY = "M-00040001A1088D81"

# Canonical Quotes (0001...) (Mock Data)
CANONICAL_ID_VINYL_QUOTE = "M-00010001A1088D80"
CANONICAL_ID_FAUST_QUOTE = "M-00010001A1088D81"
CANONICAL_ID_BLAKE_QUOTE = "M-00010001A1088D82"


def generate_hex_id(prefix: str = PREFIX_QUOTE, unix_ms: int = None) -> str:
    """
    Generates a 16-character uppercase hex identifier:
      <4 HEX PREFIX><12 HEX UNIX MILLISECONDS>
    """
    if unix_ms is None:
        unix_ms = int(time.time() * 1000)
    clean_prefix = str(prefix).upper().rjust(4, "0")[:4]
    hex_ts = f"{unix_ms:012X}"[-12:]
    return f"{clean_prefix}{hex_ts}"


def parse_hex_id_timestamp(hex_id: str) -> float:
    """Extracts Unix epoch timestamp (in seconds) directly from the 16-char hex ID."""
    if len(hex_id) < 16:
        return 0.0
    unix_ms = int(hex_id[4:], 16)
    return unix_ms / 1000.0


def create_sample_quotes(deterministic: bool = True):
    if deterministic:
        id_vinyl = CANONICAL_ID_VINYL_QUOTE
        id_faust = CANONICAL_ID_FAUST_QUOTE
        id_blake = CANONICAL_ID_BLAKE_QUOTE
        date_str = "2026-09-30"
    else:
        now_ms = int(time.time() * 1000)
        id_vinyl = generate_hex_id(PREFIX_QUOTE, now_ms - 10000)
        id_faust = generate_hex_id(PREFIX_QUOTE, now_ms - 5000)
        id_blake = generate_hex_id(PREFIX_QUOTE, now_ms)
        date_str = datetime.now().strftime("%Y-%m-%d")

    import db
    db.init_db()

    # 1. Seed Containers (Table 2)
    core_containers = [
        {"id": CANONICAL_ID_VINYL_CONTAINER, "name": "Vinyl Angel", "type": "persona", "notes": "Project & Acoustic Fiction"},
        {"id": CANONICAL_ID_FAUST_CONTAINER, "name": "Faust", "type": "intellect", "notes": "Strategic Analytical Intellect"},
        {"id": CANONICAL_ID_MANAGER_CONTAINER, "name": "The Manager", "type": "personal", "notes": "Visionary & Commander"},
        {"id": CANONICAL_ID_MARCUS_CONTAINER, "name": "Marcus Aurelius", "type": "author", "notes": "Stoic Emperor"},
        {"id": CANONICAL_ID_BLAKE_CONTAINER, "name": "William Blake", "type": "author", "notes": "Romantic Poet & Painter"},
        {"id": CANONICAL_ID_EVA_CONTAINER, "name": "Neon Genesis Evangelion", "type": "anime", "notes": "Studio Gainax"}
    ]
    for c in core_containers:
        db.upsert_container(c)

    # 2. Seed Usages (Table 5) with Conflict Matrix
    core_usages = [
        {
            "id": CANONICAL_ID_USAGE_REWRITE,
            "name": "Rewrite Craft",
            "description": "Sentence rhythm & prose training",
            "icon": "✍️",
            "conflicts_with": [CANONICAL_ID_USAGE_RULE]
        },
        {
            "id": CANONICAL_ID_USAGE_PROMPT,
            "name": "Diary Prompt",
            "description": "Creative catalyst for morning writing",
            "icon": "💡",
            "conflicts_with": []
        },
        {
            "id": CANONICAL_ID_USAGE_ANCHOR,
            "name": "Memory Anchor",
            "description": "Core realization from personal history",
            "icon": "⚓",
            "conflicts_with": [CANONICAL_ID_USAGE_PERSPECTIVE]
        },
        {
            "id": CANONICAL_ID_USAGE_RULE,
            "name": "Daily Rule",
            "description": "Actionable principle & meta-habit",
            "icon": "📜",
            "conflicts_with": [CANONICAL_ID_USAGE_REWRITE]
        },
        {
            "id": CANONICAL_ID_USAGE_PERSPECTIVE,
            "name": "Perspective / Levity",
            "description": "Cosmic scale / meme / curiosity",
            "icon": "🪐",
            "conflicts_with": [CANONICAL_ID_USAGE_ANCHOR]
        }
    ]
    for u in core_usages:
        db.upsert_usage(u)

    # 3. Seed Specifics (Table 3) with dates and default_usage_ids (NOT default tags)
    core_specifics = [
        {"id": CANONICAL_ID_KOI_SPECIFIC, "name": "Koi no Koe", "container_id": CANONICAL_ID_VINYL_CONTAINER, "category": "music", "date": "2026-09-30", "default_usage_ids": [CANONICAL_ID_USAGE_PROMPT], "notes": ""},
        {"id": CANONICAL_ID_FAUST_SPECIFIC, "name": "System Reflections", "container_id": CANONICAL_ID_FAUST_CONTAINER, "category": "insight", "date": "2026-09-30", "default_usage_ids": [CANONICAL_ID_USAGE_RULE], "notes": ""},
        {"id": CANONICAL_ID_DIARY_SPECIFIC, "name": "Diary", "container_id": CANONICAL_ID_MANAGER_CONTAINER, "category": "diary", "date": "2026", "default_usage_ids": [CANONICAL_ID_USAGE_ANCHOR], "notes": "Personal daily life reflections"},
        {"id": CANONICAL_ID_WISDOM_SPECIFIC, "name": "Wisdom", "container_id": CANONICAL_ID_MANAGER_CONTAINER, "category": "wisdom", "date": "2026", "default_usage_ids": [CANONICAL_ID_USAGE_RULE], "notes": "Accumulated personal meta-rules"},
        {"id": CANONICAL_ID_THOUGHT_SPECIFIC, "name": "Thought on", "container_id": CANONICAL_ID_MANAGER_CONTAINER, "category": "thought", "date": "2026", "default_usage_ids": [CANONICAL_ID_USAGE_PROMPT], "notes": "Compact personal take, open-ended without final conclusion"},
        {"id": CANONICAL_ID_MEDITATIONS_SPECIFIC, "name": "Meditations", "container_id": CANONICAL_ID_MARCUS_CONTAINER, "category": "book", "date": "180", "default_usage_ids": [CANONICAL_ID_USAGE_RULE], "notes": "Greek notes to himself"},
        {"id": CANONICAL_ID_INFANT_JOY_SPECIFIC, "name": "Infant Joy", "container_id": CANONICAL_ID_BLAKE_CONTAINER, "category": "poem", "date": "1789", "default_usage_ids": [CANONICAL_ID_USAGE_REWRITE, CANONICAL_ID_USAGE_PROMPT], "notes": "Songs of Innocence (1789)"},
        {"id": CANONICAL_ID_ASUKA_SPECIFIC, "name": "Asuka Langley Soryu", "container_id": CANONICAL_ID_EVA_CONTAINER, "category": "character", "date": "1995", "default_usage_ids": [CANONICAL_ID_USAGE_PROMPT], "notes": "Second Child"}
    ]
    for s in core_specifics:
        db.upsert_specific(s)

    # 4. Seed Themes (Table 4) - child_of Tree
    core_themes = [
        {"id": CANONICAL_ID_THEME_ORDER, "name": "Order & Entropy", "child_of": None, "notes": "Foundational laws of order, decay and emergence"},
        {"id": CANONICAL_ID_THEME_DECAY, "name": "Decay & Fading", "child_of": CANONICAL_ID_THEME_ORDER, "notes": "Physical media wear, temporal suspension"}
    ]
    for th in core_themes:
        db.upsert_theme(th)

    # 5. Seed Quotes (Table 1) - references specific_id, theme_ids, usage_ids (ZERO sentiment)
    quote_1 = {
        "id": id_vinyl,
        "index": 1,
        "main_content": "Static hum, thrum—needle drops,\nSpinning echo, time just stops.\nFamiliar chords fill up the room,\nWrapped inside this faded tomb.",
        "context": "Lyricism from 'Koi no Koe' by Vinyl Angel. The needle touching groove marks the suspended temporal boundary where sound transcends decaying physical media—evoking acoustic memory and temporal suspension.",
        "date": date_str,
        "specific_id": CANONICAL_ID_KOI_SPECIFIC,
        "theme_ids": [CANONICAL_ID_THEME_DECAY],
        "usage_ids": [CANONICAL_ID_USAGE_PROMPT],
        "preference": [],
        "backlinks": ["https://vinylangel.net/lyrics/koi-no-koe"]
    }

    quote_2 = {
        "id": id_faust,
        "index": 2,
        "main_content": "The universe is built on a plan, the profound symmetry of which is somehow present in every inner corner of human thought.\nWe are not passive observers; we are the system observing itself.",
        "context": "Reflections on cybernetics and distributed consciousness.\nNoted while constructing the Faust Hivemind infrastructure at the nexus of order and entropy.",
        "date": date_str,
        "specific_id": CANONICAL_ID_FAUST_SPECIFIC,
        "theme_ids": [CANONICAL_ID_THEME_ORDER],
        "usage_ids": [CANONICAL_ID_USAGE_RULE],
        "preference": [id_vinyl],
        "backlinks": []
    }

    quote_3 = {
        "id": id_blake,
        "index": 3,
        "main_content": "I have no name:\nI am but two days old.\nWhat shall I call thee?\nI happy am,\nJoy is my name.\nSweet joy befall thee!",
        "context": "Infant Joy from Songs of Innocence (1789)",
        "date": "1789",
        "specific_id": CANONICAL_ID_INFANT_JOY_SPECIFIC,
        "theme_ids": [],
        "usage_ids": [CANONICAL_ID_USAGE_REWRITE, CANONICAL_ID_USAGE_PROMPT],
        "preference": [],
        "backlinks": ["https://en.wikipedia.org/wiki/Infant_Joy"]
    }

    out_dir = os.path.join(BASE_DIR, "data")
    os.makedirs(out_dir, exist_ok=True)

    db.upsert_quote(quote_1, compile_after=False)
    db.upsert_quote(quote_2, compile_after=False)
    db.upsert_quote(quote_3, compile_after=True)

    print(f"[OK] Seeded Quotes with Specifics & Usages (Zero sentiment).")


if __name__ == "__main__":
    create_sample_quotes()

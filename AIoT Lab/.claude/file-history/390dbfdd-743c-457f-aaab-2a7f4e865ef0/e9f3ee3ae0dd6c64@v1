#!/usr/bin/env python3
"""
Paleo.gg JWTG Creature Data Scraper & Synchronizer
==================================================
Scrapes static JSON data from https://www.paleo.gg/games/jurassic-world-the-game/creatures
and generates exact schema-compliant dino.json and lookup.json for Universe 25 ARC Jurassic.
"""

import sys
import os
import json
import re
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional

BASE_URL = "https://www.paleo.gg/games/jurassic-world-the-game/creatures"
CDN_BASE = "https://cdn.paleo.gg/games/jwtg/images"

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def fetch_html(url: str, retries: int = 3, timeout: int = 15) -> Optional[str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == retries - 1:
                print(f"[HTTP Error] {url}: {e.code} {e.reason}", file=sys.stderr)
        except Exception as e:
            if attempt == retries - 1:
                print(f"[Network Error] {url}: {e}", file=sys.stderr)
    return None

def extract_next_data(html: str) -> Optional[Dict[str, Any]]:
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None

def fetch_creature_catalog() -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
    print(f"[*] Fetching master creature list from: {BASE_URL}")
    html = fetch_html(BASE_URL)
    if not html:
        raise RuntimeError("Failed to fetch master creature list from paleo.gg")

    data = extract_next_data(html)
    if not data:
        raise RuntimeError("Failed to extract __NEXT_DATA__ from paleo.gg catalog")

    dex = data.get("props", {}).get("pageProps", {}).get("dex", {})
    items = dex.get("items", [])
    filter_items = dex.get("filterItems", [])
    print(f"[+] Discovered {len(items)} creatures in dex catalogue.")
    return items, {"filterItems": filter_items}

def fetch_single_creature_detail(creature_item: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    uuid = creature_item.get("uuid") or creature_item.get("key")
    url = f"{BASE_URL}/{uuid}"
    html = fetch_html(url)
    if not html:
        return uuid, {}

    next_data = extract_next_data(html)
    if not next_data:
        return uuid, {}

    detail = next_data.get("props", {}).get("pageProps", {}).get("detail", {})
    return uuid, detail

def calculate_ferocity(health: int, damage: int) -> int:
    """JWTG Standard Ferocity = floor(health * 0.3125 + damage)"""
    return int(health * 0.3125 + damage)

def transform_creature(item: Dict[str, Any], detail: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    uuid = item.get("uuid") or item.get("key")
    rarity = detail.get("rarity") or item.get("rarity") or "common"
    hybrid_type = detail.get("hybrid_type") or item.get("hybrid_type") or "non-hybrid"
    region = detail.get("region") or item.get("region") or "jurassic"
    creature_class = detail.get("class") or item.get("class") or "carnivore"

    name = (detail.get("name") or item.get("name") or uuid.replace("_", " ")).upper()
    image_url = f"{CDN_BASE}/creature/{uuid}.png"
    release_date = detail.get("release_date")
    hatch_time_mins = detail.get("hatch_time") if detail.get("hatch_time") is not None else item.get("hatch_time")

    buy_price_dna = detail.get("dna_buy")
    sell_price_dna = detail.get("dna_sell")
    if sell_price_dna is None and buy_price_dna is not None:
        sell_price_dna = buy_price_dna // 2

    facts = detail.get("facts", [])
    ingredients = detail.get("ingredients", [])

    # Evolutions parsing
    evolutions = []
    health_evo = detail.get("health_evo", [])
    damage_evo = detail.get("damage_evo", [])

    if health_evo and damage_evo and len(health_evo) == len(damage_evo):
        for idx, (hp, dmg) in enumerate(zip(health_evo, damage_evo)):
            lvl = (idx + 1) * 10
            fero = calculate_ferocity(hp, dmg)
            evolutions.append({
                "level": lvl,
                "health": hp,
                "damage": dmg,
                "image_url": f"{CDN_BASE}/creature-portrait/{uuid}_evo{idx+1}.png",
                "portrait_frame": rarity,
                "ferocity": fero
            })

    # Heroic Evolutions (levels 50, 60, 70, 80, 90, 100)
    health_heroic = detail.get("health_heroic", [])
    damage_heroic = detail.get("damage_heroic", [])
    if health_heroic and damage_heroic and len(health_heroic) == len(damage_heroic):
        heroic_levels = [50, 60, 70, 80, 90, 100]
        for idx, (hp, dmg) in enumerate(zip(health_heroic, damage_heroic)):
            lvl = heroic_levels[idx] if idx < len(heroic_levels) else (50 + idx * 10)
            fero = calculate_ferocity(hp, dmg)
            evolutions.append({
                "level": lvl,
                "health": hp,
                "damage": dmg,
                "image_url": f"{CDN_BASE}/creature-portrait/{uuid}_heroic.png",
                "portrait_frame": rarity,
                "ferocity": fero
            })

    # Max ferocity and evo4 ferocity calculations
    if evolutions:
        evo4_fero = evolutions[3]["ferocity"] if len(evolutions) >= 4 else evolutions[-1]["ferocity"]
        max_fero = evolutions[-1]["ferocity"]
    else:
        # Fallback if no evo array present
        max_fero = detail.get("ferocity") or item.get("ferocity") or 0
        evo4_fero = max_fero

    # Maximum number calculation: 2^(len(evolutions)-1) => 8 for standard 4 evos, 512 for 10 evos
    num_evos = len(evolutions) if evolutions else 4
    maximum_number = 2 ** max(0, num_evos - 1)

    record = {
        "name": name,
        "image_url": image_url,
        "region": region,
        "rarity": rarity,
        "hybrid_type": hybrid_type,
        "class": creature_class,
        "release_date": release_date,
        "hatch_time_mins": hatch_time_mins,
        "buy_price_dna": buy_price_dna,
        "sell_price_dna": sell_price_dna,
        "facts": facts,
        "ingredients": ingredients,
        "evolutions": evolutions,
        "max_ferocity": max_fero,
        "evo4_ferocity": evo4_fero,
        "maximum_number": maximum_number
    }

    return uuid, record

def generate_lookup_table(dino_dict: Dict[str, Any]) -> Dict[str, Any]:
    all_classes = set()
    all_rarities = set()
    all_hybrid_types = set()
    all_regions = set()
    card_bg_combos = set()

    for _, dino in dino_dict.items():
        c = dino.get("class")
        r = dino.get("rarity")
        h = dino.get("hybrid_type")
        reg = dino.get("region")
        if c: all_classes.add(c)
        if r: all_rarities.add(r)
        if h: all_hybrid_types.add(h)
        if reg: all_regions.add(reg)
        if h and r: card_bg_combos.add((h, r))

    class_icons = {cls: f"{CDN_BASE}/class/{cls}.png" for cls in sorted(all_classes)}
    card_backgrounds = {f"{h}_{r}": f"{CDN_BASE}/card-bg/{h}/{r}.png" for h, r in sorted(card_bg_combos)}

    hybrid_types = {
        "non-hybrid": f"{CDN_BASE}/hybrid-type/non-hybrid.png",
        "speed": "https://static.vecteezy.com/system/resources/previews/034/089/782/non_2x/shopping-clock-or-stock-time-or-sale-hours-simple-gold-icon-for-apps-and-websites-vector.jpg",
        "hybrid": f"{CDN_BASE}/hybrid-type/hybrid.png",
        "super-hybrid": f"{CDN_BASE}/hybrid-type/super-hybrid.png"
    }

    regions = {reg: f"{CDN_BASE}/region/{reg}.png" for reg in sorted(all_regions)}
    portrait_frames = {rar: f"{CDN_BASE}/portrait-frame/{rar}.png" for rar in sorted(all_rarities)}

    stats = {
        "ferocity": f"{CDN_BASE}/stats/ferocity.png",
        "health": f"{CDN_BASE}/stats/health.png",
        "speed": f"{CDN_BASE}/stats/speed.png",
        "damage": f"{CDN_BASE}/stats/damage.png"
    }

    return {
        "class_icons": class_icons,
        "card_backgrounds": card_backgrounds,
        "hybrid_types": hybrid_types,
        "region": regions,
        "portrait_frames": portrait_frames,
        "stats": stats
    }

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.abspath(os.path.join(script_dir, "..", "..", ".."))

    dino_out_path = os.path.join(workspace_dir, "universe-25", "src", "apps", "arc-jurassic", "data", "dino.json")
    lookup_out_path = os.path.join(workspace_dir, "universe-25", "src", "apps", "arc-jurassic", "data", "lookup.json")

    if len(sys.argv) > 1:
        dino_out_path = sys.argv[1]
    if len(sys.argv) > 2:
        lookup_out_path = sys.argv[2]

    print(f"[*] Target Dino Output: {dino_out_path}")
    print(f"[*] Target Lookup Output: {lookup_out_path}")

    catalog_items, catalog_meta = fetch_creature_catalog()
    total = len(catalog_items)

    dino_dict = {}
    details_map = {}

    print(f"[*] Concurrently fetching {total} creature detail profiles (20 worker pool)...")
    completed = 0
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_item = {executor.submit(fetch_single_creature_detail, item): item for item in catalog_items}
        for future in as_completed(future_to_item):
            uuid, detail = future.result()
            details_map[uuid] = detail
            completed += 1
            if completed % 25 == 0 or completed == total:
                print(f"    -> Progress: {completed}/{total} ({completed*100//total}%)")

    print("[*] Transforming data into ARC Jurassic canonical schemas...")
    for item in catalog_items:
        uuid = item.get("uuid") or item.get("key")
        detail = details_map.get(uuid, {})
        u, transformed = transform_creature(item, detail)
        dino_dict[u] = transformed

    print(f"[+] Total creatures parsed and indexed: {len(dino_dict)}")

    lookup_dict = generate_lookup_table(dino_dict)

    os.makedirs(os.path.dirname(dino_out_path), exist_ok=True)
    os.makedirs(os.path.dirname(lookup_out_path), exist_ok=True)

    with open(dino_out_path, "w", encoding="utf-8") as f:
        json.dump(dino_dict, f, indent=4, ensure_ascii=False)
    print(f"[SUCCESS] Wrote dino.json ({len(dino_dict)} creatures) -> {dino_out_path}")

    with open(lookup_out_path, "w", encoding="utf-8") as f:
        json.dump(lookup_dict, f, indent=4, ensure_ascii=False)
    print(f"[SUCCESS] Wrote lookup.json -> {lookup_out_path}")

if __name__ == "__main__":
    main()

"""
Initialize database with Hazard Trigger default data.
"""

import db
import time


def seed_database():
    """Seed the database with default categories, nodes, pools, and presets."""

    db.init_db()

    print("[Seed] Initializing Rebased database with defaults...")

    # Categories
    categories = [
        {
            "id": "0002" + f"{int(time.time() * 1000):012X}"[-12:],
            "name": "Subject & Heroine",
            "description": "Central character archetypes and identity",
            "icon": "User",
            "color": "#e11d48",
            "selection_type": "single"
        },
        {
            "id": "0002" + f"{int(time.time() * 1000) + 1:012X}"[-12:],
            "name": "Hazard Triggers",
            "description": "Overdrive FX, energy fields, combat auras",
            "icon": "Flame",
            "color": "#f59e0b",
            "selection_type": "multiple"
        },
        {
            "id": "0002" + f"{int(time.time() * 1000) + 2:012X}"[-12:],
            "name": "Poses & Stances",
            "description": "Dynamic stances and anatomical poses",
            "icon": "Activity",
            "color": "#06b6d4",
            "selection_type": "single"
        },
        {
            "id": "0002" + f"{int(time.time() * 1000) + 3:012X}"[-12:],
            "name": "Camera & Lighting",
            "description": "Cinematic angles and volumetric lighting",
            "icon": "Camera",
            "color": "#3b82f6",
            "selection_type": "multiple"
        },
        {
            "id": "0002" + f"{int(time.time() * 1000) + 4:012X}"[-12:],
            "name": "Render & Engine",
            "description": "Octane render, 8k illustration, photoreal fidelity",
            "icon": "Sparkles",
            "color": "#ec4899",
            "selection_type": "single"
        }
    ]

    for cat in categories:
        db.upsert_category(cat)
        print(f"  [+] Category: {cat['name']}")

    # Nodes (sample from Hazard Trigger defaults)
    subject_cat_id = categories[0]['id']
    hazard_cat_id = categories[1]['id']
    poses_cat_id = categories[2]['id']
    camera_cat_id = categories[3]['id']
    render_cat_id = categories[4]['id']

    nodes = [
        {
            "id": db.generate_hex_id("0001"),
            "category_id": subject_cat_id,
            "label": "Eva Frontier (StellaBlade)",
            "token": "Eva Frontier, 1girl, sharp glowing amber eyes, sleek silver ponytail, high-definition face",
            "default_weight": 1.25,
            "rarity": "SSR",
            "tags": ["heroine", "combat", "eva"],
            "description": "Stellar combat heroine with signature silver ponytail and glowing eyes"
        },
        {
            "id": db.generate_hex_id("0001"),
            "category_id": subject_cat_id,
            "label": "2B Cyber Automata",
            "token": "2B, 1girl, tactical blindfold, short white bob hair, elegant combat android",
            "default_weight": 1.2,
            "rarity": "SSR",
            "tags": ["android", "heroine", "2b"]
        },
        {
            "id": db.generate_hex_id("0001"),
            "category_id": hazard_cat_id,
            "label": "Hazard Overdrive: Crimson Burst",
            "token": "hazard trigger active, crimson particle burst, glowing red overdrive veins, energy dissipation arcs",
            "default_weight": 1.35,
            "rarity": "SSR",
            "tags": ["hazard", "overclock", "aura"]
        },
        {
            "id": db.generate_hex_id("0001"),
            "category_id": poses_cat_id,
            "label": "Combat Stance: All Fours",
            "token": "on all fours combat stance, low predatory posture, looking up at viewer, arched back, dynamic tension",
            "default_weight": 1.2,
            "rarity": "SSR",
            "tags": ["pose", "all_fours", "combat"]
        },
        {
            "id": db.generate_hex_id("0001"),
            "category_id": camera_cat_id,
            "label": "Volumetric Neon Rimlight",
            "token": "volumetric light rays, high-contrast cyan and crimson rim lighting, deep cinematic shadows, raytraced reflections",
            "default_weight": 1.2,
            "rarity": "SSR",
            "tags": ["lighting", "neon", "volumetric"]
        },
        {
            "id": db.generate_hex_id("0001"),
            "category_id": render_cat_id,
            "label": "8K Masterpiece Illustration",
            "token": "masterpiece, best quality, ultra-detailed 8k illustration, extremely detailed CG, high fidelity rendering",
            "default_weight": 1.0,
            "rarity": "N",
            "tags": ["quality", "masterpiece"]
        }
    ]

    for node in nodes:
        db.upsert_node(node)
        print(f"  [+] Node: {node['label']}")

    # Gacha Pools
    pools = [
        {
            "id": db.generate_hex_id("0003"),
            "name": "Gacha: Facial Entropy",
            "description": "Nuanced facial expressions and micro-tells",
            "draw_count": 1,
            "items": [
                {"token": "subtle blush across cheekbones, sweat droplet on jawline", "weight": 1.1, "rarity": "SR"},
                {"token": "holographic data scrolling across pupil irises", "weight": 1.3, "rarity": "SSR"},
                {"token": "parted lips exhaling cool steam mist", "weight": 1.0, "rarity": "R"},
                {"token": "fierce focused brows, absolute combat determination", "weight": 1.0, "rarity": "N"}
            ]
        }
    ]

    for pool in pools:
        db.upsert_pool(pool)
        print(f"  [+] Pool: {pool['name']}")

    # Default Preset
    presets = [
        {
            "id": db.generate_hex_id("0004"),
            "name": "Eva Frontier: Hazard Overdrive Prime",
            "description": "Golden standard battle loadout with crimson aura and predatory pose",
            "target_engine": "ComfyUI",
            "active_node_ids": [nodes[0]['id'], nodes[2]['id'], nodes[3]['id'], nodes[4]['id'], nodes[5]['id']],
            "node_weights": {
                nodes[0]['id']: 1.25,
                nodes[2]['id']: 1.35,
                nodes[3]['id']: 1.2,
                nodes[4]['id']: 1.2
            },
            "custom_positive": "8k wallpaper, dramatic atmospheric perspective",
            "custom_negative": "cartoon, 3d render, sketch",
            "active_gacha_pool_ids": [pools[0]['id']]
        }
    ]

    for preset in presets:
        db.upsert_preset(preset)
        print(f"  [+] Preset: {preset['name']}")

    print("[OK] Database seeded successfully.")


if __name__ == "__main__":
    seed_database()

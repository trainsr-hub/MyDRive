"""
Rebased FastAPI Server - Full REST API for Hazard Trigger System
Port 8081 with CORS enabled for frontend
"""

import os
import shutil
import time
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
from models import (
    CategoryCreate, Category,
    NodeCreate, Node,
    PoolCreate, Pool,
    PresetCreate, Preset,
    ResolvedPromptResult
)
from graph_resolver import GraphResolver

import tournament_db as tdb
import tournament_engine as teng
import character_db as cdb
import album_db as adb

app = FastAPI(
    title="Rebased API",
    version="1.0.0",
    description="Hazard Trigger Prompt Engineering System"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))


def resolve_safe_path(rel_path: str) -> str:
    clean = rel_path.replace("\\", "/").strip("/")
    full = os.path.normpath(os.path.join(DATA_ROOT, clean))
    if not full.startswith(DATA_ROOT):
        raise HTTPException(status_code=403, detail="Path outside data directory")
    return full


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    db.init_db()
    tdb.init_tournament_schema()
    cdb.init_character_schema()
    cdb.seed_character_roster()
    adb.init_album_schema()
    adb.migrate_characters_to_individual_json_files()
    print("[OK] Rebased API server, Tournament, Character & Album Schemas initialized on port 8081")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "rebased-backend",
        "timestamp": int(time.time())
    }


# ==============================================================================
# VIRTUAL FILESYSTEM (ADAPTER COMPATIBILITY) ENDPOINTS
# ==============================================================================

@app.get("/api/fs/exists")
async def fs_exists(path: str = ""):
    full = resolve_safe_path(path)
    return {"exists": os.path.exists(full)}


@app.get("/api/fs/read")
async def fs_read(path: str = ""):
    full = resolve_safe_path(path)
    if not os.path.exists(full):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    if os.path.isdir(full):
        raise HTTPException(status_code=400, detail="Cannot read a directory")
    with open(full, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content=content, media_type="text/plain; charset=utf-8")


class WriteRequest(BaseModel):
    path: str
    content: str


@app.post("/api/fs/write")
async def fs_write(req: WriteRequest):
    full = resolve_safe_path(req.path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(req.content)
    return {"ok": True}


@app.get("/api/fs/list")
async def fs_list(path: str = ""):
    full = resolve_safe_path(path)
    if not os.path.exists(full) or not os.path.isdir(full):
        return {"files": [], "folders": []}
    files = []
    folders = []
    clean_base = path.replace("\\", "/").strip("/")
    for entry in os.scandir(full):
        entry_rel = f"{clean_base}/{entry.name}" if clean_base else entry.name
        if entry.is_dir():
            folders.append(entry_rel)
        else:
            files.append(entry_rel)
    return {"files": files, "folders": folders}


class MkdirRequest(BaseModel):
    path: str


@app.post("/api/fs/mkdir")
async def fs_mkdir(req: MkdirRequest):
    full = resolve_safe_path(req.path)
    os.makedirs(full, exist_ok=True)
    return {"ok": True}


class RenameRequest(BaseModel):
    old_path: str
    new_path: str


@app.post("/api/fs/rename")
async def fs_rename(req: RenameRequest):
    old_full = resolve_safe_path(req.old_path)
    new_full = resolve_safe_path(req.new_path)
    if not os.path.exists(old_full):
        raise HTTPException(status_code=404, detail="Source not found")
    os.makedirs(os.path.dirname(new_full), exist_ok=True)
    os.rename(old_full, new_full)
    return {"ok": True}


@app.delete("/api/fs/remove")
async def fs_remove(path: str = ""):
    full = resolve_safe_path(path)
    if not os.path.exists(full):
        return {"ok": True}
    if os.path.isdir(full):
        shutil.rmtree(full)
    else:
        os.remove(full)
    return {"ok": True}


# ==============================================================================
# CATEGORIES ENDPOINTS
# ==============================================================================

@app.get("/api/categories", response_model=List[Category])
async def list_categories():
    """Get all categories."""
    try:
        categories = db.get_all_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    """Create a new category."""
    try:
        category_id = db.generate_hex_id("0002")
        category_dict = category.dict()
        category_dict["id"] = category_id
        db.upsert_category(category_dict)
        return category_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category."""
    try:
        db.delete_category(category_id)
        return {"ok": True, "deleted": category_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# NODES ENDPOINTS
# ==============================================================================

@app.get("/api/nodes", response_model=List[Node])
async def list_nodes(category_id: Optional[str] = None):
    """Get all nodes, optionally filtered by category."""
    try:
        nodes = db.get_all_nodes()
        if category_id:
            nodes = [n for n in nodes if n['category_id'] == category_id]
        return nodes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/nodes", response_model=Node)
async def create_node(node: NodeCreate):
    """Create a new node."""
    try:
        node_id = db.generate_hex_id("0001")
        node_dict = node.dict()
        node_dict["id"] = node_id
        node_dict["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        db.upsert_node(node_dict)
        return node_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/nodes/{node_id}", response_model=Node)
async def update_node(node_id: str, node: NodeCreate):
    """Update an existing node."""
    try:
        node_dict = node.dict()
        node_dict["id"] = node_id
        node_dict["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        db.upsert_node(node_dict)
        return node_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/nodes/{node_id}")
async def delete_node(node_id: str):
    """Delete a node."""
    try:
        db.delete_node(node_id)
        return {"ok": True, "deleted": node_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# POOLS ENDPOINTS
# ==============================================================================

@app.get("/api/pools", response_model=List[Pool])
async def list_pools():
    """Get all gacha pools."""
    try:
        pools = db.get_all_pools()
        return pools
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pools", response_model=Pool)
async def create_pool(pool: PoolCreate):
    """Create a new gacha pool."""
    try:
        pool_id = db.generate_hex_id("0003")
        pool_dict = pool.dict()
        pool_dict["id"] = pool_id
        db.upsert_pool(pool_dict)
        return pool_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/pools/{pool_id}")
async def delete_pool(pool_id: str):
    """Delete a gacha pool."""
    try:
        db.delete_pool(pool_id)
        return {"ok": True, "deleted": pool_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# PRESETS ENDPOINTS
# ==============================================================================

@app.get("/api/presets", response_model=List[Preset])
async def list_presets():
    """Get all presets."""
    try:
        presets = db.get_all_presets()
        return presets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets", response_model=Preset)
async def create_preset(preset: PresetCreate):
    """Create a new preset."""
    try:
        preset_id = db.generate_hex_id("0004")
        preset_dict = preset.dict()
        preset_dict["id"] = preset_id
        preset_dict["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        db.upsert_preset(preset_dict)
        return preset_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """Delete a preset."""
    try:
        db.delete_preset(preset_id)
        return {"ok": True, "deleted": preset_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# GRAPH RESOLUTION ENDPOINT
# ==============================================================================

@app.post("/api/graph/resolve", response_model=ResolvedPromptResult)
async def resolve_graph(
    preset_id: str,
    seed: Optional[int] = None
):
    try:
        presets = db.get_all_presets()
        preset = next((p for p in presets if p['id'] == preset_id), None)

        if not preset:
            raise HTTPException(status_code=404, detail=f"Preset {preset_id} not found")

        all_nodes = db.get_all_nodes()
        active_nodes = [n for n in all_nodes if n['id'] in preset['active_node_ids']]
        all_pools = db.get_all_pools()

        wildcards = {}
        exclusions = {
            "forbidden_keywords": ["bad anatomy", "extra limbs", "mutated hands"],
            "global_negatives": [
                "lowres", "bad anatomy", "bad hands", "text", "error",
                "missing fingers", "extra digit", "fewer digits", "cropped",
                "worst quality", "low quality", "normal quality", "jpeg artifacts",
                "signature", "watermark", "username", "blurry"
            ],
            "auto_negatives": {}
        }

        resolver = GraphResolver(db)
        result = resolver.resolve_prompt_graph(
            active_nodes=active_nodes,
            node_weights=preset['node_weights'],
            gacha_pools=all_pools,
            active_gacha_pool_ids=preset['active_gacha_pool_ids'],
            wildcards=wildcards,
            exclusions=exclusions,
            target_engine=preset['target_engine'],
            custom_positive=preset['custom_positive'],
            custom_negative=preset['custom_negative'],
            seed=seed
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# TOURNAMENT BRACKET ENDPOINTS (Hex Prefix 1001 / 1002 / 1003)
# ==============================================================================

class TournamentCreatePayload(BaseModel):
    name: str
    format: Optional[str] = "single_elimination_32"
    notes: Optional[str] = ""
    participants: Optional[List[Dict[str, Any]]] = []


class MatchWinnerPayload(BaseModel):
    winner_char_id: str


@app.get("/api/tournaments")
async def get_tournaments():
    """List all registered tournaments."""
    try:
        return tdb.list_tournaments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tournaments")
async def create_tournament(payload: TournamentCreatePayload):
    """Create a tournament and generate its full dual-wing bracket tree."""
    try:
        tourney = tdb.create_tournament_record(
            name=payload.name,
            format_type=payload.format or "single_elimination_32",
            notes=payload.notes or ""
        )

        # Build bracket
        teng.build_dual_wing_bracket(
            tournament_id=tourney["id"],
            participants=payload.participants or []
        )

        return teng.get_tournament_projection(tourney["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tournaments/{tournament_id}")
async def get_tournament(tournament_id: str):
    """Get the complete visual bracket projection for a tournament."""
    try:
        return teng.get_tournament_projection(tournament_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tournaments/{tournament_id}/match/{match_id}/winner")
async def record_winner(tournament_id: str, match_id: str, payload: MatchWinnerPayload):
    """Record a match outcome and advance the winner up the bracket tree."""
    try:
        return teng.record_match_winner(
            tournament_id=tournament_id,
            match_id=match_id,
            winner_char_id=payload.winner_char_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateSlotPayload(BaseModel):
    display_name: str
    avatar_url: Optional[str] = None
    character_id: Optional[str] = None


@app.put("/api/tournaments/{tournament_id}/slot/{slot_code}")
async def update_slot(tournament_id: str, slot_code: str, payload: UpdateSlotPayload):
    """Update participant details for a base seed slot (l1..l8, r1..r8)."""
    try:
        return teng.update_slot_participant(
            tournament_id=tournament_id,
            slot_code=slot_code,
            display_name=payload.display_name,
            avatar_url=payload.avatar_url,
            character_id=payload.character_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str):
    """Delete a tournament and all its child matches/participants."""
    try:
        tdb.delete_tournament_record(tournament_id)
        return {"ok": True, "deleted": tournament_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# CHARACTER IDENTITY ENDPOINTS (Hex Prefix 1004 / 1005)
# ==============================================================================

@app.get("/api/characters")
async def list_characters(q: str = "", limit: int = 30):
    """Search or list characters from the SQLite database."""
    try:
        return cdb.search_characters(query=q, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/characters/all")
async def get_all_characters_full_api():
    """Get all characters with full columns and variant counts."""
    try:
        return cdb.get_all_characters_full()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/characters/{char_code}")
async def get_character(char_code: str):
    """Get full character definition and variants by char_code."""
    char = cdb.get_character_by_code(char_code)
    if not char:
        raise HTTPException(status_code=404, detail=f"Character '{char_code}' not found in SQLite database")
    return char


@app.delete("/api/characters/{char_code}")
async def delete_character_api(char_code: str):
    """Delete a character and its variants."""
    try:
        cdb.delete_character(char_code)
        return {"ok": True, "deleted": char_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# VARIANTS ENDPOINTS (Hex Prefix 1005)
# ==============================================================================

class VariantUpsertPayload(BaseModel):
    id: Optional[str] = None
    char_code: str
    variant_names: List[str]
    short_names: Optional[List[str]] = []
    series_ids: Optional[List[str]] = []
    taxonomy_ids: Optional[List[str]] = []
    stand_ids: Optional[List[str]] = []
    dna_ids: Optional[List[str]] = []
    hazard_rank: Optional[int] = 0
    base_prompt: Optional[str] = ""
    outfit: Optional[str] = ""
    avatar_url: Optional[str] = ""


@app.get("/api/variants")
async def list_all_variants():
    """List all variants across all characters."""
    try:
        return cdb.get_all_variants_full()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/variants")
async def upsert_variant_api(payload: VariantUpsertPayload):
    """Create or update a variant."""
    try:
        v_data = payload.dict(exclude={"char_code"})
        return cdb.upsert_single_variant(payload.char_code, v_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/variants/{variant_id}")
async def delete_variant_api(variant_id: str):
    """Delete a variant by ID."""
    try:
        cdb.delete_variant(variant_id)
        return {"ok": True, "deleted": variant_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# WORLDS TREE ENDPOINTS (Hex Prefix 1006)
# ==============================================================================

class WorldUpsertPayload(BaseModel):
    id: Optional[str] = None
    name: str
    child_of: Optional[str] = None
    description: Optional[str] = ""
    rules: Optional[List[str]] = []


@app.get("/api/worlds")
async def list_worlds():
    """List all worlds/series from the database."""
    try:
        import series_db as sdb
        return sdb.get_all_worlds()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/worlds/tree")
async def get_worlds_tree():
    """Get the full hierarchical recursive world tree from root."""
    try:
        import series_db as sdb
        return sdb.get_world_tree()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/worlds")
async def upsert_world_api(payload: WorldUpsertPayload):
    """Create or update a world node."""
    try:
        import series_db as sdb
        return sdb.upsert_world(payload.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/worlds/{world_id}")
async def get_world(world_id: str):
    """Get a specific world by ID."""
    try:
        import series_db as sdb
        world = sdb.get_world_by_id(world_id)
        if not world:
            raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")
        return world
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/worlds/{world_id}")
async def delete_world_api(world_id: str):
    """Delete a world by ID."""
    try:
        import series_db as sdb
        sdb.delete_world(world_id)
        return {"ok": True, "deleted": world_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# CHARACTER UPSERT & TOURNAMENT ASSIGNMENT
# ==============================================================================

class CharacterUpsertPayload(BaseModel):
    char_code: str
    canonical_name: str
    short_names: Optional[List[str]] = []
    series_ids: Optional[List[str]] = []
    taxonomy_ids: Optional[List[str]] = []
    stand_ids: Optional[List[str]] = []
    dna_ids: Optional[List[str]] = []
    hazard_rank: Optional[int] = 0
    base_prompt: Optional[str] = ""
    outfit: Optional[str] = ""
    avatar_url: Optional[str] = ""
    variants: Optional[List[Dict[str, Any]]] = None


@app.post("/api/characters")
async def upsert_character_api(payload: CharacterUpsertPayload):
    """Upsert a character into the SQLite database."""
    try:
        char_dict = payload.dict(exclude={"variants"})
        return cdb.upsert_character(char_dict, payload.variants)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SelectCharacterSlotPayload(BaseModel):
    char_code: str


@app.put("/api/tournaments/{tournament_id}/slot/{slot_code}/select-character")
async def select_character_for_slot(tournament_id: str, slot_code: str, payload: SelectCharacterSlotPayload):
    """
    Selects an existing character from SQLite by char_code and assigns it to a tournament slot.
    Strictly enforces 'no create new': returns 404 if char_code is not found in the database.
    """
    char = cdb.get_character_by_code(payload.char_code)
    if not char:
        raise HTTPException(
            status_code=404,
            detail=f"Character ID '{payload.char_code}' not found in database. Options are restricted to registered characters."
        )

    try:
        resolved_avatar = char.get("avatar_url") or adb.get_primary_avatar(char["id"])
        return teng.update_slot_participant(
            tournament_id=tournament_id,
            slot_code=slot_code,
            display_name=char["canonical_name"],
            avatar_url=resolved_avatar,
            character_id=char["char_code"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# ALBUMS & CHARACTER IMAGES ENDPOINTS (Hex Prefix 1007 / 1008)
# ==============================================================================

class AlbumUpsertPayload(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""


@app.get("/api/albums")
async def list_albums_api():
    """List all album containers from SQLite."""
    try:
        return adb.get_all_albums()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/albums")
async def upsert_album_api(payload: AlbumUpsertPayload):
    """Create or update an album container."""
    try:
        return adb.upsert_album(payload.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/albums/{album_id}")
async def delete_album_api(album_id: str):
    """Delete an album container."""
    try:
        adb.delete_album(album_id)
        return {"ok": True, "deleted": album_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CharacterImageAddPayload(BaseModel):
    image_url: str
    album_id: str
    char_code: Optional[str] = None


@app.get("/api/characters/{char_id}/images")
async def get_character_images_api(char_id: str):
    """Get all images linked to a character by their exact character_id or char_code."""
    try:
        return adb.get_images_for_character(char_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/characters/{char_id}/images")
async def add_character_image_api(char_id: str, payload: CharacterImageAddPayload):
    """Add an image to a character's chest linked to an album_id."""
    try:
        return adb.add_character_image(
            character_id=char_id,
            image_url=payload.image_url,
            album_id=payload.album_id,
            char_code=payload.char_code
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/characters/{char_id}/images/{image_id}")
async def delete_character_image_api(char_id: str, image_id: str):
    """Delete an image from a character's chest."""
    try:
        ok = adb.remove_character_image(char_id, image_id)
        return {"ok": ok, "deleted": image_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# GRACEFUL SHUTDOWN
# ==============================================================================

@app.post("/api/shutdown")
async def shutdown():
    """Graceful shutdown endpoint."""
    import signal

    def delayed_shutdown():
        import threading
        time.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)

    import threading
    threading.Thread(target=delayed_shutdown, daemon=True).start()
    return {"ok": True, "message": "Rebased server shutting down"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081, log_level="info")

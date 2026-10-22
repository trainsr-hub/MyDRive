"""
Pydantic models for strict type validation across all API boundaries.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ==============================================================================
# CATEGORIES
# ==============================================================================

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = ""
    color: Optional[str] = "#6366f1"
    selection_type: Optional[str] = "multiple"


class Category(CategoryCreate):
    id: str


# ==============================================================================
# NODES
# ==============================================================================

class NodeCreate(BaseModel):
    category_id: str
    label: str
    token: str
    default_weight: Optional[float] = 1.0
    rarity: Optional[str] = "N"
    tags: Optional[List[str]] = []
    gacha_pool_id: Optional[str] = None
    description: Optional[str] = ""


class Node(NodeCreate):
    id: str
    created_at: str


# ==============================================================================
# POOLS
# ==============================================================================

class PoolItem(BaseModel):
    token: str
    weight: Optional[float] = 1.0
    rarity: Optional[str] = "N"


class PoolCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    draw_count: Optional[int] = 1
    items: List[PoolItem] = []


class Pool(PoolCreate):
    id: str


# ==============================================================================
# PRESETS
# ==============================================================================

class PresetCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    target_engine: Optional[str] = "ComfyUI"
    active_node_ids: List[str] = []
    node_weights: Optional[Dict[str, float]] = {}
    custom_positive: Optional[str] = ""
    custom_negative: Optional[str] = ""
    active_gacha_pool_ids: List[str] = []


class Preset(PresetCreate):
    id: str
    created_at: str


# ==============================================================================
# GRAPH RESOLUTION
# ==============================================================================

class ResolvedPromptResult(BaseModel):
    positive_prompt: str
    negative_prompt: str
    loras: List[str] = []
    token_count: int
    active_nodes: List[Node]
    gacha_draws: List[Dict[str, Any]] = []
    seed: int
    timestamp: int

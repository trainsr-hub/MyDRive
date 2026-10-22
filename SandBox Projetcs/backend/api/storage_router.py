# backend/api/storage_router.py — Core 5-Tier Storage Router
import importlib
from fastapi import APIRouter
from core.storage_engine import OrderRequest
import core.storage_engine as storage_engine

router = APIRouter(tags=["Storage Engine"])

@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Blue Rose Storage Engine is running"}

@router.post("/api/v1/execute")
async def execute_order(req: OrderRequest):
    importlib.reload(storage_engine)
    return storage_engine.process_storage_order(req)


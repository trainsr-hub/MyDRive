# backend/api/golden_hour_router.py — Golden Hour Task & Hardware Bridge Router
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from integrations.notion.client import NotionClient
from integrations.google_tasks.client import GoogleTasksClient

router = APIRouter(prefix="/api/v1/golden-hour", tags=["Golden Hour Engine"])

# =============================================================================
# 1. GOOGLE TASKS API (High-Performance SQLite Engine & Metadata Inheritance)
# =============================================================================

@router.get("/google-tasks/status")
async def get_google_tasks_status():
    client = GoogleTasksClient()
    cached_data = client.get_cached_tasks(tasklist_id="all")
    return {
        "credentials_present": client.is_credentials_present(),
        "authenticated": client.is_authenticated(),
        "last_synced_at": cached_data.get("last_synced_at"),
        "cached_tasks_count": cached_data.get("total_cached_count", 0),
        "tasklists_count": len(cached_data.get("tasklists", []))
    }

@router.post("/google-tasks/auth")
async def authenticate_google_tasks(background_tasks: BackgroundTasks):
    """Trigger one-time browser OAuth flow directly via the backend."""
    client = GoogleTasksClient()
    if not client.is_credentials_present():
        raise HTTPException(
            status_code=400,
            detail="[FAIL LOUDLY] Google credentials.json is missing in backend/auth/."
        )
    try:
        if not client.is_authenticated():
            client.start_oauth_flow()

        # Trigger background cache sync
        background_tasks.add_task(client.sync_from_google_api)

        return {
            "success": True,
            "authenticated": client.is_authenticated(),
            "timestamp": datetime.now().isoformat()
        }
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[FAIL LOUDLY] OAuth Authorization failed: {str(e)}")

@router.post("/google-tasks/sync")
async def sync_google_tasks():
    """Explicitly triggers a sync of all lists from Google API into SQLite."""
    client = GoogleTasksClient()
    if not client.is_authenticated():
        raise HTTPException(status_code=401, detail="Google Tasks is not authenticated.")
    try:
        synced_data = client.sync_from_google_api()
        return {
            "success": True,
            "count": synced_data.get("tasks_count", 0),
            "lists_count": synced_data.get("lists_count", 0),
            "last_synced_at": synced_data.get("last_synced_at")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[FAIL LOUDLY] Sync failed: {str(e)}")

@router.get("/google-tasks/lists")
async def get_google_tasks_lists():
    """Reads all tasklists and their condition metadata from SQLite (< 0.5ms)."""
    client = GoogleTasksClient()
    tasklists = client.get_tasklists()

    # If empty on first start, sync once
    if not tasklists and client.is_authenticated():
        try:
            client.sync_from_google_api()
            tasklists = client.get_tasklists()
        except Exception:
            pass

    return {
        "success": True,
        "count": len(tasklists),
        "lists": tasklists,
        "timestamp": datetime.now().isoformat()
    }

class UpdateListConditionsRequest(BaseModel):
    tasklist_id: str
    conditions: Dict[str, Any]

@router.post("/google-tasks/lists/conditions")
async def update_list_conditions(req: UpdateListConditionsRequest):
    """Updates condition metadata tags on a specific list for child task inheritance."""
    client = GoogleTasksClient()
    res = client.update_list_conditions(req.tasklist_id, req.conditions)
    return res

@router.get("/google-tasks/tasks")
async def list_google_tasks(show_completed: bool = False, tasklist_id: Optional[str] = None):
    """Ultra-fast local SQLite query with inherited list metadata (< 0.5ms)."""
    client = GoogleTasksClient()
    if not client.is_credentials_present():
        raise HTTPException(
            status_code=400,
            detail="[FAIL LOUDLY] Google credentials.json is missing in backend/auth/."
        )

    target_id = tasklist_id if tasklist_id else "all"
    cache_result = client.get_cached_tasks(tasklist_id=target_id, show_completed=show_completed)

    # Initial auto-sync if completely empty
    if not cache_result["tasks"] and not cache_result["last_synced_at"] and client.is_authenticated():
        try:
            client.sync_from_google_api()
            cache_result = client.get_cached_tasks(tasklist_id=target_id, show_completed=show_completed)
        except Exception:
            pass

    return {
        "success": True,
        "count": len(cache_result["tasks"]),
        "tasks": cache_result["tasks"],
        "tasklists": cache_result.get("tasklists", []),
        "selected_list": target_id,
        "last_synced_at": cache_result["last_synced_at"],
        "timestamp": datetime.now().isoformat()
    }

class TaskCompleteRequest(BaseModel):
    task_id: str
    tasklist_id: Optional[str] = None

@router.post("/google-tasks/complete")
async def complete_google_task(req: TaskCompleteRequest):
    """
    1. Optimistically marks task completed in SQLite in < 0.2ms.
    2. Zero synthetic rewards injected per Manager Vision (pure task execution).
    3. Fires non-blocking background PATCH to Google Cloud.
    """
    client = GoogleTasksClient()
    try:
        res = client.complete_task(task_id=req.task_id, tasklist_id=req.tasklist_id)

        # Append audit log receipt to events.jsonl
        events_file = client.db_file.parent / "events.jsonl"
        try:
            event_row = {
                "type": "TASK_COMPLETED",
                "task_id": req.task_id,
                "tasklist_id": res.get("tasklist_id"),
                "timestamp": datetime.now().isoformat()
            }
            with open(events_file, "a", encoding="utf-8") as ef:
                ef.write(json.dumps(event_row, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[GoldenHour] Error writing to events.jsonl: {e}")

        return {
            "success": True,
            "task_id": req.task_id,
            "tasklist_id": res.get("tasklist_id"),
            "status": "completed",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[FAIL LOUDLY] Failed to complete task: {str(e)}")

# =============================================================================
# 2. NOTION API (Legacy & Deep Reference Database)
# =============================================================================

@router.get("/notion/status")
async def get_notion_status():
    client = NotionClient()
    return {
        "configured": client.is_configured(),
        "database_id": client.database_id,
        "has_api_key": bool(client.api_key)
    }

class NotionReadRequest(BaseModel):
    database_id: Optional[str] = None

@router.post("/notion/read")
async def read_notion_database(req: Optional[NotionReadRequest] = None):
    client = NotionClient()
    target_db = (req.database_id if req and req.database_id else None) or client.database_id
    if not client.api_key:
        raise HTTPException(
            status_code=400,
            detail="[FAIL LOUDLY] NOTION_API_KEY is missing. Check .env in project root."
        )
    if not target_db:
        raise HTTPException(
            status_code=400,
            detail="[FAIL LOUDLY] NOTION_DB_ID is missing. Provide database ID in request or in .env."
        )
    try:
        db_info = {}
        try:
            db_info = client.get_database_info(target_db)
        except Exception:
            pass

        raw_res = client.query_database(target_db)
        tasks = client.parse_tasks(raw_res)

        db_title_objs = db_info.get("title", [])
        db_title = "".join([t.get("plain_text", "") for t in db_title_objs]) or "Notion Task Database"

        db_props = db_info.get("properties", {})
        columns_schema = [
            {"name": name, "type": meta.get("type", "text"), "id": meta.get("id")}
            for name, meta in db_props.items()
        ]

        return {
            "success": True,
            "database_id": target_db,
            "database_title": db_title,
            "columns": columns_schema,
            "count": len(tasks),
            "tasks": tasks,
            "timestamp": datetime.now().isoformat()
        }
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[FAIL LOUDLY] Notion Query Error: {str(e)}")

# =============================================================================
# 3. ESP32 HARDWARE COMPACT QUEUE (< 0.5ms SQLite Response)
# =============================================================================

@router.get("/esp32/queue")
async def get_esp32_queue(tasklist_id: Optional[str] = None, limit: int = 3):
    """
    Returns the top focused directives (default 1 to 3 items) formatted
    specifically for ESP32 OLED/TFT display from SQLite database in < 0.5ms.
    """
    client = GoogleTasksClient()
    target_list = tasklist_id if tasklist_id else "all"
    cache_result = client.get_cached_tasks(tasklist_id=target_list, show_completed=False)
    all_active_tasks = cache_result.get("tasks", [])

    batch_size = max(1, min(limit, 10))
    focused_tasks = []

    for idx, t in enumerate(all_active_tasks[:batch_size], 1):
        cond = t.get("conditions", {})
        focused_tasks.append({
            "index": idx,
            "task_id": t["id"],
            "tasklist_id": t.get("tasklist_id"),
            "tasklist_title": t.get("tasklist_title", "Inbox"),
            "domain": cond.get("domain", "General"),
            "element": cond.get("element", "solar"),
            "priority": cond.get("priority_default", "normal"),
            "mode": cond.get("mode_default", "timer"),
            "target_seconds": cond.get("target_seconds", 1500),
            "title": t["title"][:28],
            "notes": t.get("notes", "")[:40],
            "due": t.get("due")
        })

    top_task = focused_tasks[0] if focused_tasks else None

    return {
        "success": True,
        "count": len(focused_tasks),
        "total_in_queue": len(all_active_tasks),
        "selected_list": target_list,
        "tasks": focused_tasks,
        "top_task": top_task,
        "last_synced_at": cache_result.get("last_synced_at")
    }

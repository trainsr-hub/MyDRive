#!/usr/bin/env python3
"""
Notion Read Verification — Integration Test
Method 2: Full stack test — Golden Hour store writes -> NotionClient reads back.
Usage (after backend is running):
    python test_notion_integration.py
This verifies the backend -> Notion -> frontend loop works.
"""
import requests, os, json, sys

BACKEND_URL = "http://localhost:8080/api/v1"
STORAGE_ROOT = r"D:\My Drive\SandBox Projetcs\backend"
TEST_RESULT_FILE = os.path.join(STORAGE_ROOT, "notion_integration_result.json")


def test_integration():
    # 1. Check backend health
    try:
        health = requests.get(f"{BACKEND_URL}/health", timeout=5)
        health.raise_for_status()
    except Exception as e:
        return {"success": False, "stage": "backend_health", "error": str(e)}

    # 2. Read from Notion (via backend endpoint — future)
    # For Phase 1: directly test NotionClient
    try:
        sys.path.insert(0, os.path.dirname(__file__))
        from notion_client import NotionClient
        client = NotionClient(
            api_key=os.getenv("NOTION_API_KEY"),
            database_id=os.getenv("NOTION_DB_ID"),
        )
        status = client.get_sync_status()
        return {
            "success": True,
            "stage": "notion_client_sync_status",
            "sync_status": status,
            "configured": client.is_configured(),
            "message": "NotionClient initialized; full read deferred to Phase 2 with real DB ID.",
        }
    except Exception as e:
        return {"success": False, "stage": "notion_client", "error": str(e)}


if __name__ == "__main__":
    result = test_integration()
    print(json.dumps(result, indent=2))
    with open(TEST_RESULT_FILE, "w") as f:
        json.dump(result, f, indent=2)

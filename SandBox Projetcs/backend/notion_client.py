# notion_client.py — Authoritative Notion API Client
# Storage Invariant: All caches and data reside on D:\
import os
import json
import subprocess
from typing import Dict, Any, List, Optional
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

def load_env_vars() -> Dict[str, str]:
    env_vars = {}
    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip().strip('"').strip("'")
    for k in ["NOTION_API_KEY", "NOTION_DB_ID"]:
        if k in os.environ and os.environ[k]:
            env_vars[k] = os.environ[k]
    return env_vars

class NotionClient:
    def __init__(self, api_key: Optional[str] = None, database_id: Optional[str] = None):
        envs = load_env_vars()
        self.api_key = api_key or envs.get("NOTION_API_KEY", "")
        self.database_id = database_id or envs.get("NOTION_DB_ID", "")
        self.version = "2022-06-28"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.database_id)

    def _call_notion(self, endpoint: str, method: str = "POST", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("NOTION_API_KEY is missing. Check D:\\My Drive\\SandBox Projetcs\\.env")

        url = f"https://api.notion.com/v1/{endpoint.lstrip('/')}"
        data_json = json.dumps(payload or {})

        cmd = [
            "curl.exe", "-s", "-X", method,
            url,
            "-H", f"Authorization: Bearer {self.api_key}",
            "-H", f"Notion-Version: {self.version}",
            "-H", "Content-Type: application/json",
            "-d", data_json
        ]

        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if proc.returncode != 0:
            raise RuntimeError(f"curl process failed with code {proc.returncode}: {proc.stderr}")

        try:
            return json.loads(proc.stdout)
        except Exception as e:
            raise RuntimeError(f"Failed to parse Notion JSON response: {proc.stdout} (Err: {e})")

    def get_database_info(self, db_id: Optional[str] = None) -> Dict[str, Any]:
        target_db = db_id or self.database_id
        if not target_db:
            raise ValueError("NOTION_DB_ID is missing.")
        res = self._call_notion(f"databases/{target_db}", method="GET")
        if res.get("object") == "error":
            if res.get("status") == 404:
                raise PermissionError(
                    f"[FAIL LOUDLY] Notion Database '{target_db}' was not found or has NOT been shared with integration 'Universe_25'. "
                    f"Please open your Notion page/table, click '...' (top right) -> 'Connections' -> add 'Universe_25'."
                )
            raise RuntimeError(f"Notion Error [{res.get('code')}]: {res.get('message')}")
        return res

    def query_database(self, db_id: Optional[str] = None) -> Dict[str, Any]:
        target_db = db_id or self.database_id
        if not target_db:
            raise ValueError("NOTION_DB_ID is missing.")

        res = self._call_notion(f"databases/{target_db}/query", method="POST", payload={})

        if res.get("object") == "error":
            error_code = res.get("code")
            error_msg = res.get("message")
            if res.get("status") == 404:
                raise PermissionError(
                    f"[FAIL LOUDLY] Notion Database '{target_db}' was not found or has NOT been shared with integration 'Universe_25'. "
                    f"Please open your Notion page/table, click '...' (top right) -> 'Connections' -> add 'Universe_25'."
                )
            raise RuntimeError(f"Notion API Error [{error_code}]: {error_msg}")

        return res

    def search_accessible(self) -> List[Dict[str, Any]]:
        res = self._call_notion("search", method="POST", payload={})
        if res.get("object") == "error":
            raise RuntimeError(f"Notion Search Error: {res.get('message')}")
        return res.get("results", [])

    def parse_tasks(self, query_response: Dict[str, Any]) -> List[Dict[str, Any]]:
        results = query_response.get("results", [])
        tasks = []
        for row in results:
            row_id = row.get("id")
            props = row.get("properties", {})

            title = ""
            status = "Pending"
            priority = "Normal"
            tags = []
            due_date = None
            raw_props_parsed: Dict[str, Any] = {}

            for p_name, p_val in props.items():
                p_type = p_val.get("type")
                name_lower = p_name.lower()
                extracted_val = None

                # Extract Title
                if p_type == "title":
                    title = "".join([t.get("plain_text", "") for t in p_val.get("title", [])])
                    extracted_val = title
                # Extract Status
                elif p_type in ["status", "select"] and any(k in name_lower for k in ["status", "state", "stage"]):
                    val_obj = p_val.get(p_type)
                    if val_obj:
                        status = val_obj.get("name", status)
                        extracted_val = status
                # Extract Priority
                elif p_type in ["select", "status"] and "priority" in name_lower:
                    val_obj = p_val.get(p_type)
                    if val_obj:
                        priority = val_obj.get("name", priority)
                        extracted_val = priority
                # Extract Checkbox
                elif p_type == "checkbox":
                    is_done = p_val.get("checkbox", False)
                    extracted_val = is_done
                    if is_done:
                        status = "Completed"
                # Extract Multi-select (tags)
                elif p_type == "multi_select":
                    tags = [t.get("name") for t in p_val.get("multi_select", [])]
                    extracted_val = tags
                # Extract Date
                elif p_type == "date":
                    d_obj = p_val.get("date")
                    if d_obj:
                        due_date = d_obj.get("start")
                        extracted_val = due_date
                elif p_type == "rich_text":
                    extracted_val = "".join([t.get("plain_text", "") for t in p_val.get("rich_text", [])])
                elif p_type == "number":
                    extracted_val = p_val.get("number")
                else:
                    extracted_val = f"({p_type})"

                raw_props_parsed[p_name] = {
                    "type": p_type,
                    "value": extracted_val
                }

            tasks.append({
                "id": row_id,
                "title": title or "(Empty Title)",
                "status": status,
                "priority": priority,
                "tags": tags,
                "dueAt": due_date,
                "url": row.get("url"),
                "properties": raw_props_parsed
            })

        return tasks

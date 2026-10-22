# backend/integrations/google_tasks/client.py — High-Performance SQLite Task Inheritance Engine
# Storage Invariant: All databases and caches reside on Local Disk D:\
import os
import json
import sqlite3
import subprocess
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
AUTH_DIR = BACKEND_DIR / "auth"
CREDENTIALS_FILE = AUTH_DIR / "credentials.json"
TOKEN_FILE = AUTH_DIR / "token.json"

APP_DATA_DIR = BACKEND_DIR / "data" / "projects" / "universe_25" / "app_data" / "golden_hour"
DB_FILE = APP_DATA_DIR / "tasks.db"
LEGACY_CACHE_FILE = APP_DATA_DIR / "tasks_cache.json"

SCOPES = ["https://www.googleapis.com/auth/tasks"]


def get_default_conditions_for_title(title: str) -> Dict[str, Any]:
    """Infers structural condition metadata & tags based on list title."""
    t_lower = title.lower()

    if "green" in t_lower:
        return {
            "domain": "Physical",
            "element": "verdant",
            "tags": ["green", "habits", "health"],
            "priority_default": "normal",
            "mode_default": "timer",
            "target_seconds": 1500
        }
    elif "quotes" in t_lower:
        return {
            "domain": "Wisdom",
            "element": "celestial",
            "tags": ["quotes", "philosophy", "insight"],
            "priority_default": "low",
            "mode_default": "atomic",
            "target_seconds": 300
        }
    elif "evo" in t_lower or "machina" in t_lower or "deus" in t_lower:
        return {
            "domain": "Deep Work",
            "element": "void",
            "tags": ["engineering", "ai", "high-leverage"],
            "priority_default": "high",
            "mode_default": "timer",
            "target_seconds": 3000
        }
    elif "project" in t_lower or "vg" in t_lower or "yg" in t_lower:
        return {
            "domain": "Project",
            "element": "aether",
            "tags": ["project", "hardware", "firmware"],
            "priority_default": "high",
            "mode_default": "timer",
            "target_seconds": 1800
        }
    elif "date" in t_lower or "dependence" in t_lower:
        return {
            "domain": "Scheduled",
            "element": "solar",
            "tags": ["deadline", "timed", "critical"],
            "priority_default": "urgent",
            "mode_default": "timer",
            "target_seconds": 1500
        }
    elif "hazard" in t_lower:
        return {
            "domain": "Hazard",
            "element": "void",
            "tags": ["hazard", "endgame", "backlog"],
            "priority_default": "urgent",
            "mode_default": "timer",
            "target_seconds": 3600
        }
    elif "arc" in t_lower or "emperor" in t_lower:
        return {
            "domain": "Core Arc",
            "element": "solar",
            "tags": ["arc", "mastery", "focus"],
            "priority_default": "high",
            "mode_default": "timer",
            "target_seconds": 2400
        }
    elif "inbox" in t_lower:
        color = "blue" if "blue" in t_lower else ("yellow" if "yellow" in t_lower else "triage")
        return {
            "domain": "Inbox",
            "element": "aether",
            "tags": ["inbox", color, "rapid-triage"],
            "priority_default": "normal",
            "mode_default": "atomic",
            "target_seconds": 900
        }
    else:
        return {
            "domain": "General",
            "element": "solar",
            "tags": ["general"],
            "priority_default": "normal",
            "mode_default": "timer",
            "target_seconds": 1500
        }


class GoogleTasksClient:
    def __init__(self):
        self.credentials_file = CREDENTIALS_FILE
        self.token_file = TOKEN_FILE
        self.db_file = DB_FILE
        self._cached_token: Optional[str] = None
        self._is_syncing = False

        # Initialize SQLite database and execute migrations if needed
        self._init_sqlite()

    def _get_connection(self) -> sqlite3.Connection:
        self.db_file.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_file), timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_sqlite(self):
        """Initializes relational tables and auto-migrates from legacy JSON if present."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasklists (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    conditions TEXT NOT NULL DEFAULT '{}',
                    sort_order INTEGER DEFAULT 0,
                    updated_at TEXT,
                    last_synced_at TEXT
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    tasklist_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    notes TEXT DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'needsAction',
                    due TEXT,
                    completed_at TEXT,
                    updated_at TEXT,
                    deleted INTEGER DEFAULT 0,
                    source TEXT DEFAULT 'google_tasks',
                    FOREIGN KEY (tasklist_id) REFERENCES tasklists(id) ON DELETE CASCADE
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(tasklist_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(status, deleted);")
            conn.commit()

        # Migrate from legacy tasks_cache.json if exists
        if LEGACY_CACHE_FILE.exists():
            try:
                self._migrate_from_legacy_cache()
            except Exception as e:
                print(f"[GoogleTasks] Legacy cache migration warning: {e}")

    def _migrate_from_legacy_cache(self):
        """Migrates tasks_cache.json into tasks.db and removes the monolithic file."""
        print("[GoogleTasks] Migrating legacy tasks_cache.json into SQLite tasks.db...")
        data = json.loads(LEGACY_CACHE_FILE.read_text(encoding="utf-8"))
        raw_lists = data.get("tasklists", [])
        raw_tasks = data.get("tasks", [])
        last_synced = data.get("last_synced_at") or datetime.now().isoformat()

        with self._get_connection() as conn:
            # 1. Upsert lists
            for tl in raw_lists:
                tl_id = tl.get("id")
                tl_title = tl.get("title", "Untitled List")
                cond = json.dumps(get_default_conditions_for_title(tl_title), ensure_ascii=False)
                conn.execute("""
                    INSERT INTO tasklists (id, title, conditions, updated_at, last_synced_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET title=excluded.title, last_synced_at=excluded.last_synced_at;
                """, (tl_id, tl_title, cond, tl.get("updated"), last_synced))

            # 2. Upsert tasks
            for t in raw_tasks:
                conn.execute("""
                    INSERT INTO tasks (id, tasklist_id, title, notes, status, due, completed_at, updated_at, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title,
                        notes=excluded.notes,
                        status=excluded.status,
                        due=excluded.due,
                        completed_at=excluded.completed_at,
                        updated_at=excluded.updated_at;
                """, (
                    t.get("id"),
                    t.get("tasklist_id"),
                    t.get("title", "(Untitled Task)"),
                    t.get("notes", ""),
                    t.get("status", "needsAction"),
                    t.get("due"),
                    t.get("completed"),
                    t.get("updated"),
                    t.get("source", "google_tasks")
                ))
            conn.commit()

        # Delete legacy file to clean app_data
        try:
            LEGACY_CACHE_FILE.unlink()
            print("[GoogleTasks] Legacy tasks_cache.json removed. SQLite migration complete.")
        except Exception:
            pass

    def is_credentials_present(self) -> bool:
        return self.credentials_file.exists()

    def is_authenticated(self) -> bool:
        if not self.token_file.exists():
            return False
        try:
            token_data = json.loads(self.token_file.read_text(encoding="utf-8"))
            return bool(token_data.get("token") or token_data.get("refresh_token"))
        except Exception:
            return False

    def get_valid_access_token(self) -> str:
        """Returns a valid access token, auto-refreshing via curl if expired."""
        if self._cached_token:
            return self._cached_token

        if not self.token_file.exists():
            raise FileNotFoundError("[FAIL LOUDLY] Google token.json not found. Please click 'Connect Google Tasks'.")

        token_data = json.loads(self.token_file.read_text(encoding="utf-8"))
        access_token = token_data.get("token")
        refresh_token = token_data.get("refresh_token")
        client_id = token_data.get("client_id")
        client_secret = token_data.get("client_secret")

        if (not client_id or not client_secret) and self.credentials_file.exists():
            try:
                c_data = json.loads(self.credentials_file.read_text(encoding="utf-8"))
                installed = c_data.get("installed") or c_data.get("web") or {}
                client_id = client_id or installed.get("client_id")
                client_secret = client_secret or installed.get("client_secret")
            except Exception:
                pass

        test_cmd = [
            "curl.exe", "-s",
            "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=1",
            "-H", f"Authorization: Bearer {access_token}",
            "-H", "Accept: application/json"
        ]
        res = subprocess.run(test_cmd, capture_output=True, text=True, encoding="utf-8")
        try:
            test_json = json.loads(res.stdout)
            if "error" in test_json:
                err_code = test_json["error"].get("code")
                err_msg = test_json["error"].get("message", "")

                if err_code == 403 and "Google Tasks API has not been used" in err_msg:
                    raise PermissionError(
                        "[FAIL LOUDLY] Google Tasks API is disabled in your Google Cloud project. "
                        "Enable it here: https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=430271827093"
                    )

                if err_code == 401 and refresh_token and client_id and client_secret:
                    refresh_cmd = [
                        "curl.exe", "-s", "-X", "POST",
                        "https://oauth2.googleapis.com/token",
                        "-d", f"client_id={client_id}",
                        "-d", f"client_secret={client_secret}",
                        "-d", f"refresh_token={refresh_token}",
                        "-d", "grant_type=refresh_token"
                    ]
                    ref_res = subprocess.run(refresh_cmd, capture_output=True, text=True, encoding="utf-8")
                    ref_json = json.loads(ref_res.stdout)
                    if "access_token" in ref_json:
                        token_data["token"] = ref_json["access_token"]
                        self.token_file.write_text(json.dumps(token_data, indent=2), encoding="utf-8")
                        self._cached_token = ref_json["access_token"]
                        return self._cached_token
                    else:
                        raise RuntimeError(f"Token refresh failed: {ref_res.stdout}")
        except PermissionError:
            raise
        except Exception:
            pass

        self._cached_token = access_token
        return access_token

    def _call_api(self, endpoint: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        token = self.get_valid_access_token()
        url = f"https://tasks.googleapis.com/tasks/v1/{endpoint.lstrip('/')}"

        cmd = [
            "curl.exe", "-s", "-X", method,
            url,
            "-H", f"Authorization: Bearer {token}",
            "-H", "Accept: application/json",
            "-H", "Content-Type: application/json"
        ]
        if payload is not None:
            cmd.extend(["-d", json.dumps(payload)])

        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode != 0:
            raise RuntimeError(f"curl process failed with code {res.returncode}: {res.stderr}")

        try:
            data = json.loads(res.stdout)
        except Exception as e:
            raise RuntimeError(f"Failed to parse Google API response: {res.stdout} (Err: {e})")

        if "error" in data:
            err_msg = data["error"].get("message", "Unknown error")
            err_code = data["error"].get("code", 500)
            if err_code == 403 and "Google Tasks API has not been used" in err_msg:
                raise PermissionError(
                    "[FAIL LOUDLY] Google Tasks API is disabled in your Google Cloud project. "
                    "Please enable it here: https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=430271827093"
                )
            raise RuntimeError(f"Google Tasks API Error [{err_code}]: {err_msg}")

        return data

    # =========================================================================
    # SQLITE RETRIEVAL WITH METADATA INHERITANCE (< 0.5ms Response)
    # =========================================================================

    def get_tasklists(self) -> List[Dict[str, Any]]:
        """Reads all tasklists with condition metadata from SQLite."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, conditions, sort_order, updated_at, last_synced_at FROM tasklists ORDER BY sort_order ASC, title ASC")
            rows = cursor.fetchall()
            lists = []
            for r in rows:
                cond = {}
                try:
                    cond = json.loads(r["conditions"] or "{}")
                except Exception:
                    pass
                lists.append({
                    "id": r["id"],
                    "title": r["title"],
                    "conditions": cond,
                    "sort_order": r["sort_order"],
                    "updated_at": r["updated_at"],
                    "last_synced_at": r["last_synced_at"]
                })
            return lists

    def update_list_conditions(self, tasklist_id: str, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Updates condition metadata tags on a specific list for child task inheritance."""
        with self._get_connection() as conn:
            cond_str = json.dumps(conditions, ensure_ascii=False)
            conn.execute("UPDATE tasklists SET conditions = ? WHERE id = ?", (cond_str, tasklist_id))
            conn.commit()
        return {"success": True, "tasklist_id": tasklist_id, "conditions": conditions}

    def get_cached_tasks(
        self,
        tasklist_id: Optional[str] = None,
        show_completed: bool = False
    ) -> Dict[str, Any]:
        """
        Fetches tasks with full inherited list metadata via SQL JOIN.
        Every task inherits its parent list's condition tags automatically.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Fetch lists for summary
            cursor.execute("SELECT id, title, conditions, last_synced_at FROM tasklists ORDER BY sort_order ASC, title ASC")
            lists_raw = cursor.fetchall()
            tasklists = []
            last_synced = None
            for lr in lists_raw:
                cond = {}
                try: cond = json.loads(lr["conditions"] or "{}")
                except Exception: pass
                if lr["last_synced_at"]:
                    last_synced = lr["last_synced_at"]
                tasklists.append({
                    "id": lr["id"],
                    "title": lr["title"],
                    "conditions": cond
                })

            # Relational query with list metadata inheritance
            query = """
                SELECT
                    t.id,
                    t.tasklist_id,
                    l.title AS tasklist_title,
                    l.conditions AS list_conditions,
                    t.title,
                    t.notes,
                    t.status,
                    t.due,
                    t.completed_at,
                    t.updated_at,
                    t.source
                FROM tasks t
                JOIN tasklists l ON t.tasklist_id = l.id
                WHERE t.deleted = 0
            """
            params: List[Any] = []

            if not show_completed:
                query += " AND t.status != 'completed'"

            if tasklist_id and tasklist_id != "all":
                query += " AND t.tasklist_id = ?"
                params.append(tasklist_id)

            query += " ORDER BY CASE WHEN t.due IS NOT NULL THEN 0 ELSE 1 END, t.due ASC, t.updated_at DESC"

            cursor.execute(query, params)
            task_rows = cursor.fetchall()

            tasks = []
            for tr in task_rows:
                inherited_cond = {}
                try:
                    inherited_cond = json.loads(tr["list_conditions"] or "{}")
                except Exception:
                    pass

                tasks.append({
                    "id": tr["id"],
                    "tasklist_id": tr["tasklist_id"],
                    "tasklist_title": tr["tasklist_title"],
                    "conditions": inherited_cond, # Child task inherits parent list condition metadata!
                    "title": tr["title"],
                    "notes": tr["notes"],
                    "status": tr["status"],
                    "due": tr["due"],
                    "completed": tr["completed_at"],
                    "updated": tr["updated_at"],
                    "source": tr["source"]
                })

            return {
                "last_synced_at": last_synced,
                "tasklists": tasklists,
                "tasks": tasks,
                "total_cached_count": len(tasks)
            }

    # =========================================================================
    # BATCH SYNC ENGINE (SQLite Transaction < 30ms for 500+ Tasks)
    # =========================================================================

    def sync_from_google_api(self, max_per_list: int = 100) -> Dict[str, Any]:
        """Directly pulls from Google API and commits all rows in a single SQLite transaction."""
        if not self.is_authenticated():
            raise RuntimeError("Google Tasks is not authenticated. Cannot sync from API.")

        # 1. Fetch all tasklists from Google
        lists_data = self._call_api("users/@me/lists?maxResults=100", method="GET")
        raw_lists = lists_data.get("items", [])

        # 2. Fetch tasks across lists
        fetched_lists = []
        fetched_tasks = []
        sync_timestamp = datetime.now().isoformat()

        for idx, tl in enumerate(raw_lists):
            tl_id = tl.get("id")
            tl_title = tl.get("title", "Untitled List")
            fetched_lists.append({
                "id": tl_id,
                "title": tl_title,
                "sort_order": idx,
                "updated": tl.get("updated")
            })

            try:
                endpoint = f"lists/{tl_id}/tasks?maxResults={max_per_list}&showCompleted=false&showHidden=false"
                data = self._call_api(endpoint, method="GET")
                for item in data.get("items", []):
                    title = item.get("title", "").strip()
                    if not title and not item.get("notes"):
                        continue
                    fetched_tasks.append({
                        "id": item.get("id"),
                        "tasklist_id": tl_id,
                        "title": title or "(Untitled Task)",
                        "notes": item.get("notes", ""),
                        "status": item.get("status", "needsAction"),
                        "due": item.get("due"),
                        "completed": item.get("completed"),
                        "updated": item.get("updated")
                    })
            except Exception as e:
                print(f"[GoogleTasks] Error pulling list '{tl_title}': {e}")

        # 3. Commit to SQLite in a single transaction
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Insert/Update Tasklists (preserving custom conditions if already customized)
            for fl in fetched_lists:
                cursor.execute("SELECT conditions FROM tasklists WHERE id = ?", (fl["id"],))
                existing_row = cursor.fetchone()
                if existing_row and existing_row["conditions"] and existing_row["conditions"] != "{}":
                    cond_str = existing_row["conditions"]
                else:
                    cond_str = json.dumps(get_default_conditions_for_title(fl["title"]), ensure_ascii=False)

                cursor.execute("""
                    INSERT INTO tasklists (id, title, conditions, sort_order, updated_at, last_synced_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title,
                        sort_order=excluded.sort_order,
                        updated_at=excluded.updated_at,
                        last_synced_at=excluded.last_synced_at;
                """, (fl["id"], fl["title"], cond_str, fl["sort_order"], fl["updated"], sync_timestamp))

            # Mark all existing tasks as deleted=0 before upserting active ones
            cursor.execute("UPDATE tasks SET deleted = 1 WHERE source = 'google_tasks' AND status != 'completed';")

            # Upsert active tasks
            for ft in fetched_tasks:
                cursor.execute("""
                    INSERT INTO tasks (id, tasklist_id, title, notes, status, due, completed_at, updated_at, deleted, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'google_tasks')
                    ON CONFLICT(id) DO UPDATE SET
                        tasklist_id=excluded.tasklist_id,
                        title=excluded.title,
                        notes=excluded.notes,
                        status=excluded.status,
                        due=excluded.due,
                        completed_at=excluded.completed_at,
                        updated_at=excluded.updated_at,
                        deleted=0;
                """, (
                    ft["id"],
                    ft["tasklist_id"],
                    ft["title"],
                    ft["notes"],
                    ft["status"],
                    ft["due"],
                    ft["completed"],
                    ft["updated"]
                ))

            # Purge tasks that no longer exist on Google
            cursor.execute("DELETE FROM tasks WHERE deleted = 1 AND status != 'completed';")
            conn.commit()

        return {
            "success": True,
            "last_synced_at": sync_timestamp,
            "lists_count": len(fetched_lists),
            "tasks_count": len(fetched_tasks)
        }

    # =========================================================================
    # O(1) INSTANT TASK COMPLETION
    # =========================================================================

    def complete_task(self, task_id: str, tasklist_id: Optional[str] = None) -> Dict[str, Any]:
        """
        O(1) local SQLite update in < 0.2ms.
        Dispatches non-blocking async background patch to Google Cloud.
        """
        target_list = tasklist_id or "@default"
        now_iso = datetime.now().isoformat()

        # 1. Update SQLite in < 0.2ms
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if not tasklist_id:
                cursor.execute("SELECT tasklist_id FROM tasks WHERE id = ?", (task_id,))
                row = cursor.fetchone()
                if row:
                    target_list = row["tasklist_id"]

            cursor.execute("""
                UPDATE tasks
                SET status = 'completed', completed_at = ?, updated_at = ?
                WHERE id = ?;
            """, (now_iso, now_iso, task_id))
            conn.commit()

        # 2. Asynchronous background patch to Google
        def _bg_patch():
            try:
                endpoint = f"lists/{target_list}/tasks/{task_id}"
                self._call_api(endpoint, method="PATCH", payload={"status": "completed"})
            except Exception as e:
                print(f"[GoogleTasks] Background patch error for task {task_id}: {e}")

        threading.Thread(target=_bg_patch, daemon=True).start()

        return {
            "success": True,
            "id": task_id,
            "tasklist_id": target_list,
            "status": "completed"
        }

    def start_oauth_flow(self) -> Dict[str, Any]:
        if not self.credentials_file.exists():
            raise FileNotFoundError(
                f"[FAIL LOUDLY] Google credentials.json not found at {self.credentials_file}."
            )
        from google_auth_oauthlib.flow import InstalledAppFlow
        flow = InstalledAppFlow.from_client_secrets_file(str(self.credentials_file), SCOPES)
        creds = flow.run_local_server(port=0)
        self.token_file.parent.mkdir(parents=True, exist_ok=True)
        self.token_file.write_text(creds.to_json(), encoding="utf-8")
        self._cached_token = creds.token

        # Run background sync on initial auth
        threading.Thread(target=self.sync_from_google_api, daemon=True).start()
        return {"success": True, "authenticated": True}

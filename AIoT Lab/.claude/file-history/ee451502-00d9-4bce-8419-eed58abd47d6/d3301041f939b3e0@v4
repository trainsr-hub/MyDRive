"""
Entropy Rose / Prescripts: Unified REST Server & Bridge for Full CRUD Studio.
Serves the Prescripts Studio single-page interface and provides REST endpoints
to Create, Read, Update, and Delete across all 4 tables:
  - Quotes, Containers, Specifics, Themes (child_of tree)
Includes graceful /api/shutdown to prevent orphaned processes.
"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json
import os
import sys
import threading
import urllib.parse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import db
from compile_projections import compile_projections

PORT = 20137


class PrescriptsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Origin, Accept")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/entry":
            self.send_response(302)
            self.send_header("Location", "/prescripts_entry.html")
            self.end_headers()
            return

        db.init_db()

        if path == "/api/taxonomy":
            tax_path = os.path.join(BASE_DIR, "data", "taxonomy_index.json")
            if not os.path.exists(tax_path):
                compile_projections()
            with open(tax_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(data)
            return

        if path == "/api/quotes":
            quotes_path = os.path.join(BASE_DIR, "data", "quotes_map.json")
            if not os.path.exists(quotes_path):
                compile_projections()
            with open(quotes_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(data)
            return

        if path == "/api/quotes/list":
            self._send_json(db.get_all_quotes())
            return

        if path == "/api/containers":
            self._send_json(db.get_all_containers())
            return

        if path == "/api/specifics":
            self._send_json(db.get_all_specifics())
            return

        if path == "/api/themes":
            self._send_json(db.get_all_themes())
            return

        if path == "/api/usages":
            self._send_json(db.get_all_usages())
            return

        if path == "/api/next_index":
            next_idx = db.get_next_index()
            self._send_json({"next_index": next_idx, "next_idx": next_idx})
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, status=400)
            return

        db.init_db()

        # Graceful shutdown endpoint
        if path == "/api/shutdown":
            self._send_json({"ok": True, "msg": "Shutting down Prescripts server"})
            threading.Thread(target=self.server.shutdown).start()
            return

        # --- TURSO CLOUD ONE-WAY SYNC ---
        if path == "/api/turso/sync":
            try:
                import turso_sync
                counts = turso_sync.sync_all_to_turso()
                self._send_json({"ok": True, "counts": counts, "msg": "Turso cloud database synchronized"})
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)
            return

        # --- QUOTES ---
        if path == "/api/quote":
            if not payload.get("main_content"):
                self._send_json({"error": "main_content is required"}, status=400)
                return

            if not payload.get("id"):
                from seed_quote import generate_hex_id, PREFIX_QUOTE
                payload["id"] = generate_hex_id(PREFIX_QUOTE)

            idx = payload.get("idx") or payload.get("index")
            if not idx:
                existing = db.get_quote(payload["id"])
                if existing:
                    idx = existing.get("idx") or existing.get("index")
                else:
                    idx = db.get_next_index()
            payload["index"] = int(idx)
            payload["idx"] = int(idx)

            db.upsert_quote(payload, compile_after=True)
            saved = db.get_quote(payload["id"])
            saved_scores = saved.get("scores", []) if saved else []
            saved_avg = saved.get("average_score") if saved else None
            self._send_json({
                "ok": True,
                "id": payload["id"],
                "index": payload["index"],
                "idx": payload["idx"],
                "scores": saved_scores,
                "average_score": saved_avg
            })
            return

        if path == "/api/quote/delete":
            qid = payload.get("id")
            if not qid:
                self._send_json({"error": "id is required"}, status=400)
                return
            db.delete_quote(qid)
            self._send_json({"ok": True, "deleted": qid})
            return

        # --- CONTAINERS ---
        if path == "/api/container":
            name = payload.get("name", "").strip()
            if not name:
                self._send_json({"error": "name is required"}, status=400)
                return

            if not payload.get("id"):
                from seed_quote import generate_hex_id, PREFIX_CONTAINER
                payload["id"] = generate_hex_id(PREFIX_CONTAINER)

            db.upsert_container(payload)
            compile_projections()
            self._send_json({"ok": True, "container": payload})
            return

        if path == "/api/container/delete":
            cid = payload.get("id")
            if not cid:
                self._send_json({"error": "id is required"}, status=400)
                return
            db.delete_container(cid)
            self._send_json({"ok": True, "deleted": cid})
            return

        # --- SPECIFICS ---
        if path == "/api/specific":
            name = payload.get("name", "").strip()
            cid = payload.get("container_id", "").strip()
            if not name or not cid:
                self._send_json({"error": "name and container_id are required"}, status=400)
                return

            if not payload.get("id"):
                from seed_quote import generate_hex_id, PREFIX_SPECIFIC
                payload["id"] = generate_hex_id(PREFIX_SPECIFIC)

            db.upsert_specific(payload)
            compile_projections()
            self._send_json({"ok": True, "specific": payload})
            return

        if path == "/api/specific/delete":
            sid = payload.get("id")
            if not sid:
                self._send_json({"error": "id is required"}, status=400)
                return
            db.delete_specific(sid)
            self._send_json({"ok": True, "deleted": sid})
            return

        # --- THEMES ---
        if path == "/api/theme":
            name = payload.get("name", "").strip()
            if not name:
                self._send_json({"error": "name is required"}, status=400)
                return

            if not payload.get("id"):
                from seed_quote import generate_hex_id
                payload["id"] = generate_hex_id("0004")

            db.upsert_theme(payload)
            compile_projections()
            self._send_json({"ok": True, "theme": payload})
            return

        if path == "/api/theme/delete":
            tid = payload.get("id")
            if not tid:
                self._send_json({"error": "id is required"}, status=400)
                return
            db.delete_theme(tid)
            self._send_json({"ok": True, "deleted": tid})
            return

        # --- USAGES ---
        if path == "/api/usage":
            name = payload.get("name", "").strip()
            if not name:
                self._send_json({"error": "name is required"}, status=400)
                return

            if not payload.get("id"):
                from seed_quote import generate_hex_id, PREFIX_USAGE
                payload["id"] = generate_hex_id(PREFIX_USAGE)

            db.upsert_usage(payload)
            compile_projections()
            self._send_json({"ok": True, "usage": payload})
            return

        if path == "/api/usage/delete":
            uid = payload.get("id")
            if not uid:
                self._send_json({"error": "id is required"}, status=400)
                return
            db.delete_usage(uid)
            self._send_json({"ok": True, "deleted": uid})
            return

        self._send_json({"error": "Endpoint not found"}, status=404)

    def _send_json(self, data, status=200):
        res = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(res)))
        self.end_headers()
        self.wfile.write(res)


def run_server(port: int = PORT):
    db.init_db()
    compile_projections()
    server = ThreadingHTTPServer(("127.0.0.1", port), PrescriptsHandler)
    print(f"[OK] Prescripts Studio Server live at http://127.0.0.1:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[OK] Server shutting down.")
        server.server_close()


if __name__ == "__main__":
    run_server()

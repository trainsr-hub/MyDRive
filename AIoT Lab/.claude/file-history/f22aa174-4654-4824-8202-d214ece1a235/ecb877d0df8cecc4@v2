"""
Entropy Rose / Prescripts: Development Server with Hot-Reload
Watches for file changes and automatically restarts the server.
Ideal for active development on database, API endpoints, or projections.
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BASE_DIR = Path(__file__).parent.absolute()
WATCH_DIRS = [
    str(BASE_DIR / "db.py"),
    str(BASE_DIR / "server.py"),
    str(BASE_DIR / "compile_projections.py"),
    str(BASE_DIR / "seed_quote.py"),
    str(BASE_DIR / "schemas"),
]
IGNORE_PATTERNS = {"*.pyc", "__pycache__", ".pytest_cache", "*.db-journal"}

server_process = None


class SourceChangeHandler(FileSystemEventHandler):
    """Restart server on Python file changes."""

    def on_modified(self, event):
        if event.is_directory:
            return
        if any(pattern in str(event.src_path) for pattern in IGNORE_PATTERNS):
            return
        if not event.src_path.endswith(".py"):
            return

        print(f"\n[RELOAD] Detected change: {Path(event.src_path).name}")
        restart_server()


def restart_server():
    """Kill existing server and spawn a new one."""
    global server_process

    if server_process and server_process.poll() is None:
        print("[RELOAD] Stopping server...")
        try:
            server_process.terminate()
            server_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            print("[RELOAD] Force-killing server...")
            server_process.kill()

    print("[RELOAD] Starting fresh server...\n")
    time.sleep(0.5)

    server_process = subprocess.Popen(
        [sys.executable, str(BASE_DIR / "server.py")],
        cwd=str(BASE_DIR),
        stdout=sys.stdout,
        stderr=sys.stderr,
    )


def run_dev_mode():
    """Run server with file watcher in development mode."""
    print("=" * 70)
    print("  Prescripts Studio — DEVELOPMENT MODE (Hot-Reload Enabled)")
    print("=" * 70)
    print(f"Watching for changes in: {BASE_DIR}\n")

    # Start initial server
    restart_server()

    # Set up file watcher
    event_handler = SourceChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=str(BASE_DIR), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
            # Check if server crashed unexpectedly
            if server_process.poll() is not None:
                print("\n[ERROR] Server crashed. Restarting...")
                time.sleep(2)
                restart_server()
    except KeyboardInterrupt:
        print("\n\n[OK] Shutting down development server...")
        observer.stop()
        if server_process and server_process.poll() is None:
            server_process.terminate()
            server_process.wait()
        observer.join()
        print("[OK] Development mode stopped.")


if __name__ == "__main__":
    run_dev_mode()

# backend/run_backend.py — Continuous Hot-Reloading Uvicorn Runner
# Automatically monitors and hot-reloads on any file changes in backend/
import os
import sys
from pathlib import Path
import uvicorn

BACKEND_DIR = Path(__file__).resolve().parent

if __name__ == "__main__":
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))

    print(f"[UVICORN] Starting Blue Rose Storage Engine with Hot-Reload on: {BACKEND_DIR}")
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        reload_dirs=[str(BACKEND_DIR)],
        reload_includes=["*.py", "*.json", ".env"],
        log_level="info"
    )

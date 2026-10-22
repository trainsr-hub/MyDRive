---
name: single-run-bat-launcher-pattern
description: All batch launchers and shortcuts must follow the Universe 25 pattern with continuous hot-reloading so they only need to be run once
metadata:
  node_type: memory
  type: feedback
  originSessionId: 89eac77a-8fc3-428f-b296-ceaa77daa1dd
  modified: 2026-10-19T17:32:27.407Z
---

All application, daemon, and UI launchers constructed for Faust and the Manager must strictly follow the Universe 25 golden standard (`Universe25.bat` / `ZZ - Shortcuts\Universe25.lnk`). The Manager must never be required to manually re-run or restart a `.bat` file upon code or template changes.

**Why:** Re-running batch scripts manually breaks flow and wastes the Manager's focus. Development servers should hot-reload code changes automatically while background launchers supervise lifecycle and process cleanup.

**How to apply:**
1. **Continuous Hot-Reloading**: Launch backend services (Uvicorn, Vite, Node) with `reload=True` watching code directories, so any code updates made by Faust or the Manager take effect live in <100ms without restarting the launcher.
2. **Universe 25 5-Pillars**:
   - Hardcoded project root `set "ROOT=D:\..."` with trailing backslash stripping.
   - Centralized `PYTHON_EXE` / `NODE_EXE` definitions.
   - Atomic process cleanup on start via PID file (`%TEMP%\<App>\<service>.pid`) and direct `netstat` listening port sweeps (`taskkill /F /PID`).
   - Headless background launch via single-line PowerShell `-WindowStyle Hidden -PassThru` with log redirection.
   - Companion `.lnk` shortcut placed in `ZZ - Shortcuts\` for 1-click access.

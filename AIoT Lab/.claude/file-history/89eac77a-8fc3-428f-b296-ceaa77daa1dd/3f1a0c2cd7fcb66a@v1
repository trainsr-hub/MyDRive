# Single-Run Batch Launcher Architecture & Continuous Hot-Reload Doctrine

All application, daemon, and UI launchers constructed for Faust and the Manager must strictly follow the **Universe 25 Single-Run Golden Standard** (`Universe25.bat` / `ZZ - Shortcuts\Universe25.lnk`).

### 1. The Single-Run Invariant (Run Once Only)
- The Manager must **never be required to manually re-run or restart a `.bat` file** when code, configuration, or UI templates are edited.
- All backend servers (Uvicorn, Vite, Node, FastAPI) must be launched with **continuous hot-reloading enabled**:
  ```python
  uvicorn.run(
      "main:app",
      host="0.0.0.0",
      port=PORT,
      reload=True,
      reload_dirs=[str(PROJECT_ROOT / "backend"), str(PROJECT_ROOT)],
      reload_includes=["*.py", "*.html", "*.json", ".env"],
  )
  ```
- Any code updates made by Faust or the Manager must reflect live in the running application within 100 milliseconds automatically.

### 2. The 5 Pillars of Universe 25 Launcher Design
Every `.bat` launcher must include:
1. **Hardcoded Project Root**:
   `set "ROOT=D:\..."` with trailing backslash stripping (`if "!ROOT:~-1!" == "\" set "ROOT=!ROOT:~0,-1!"`), allowing the `.bat` or its `.lnk` shortcut to be moved, clicked, or pinned from anywhere without path distortion.
2. **Centralized Executable Configuration**:
   Centralized `PYTHON_EXE` and `NODE_EXE` variable definitions at the top of the script.
3. **Atomic Process Cleanup & PID Tracking**:
   Store process IDs in `%TEMP%\<AppName>\<service>.pid`. On launch, kill prior process trees via PID, window title, and direct `netstat` listening port sweeps:
   `for /f "tokens=5" %%a in ('netstat -aon ^| findstr :<PORT> ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1`
4. **Windowless Headless Background Execution**:
   Launch processes via single-line PowerShell commands with `-WindowStyle Hidden -PassThru` and redirect stdout/stderr to dedicated log files (`%PID_DIR%\<service>.log`). Never spawn messy, lingering console windows.
5. **Accompanying Sovereign Shortcut (`.lnk`)**:
   Every launcher must have an accompanying `.lnk` shortcut registered in `D:\My Drive\Blue AI\ZZ - Shortcuts\` (or project shortcuts) for instant desktop accessibility.

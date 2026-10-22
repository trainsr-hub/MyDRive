# Universe 25 - Backend Setup Guide

## Backend Status
- **Code Location:** `D:\Users\HP\Blue AI\reference\backend\server.py`
- **Currently:** Not running (port 8080 unreachable)
- **Needs:** Data directory structure + universe_25 project registration

## Quick Start

### 1. Create Backend Data Structure
```powershell
cd "D:\Users\HP\Blue AI\reference\backend"
mkdir -p data/projects/universe_25/app_data
```

### 2. Copy Project Config
Copy `universe-25/backend-config/index.json` to `reference/backend/data/projects/universe_25/index.json`

### 3. Start Backend
```powershell
cd "D:\Users\HP\Blue AI\reference\backend"
python server.py
```

Backend will run at `http://127.0.0.1:8080`

### 4. Test Connection
Open `http://localhost:5173` (Vite dev server) and check console for API errors.

## Project Config
- **project_id:** `universe_25`
- **Tiers:**
  - `state` → `state.json` (Zustand snapshot)
  - `events` → `events.jsonl` (append-only log)

## Dev Mode Notes
- Frontend is local-first — works offline, syncs on explicit save
- All themes unlocked in dev mode
- Backend connection error is non-fatal (check browser console)

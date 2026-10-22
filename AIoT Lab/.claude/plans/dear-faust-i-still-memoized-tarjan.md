# Architecture & Execution Plan: Complete Elimination of app_data/system & Curler De-Ghosting

## Context & Root Cause

The Manager has identified that songs from "Yugo Kanno" (and potentially other previously purged channels) cannot be re-ingested because the curler engine reports them as "already present in database", despite the channel having 0 tracks in the active runtime database `_1_static.db`.

### The Cause
1. **Active Database (`app_data/_1_static.db`)**: 167,958 tracks. **0** tracks for "Yugo Kanno". The Origins tab queries this file, so "Yugo Kanno" does not appear in the UI.
2. **Ghost Directory (`app_data/system/`)**:
   - `system/_1_static.db` (173,913 tracks &rarr; 4,755 "Yugo Kanno" tracks)
   - `system/rawinfo.db` (173,773 tracks &rarr; 4,758 "Yugo Kanno" tracks)
   - `system/black_list.db` (1,095 track IDs)
   - `system/bad_kpi_list.db` (0 track IDs)
3. **Curler Ingestion (`curler_service.py`)**:
   Checks `system/_1_static.db` first. Since all Yugo Kanno video IDs exist there, `missing_ids` is evaluated as empty, so the curler skips fetching/inserting them into `app_data/_1_static.db` and falsely outputs `[GREEN - ALL TAKEN]`.

Per Manager's direct command:
> **"Just make it that we don't need 'D:\My Drive\SandBox Projetcs\backend\data\projects\music_app\app_data\system' anymore. Make sure to delete 'D:\My Drive\SandBox Projetcs\backend\data\projects\music_app\app_data\system' in the end"**

---

## Action Plan

### 1. Refactor Curler Services (`backend/integrations/curler/curler_service.py` & `backend/curler.py`)
- Remove all paths and references pointing to `app_data/system`:
  - Delete `SYSTEM_STATIC_DB_FILE`, `RAWINFO_DB_FILE`, `BLACKLIST_DB_FILE`, `BAD_KPI_DB_FILE`.
- Set `APP_STATIC_DB_FILE = BASE_DIR / "_1_static.db"` as the sole source of truth.
- Update `get_existing_video_ids()` to load IDs exclusively from `APP_STATIC_DB_FILE`.
- Deprecate `get_blacklisted_ids()` (return empty `set()`).
- In `save_to_target_databases()`, write exclusively to `APP_STATIC_DB_FILE`.
- In `stream_playlist_curl()`, initialize `all_known_ids` strictly from `APP_STATIC_DB_FILE`.

### 2. Update Storage Engine (`backend/core/storage_engine.py`)
- In `cascade_files` for Tier 1 deletion (lines 607-613):
  - Remove references to `app_data_dir / "system" / "rawinfo.db"` and `app_data_dir / "system" / "_1_static.db"`.
  - Cascade deletions strictly to `_3_state.db` and `_4_display.db`.

### 3. Update Configuration (`backend/data/projects/music_app/index.json`)
- Remove obsolete tiers pointing into `system/`:
  - `"blacklist": { "filename": "system/black_list.db", "format": "sqlite" }`
  - `"rawinfo": { "filename": "system/rawinfo.db", "format": "sqlite" }`
  - `"bad_kpi": { "filename": "system/bad_kpi_list.db", "format": "sqlite" }`

### 4. Delete the Entire `app_data/system` Directory
- Permanently delete `D:\My Drive\SandBox Projetcs\backend\data\projects\music_app\app_data\system` and all contents inside it (`_1_static.db`, `rawinfo.db`, `black_list.db`, `bad_kpi_list.db`, `filler.py`).

---

## Verification

1. Verify that `backend/data/projects/music_app/app_data/system` no longer exists on disk.
2. Verify that running `curler_service` queries only `_1_static.db`.
3. Check `all_known_ids`: confirm 0 "Yugo Kanno" video IDs are present.
4. Ingest/curl a Yugo Kanno playlist URL:
   - Confirm curler logs `[YELLOW - CURLED NEW]`.
   - Confirm songs are inserted into `_1_static.db`.
   - Confirm "Yugo Kanno" appears in the Origins tab with all its songs.

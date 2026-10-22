# Implementation Plan: Unavailable Videos Buffer & Management in Vinyl Angel

## Context
In the Vinyl Angel Gameplay tab (`VinylPlayer.tsx`), tracks are streamed via the embedded YouTube IFrame API. When a video in the catalog (`_1_static.db`) is removed, made private, or restricted for embedding on YouTube, the player emits an error (`onError` with codes like 100, 101, 150). Currently, the player logs a console warning and auto-skips to the next song after up to 5 consecutive errors, but the dead track remains in the database and re-appears in future sessions.

Per the Manager's vision:
1. When a video is unavailable to play, we will buffer its record/ID into a dedicated JSONL buffer file (`unavailable_videos.jsonl`).
2. We will display these buffered unavailable videos in a dedicated subtab within the `Video Ingestion` (`Song Ingestion`) tab (`VinylIngestion.tsx`).
3. The subtab will provide two clear buffer clearing options:
   - **"Clear the buffer"**: Empties the JSONL buffer without modifying the database.
   - **"Clear the buffer and delete the unavailable videos"**: Deletes the unavailable tracks from `_1_static.db` (which cascades to `_3_state.db` and `_4_display.db`, and records them in `blocked.db` to prevent re-curling), then empties the buffer.

---

## Architectural Design

### 1. Backend Data Tier Configuration (`backend/data/projects/music_app/index.json`)
Register a new JSONL tier named `unavailable` targeting `unavailable_videos.jsonl`:
```json
"unavailable": { "filename": "unavailable_videos.jsonl", "format": "jsonl" }
```
Because Faust's `storage_engine.py` natively supports `format: "jsonl"` for `append`, `read_all`, and `clear`, all standard tier orders work out of the box with zero custom endpoints:
- `append`: Appends an entry `{ id, title, channel, channel_id, timestamp, error_code, reason }`
- `read_all`: Returns all buffered entries as an array
- `clear`: Truncates the JSONL buffer to 0 bytes

### 2. Backend Storage Engine Polish (`backend/core/storage_engine.py`)
Enhance `fmt == "jsonl"` in `storage_engine.py` to also support single-item removal (`action: "delete"` by `key` or `id`) and `overwrite`/`overwrite_all` so individual items can be dismissed from the buffer if needed.
Ensure `tier == "1"` action `batch_delete` cascades cleanly to `_3_state.db`, `_4_display.db`, and `blocked.db` (already implemented, verify chunking and error resilience).

### 3. Type Definitions (`universe-25/src/apps/vinyl-angel/types.ts`)
Add interface for unavailable video buffer items:
```typescript
export interface UnavailableVideoEntry {
  id: string;
  title?: string;
  channel?: string;
  channel_id?: string;
  timestamp: string;
  error_code?: number;
  reason?: string;
}
```

### 4. Service Layer (`universe-25/src/apps/vinyl-angel/services/engine.ts`)
Add service helpers for interacting with the unavailable buffer and deleting tracks:
- `fetchUnavailableVideos(projectId: string): Promise<UnavailableVideoEntry[]>`
- `bufferUnavailableVideo(projectId: string, track: PlaylistItem, errorCode?: number): Promise<boolean>`
- `clearUnavailableBuffer(projectId: string): Promise<boolean>`
- `deleteUnavailableTrackFromBuffer(projectId: string, trackId: string): Promise<boolean>`
- `deleteUnavailableVideosAndClearBuffer(projectId: string, trackIds: string[]): Promise<{ deletedCount: number }>`

### 5. Gameplay Player Auto-Buffering (`VinylPlayer.tsx`)
In `VinylPlayer.tsx`:
- Maintain a session `Set<string>` of already-buffered track IDs (`bufferedUnavailableIdsRef`) to prevent redundant calls.
- In `onError: (e: any) => { ... }`:
  - Identify error code (`100` = Not Found/Private/Deleted, `101`/`150` = Embed Restricted, `2` = Invalid ID, etc.).
  - Read active track from `currentTrackRef.current`.
  - If track exists and hasn't been buffered in this session:
    - Call `bufferUnavailableVideo(targetProjectId, activeTrack, e?.data)`.
    - Show brief toast notification: `⚠️ Track "${activeTrack.title}" unavailable (${e?.data}). Buffered to Ingestion.`
  - Advance playback via `handleNextSong(null)`.

### 6. Subtab in Video Ingestion Tab (`VinylIngestion.tsx`)
In `VinylIngestion.tsx`:
- Add top-level subtab navigation:
  - 📚 **Playlists Ingestion** (existing ingestion lab, streaming diagnostics, logs)
  - ⚠️ **Unavailable Videos Buffer** (new subtab, with a counter badge showing pending unavailable count)
- In the **Unavailable Videos Buffer** subtab:
  - **Telemetry Summary Cards**:
    - Total buffered unavailable tracks
    - Affected unique channels
    - Last buffered timestamp
  - **Action Toolbar**:
    - 🧹 **"Clear the Buffer"** (clears `unavailable_videos.jsonl`, leaves database untouched)
    - 🗑️ **"Clear Buffer & Delete Unavailable Videos"** (executes `batch_delete` on Tier 1 to eradicate from catalog and cascade to Tier 3/4 + `blocked.db`, then clears buffer)
    - Filter by Channel dropdown
    - Search by Title / ID
  - **Data Table / Card List**:
    - Video thumbnail & direct YouTube watch link (`https://www.youtube.com/watch?v=${id}`)
    - Track Title & ID
    - Channel Name
    - Error code / reason badge
    - Detection timestamp
    - Individual item actions: "Dismiss from Buffer" or "Delete Track from DB"
  - **Empty State**:
    - Clean illustration/icon when buffer is empty: "All played tracks are healthy. No unavailable videos buffered."

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `backend/data/projects/music_app/index.json` | Register tier `"unavailable": { "filename": "unavailable_videos.jsonl", "format": "jsonl" }` |
| `backend/core/storage_engine.py` | Add `delete` action support for `fmt == "jsonl"` to allow individual entry removal |
| `universe-25/src/apps/vinyl-angel/types.ts` | Export `UnavailableVideoEntry` type interface |
| `universe-25/src/apps/vinyl-angel/services/engine.ts` | Add buffer, read, clear, and batch delete helper functions |
| `universe-25/src/apps/vinyl-angel/components/VinylPlayer.tsx` | Hook `onError` to automatically buffer unavailable tracks |
| `universe-25/src/apps/vinyl-angel/components/VinylIngestion.tsx` | Implement subtab switching and the Unavailable Videos Buffer UI with actions |

---

## Verification Plan

### End-to-End Testing Steps:
1. **Backend Tier Verification**:
   - Verify `executeOrder` with `tier: "unavailable"` can `append`, `read_all`, and `clear`.
   - Verify `executeOrder` with `tier: "1"` can `batch_delete` and cascades to `_3_state.db`, `_4_display.db`, and `blocked.db`.
2. **Gameplay Player Buffering**:
   - In `VinylPlayer.tsx`, trigger or simulate a video playback error (e.g., error code 100 or 150).
   - Check that the track details are appended to `unavailable_videos.jsonl`.
   - Check that toast notification confirms buffering.
3. **Ingestion Subtab UI**:
   - Navigate to `Song Ingestion` (`VinylIngestion.tsx`).
   - Switch to the `Unavailable Videos Buffer` subtab.
   - Verify buffered items appear with proper metadata and YouTube external links.
   - Test **"Clear the buffer"**: check that `unavailable_videos.jsonl` is emptied while `_1_static.db` maintains all songs.
   - Test **"Clear the buffer and delete the unavailable videos"**: verify items are deleted from `_1_static.db`, cascade to other tiers, recorded in `blocked.db`, and the buffer is cleared.

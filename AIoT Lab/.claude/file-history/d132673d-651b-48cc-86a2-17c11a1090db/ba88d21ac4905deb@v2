# Plan: Immediate Block Removal from Vinyl Angel Gameplay Pool

## Context

The user identified a significant issue with the current blocking mechanism in Vinyl Angel. Currently, when a song is blocked in the Gameplay tab:

1. **Current Flow**: Block event → Tier 2 JSONL buffer → Manual sync trigger → Blacklist DB → Pool filtering
2. **Problem**: Blocked songs remain in the active pool until the JSONL buffer is manually synced to Tier 3→4
3. **User Experience Impact**: Users can encounter the same blocked song multiple times before the sync happens

**User's Request**: Make blocking **immediately** remove songs from the pool instead of waiting for the buffer resolution. The user also wants to eliminate the dependency on `black_list.db` and `bad_kpi_list.db` - blocking should be the **only** way songs get removed from the pool.

## Current Architecture Analysis 

**Blocking Flow (From Explore Agent)**:
- `VinylPlayer.tsx` → `handleNextSong('block')` → `logActionToTier2(track, 'block')`
- `logActionToTier2` appends block event to Tier 2 JSONL buffer (`_2_events.jsonl`)
- Manual sync: `syncTier2ToTier3` → processes block events → adds to `blacklist` DB
- Pool filtering: `fetchSampledTracks` uses `get_blacklisted_ids()` to exclude blacklisted songs

**Key Files Identified**:
- Frontend: `VinylPlayer.tsx` - block button handlers
- Backend: `storage_engine.py` - pool sampling with blacklist filtering
- Backend: `curler_service.py` - `get_blacklisted_ids()` function
- Engine: `engine.ts` - sync functions that process block events

## Implementation Plan

### Phase 1: Frontend Immediate Removal

**File**: `universe-25/src/apps/vinyl-angel/components/VinylPlayer.tsx`

1. **Modify `logActionToTier2`** for 'block' actions:
   - Keep existing Tier 2 logging for audit trail
   - **Add immediate local removal** from current session's playlist
   - Update `seenIdsRef` to permanently exclude the blocked ID
   - Show immediate toast feedback

2. **Modify `handleNextSong('block')`**:
   - Immediately remove blocked song from `playlist` state
   - Update `playlistRef.current` to exclude blocked song
   - Advance to next song without delay

3. **Update buffer replenishment logic**:
   - Modify `replenishBufferIfNeeded` and `fetchMoreSampledTracks` calls
   - Ensure `seenIdsRef` is passed as exclusion filter to prevent re-sampling blocked songs

### Phase 2: Backend Pool Filtering Simplification

**Simplified approach**: Add `exclude_ids` parameter to existing `sample` action

**File**: `backend/core/storage_engine.py`

1. **Add `exclude_ids` handling in `sample` action** (lines 475-528):
   ```python
   exclude_ids = None
   if isinstance(payload, dict):
       exclude_ids = payload.get("exclude_ids")  # List of blocked song IDs
   
   # In the SQL query building:
   ex_ids = _parse_exclude_list(exclude_ids)
   if ex_ids:
       placeholders = ", ".join(["?"] * len(ex_ids))
       conditions.append(f"id NOT IN ({placeholders})")
       params.extend(ex_ids)
   ```

This eliminates the need to read from blacklist DBs at query time - blocked IDs come directly from the frontend.

**Note**: No changes needed in `curler_service.py` - blacklist DBs still exist but are not used for pool filtering.

### Phase 3: Engine Layer Updates

**File**: `universe-25/src/apps/vinyl-angel/services/engine.ts`

1. **Modify `fetchSampledTracks` and `fetchMoreSampledTracks`**:
   - Add `blockedIds` parameter to pass immediately blocked songs
   - Update API calls to backend with exclusion list
   - Maintain session-level blocked IDs in memory or store

2. **Update sync functions** (optional):
   - Keep `syncTier2ToTier3` for audit purposes
   - Remove blacklist DB population (since immediate removal handles filtering)

### Phase 4: Store Integration (Leverage Option B)

Since we just implemented Option B (shared Zustand store), we can use it for blocked song tracking:

**File**: `universe-25/src/apps/vinyl-angel/store/useVinylStore.ts`

1. **Add blocked songs state**:
   ```typescript
   blockedSongIds: Set<string>;
   addBlockedSong: (songId: string) => void;
   ```

2. **Integrate with pool sampling**:
   - Pass `blockedSongIds` to all API calls that fetch songs
   - Ensure blocked songs persist across tab switches
   - Optional: Persist to localStorage for session persistence

### Phase 5: Backend Database Cleanup

**Files**: 
- `backend/data/projects/music_app/app_data/system/black_list.db` (remove dependency)
- `backend/data/projects/music_app/app_data/system/bad_kpi_list.db` (remove dependency)

1. **Remove blacklist DB dependencies**:
   - Keep files but don't use them for pool filtering
   - Only Gameplay tab blocking affects the pool
   - Clean up references in curler and sync logic

## Verification Plan

### End-to-End Test:
1. **Open Vinyl Angel Gameplay tab**
2. **Play a song and click "Block & Skip Now"**
3. **Expected**: Song immediately disappears from session, never appears again
4. **Verify**: No blocked song appears in subsequent `replenishBufferIfNeeded` calls
5. **Verify**: Tab switching preserves blocked song exclusions (Option B store integration)

### API Verification:
1. **Check network calls**: `fetchSampledTracks` should include excluded IDs
2. **Check store state**: Blocked song IDs persist in Zustand store
3. **Check buffer replenishment**: New songs exclude blocked IDs from `seenIdsRef`

### Regression Testing:
1. **Rating system**: Non-block ratings still work normally
2. **Sync system**: Tier 2 JSONL still logs block events for audit
3. **Tab synchronization**: Option B store changes work with new blocking logic

## Implementation Notes

- **Backward Compatibility**: Keep Tier 2 JSONL logging for audit trail and existing sync workflows
- **Performance**: Frontend exclusion is O(1) lookup, more efficient than backend DB queries  
- **Data Integrity**: Block events still logged to `_2_events.jsonl` for historical tracking
- **User Experience**: Immediate feedback with toast notifications and instant song removal

This approach transforms blocking from an **eventual consistency** model to an **immediate consistency** model while maintaining audit trails and leveraging the newly implemented Option B shared store for cross-tab persistence.
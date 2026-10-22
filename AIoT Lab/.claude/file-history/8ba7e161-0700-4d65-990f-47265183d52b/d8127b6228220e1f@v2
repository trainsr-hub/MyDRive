# Plan: Add Playing Track's Origin Playlist/Channel to Custom Playlist in Vinyl Angel

## Context
In Vinyl Angel (`D:\My Drive\SandBox Projetcs\universe-25\src\apps\vinyl-angel`), audio streams can be filtered by origin channels (ingested YouTube playlists) or thematic **Custom Playlists** (federations of channels stored in `playlists.db`).
Currently in the Gameplay Tab (`VinylPlayer.tsx`), users can listen to a track, rate it, and view its origin channel (`currentTrack.channel`), but there is no direct action to add that playing track's origin channel to an existing custom playlist or create a new custom playlist around it without leaving gameplay to navigate to the Playlists Tab.

The intended outcome is to empower the Manager to seamlessly curate playing channels directly from the Gameplay workstation with a single click, persisting changes immediately to both the Zustand store and SQLite `playlists.db`.

---

## Recommended Implementation Approach

### 1. Interactive "+ Playlist" Popover in Track Metadata Row
In `VinylPlayer.tsx`, wrap the existing `{currentTrack.channel}` display (around line 2249) in a container with a compact trigger button:
- **Trigger**: `[+ Playlist ▾]` button adjacent to `{currentTrack.channel}`.
- **Visual Design**: Sleek celestial styling matching Vinyl Angel's theme (`bg-[#1a1424]`, border `#3d304f`, hover `#ffd86b`).
- **Popover Dropdown**:
  - Displays the active origin channel badge (`currentTrack.channel`).
  - Search filter input (if more than 4 custom playlists exist).
  - Scrollable list of user's custom playlists from `useVinylStore`:
    - Shows `{pl.emoji} {pl.name}` and member count.
    - **Already Member**: Displays a subtle green `✓ In Playlist` badge.
    - **Not Member**: Displays a `+ Add` button with hover glow and in-flight loading spinner.
  - **Inline Quick Create**: Simple text input + `+ Create` button to quickly forge a new custom playlist with `[currentTrack.channel]` pre-selected.
  - **Full Manager Launcher**: Link to open `PlaylistManagerModal` pre-populated with `[currentTrack.channel]`.

### 2. State & Engine Persistence Flow
When "+ Add" is clicked for a target playlist:
1. Verify `!targetPl.channels.includes(currentTrack.channel)`.
2. Construct updated playlist object:
   ```ts
   const updated = {
     ...targetPl,
     channels: [...targetPl.channels, currentTrack.channel],
     updated_at: new Date().toISOString(),
   };
   ```
3. Call `saveCustomPlaylist(targetProjectId, updated)` from `services/engine.ts` (persists to `playlists.db`).
4. Update Zustand state via `updateCustomPlaylist(saved)` from `useVinylStore.ts`.
5. Display confirmation toast via `showToast(`Added "${currentTrack.channel}" to "${saved.name}"`, 'success')`.
6. Popover reactively reflects membership without closing, allowing multi-playlist assignment if desired.

### 3. Quick Create & Modal Pre-population
- **Inline Quick Create**: Calls `saveCustomPlaylist(targetProjectId, { name, emoji: '🎵', channels: [currentTrack.channel] })`, then `addCustomPlaylist(saved)`.
- **Full Modal Integration**: Extend `PlaylistManagerModal.tsx` to accept `initialSelectedChannels?: string[]`. When passed, modal defaults into `'edit'` mode with the current channel checked and ready for custom emoji/timeblock assignment.

---

## Critical Files to Modify

1. **`src/apps/vinyl-angel/components/VinylPlayer.tsx`**
   - Add state: `isAddToPlaylistOpen`, `savingPlaylistId`, `quickPlaylistName`, `isQuickCreating`, `playlistSearchQuery`, `preselectedChannelForModal`.
   - Add click-outside and escape-key event listeners for the popover ref.
   - Implement `handleAddChannelToPlaylist` and `handleQuickCreatePlaylist`.
   - Render the `[+ Playlist]` trigger button and popover dropdown next to `{currentTrack.channel}` in the track header.
   - Pass pre-selected channel into `PlaylistManagerModal`.

2. **`src/apps/vinyl-angel/components/PlaylistManagerModal.tsx`**
   - Extend `PlaylistManagerModalProps` with `initialSelectedChannels?: string[]`.
   - Add `useEffect` to pre-seed `selectedChannels` and start in `'edit'` mode when opened with `initialSelectedChannels`.

---

## Reused Functions & Utilities

- **`saveCustomPlaylist(projectId, playlist)`** (`src/apps/vinyl-angel/services/engine.ts:1806`):
  Persists custom playlists to SQLite `playlists.db` tier.
- **`updateCustomPlaylist` & `addCustomPlaylist`** (`src/apps/vinyl-angel/store/useVinylStore.ts:282-289`):
  Updates reactive Zustand store and browser localStorage.
- **`showToast(msg, type)`** (`src/apps/vinyl-angel/components/VinylPlayer.tsx:156`):
  Unified gameplay notification system.
- **`PlaylistManagerModal`** (`src/apps/vinyl-angel/components/PlaylistManagerModal.tsx`):
  Modal for comprehensive playlist configuration.

---

## Verification Plan

1. **Build & Type Check**:
   - Run TypeScript check or Vite build to confirm no type errors or regressions in `VinylPlayer.tsx` and `PlaylistManagerModal.tsx`.
2. **End-to-End Functional Verification**:
   - Open Vinyl Angel at `http://localhost:5173` (or active dev port).
   - In the Gameplay Tab, verify the `+ Playlist` button appears adjacent to the playing song's channel.
   - Click the button to inspect the popover:
     - Verify existing custom playlists are listed with correct membership status (`In Playlist` vs `+ Add`).
     - Click `+ Add` on a playlist: verify spinner, toast confirmation, and status switch to `In Playlist`.
     - Refresh the page and inspect `playlists.db` / Playlists Tab: verify the channel is preserved in that custom playlist.
   - Test inline quick create: type a name, hit create, verify playlist appears with the channel.
   - Test full modal trigger: click "Open Full Playlist Manager", verify `PlaylistManagerModal` opens in edit mode with the current channel selected.
   - Test edge cases: click outside to close popover, press Escape to close, verify UI behavior when no track is loaded.

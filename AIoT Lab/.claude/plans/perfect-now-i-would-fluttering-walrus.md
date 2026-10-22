# Tactical Blueprint: Origin Channel Hygiene Protocol (Revised)

## Context
The Manager directs:
1. **Avatar Thumbnail per Channel**: Use the **best song** of each channel (highest hazard level in `_4_display.db`; latest `published_at` if tied) as the channel's avatar thumbnail.
2. **Status Lifecycle**: Each channel shows its curation status badge (`Approved` 🟢, `Cleaning` 🟡, `Raw` 🔴).
3. **Triple-Priority Sorting** (default order):
   - **Primary**: Status: `Approved` first → `Cleaning` → `Raw`.
   - **Secondary**: Average Hazard Level: High → Low.
   - **Tertiary**: Number of songs: High → Low.
4. **Channel Purge**: Delete all songs + cascading cleanup across all tiers.
5. **Derived Existence**: Channel only appears if it has songs in `_1_static.db`.

---

## Technical Specifications

### 1. Backend: Enhanced `get_channels` Action (`storage_engine.py`)
Upgrade the existing `get_channels` action to also return the **best song thumbnail** for each channel:
```sql
SELECT
    s.channel_name,
    s.channel_id,
    COUNT(*) as cnt,
    AVG(COALESCE(t4.hazard_level, 3.0)) as avg_h,
    best.thumbnail as best_thumbnail,
    best.title as best_title
FROM layer1_static s
LEFT JOIN t4_db.tier_4_data t4 ON s.id = t4.id
LEFT JOIN (
    SELECT s2.channel_name, s2.thumbnail, s2.title,
           ROW_NUMBER() OVER (
               PARTITION BY s2.channel_name
               ORDER BY COALESCE(t42.hazard_level, 3.0) DESC, s2.published_at DESC
           ) as rn
    FROM layer1_static s2
    LEFT JOIN t4_db.tier_4_data t42 ON s2.id = t42.id
) best ON best.channel_name = s.channel_name AND best.rn = 1
GROUP BY s.channel_name
ORDER BY cnt DESC
LIMIT 500
```
Each channel entry now includes `{ name, channel_id, count, avg_hazard, best_thumbnail, best_title }`.

### 2. Channel Metadata Table (`playlists.db` → `channel_meta`)
- **Tier Configuration (`index.json`)**: `"channel_meta": { "filename": "playlists.db", "format": "sqlite", "table": "channel_meta" }`
- **Schema**: `id TEXT PK, channel_name TEXT, status TEXT DEFAULT 'raw', notes TEXT, updated_at TEXT`
- Channels without a `channel_meta` record default to `status: 'raw'`.

### 3. Backend: `purge_channel` Action
Delete all songs of a channel from `_1_static.db`, `_3_state.db` (tier_3_data + channel_state), `_4_display.db`.

### 4. Frontend Engine Services (`engine.ts`)
- `fetchChannelMeta(projectId)`: Reads all records from `tier: 'channel_meta'`.
- `updateChannelStatus(projectId, channelId, channelName, status, notes?)`: Upserts a channel's status.
- `purgeChannelSongs(projectId, channelName)`: Calls backend to purge all songs.
- Update `ChannelOriginItem` with: `channel_id?, avg_hazard?, best_thumbnail?, best_title?, status?`.

### 5. UI: Origin Channels View in Playlists Tab (`VinylPlaylists.tsx`)
Each Origin Channel card shows:
- **Avatar Thumbnail**: The best song's YouTube thumbnail (`https://i.ytimg.com/vi/{videoId}/mqdefault.jpg`).
- **Status Badge**: 🟢 Approved / 🟡 Cleaning / 🔴 Raw (clickable to change).
- **Channel Name, Song Count, Average Hazard Level**.
- **Purge Button** (🗑️): With confirmation dialog.
- **Default Sort**: Status (Approved→Cleaning→Raw), then Hazard (desc), then Count (desc).
- **Status Filter**: Buttons to filter by status category.

---

## Verification
1. Backend: Verify `get_channels` returns `best_thumbnail` per channel.
2. Backend: Verify `purge_channel` cascading deletion across all tiers.
3. Frontend: 0 diagnostics, Vite 200 OK.
4. E2E: Mark channel → Purge → Re-ingest → Mark Approved.

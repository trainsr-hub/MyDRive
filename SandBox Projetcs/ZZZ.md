# Vinyl Angel — Complete Architectural & Gameplay Tab Knowledge Base

*Codex Location: `D:\My Drive\SandBox Projetcs\universe-25\src\apps\vinyl-angel`*  
*Target Project ID: `music_app` (`backend/data/projects/music_app`)*

---

## 1. System Overview & Multi-Tier Architecture

Vinyl Angel is an audio discovery, roulette curation, and harmonic rating application within Universe 25. It interfaces with an SQLite 5-Tier Data Engine exposed via HTTP API (`http://localhost:8080/api/v1/execute`).

### The Storage Tiers
1. **Tier 1 (`_1_static.db`)**: 
   - Static audio catalog.
   - Contains all scraped/ingested YouTube tracks (`id`, `title`, `channel`, `channel_id`, `duration`).
2. **Tier 2 (`_2_events.jsonl`)**:
   - Append-only event log recording every user rating action.
   - Event structure (`Tier2EventEntry`): `id`, `action` ('3+' | '4+' | '5+' | '6+' | '7+' | 'pass' | 'block'), `timestamp`, `timeblock`, `target_type` ('track' | 'channel'), `channel_id`, `channel_name`, `hazard_rank`.
3. **Tier 3 (`_3_state.db`)**:
   - Aggregated track and channel scoring state (`tier_3_data` table).
   - Tracks scores: `score_3_count` through `score_7_count` (stored as string arrays), `timeblock_arc0`..`arc4`, `unlock_date`, `hazard_rank`.
   - Also contains `channel_state` table for channel-level aggregate records.
4. **Tier 4 (`_4_display.db`)**:
   - Materialized display projections (`tier_4_data` table).
   - Precomputed `hazard_level`, `played`, `timeblock`, `unlock_date`, `rankCategory`, `hazard_rank`.
5. **Tier 5 (`_5_config.db`)**:
   - Player filter & configuration persistence (`tier_5_data` table, key: `'filter_settings'`).
   - Stores: `selectedChannel`, `excludedChannels`, `hazardCap`.
6. **Tier Playlists (`playlists.db`)**:
   - Custom playlists created by the user (`playlists` table). See Section 4 for the schema and the 3 playlist types.
   - Stores: `id` (12-char HexID), `emoji`, `name`, `type`, `compatible_timeblocks`, `date_start`, `date_end`, `include_playlists`, `include_channels`, `include_songs`, `created_at`, `updated_at`, `description`.
7. **Tier Channel Metadata (`channel_meta.db` / `playlists.db`)**:
   - Origin channel curation statuses: `'raw' | 'cleaning' | 'approved'`.
8. **Blacklist & Unplayable Buffers**:
   - `blocked.db`: Permanently blacklisted songs.
   - `unavailable_videos.jsonl`: Unplayable YouTube videos (error codes 100, 101, 150) buffered before being pruned from Tier 1.

---

## 2. File Map & Responsibilities

| File Path | Role | Key Exports / Responsibilities |
|---|---|---|
| `VinylAngel.tsx` | Main Application Container | Tab navigation (`gameplay`, `gallery`, `playlists`, `ingestion`, `config`), theme switching, top currency counter (`Celestial Discs`, `Angel Roll Tickets`). |
| `types.ts` | TypeScript Domain Models | `CustomPlaylist`, `PlaylistItem`, `ChannelOriginItem`, `Tier2EventEntry`, `Tier3StateRecord`, `ScoreTier`, `VinylAction`, etc. |
| `store/useVinylStore.ts` | Zustand Global Store (Persisted) | Currencies (`discs`, `angelRollTickets`), shop purchases, settings, `customPlaylists`, `channelList`, `channelMetaMap`, `blockedSongIds`, inter-tab queued items. |
| `services/engine.ts` | Engine API & Mathematical Core | `fetchSampledTracks()`, `fetchCustomPlaylists()`, `saveCustomPlaylist()`, `deleteCustomPlaylist()`, `logRatingEvent()`, `getFilterConfig()`, `saveFilterConfig()`, `fetchChannelOrigins()`, `updateChannelStatus()`. |
| `components/VinylPlayer.tsx` | Gameplay Tab (Core Workstation) | YouTube iframe player, weighted roulette selection, filter controls (Include/Exclude/Hazard Cap), telemetry stats, harmonic rating deck. |
| `components/VinylPlaylists.tsx` | Playlists Tab | Displays Custom Playlists & Origin Channels, curation status toggles (`raw` -> `cleaning` -> `approved`), channel purging, playback trigger. |
| `components/PlaylistManagerModal.tsx` | Playlist Editor Modal | Create/edit Custom Playlist: name, emoji, description, member channel checklist, timeblock arcs. |
| `components/VinylGallery.tsx` | Gallery & Catalog Sync Tab | Full track leaderboard, search across Tier 1, manual ETL synchronization buttons, queue track to gameplay. |
| `components/VinylIngestion.tsx` | Song Ingestion Tab | Discover and curl YouTube playlists into Tier 1, SSE progress streaming, Channel ID auto-conversion (`UC...` -> `UU...`), unplayable video review. |
| `components/VinylConfig.tsx` | Settings Tab | Theme selection, autoplay toggles, default pass score. |
| `components/VinylPipeline.tsx` | Pipeline Diagnostics | Direct diagnostic execution of ETL sync stages. |

---

## 3. Deep Dive: Gameplay Tab (`VinylPlayer.tsx`)

### Architecture & Lifecycle
1. **Mount & Filter Hydration**:
   - Reads persistent filter settings (`getFilterConfig`) from Tier 5 (`_5_config.db`).
   - Restores: `selectedChannel`, `excludedChannels`, `hazardCap`.
   - If queued item exists in `useVinylStore` (`queuedTrackForGameplay` or `queuedPlaylistForGameplay`), overrides active playback.
2. **Track Sampling (`loadData`)**:
   - Calls `fetchSampledTracks()` in `engine.ts`.
   - Filters out `blockedSongIds`.
   - Resolves active channel filter:
     - `ALL`: Samples across all channels.
     - `CUSTOM:<id>`: Resolves custom playlist channels array and samples from those channels.
     - `STATUS:approved | STATUS:cleaning | STATUS:raw`: Samples only channels with matching curation status.
     - `<channel_name>`: Samples songs exclusively from that single origin channel.
   - Applies `hazardCap` range filter.
   - Respects `excludedChannels` list.
3. **Roulette Track Selection (`selectWeightedTrack`)**:
   - $O(N)$ inverse-play-count weighting: $w = \frac{1}{\text{played} + 1}$.
   - Songs with 0 plays have highest probability; frequently played songs have lower probability.
4. **Buffer Maintenance**:
   - Local `playlist` array holds up to 50 sampled tracks.
   - When remaining unplayed tracks drop below 15, `replenishBufferIfNeeded()` triggers a background sampling request.
5. **YouTube Iframe Integration**:
   - Embeds `#vinyl-yt-player`.
   - Handlers for `onStateChange`:
     - Track Ends: If `autoplay` is enabled, automatically logs the track with default pass score and advances.
     - Errors (100, 101, 150): Appends to `unavailable_videos.jsonl`, excludes track, and spins to next track.

### Visual & Interactive Layout
1. **Telemetry & Filter Header (Top)**:
   - **Include Selector Dropdown**:
     - `ALL` (All Playlists / Catalog)
     - `✨ Discovery: Unassigned to Any Album` (`DISCOVERY:unassigned` - chế độ khám phá ca khúc mới chưa thuộc Album)
     - `⭐ Custom Playlists` (`CUSTOM:<id>`)
     - `📁 Channel Status Groups` (`STATUS:approved`, `STATUS:cleaning`, `STATUS:raw`)
     - `📻 Individual Channels` (Alphabetical list of channels with track counts)
     - `⚙️ Manage Custom Playlists...`
   - **Discovery Mode Toggle Button**: Nút bật tắt chế độ Khám Phá Ca Khúc Mới (`Sparkles` icon, glowing amber) cạnh Include/Exclude/Hazard Cap.
   - **Hazard Drag Badge**: Real-time calculation showing how many 3.0 songs must be deleted/raised to gain +0.01 hazard average.
   - **Exclude Popover**: Multi-select checklist allowing the user to exclude specific Custom Playlists or individual channels.
   - **Hazard Cap Dropdown**: Filter by hazard tier (`7+`, `6+`, `3.2 to <6.0`, `<4.0`, `<3.2`, `All`).
   - **Metrics Pill Badges**: Pool count, session rated count, earned discs, offline outbox count, auto-sync batch counter (`X/15`).
2. **Left Column (Track & Video Deck)**:
   - Buffer position (`TRACK X / Y • Z in Pool`).
   - Song Title (`currentTrack.title`).
   - **Metadata Row**:
     - **Origin Channel / Playlist Name**: `{currentTrack.channel}`
     - **Track ID**: `ID: {currentTrack.id}`
     - **Play Count**: `Played: {getPlayedCount(currentTrack.id)}`
     - **Hazard Badge**: `HazardBadge` with score.
     - **Pick Chance**: Weighted probability percentage.
   - **16:9 YouTube Video Viewport**: `#vinyl-yt-player`.
3. **Right Column (Harmonic Rating Deck)**:
   - **Pin Button**: Locks ratings/ranks across tracks.
   - **Rating Target Toggle**:
     - `Single Song` (`'track'`): Logs rating to just `currentTrack.id`.
     - `All in Channel` (`'channel'`): Logs rating to all songs belonging to `currentTrack.channel`.
   - **Quick Action Row**:
     - `🥀 Cancel (3+)`: Quick log as 3+ and advance.
     - `🎲 Spin`: Skip to next roulette track without rating.
     - `✨ Pass (5+)`: Log with selected score / default score and advance.
   - **Hazard Rank Staging**: 3 (Base), 4 (Solid), 5 (Prime), 6 (Awaken), 7 (Crown).
   - **Score Tier Buttons**: 3+, 4+, 5+, 6+, 7+.
    - **Add to Playlist** (replaces the old Timeblock Arc Tags):
      - `Add this Channel to a Playlist`: Genre playlists only (Section 5).
      - `Add this Song to a Playlist`: Genre or Album playlists (Section 5).
   - **Block Buttons**:
     - `Blacklist & Skip Now`: Immediate removal, block persistence to `blocked.db`, advance.
     - `Blacklist on Track End`: Flags song to be blocked once playback finishes.

---

## 4. Custom Playlists vs. Origin Playlists

### Key Distinction
- **Origin Playlist / Channel (`currentTrack.channel`)**:
  - The source YouTube playlist/channel that was ingested into Tier 1 (`_1_static.db`).
  - Represented as `channel` (string) on each track item.
- **Custom Playlist (`CustomPlaylist`)**:
  - A user-defined playlist. There are 4 types (below).
  - Interface:
    ```ts
    type PlaylistType = 'genre' | 'genre_compilation' | 'album' | 'collection';

    interface CustomPlaylist {
      id: string;                       // 12-char HexID: Date.now().toString(16).padStart(12, '0')
      emoji: string;                    // e.g. "⚡"
      name: string;                     // e.g. "Cyberpunk Synthwave"
      type: PlaylistType;
      compatible_timeblocks?: string[]; // Unchanged from the old schema
      date_start?: string;              // First quarter covered, e.g. '2024-Q1' (free/optional)
      date_end?: string;                // Last quarter covered, inclusive, e.g. '2024-Q2'; equal to start for a 1-quarter Album (free/optional)
      include_playlists: string[];      // Member playlist IDs (Album IDs for 'collection'; Genre IDs for 'genre_compilation')
      include_channels: string[];       // Origin channels (used by 'genre')
      include_songs: string[];          // Song IDs (used by 'genre' and 'album')
      created_at: string;               // Time stamps unchanged
      updated_at: string;
      description?: string;             // Short note
    }
    ```

### The 4 Playlist Types
| Type | Meaning | Uses |
|---|---|---|
| `genre` (Rock, Pop) | Usually takes whole channels. Takes single songs only when a channel is too diverse. | `include_channels` + `include_songs` |
| `genre_compilation` (Genre Compilation) | Merges many Genre playlists into one broader umbrella (e.g. Rock + Metal + Punk -> Heavy Music). | `include_playlists` only (Genre IDs) |
| `album` | A remarkable period, built from carefully handpicked songs. Multi-select. | `include_songs` only |
| `collection` (Album Compilation) | Merges many Albums into one bigger period (e.g. Grade 10 + 11 + 12 -> High School). | `include_playlists` only (Album IDs) |

- Album: no channels; every song must be handpicked (no bulk/blind adds).
- Collection / Genre Compilation: contains member playlist IDs only, never direct songs or channels.
- Resolving for playback: genre -> channels' songs + `include_songs`; album -> `include_songs`; collection / genre_compilation -> recursively expands member playlists.
- **Legacy data**: old playlists (`channels`, no `type`) are mock data. No auto-migration; the user will gradually recreate them in the new format.

### UI Presentation Layout (Playlists Tab)
1. **Tổng Hợp Albums (`collection`)**: Mỗi Tổng Hợp hiển thị như một card lớn chứa thông tin thống kê tổng hợp và một sub-grid các **Album thành phần** của nó (với đầy đủ nút Play stream, Edit, Delete).
2. **Albums Độc Lập (`album`)**: Các Album chưa được gán vào bất kỳ Tổng Hợp nào sẽ hiển thị ở khu vực riêng kế tiếp.
3. **Expander Section cho Genre Playlists & Compilations (`genre_compilation` & `genre`)**: Nằm gọn gàng ở section dưới cùng dạng toggle accordion (mặc định mở):
   - **Genre Compilations (`genre_compilation`)**: Hiển thị card tổng hợp với sub-grid các **Genre thành phần** tương tự như Album Compilations.
   - **Standalone Genres (`genre`)**: Các Genre độc lập chưa thuộc compilation nào (hoặc toàn bộ Genre nếu chưa tạo compilation) hiển thị dạng card lưới bên dưới.

---

## 5. Gameplay Tab: Nhập Liệu Playlist Riêng Biệt (Album & Genre)

Phần Timeblock Tag trước đây được thay thế bằng **2 khối nhập liệu riêng biệt** dạng **Single-Choice Selector (chọn 1)**:

1. **Khối 1: THÊM VÀO ALBUM (1 nút selector, chỉ cho Song)**
   - Mục tiêu: Chỉ gán ca khúc lẻ (`currentTrack.id`) vào 1 Album duy nhất. Không cho phép gán channel vào Album.
   - Hiển thị: Nếu ca khúc hiện tại đã thuộc về một Album nào đó, nút sẽ hiển thị trực tiếp tên Album, emoji, mốc thời gian (Quý/Năm), số bài đã gán và badge `ĐÃ GÁN` kèm nút `✕` để bỏ gán nhanh.
   - Khi chọn một Album mới: Bài hát sẽ tự động được rút khỏi Album cũ (nếu có) và thêm vào Album mới (database lưu trữ trong mảng `include_songs`).

2. **Khối 2: THÊM VÀO GENRE PLAYLIST (2 nút selector)**
   - **Nút 1: Cho Song (`currentTrack.id`)**: Chọn 1 Genre playlist cho ca khúc hiện tại. Nếu ca khúc đã thuộc 1 Genre thì hiển thị tên Genre đó.
   - **Nút 2: Cho Channel (`currentTrack.channel`)**: Chọn 1 Genre playlist cho Channel nguồn hiện tại. Nếu Channel đã thuộc 1 Genre thì hiển thị tên Genre đó.
   - Cả 2 đều hoạt động theo cơ chế Single-Choice Selector (chọn 1 để gán hoặc đổi, có nút `✕` gỡ gán nhanh). Trong database vẫn lưu trữ chuẩn hóa dưới dạng mảng `include_songs` và `include_channels`.

Mỗi nút khi bấm sẽ mở dropdown popover tùy chỉnh với:
- Nút `-- Bỏ gán khỏi Album/Genre này --`
- Danh sách các playlist tương ứng kèm radio status `(● / ○)`, tên, emoji, số bài và badge trạng thái
- Thanh tạo nhanh (`Tên mới...` + nút `Tạo & Gán`)
- Nút dẫn trực tiếp tới `Full Playlist Manager Modal`

---

## 6. Cơ Chế Tự Động Approved Kênh Nguồn & Ẩn Khỏi Include Gameplay

### 1. Điều kiện Tự Động Approved (`auto_approved`)
- Nếu **tất cả bài hát của 1 Channel nguồn** đều đã được đưa vào các Album (`type = 'album'`) thì Channel đó sẽ tự động được gán trạng thái **`approved`** (với `notes: 'auto_approved'`).
- Cơ chế kiểm tra diễn ra ở cả backend SQLite (sử dụng temp table và set intersection) và frontend:
  + Khi người dùng gán bài hát cuối cùng của kênh vào một Album, backend tự động đánh dấu `approved` và frontend hiển thị thông báo chúc mừng hoàn thành kênh.
  + Nếu bài hát bị rút khỏi Album khiến kênh không còn đạt 100% độ phủ Album, trạng thái sẽ tự động revert về `cleaning`.

### 2. Ẩn Kênh Approved Khỏi Mục Include của Tab Gameplay
- Các kênh đã đạt **`approved`** sẽ **hoàn toàn bị ẩn** khỏi dropdown Include của tab Gameplay (người dùng chỉ tập trung phân loại các kênh còn đang dọn dẹp `cleaning` hoặc `raw`).
- Nếu Gameplay đang mở một kênh mà kênh đó vừa đạt `approved`, hệ thống sẽ **tự động chuyển sang playlist ở đáy của danh sách các option Include** (ưu tiên kênh thô `raw` cuối cùng trong danh sách, nếu không còn `raw` thì lấy kênh `cleaning` cuối cùng, hoặc custom playlist ở đáy) để tiếp tục quá trình dọn dẹp âm nhạc liên tục mà không bị nhảy về `ALL`.
- Toàn bộ danh sách và huy hiệu `🟢 APPROVED` của các kênh này vẫn được hiển thị và quản lý đầy đủ tại tab **Playlists -> Origin Channels**.

### 3. Tự Động Trả Về `Cleaning` Khi Ingest Thêm Nhạc Mới
- Khi tiến hành ingest/curl thêm bài hát mới vào một playlist / kênh nguồn (dù qua Curler batch hay Single Song Ingestion):
  + Backend phát hiện các bài hát mới thuộc về channel nào và tự động **trả Status của Channel đó về `cleaning`** (xóa note `auto_approved` nếu có).
  + Logic kiểm tra `sync_channel_approval_status` xác nhận channel đó hiện có bài hát mới chưa nằm trong Album (độ phủ < 100%), do đó duy trì trạng thái `cleaning`.
  + Frontend `VinylIngestion` khi hoàn tất batch ingest sẽ tự động trigger refresh metadata (`fetchChannelMeta`, `fetchChannelOrigins`) trên store để UI cập nhật ngay lập tức.

---

## 7. Gán Trực Tiếp Vào Playlist Tổng Hợp Khi Tạo / Chỉnh Sửa Playlist

- Trong giao diện tạo mới hoặc chỉnh sửa Playlist (`PlaylistManagerModal.tsx`):
  + **Khi chọn loại Album (`type = 'album'`)**: Xuất hiện thêm mục **`Add to Album Compilation (Optional)`**, tự động lọc các Album Compilation (`type = 'collection'`) hiện có để người dùng chọn Album mới sẽ nằm trong Tổng Hợp nào ngay từ lúc khởi tạo.
  + **Khi chọn loại Genre (`type = 'genre'`)**: Xuất hiện thêm mục **`Add to Genre Compilation (Optional)`**, tự động lọc các Genre Compilation (`type = 'genre_compilation'`) hiện có.
  + **Khi tạo các Compilation (`collection` / `genre_compilation`)**: Tùy chọn này tự động ẩn để tránh lồng ghép lặp.
- **Cơ chế lưu trữ & đồng bộ 2 chiều**:
  + Mặc định ở trạng thái `Standalone (None)` nếu không chọn.
  + Khi lưu (`Create Playlist` hoặc `Update Playlist`), hệ thống tự động cập nhật mảng `include_playlists` của tất cả các Compilation được chọn (thêm ID của playlist mới vào) và lưu trực tiếp vào cơ sở dữ liệu `playlists.db`, đồng thời cập nhật ngay Zustand store.
  + Khi chỉnh sửa một playlist cũ, form tự động nhận diện và tích sẵn các Compilation mà playlist đó đang thuộc về; nếu người dùng bỏ chọn thì playlist đó sẽ tự động được rút khỏi Compilation tương ứng.

---

## 8. Tự Động Xóa Playlist Khi Block Video Duy Nhất / Cuối Cùng & Mặc Định Include Luôn Ở Đáy

### 1. Mặc Định Include Luôn Là Playlist Ở Dưới Đáy Cùng (`computeBottomPlaylistOption`)
- Khi ứng dụng khởi tạo (mount) hoặc khi người dùng reset bộ lọc: hệ thống không còn mặc định là `ALL`, mà tự động gán option mặc định là **playlist ở dưới đáy cuối cùng của Include** (ưu tiên kênh `raw` cuối cùng, kế tiếp là kênh `cleaning` cuối cùng, hoặc Custom Playlist cuối cùng).

### 2. Quy Trình Curation: Block Video Cuối Cùng -> Xóa Ngay Lập Tức & Phát Playlist Đáy Tiếp Theo
- Khi người dùng đang nghe/lọc một playlist không đạt chuẩn và bấm **Block** đối với video duy nhất (hoặc video cuối cùng còn lại) của playlist đó:
  + **Xóa ngay lập tức mà không cần buffer**: Hệ thống tự động kích hoạt `purgeChannelSongs` (hoặc `deleteCustomPlaylist` nếu là Custom Playlist), thanh lọc hoàn toàn dữ liệu kênh ở `_1_static.db`, `_3_state.db` (`channel_state`), `playlists.db` (`channel_meta`), đồng thời loại bỏ khỏi `channelList` trong state.
  + Bỏ qua hoàn toàn bước buffer/nạp thêm bài từ playlist vừa bị xóa (tránh màn hình đứng hoặc buffer rỗng).
  + Tự động chọn ngay playlist tiếp theo ở dưới đáy và stream phát bài hát mới ngay lập tức mà không bị gián đoạn.

### 3. Sắp Xếp Ổn Định Tuyệt Đối (Deterministic Ordering) Chống Nhảy Option
- Khi có nhiều playlist/channel có cùng số lượng bài hát (ví dụ nhiều kênh cùng có 1 bài), nếu chỉ sắp xếp theo `cnt DESC` thì thứ tự các kênh đó sẽ bị đảo ngẫu nhiên mỗi lần SQLite query lại.
- **Giải pháp**:
  + Backend SQL: Bổ sung thứ tự phụ theo tên chữ cái `ORDER BY cnt DESC, s.channel_name ASC`.
  + Frontend: Toàn bộ danh sách kênh và hàm tính đáy `computeBottomPlaylistOption` đều sắp xếp ổn định bằng `b.count - a.count || a.name.localeCompare(b.name)`.
  + Effect khởi tạo `initFromPersistentConfig` được chốt cờ `isInitializedRef` chỉ chạy đúng 1 lần khi mount, loại bỏ triệt để hiện tượng Include bị nhảy liên tục giữa các option có cùng số bài.

---

## 9. Tối Ưu Hóa Tốc Độ Sampling & Harmonic Stream Pipeline (< 100ms thay vì 5 - 8s)

### 1. Nguyên Nhân Hiện Tượng Nghẽn Cổ Chai
- Khi màn hình Gameplay hiển thị thông báo `Fetching harmonic stream from database...`:
  1. **Quét toàn bộ Tier 4 trên mọi lần lấy mẫu**: Trong `fetchSampledTracks` và `fetchMoreSampledTracks` (`engine.ts`), code cũ thực hiện `tier: '4', action: 'read_all'` trên toàn bộ 19,174 bản ghi của `_4_display.db`. Payload JSON trả về nặng tới 1.85MB và mất từ **4.5 - 5.5 giây** chỉ để lấy thông tin điểm hazard cho đúng 50 bài hát được chọn mẫu.
  2. **Query lặp lại metadata nặng trong `loadData`**: Mỗi lần chọn kênh, chuyển playlist hoặc sampling lại, `VinylPlayer.tsx` đều gọi `fetchChannelOrigins` (chạy phép gom nhóm `GROUP BY channel_name` trên toàn bộ 160,000 bài hát của `_1_static.db`), `fetchCustomPlaylists`, và `fetchChannelMeta` song song với `fetchSampledTracks`, tiêu tốn thêm ~600ms không cần thiết.

### 2. Các Biện Pháp Tối Ưu Hóa Đã Thực Hiện
1. **Chuyển sang `batch_read` có chọn lọc theo Track ID**:
   - `fetchSampledTracks` và `fetchMoreSampledTracks` trong `engine.ts` đã được tách luồng:
     + Bước 1: Gọi song song `sample` (Tier 1), `count` (Tier 1), và `fetchChannelState` (Tier 3) -> trả về 50 Track IDs ngẫu nhiên phù hợp điều kiện lọc trong ~60ms.
     + Bước 2: Chỉ lấy đúng 50 Track IDs đó để gọi song song `batch_read` trên Tier 4 (`_4_display.db`) và Tier 3 (`_3_state.db`) -> tiêu tốn chỉ **12ms** với payload vài KB thay vì 1.85MB.
2. **Loại bỏ truy vấn metadata trùng lặp trong `loadData`**:
   - `loadData` trong `VinylPlayer.tsx` tận dụng danh sách `channelList`, `customPlaylists`, `channelMetaMap` đã có sẵn trong Zustand store (`useVinylStore`).
   - Chỉ khi store hoàn toàn trống (lần đầu khởi chạy ứng dụng), `loadData` mới kích hoạt tải metadata phụ trợ. Mọi lần đổi bộ lọc, đổi playlist hay refresh buffer tiếp theo chỉ gọi duy nhất `fetchSampledTracks`.
   - Bổ sung `fetchBlockedTrackIds` vào `initFromPersistentConfig` lúc mount một lần duy nhất.

### 3. Kết Quả Đo Lường Thực Tế
- **Trước tối ưu**: 5.5 - 8.0 giây (`read_all` 1.85MB + 160k rows aggregation).
- **Sau tối ưu**: **~73ms - 89ms** (giảm thời gian chờ tới **hơn 70 lần**). Quá trình lấy bài và bắt đầu phát nhạc diễn ra gần như tức thì.

---

## 10. Tách Biệt Trạng Thái Khởi Tạo (`isInitializing`) & Khắc Phục Mắc Kẹt Màn Hình Chờ

### 1. Hiện Tượng Gặp Phải
- Khi mở ứng dụng lần đầu, giao diện bị treo vĩnh viễn ở màn hình chờ:
  ```
  Sampling Stream: All Playlists (Hazard: <3.2 (Calm/Unrated))
  Fetching harmonic stream from database...
  ```
- Dù cấu hình filter lưu ở Tier 5 (`_5_config.db`) là một kênh cụ thể (hoặc playlist ở đáy), giao diện vẫn hiển thị điều kiện mặc định (`All Playlists`) và đứng yên không tải bài.

### 2. Nguyên Nhân Kỹ Thuật
1. **Xung đột vòng đời React 18 StrictMode với `isMountedRef`**:
   - Khi chạy ở môi trường phát triển (Vite), `<StrictMode>` kích hoạt chu kỳ mount -> cleanup -> remount.
   - Hàm cleanup của mount lần 1 gán `isMountedRef.current = false`.
   - Khi remount lần 2, cờ `isInitializedRef.current` bẫy `return` sớm trước khi kịp set lại `isMountedRef.current = true`.
   - Kết quả: Khi promise `initFromPersistentConfig` hoặc `loadData` chạy xong, kiểm tra `if (!isMountedRef.current) return;` kích hoạt thoát sớm trước khi gọi `setIsLoading(false)`, khiến `isLoading` bị khóa ở trạng thái `true` vĩnh viễn.
2. **Thiếu sự tách biệt giữa Khởi tạo cấu hình và Lấy mẫu nhạc**:
   - Trước đây `isLoading` được đặt mặc định là `true`, và `selectedChannel` mặc định là `'ALL'`.
   - Trong suốt thời gian đang kết nối backend để tải filter đã lưu và danh sách playlist, UI đã vội vàng render màn hình `Sampling Stream: All Playlists`, gây hiểu lầm rằng hệ thống đang cố fetch nhạc theo bộ lọc mặc định khi chưa có dữ liệu cấu hình.

### 3. Giải Pháp Triệt Để Đã Áp Dụng
1. **Tách riêng trạng thái `isInitializing` và `isLoading`**:
   - Giai đoạn 1 (`isInitializing = true`, `isLoading = false`): Hiển thị thông điệp chính xác `Connecting to Storage Engine... / Synchronizing persistent filters & playlist origin channels...`. Không giả định hay hiển thị `Sampling Stream: All Playlists`.
   - Giai đoạn 2 (`isInitializing = false`, `isLoading = true`): Chỉ bắt đầu sampling sau khi đã xác định được chính xác kênh đích (kênh đã lưu hoặc playlist ở đáy). Quá trình này diễn ra trong <100ms.
2. **Khắc phục triệt để bẫy unmount và bảo đảm `setIsLoading(false)` qua `finally`**:
   - Tách việc gán `isMountedRef.current = true` vào một `useEffect` độc lập riêng biệt để không bị ảnh hưởng bởi StrictMode.
   - Đưa `setIsLoading(false)` vào khối `finally` của `loadData`, loại bỏ hoàn toàn các lệnh `return` sớm làm rơi trạng thái loading.
   - Thêm khối `catch` trong `initFromPersistentConfig`: nếu backend chưa sẵn sàng, lập tức chuyển sang giao diện offline có nút `Retry Connection Now`, không để giao diện rơi vào trạng thái đứng vô hạn.

---

## 11. Tinh Gọn Giao Diện Nhập Liệu Playlist (`PlaylistManagerModal.tsx`)

### 1. Quy Tắc Phân Loại Trường Dữ Liệu
- **Original Channels**: Giữ nguyên toàn bộ cấu trúc và thông tin gốc.
- **Genre & Genre Compilation**:
  - **Bỏ Date**: Ẩn hoàn toàn bộ chọn khoảng thời gian Quý / Năm (`QuarterPicker: From / To`) khi tạo hoặc chỉnh sửa Genre và Genre Compilation. Khi lưu, `date_start` và `date_end` tự động được gán chuỗi rỗng `''`.
  - **Giữ Timeblock Arcs**: Vẫn giữ phần chọn Arcs tương thích để phân loại mood / thời gian phát trong ngày (`Arc Zero` đến `Arc 04`).
- **Album & Album Compilation**:
  - **Bỏ Timeblock**: Ẩn hoàn toàn phần chọn Arcs tương thích (`Compatible Timeblock Arcs`) khi tạo hoặc chỉnh sửa Album và Album Compilation. Khi lưu, mảng `compatible_timeblocks` tự động được gán `[]`.
  - **Giữ Date**: Vẫn giữ bộ chọn mốc thời gian phát hành Quý / Năm (`From` - `To`) để quản lý tính niên đại của Album.

### 2. Tự Động Dọn Dẹp Dữ Liệu Khi Chuyển Loại Playlist
- Khi người dùng bấm chuyển đổi qua lại giữa các loại playlist trong form:
  - Chuyển sang Genre / Genre Compilation: tự động reset `dateStart` và `dateEnd` về `''`.
  - Chuyển sang Album / Album Compilation: tự động reset `selectedTimeblocks` về `[]`.
- Danh sách preview và card hiển thị playlist ở tab Playlists cũng được đồng bộ: huy hiệu ngày tháng chỉ hiển thị cho Album / Album Compilation, và huy hiệu Timeblock chỉ hiển thị cho Genre / Genre Compilation.

---

## 12. Bảo Vệ Tính Toàn Vẹn Phát Video & Khắc Phục Lỗi Tự Phát Lại Trình Phát YouTube (`VinylPlayer.tsx`)

### 1. Hiện Tượng Gặp Phải
- Khi người dùng đang nghe nhạc, nếu thực hiện bất kỳ thao tác cập nhật nào (ví dụ: gán bài hát vào Album, gán bài hát vào Genre, tạo Album mới, chỉnh sửa ghi chú kênh, cập nhật trạng thái kênh...), bài hát đang stream đột ngột bị tải lại từ giây thứ 0 (`startSeconds: 0`), gây gián đoạn khó chịu.
- Mọi biến động nhỏ trong store Zustand hay state cục bộ đều vô tình kích hoạt việc phát lại bài hát.

### 2. Nguyên Nhân Kỹ Thuật (Root Causes)
1. **Ô nhiễm Dependency Array trong Mounting Effect của YouTube Player**:
   - `useEffect` khởi tạo trình phát YouTube (`new window.YT.Player`) trước đây chứa:
     ```tsx
     }, [isLoading, isOffline, isExhausted, handleNextSong, syncVideoToPlayer]);
     ```
   - Trong đó, `handleNextSong` phụ thuộc vào `[customPlaylists, channelMetaMap, channelList, getBottomPlaylistOption, ...]`.
   - Mỗi khi người dùng gán bài hát vào Album hoặc Genre (`updateCustomPlaylist` / `addCustomPlaylist`), mảng `customPlaylists` thay đổi $\rightarrow$ `handleNextSong` thay đổi tham chiếu function.
   - Khi `handleNextSong` thay đổi, React chạy hàm **cleanup** của `useEffect` trước đó:
     ```tsx
     playerRef.current.destroy();
     playerRef.current = null;
     currentlyLoadedVideoIdRef.current = null;
     ```
   - Trình phát YouTube bị hủy hoàn toàn (`destroy()`), sau đó effect chạy lại và tạo mới một đối tượng `new window.YT.Player`.
   - Khi trình phát mới sẵn sàng (`onReady`), nó lập tức gọi `loadVideoById({ videoId: targetId, startSeconds: 0 })` $\rightarrow$ bài hát phát lại từ đầu!
2. **Hiệu ứng bẫy của `isLoading` và `isExhausted`**:
   - Khi hệ thống nạp thêm buffer nhạc ở chế độ nền (`replenishBufferIfNeeded`), cờ `isLoading` bật/tắt cũng kích hoạt chu kỳ destroy $\rightarrow$ remount trình phát.
3. **Điều kiện gỡ thẻ DOM (`vinyl-yt-player`)**:
   - Trước đây vùng chứa video sử dụng `{currentTrack ? <div id="vinyl-yt-player" /> : <div ... placeholder />}`. Nếu `currentTrack` bị chập chờn tạm thời trong một chu kỳ render, phần tử DOM chứa iframe bị xóa khỏi cây DOM và tạo lại, làm mất thể hiện iframe YouTube.

### 3. Giải Pháp Kiến Trúc Triệt Để (Architectural Solution)
1. **Tách biệt hoàn toàn Vòng Đời Trình Phát khỏi State biến động (Mount Once Lifecycle)**:
   - Chuyển dependency array của mounting effect thành `[]` (chỉ chạy duy nhất một lần khi mount component và dọn dẹp khi unmount ứng dụng).
   - Thể hiện `playerRef.current` tồn tại xuyên suốt phiên phát nhạc, không bao giờ bị `destroy()` khi người dùng tương tác với playlist, filter, score hay album.
2. **Cơ chế Phản Chiếu Hàm qua Ref (Decoupled Ref Mirrors)**:
   - Thiết lập các con trỏ ref luôn được đồng bộ phiên bản mới nhất:
     ```tsx
     handleNextSongRef.current = handleNextSong;
     logActionToTier2Ref.current = logActionToTier2;
     showToastRef.current = showToast;
     getBottomPlaylistOptionRef.current = getBottomPlaylistOption;
     ```
   - Các sự kiện bất đồng bộ của YouTube (`onStateChange`, `onError`, `ENDED`) truy cập trực tiếp qua `handleNextSongRef.current(null)` và `logActionToTier2Ref.current(...)`. Điều này loại bỏ hoàn toàn bẫy Stale Closure mà không cần đưa hàm vào dependency array của effect.
3. **Cố Định Vùng Chứa DOM Của Trình Phát (`#vinyl-yt-player`)**:
   - Thẻ `<div id="vinyl-yt-player" className="w-full h-full" />` luôn luôn thường trực trên cây DOM.
   - Khi chưa có `currentTrack`, một lớp phủ giao diện (`absolute inset-0 z-10 pointer-events-none`) sẽ hiển thị thông báo chờ, bảo đảm iframe YouTube bên dưới không bao giờ bị React gỡ bỏ hoặc mount lại.
4. **Bảo Vệ Đồng Bộ Video Độc Lập (`syncVideoToPlayer`)**:
   - Chỉ tải video mới khi ID của bài hát thay đổi (`currentlyLoadedVideoIdRef.current !== targetVideoId`).
   - Nếu ID bài hát vẫn như cũ (như khi đang nghe mà gán Album/Genre), hàm trả về sớm ngay lập tức mà không tác động đến vị trí đang phát của thanh thời gian.
5. **Thu Hẹp Dependency trong Hiệu Ứng Fallback Kênh Approved**:
   - Chỉ theo dõi `channelMetaMap[selectedChannel]?.status` thay vì theo dõi toàn bộ `channelMetaMap` và `customPlaylists`, ngăn chặn việc tự động kích hoạt `loadData` khi người dùng chỉnh sửa danh sách khác.

---

## 13. Quy Chuẩn Sắp Xếp Custom Playlist Theo Tên & Phân Nhóm Thao Tác `Add to...` Theo Compilation

### 1. Đồng Bộ Sắp Xếp Theo Tên Toàn Diện (Name-Ascending Everywhere)
Nhằm bảo đảm tính nhất quán và dễ tìm kiếm cho người dùng, toàn bộ các Custom Playlist (`collection`, `album`, `genre_compilation`, `genre`) ở mọi màn hình và tầng dữ liệu đều luôn luôn được sắp xếp theo tên (`a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })`):
1. **Zustand Store (`useVinylStore.ts`)**:
   - Mọi hàm tác động lên danh sách (`setCustomPlaylists`, `addCustomPlaylist`, `updateCustomPlaylist`) đều tự động chuẩn hóa và sắp xếp mảng `customPlaylists` theo tên A-Z.
2. **Data Engine API (`engine.ts`)**:
   - `fetchCustomPlaylists` sau khi parse dữ liệu từ Tier Playlists luôn sắp xếp trả về mảng đã sort theo tên.
3. **Tab Playlists (`VinylPlaylists.tsx`)**:
   - Giá trị mặc định của `sortBy` được chuyển sang `'name'`.
   - Các danh sách con như `memberAlbums` trong Album Compilation và `memberGenres` trong Genre Compilation luôn được sắp xếp theo tên.
4. **Trình Quản Lý Modal (`PlaylistManagerModal.tsx`)**:
   - Danh sách chọn Album thành viên cho Compilation, danh sách chọn Genre thành viên cho Genre Compilation, và danh sách chọn Compilation cha đều được sắp xếp theo tên A-Z.

### 2. Phân Nhóm Danh Sách `Add to...` Trong Gameplay (`VinylPlayer.tsx`)
Khi người dùng bấm gán bài hát hoặc kênh ở Deck điều khiển Gameplay (`ADD TO ALBUM` hoặc `ADD TO GENRE PLAYLIST`):
- **Phân Nhóm Theo Mục Tổng Hợp Tương Ứng**:
  - Khi mở `ADD TO ALBUM`: Danh sách Albums được nhóm theo các Album Compilation (`collection`) tương ứng. Mỗi Compilation hiển thị một huy hiệu tiêu đề kèm icon và số lượng albums thành viên. Các albums chưa thuộc Compilation nào được gom vào mục `💿 Standalone Albums`.
  - Khi mở `ADD TO GENRE PLAYLIST` (cho bài hát hoặc cho kênh): Danh sách Genres được nhóm theo các Genre Compilation (`genre_compilation`) tương ứng. Các genres chưa thuộc Compilation nào được gom vào mục `🎸 Standalone Genres`.
- **Tìm Kiếm Đa Chiều Thông Minh**:
  - Hộp tìm kiếm lọc đồng thời cả tên Compilation lẫn tên Album/Genre thành viên. Nếu một Compilation chứa album phù hợp, tiêu đề Compilation đó sẽ hiển thị kèm danh sách album kết quả.
- **Duy Trì Thao Tác Nhanh**:
  - Tính năng gán 1 chạm, bỏ gán (`-- Remove from this Album/Genre --`), và tạo nhanh playlist mới từ form bên dưới vẫn hoạt động trơn tru 100%.

---

## 14. Khắc Phục Lỗi Frontend Không Stream Được Video (YouTube Player Lifecycle Recovery & DOM Anchoring)

### 1. Nguyên Nhân Gốc (Root Cause)
1. **Unmount Khung Player Khi Đang Tải (`isInitializing` / `isLoading`)**:
   - Trước đây, toàn bộ khối `Main Workstation Grid` (chứa thẻ `<div id="vinyl-yt-player" />`) bị bọc trong điều kiện `{!isInitializing && !isLoading && !isOffline && !isExhausted && (...)}`.
   - Khi component mới mount, `isInitializing` luôn bắt đầu bằng `true`. Vì vậy, thẻ `vinyl-yt-player` **chưa hề có mặt trong DOM**.
   - Hiệu ứng khởi tạo YouTube Player (`useEffect`) chạy 1 lần duy nhất lúc mount. Do phần tử DOM chưa tồn tại, hàm `mountPlayer` kiểm tra `if (!container) return;` và thoát ngay lập tức. Sau khi API nạp dữ liệu xong (`isInitializing` chuyển thành `false`), giao diện hiển thị đầy đủ thông tin bài hát nhưng không có bất kỳ trigger nào khởi tạo lại Player, khiến khung video bị đen và không stream được.
   - Thêm vào đó, mỗi lần `isLoading` bật lên khi chuyển đổi filter hoặc playlist, React xóa sạch iframe khỏi DOM khiến instance `playerRef` bị ngắt kết nối vĩnh viễn.
2. **Cấu Hình Nocookie Gây Lỗi Cross-Origin / Quyền Phát Nhúng**:
   - Tùy chọn `host: 'https://www.youtube-nocookie.com'` trong API `YT.Player` gây xung đột với thư viện `iframe_api` tiêu chuẩn của YouTube và bị một số video bản quyền chặn phát nhúng.

3. **Lỗi `Invalid video id` khi Khởi Tạo Trống (`www-widgetapi.js`)**:
   - Khi component mới mount và dữ liệu từ backend chưa kịp trả về (`pendingVideoIdRef` và `currentTrack` còn null/rỗng), biểu thức ternary `initialVideoId ? String(initialVideoId).trim() : undefined` đã truyền `{ videoId: undefined }` vào constructor `new window.YT.Player`.
   - Trong JavaScript, thuộc tính `'videoId'` vẫn tồn tại trong object options. Bộ kiểm tra nội bộ `Ya` của YouTube API phát hiện `videoId: undefined` và quăng ngoại lệ `Error: Invalid video id`, làm constructor thất bại hoàn toàn và chặn đứng việc tạo player.

### 2. Giải Pháp Triệt Để Đã Áp Dụng (`VinylPlayer.tsx`)
1. **Neo Vĩnh Viễn Khung Workstation Grid Trong Cây DOM (Permanent Anchoring)**:
   - Loại bỏ hoàn toàn điều kiện `{!isInitializing && !isLoading && !isOffline && !isExhausted && (...)}` khỏi thẻ bọc của Workstation Grid.
   - Phần tử `<div id="vinyl-yt-player" className="w-full h-full" />` luôn luôn tồn tại trong DOM ngay từ frame đầu tiên.
   - Khi đang nạp dữ liệu (`isInitializing || isLoading || !currentTrack`), một lớp phủ kính mờ sang trọng (`bg-[#0a080f]/90 backdrop-blur-xs`) với đĩa than xoay màu vàng kim sẽ xuất hiện ngay trên bề mặt viewport 16:9 để thông báo trạng thái (`Connecting to Storage Engine...` hoặc `Sampling Stream: [Selected Playlist]...`), trong khi iframe YouTube bên dưới vẫn được giữ nguyên và sẵn sàng tải stream.
   - Khi kho nhạc bị trống (`isExhausted`), thay vì gỡ bỏ Grid bằng React conditional rendering, khối Grid được ẩn nhẹ nhàng bằng thuộc tính `style={{ display: 'none' }}` giúp bảo toàn hoàn toàn iframe YouTube trong DOM.
2. **Cơ Chế Khởi Tạo Bền Vững & Tự Phục Hồi (Resilient Watchdog & Poller)**:
   - Cơ chế polling (`pollInterval = 250ms`) liên tục theo dõi cho đến khi cả thư viện `window.YT.Player`, phần tử DOM `#vinyl-yt-player`, và iframe đã thực sự được gắn vào cây DOM (`document.body.contains(iframe)`).
   - Kiểm tra `playerRef.current.getIframe?.()`: Nếu iframe bị ngắt kết nối hoặc mất tính hợp lệ, hệ thống tự động dọn dẹp instance cũ và tạo lại Player mới tinh.
   - Trả lại cấu hình host YouTube chính thức mặc định (loại bỏ `youtube-nocookie.com`).
3. **Loại Bỏ Thuộc Tính `videoId` Khỏi Object Khi Chưa Có ID Hợp Lệ**:
   - Xây dựng cấu hình `playerConfig` linh hoạt: Chỉ gán trường `playerConfig.videoId` khi `initialVideoId` thực sự là chuỗi khác rỗng (`initialVideoId && initialVideoId.length > 0`). Nếu chưa có bài hát, hoàn toàn không khai báo key `videoId` trên options object.
   - Nhờ vậy, YouTube IFrame API khởi tạo player ở trạng thái idle/ready một cách hoàn hảo mà không bao giờ bị lỗi `Invalid video id`.
4. **Kích Hoạt Mount & Tải Video Tức Thì Khi Đồng Bộ (`syncVideoToPlayer`)**:
   - Khi bài hát được nạp mà Player chưa sẵn sàng, ID bài hát được ghi nhận vào `pendingVideoIdRef` đồng thời hàm `mountPlayer` được gọi ngay lập tức qua `mountPlayerRef.current`.
   - Ngay khi sự kiện `onReady` của YouTube Player kích hoạt, video được tải bằng `loadVideoById` và phát tự động ngay tức thì.

---

## 15. Tự Động Nhận Diện Mã Định Danh Channel (`UC...`) & Chuyển Đổi Thành Playlist Uploads Toàn Bộ Ca Khúc (`UU...`)

### 1. Nguyên Lý Kỹ Thuật YouTube Playlist Uploads
- Mọi kênh YouTube đều có một mã định danh kênh độc nhất (`Channel ID`), bắt đầu bằng tiền tố **`UC`** và theo sau bởi 22 ký tự Base64url (`UC[a-zA-Z0-9_-]{22}`, tổng độ dài 24 ký tự).
- Theo quy chuẩn cấu trúc hệ thống của YouTube:
  - `UC...` = Kênh người dùng (User Channel)
  - `UU...` = Toàn bộ video đã tải lên của kênh đó (User Uploads Playlist)
- Bằng cách thay thế tiền tố `UC` bằng `UU`, hệ thống ngay lập tức suy ra Playlist chứa **toàn bộ 100% video/ca khúc đã tải lên** của channel đó mà không cần thông qua các bước tra cứu API tốn quota:
  ```
  Channel ID:   UCaxmagbMgw7wxC6W5wRp5pQ
  Playlist ID:  UUaxmagbMgw7wxC6W5wRp5pQ
  Playlist URL: https://youtube.com/playlist?list=UUaxmagbMgw7wxC6W5wRp5pQ
  ```

### 2. Các Định Dạng Đầu Vào Được Tự Động Nhận Diện
Hệ thống nhận diện thông minh ở cả giao diện Ingestion (`VinylIngestion.tsx`) và Backend Curler Engine (`curler_service.py`):
1. **Mã kênh trực tiếp (Raw Channel ID)**:
   - Ví dụ: `UCaxmagbMgw7wxC6W5wRp5pQ`
   - Tự động chuẩn hóa thành: `https://www.youtube.com/playlist?list=UUaxmagbMgw7wxC6W5wRp5pQ`
2. **Đường dẫn kênh YouTube (Channel URL)**:
   - Các định dạng phổ biến:
     + `https://www.youtube.com/channel/UCaxmagbMgw7wxC6W5wRp5pQ`
     + `https://youtube.com/channel/UCaxmagbMgw7wxC6W5wRp5pQ/videos`
     + `https://www.youtube.com/channel/UCaxmagbMgw7wxC6W5wRp5pQ?si=...`
   - Tự động trích xuất mã `UC...` và chuyển đổi sang Playlist `UU...`.
3. **Mã Playlist có sẵn (`PL...`, `UU...`, `FL...`, `RD...`)**:
   - Vẫn được bảo toàn và xử lý bình thường theo luồng tiêu chuẩn.

### 3. Quy Trình Chuẩn Hóa Tại Tab Song Ingestion (`VinylIngestion.tsx`)
- **Single Ingestion (Direct / Multi-Link)**:
  - Khi người dùng dán một hoặc nhiều link vào ô nhập liệu: hàm `parseUrlsFromInput` tự động chạy qua `normalizeIngestionUrl`.
  - Bất kỳ mã kênh `UC...` hoặc link kênh `/channel/UC...` nào đều được chuyển đổi ngay lập tức thành link playlist `UU...` hợp lệ trước khi gửi sang endpoint curler.
- **Batch Mode (Playlist Configuration Manager)**:
  - Thêm đơn lẻ hoặc thêm hàng loạt (nhiều dòng): Form nhận diện mã kênh và thông báo Toast xác nhận chuyển đổi `(Channel Uploads)`.
  - Chế độ Raw Text (`playlists.txt`): Tự động chuẩn hóa và lưu trữ danh sách link playlist hoàn chỉnh.
- **Trích xuất ID an toàn (`extractPlaylistId`)**:
  - Tự động nhận dạng `UC...` và hiển thị nhãn badge `UU...` trực quan trên danh sách bảng quản trị.

### 4. Đồng Bộ Tại Backend Curler Engine (`curler_service.py`)
- Hàm `extract_playlist_or_video(url: str)` được bổ sung bộ nhận diện Regex cho cả mã `UC...` độc lập và URL `/channel/(UC...)`.
- Tự động gán kiểu dữ liệu `('playlist', 'UU...')`, bảo đảm các pipeline curler stream, nạp danh mục, và ghi nhận vào `_1_static.db` hoạt động 100% tự động và trơn tru.

---

## 16. Đồng Bộ Buffer Tức Thì & Xử Lý Kênh Khi Kết Thúc Bài Hát Cuối Cùng (Immediate Buffer Sync & Channel Transition Pipeline)

### 1. Hiện Tượng Gặp Phải & Nguyên Nhân Kỹ Thuật (Root Causes)
1. **Trì Hoãn Đồng Bộ Đa Tầng (Batch Sync Latency Trap)**:
   - Cơ chế đồng bộ mặc định của hệ thống chỉ kích hoạt chu kỳ ETL (`syncTier2ToTier3` ➔ `syncTier3ToTier4`) khi tích lũy đủ 15 logs (`pendingLogsCount >= 15`).
   - Khi người dùng nghe bài hát cuối cùng của một kênh hoặc playlist, log rating (hoặc pass, block) bị treo lại trong `offlineOutbox` hoặc file `_2_events.jsonl` chưa được xử lý.
   - Các thao tác block không được purge ngay khỏi Tier 1 (`layer1_static`), khiến số lượng bài hát của kênh trong catalog không được cập nhật chính xác.
2. **Kênh Bị Mắc Kẹt Ở Đáy Include Vô Tận (Infinite Bottom Stall)**:
   - Khi bài hát cuối cùng của kênh kết thúc (`updatedList.length === 0`):
     + Hàm cũ chỉ kiểm tra điều kiện `totalCatalogCount <= 1`. Nếu kênh ban đầu có nhiều hơn 1 bài hát (ví dụ 3 hoặc 5 bài), điều kiện này bị sai khiến hệ thống gọi `replenishBufferIfNeeded()` thay vì chuyển kênh.
     + Hàm `replenishBufferIfNeeded()` lọc bỏ toàn bộ bài đã nghe qua `seenIdsRef.current`, dẫn đến không tải thêm được bài nào mới và giao diện bị khóa vĩnh viễn ở trạng thái `Current Buffer Completed!`.
     + Ngay cả khi `totalCatalogCount <= 1`, do không đồng bộ metadata (`channelMetaMap`) và danh sách kênh (`channelList`) với backend, hàm `computeBottomPlaylistOption()` tiếp tục dựa trên dữ liệu cũ và trả về chính kênh vừa phát xong.
     + Kết quả: Kênh đó bị kẹt ở đáy mục Include và lặp đi lặp lại mãi mãi.

### 2. Quy Trình Đồng Bộ Buffer Tức Thì (Immediate Buffer Flush & ETL Sync)
Ngay khi bài hát cuối cùng của kênh hoặc playlist hoàn thành (`updatedList.length === 0`):
1. **Xả Ngay Hộp Thư Ngoại Tuyến (Offline Outbox Flush)**:
   - Kiểm tra `offlineOutbox`: Nếu còn log đánh giá chưa gửi, lập tức gọi `flushOfflineEvents` để đẩy trực tiếp vào `_2_events.jsonl` và xóa sạch outbox trong store.
2. **Kích Hoạt Chuỗi Đồng Bộ Đa Tầng Cưỡng Bức (`forceClear = true`)**:
   - Gọi ngay lập tức `syncTier2ToTier3(targetProjectId, true)`:
     + Quét sạch các sự kiện `block`, xóa vĩnh viễn các ca khúc bị chặn khỏi Tier 1 (`layer1_static`) và xóa cache bộ nhớ.
     + Tổng hợp toàn bộ lượt nghe (`played`), điểm số và `hazard_rank` vào Tier 3 (`_3_state.db` và `channel_state`).
     + Xóa sạch file sự kiện `_2_events.jsonl`.
   - Gọi `syncTier3ToTier4(targetProjectId)`:
     + Chiếu các chỉ số cập nhật sang Tier 4 (`_4_display.db`).
   - Đặt lại bộ đếm `setPendingLogsCount(0)`.

### 3. Quy Trình Xử Lý Kênh Toàn Diện (Comprehensive Channel Processing)
Trước khi chuyển sang kênh tiếp theo, hệ thống tiến hành xử lý dứt điểm kênh hiện tại:
1. **Lấy Dữ Liệu Tươi Mới Từ Backend**:
   - Gọi song song `fetchChannelMeta`, `fetchChannelOrigins`, và `fetchCustomPlaylists`.
   - Việc gọi `fetchChannelMeta` tự động kích hoạt backend `sync_channel_approval_status`: kiểm tra nếu 100% bài hát của kênh đã được đưa vào Albums thì tự động chuyển trạng thái kênh sang `approved`.
2. **Phân Loại & Thăng Cấp Kênh**:
   - **Kênh có 0 bài hát còn lại** (do tất cả bài đã bị block/xóa): Hệ thống tự động kích hoạt `purgeChannelSongs`, xóa sạch metadata kênh khỏi `channel_meta` và loại bỏ khỏi `channelList`.
   - **Kênh đạt 100% Album Coverage**: Được đánh dấu `approved` và tự động ẩn hoàn toàn khỏi danh sách Include của Gameplay.
   - **Kênh Thô (`raw`) Đã Nghe Hết**: Nếu kênh có trạng thái `raw` và người dùng đã nghe/duyệt hết toàn bộ bài hát của kênh đó, hệ thống tự động thăng cấp kênh sang `cleaning` (`notes: 'audited'`) qua `updateChannelStatus`. Việc này đưa kênh rời khỏi nhóm `🔴 Raw Playlists` lên nhóm `🟡 Cleaning Playlists`, giải phóng vị trí đáy của nhóm Raw cho kênh tiếp theo.
   - **Custom Playlist Trống**: Tự động xóa Custom Playlist nếu toàn bộ bài hát/kênh bên trong đã bị dọn sạch.
3. **Đồng Bộ Lập Tức Lên Zustand Store**:
   - Cập nhật ngay `setChannelList(freshOrigins)`, `setChannelMetaMap(freshMeta)`, `setCustomPlaylists(freshPlaylists)` để dropdown Include và các bộ lọc phản ánh trạng thái mới tức thì.

### 4. Cơ Chế Chuyển Kênh Đáy An Toàn Tuyệt Đối (Bulletproof Bottom Transition)
1. **Bổ Sung Tham Số Loại Trừ (`excludeChannel`)**:
   - Hàm `computeBottomPlaylistOption` được mở rộng với tham số tùy chọn:
     ```ts
     export function computeBottomPlaylistOption(
       channelList: ChannelOriginItem[],
       customPlaylists: CustomPlaylist[],
       channelMetaMap: Record<string, { status: string }>,
       excludeChannel?: string
     ): string
     ```
   - Khi tính toán kênh ở đáy tiếp theo, kênh vừa hoàn thành (`curSelected`) được truyền vào `excludeChannel`. Cả 3 nhóm (Raw, Cleaning, Custom Playlists) đều chủ động bỏ qua kênh này.
   - Ngay cả trong tình huống hy hữu khi metadata chưa kịp cập nhật, hệ thống vẫn **100% không bao giờ chọn lại kênh vừa phát**.
2. **Khởi Động Lại Bộ Nhớ Đệm Cho Stream Mới**:
   - `seenIdsRef.current.clear()` được gọi trước khi tải bài hát mới, giúp kênh tiếp theo lấy mẫu bài hát đầy đủ và không bị nghẽn ID cũ.
   - Cấu hình bộ lọc được lưu tự động qua `saveFilterConfig` và `loadData` khởi động phát nhạc ngay tức thì.

---

## 17. Chế Độ Khám Phá Ca Khúc Mới Chưa Thuộc Album (Unassigned Album Discovery Mode)

### 1. Bản Chất & Ý Đồ Thiết Kế (Design Philosophy)
- **Mục tiêu**: Người dùng muốn một chế độ chuyên biệt tại tab Gacha/Gameplay (`VinylPlayer.tsx`) để tập trung **khám phá các ca khúc mới toanh** chưa từng được tuyển chọn hay đưa vào bất kỳ Album nào (`type = 'album'`).
- **Hai Cổng Tương Tác Song Hành (Dual-Entry Interaction)**:
  1. **Nút Toggle Chuyên Biệt Trên Header Telemetry (`✨ Discovery Mode`)**:
     - Nằm ngay hàng điều khiển chính cạnh Include, Exclude và Hazard Cap.
     - Khi bật: Nút phát sáng ánh vàng kim viền hổ phách (`border-amber-400 bg-amber-950/70 text-amber-200`) kèm huy hiệu `ON`.
     - Hoạt động linh hoạt: Nếu đang chọn một Channel cụ thể hoặc nhóm Status (`raw`/`cleaning`), Discovery Mode sẽ lọc riêng các bài hát chưa có Album của Channel/Nhóm đó; nếu đang ở `ALL`, hệ thống sẽ khám phá trên toàn bộ kho tàng 158,000+ ca khúc của catalog.
  2. **Option Nổi Bật Trong Dropdown Include (`✨ Discovery: Unassigned to Any Album`)**:
     - Tùy chọn độc lập `DISCOVERY:unassigned` nằm ngay dưới `🌐 All Playlists (Catalog)`.
     - Cho phép người dùng chuyển nhanh vào luồng stream khám phá toàn bộ catalog mà không cần thao tác nhiều bước.

### 2. Kiến Trúc Lọc Siêu Tốc Backend (<30ms với SQLite ATTACH & JSON Indexing)
- **Cơ chế truy vấn**:
  - Tận dụng `ATTACH DATABASE 'playlists.db' AS pl_db` trực tiếp vào kết nối của `_1_static.db`.
  - Sử dụng hàm tích hợp sẵn của SQLite `json_each(pl_db.playlists.include_songs)` kèm `json_valid(...) = 1` để quét tất cả `include_songs` của các playlist có `type = 'album'`.
  - Mệnh đề lọc siêu tốc:
    ```sql
    id NOT IN (
        SELECT value FROM pl_db.playlists, json_each(pl_db.playlists.include_songs)
        WHERE pl_db.playlists.type = 'album'
          AND pl_db.playlists.include_songs IS NOT NULL
          AND pl_db.playlists.include_songs != ''
          AND json_valid(pl_db.playlists.include_songs) = 1
    )
    ```
  - **Tốc độ thực thi**: Chỉ tiêu tốn **~29ms** để đếm tổng số bài chưa gán (~158,400 bài) và **~63ms** để sample 50 bài hát ngẫu nhiên có trọng số, hoàn toàn tuân thủ tiêu chuẩn tốc độ <100ms của hệ sinh thái Vinyl Angel.

### 3. Vòng Đời Curation & Phản Hồi Trực Quan Tại Deck Điều Khiển
1. **Huy Hiệu Trực Quan (`✨ DISCOVERY (NO ALBUM)`)**:
   - Khi ca khúc đang phát chưa thuộc bất kỳ Album nào, hàng thông số metadata (dưới tên bài hát) hiển thị huy hiệu nổi bật `✨ DISCOVERY (NO ALBUM)`.
   - Banner tải luồng hiển thị chính xác: `Sampling Stream: Discovery Mode (Unassigned to Albums)...`.
   - Thanh đếm buffer hiển thị nhãn tiền tố: `DISCOVERY • TRACK X / Y`.
2. **Quy Trình Gán Album Một Chạm**:
   - Khi người dùng bấm `ADD TO ALBUM` để tuyển chọn ca khúc vào một Album:
     - Bài hát ngay lập tức được thêm vào `include_songs` của Album đó.
     - Khi chuyển bài (`Spin` hoặc đánh giá điểm số), bài hát này tự động bị loại khỏi các lượt Discovery tiếp theo.
3. **Lưu Trữ Bền Vững Tại Tier 5 (`_5_config.db`)**:
   - Trạng thái `discovery_mode: boolean` được lưu trữ trực tiếp vào cấu hình `filter_settings` tại `_5_config.db`.
   - Khi tải lại trang hoặc mở lại ứng dụng, chế độ Discovery được khôi phục tự động theo đúng thiết lập phiên trước của người dùng.

---

## 18. Nâng Cấp Bộ Chọn Include: Phân Nhóm Đóng/Mở (Foldable/Expandable) & Ghi Nhớ Trạng Thái Bền Vững Tại Backend

### 1. Vấn Đề Gốc Của Thẻ `<select>` & `<optgroup>` Thuần HTML
- Trước đây, bộ chọn `Include` tại Deck điều khiển Gameplay sử dụng thẻ native HTML `<select>` với các nhóm `<optgroup>`.
- **Hạn chế kỹ thuật**:
  - Chuẩn thẻ HTML `<select>` và `<optgroup>` không hỗ trợ thu gọn/mở rộng (fold/expand) các phân đoạn danh mục. Khi số lượng Custom Playlists, Cleaning Playlists và Raw Playlists ngày càng đồ sộ, danh sách xổ xuống trở nên quá dài và khó điều hướng.
  - Không thể tích hợp thanh tìm kiếm nhanh bên trong menu native của trình duyệt.
  - Không thể lưu trữ hoặc ghi nhớ trạng thái đóng/mở của từng nhóm danh mục vào cơ sở dữ liệu.

### 2. Kiến Trúc Popover Tùy Chỉnh Chuẩn Quy Tắc Thiết Kế UI/UX Hệ Thống (Rule 8)
- Bộ chọn `Include` được nâng cấp toàn diện thành một Custom Popover sang trọng (`VinylPlayer.tsx`):
  1. **Nút Trigger Điều Khiển Đẳng Cấp**:
     - Hiển thị nhãn trực quan của kênh/playlist đang chọn (ví dụ: `🌐 All Playlists`, `✨ Discovery: Unassigned`, hoặc tên Album/Playlist với emoji riêng).
     - Biểu tượng mũi tên `ChevronDown` xoay 180° mượt mà khi mở menu popover.
     - Tự động đóng popover khi người dùng nhấp chuột ra ngoài màn hình (click-outside detection với `includeDropdownRef`).
  2. **Thanh Tìm Kiếm Nhanh Nội Bộ (Realtime Inline Search)**:
     - Cho phép lọc đồng thời tên Custom Playlists, Cleaning Playlists và Raw Playlists ngay khi người dùng gõ phím.
     - Tích hợp nút xóa nhanh (`X`) để khôi phục danh sách đầy đủ.
  3. **Lựa Chọn Toàn Cục Tiện Lợi**:
     - `🌐 All Playlists (Catalog)` và `✨ Discovery: Unassigned to Album` luôn được ghim ở vị trí trên cùng để kích hoạt tức thì với 1 cú click.

### 3. Cơ Chế Phân Nhóm Đóng/Mở & Quy Luật Bề Mặt Hitbox (Monolithic Hitbox & Full-Surface Target Law)
- Menu được tổ chức thành 3 phân nhóm riêng biệt:
  - `⭐ Custom Playlists` (viền tím thạch anh - font Cinzel vàng kim)
  - `🟡 Cleaning Playlists` (viền vàng hổ phách - text amber)
  - `🔴 Raw Playlists` (viền đỏ ruby - text rose)
- **Quy tắc Hitbox 100% không vùng chết (Rule 8 Codex)**:
  - Toàn bộ thanh tiêu đề của mỗi phân nhóm (`min-h-[44px]`) là một nút bấm tương tác 100% diện tích.
  - Nhấp vào bất kỳ đâu trên thanh tiêu đề sẽ lập tức đảo trạng thái đóng/mở (`folded` / `expanded`) của nhóm đó.
  - Biểu tượng mũi tên xoay mượt mà chỉ hướng trạng thái (`-rotate-90` khi gập, `rotate-0` khi mở) kèm nhãn `Fold` / `Expand` và badge số lượng phần tử.

### 4. Ghi Nhớ Bền Vững Trạng Thái Đóng/Mở Tại Backend Tier 5 (`_5_config.db`)
- **Mô hình Dữ Liệu**:
  - Đối tượng trạng thái: `folded_sections: { custom?: boolean, cleaning?: boolean, raw?: boolean }`.
  - Cấu hình lưu trữ tại bảng `layer4_config` của SQLite `_5_config.db` dưới dạng JSON string.
- **Vòng Đời Đồng Bộ**:
  - **Khi người dùng gập/mở một nhóm**: Hàm `handleToggleFoldSection` cập nhật React state cục bộ đồng thời gọi ngay `saveFilterConfig(targetProjectId, { foldedSections: next })` để ghi thẳng vào SQLite backend.
  - **Khi mở lại ứng dụng hoặc chuyển đổi dự án**: `initFromPersistentConfig` nạp cấu hình qua `getFilterConfig(targetProjectId)`, tự động khôi phục chính xác trạng thái đóng/mở của từng phân nhóm như phiên làm việc trước đó của Manager.





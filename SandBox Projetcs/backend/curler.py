# backend/integrations/curler/curler_service.py — Vinyl Angel Playlist Curler Service
import os
import re
import ssl
import json
import time
import sqlite3
import datetime
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path
from typing import List, Dict, Any, Optional, Set, Generator

SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.load_default_certs()

API_KEY = os.environ.get("YOUTUBE_API_KEY", "AIzaSyA8otrrKxrU27QgbcD5tLW8-8ZzVw2-C2E")
BASE_URL = "https://www.googleapis.com/youtube/v3"

BASE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "projects" / "music_app" / "app_data"
DEFAULT_PLAYLIST_FILE = BASE_DIR / "playlists.txt"

APP_STATIC_DB_FILE = BASE_DIR / "_1_static.db"
BLOCKED_DB_FILE = BASE_DIR / "blocked.db"

def parse_iso8601_duration(duration_str: str) -> int:
    if not duration_str or duration_str == "PT0S":
        return 0
    pattern = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")
    match = pattern.match(duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def fetch_youtube_api(endpoint: str, params: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
    full_params = {**params, "key": API_KEY}
    query_str = urllib.parse.urlencode(full_params)
    url = f"{BASE_URL}/{endpoint}?{query_str}"

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "VinylAngel-IngestionEngine/1.0", "Accept": "application/json"},
    )
    last_err = None
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, context=SSL_CONTEXT, timeout=25) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # 400, 403, 404: permanent client/quota errors
            if e.code in [400, 403, 404]:
                raise
            last_err = e
            time.sleep(1.2 * (attempt + 1))
        except (urllib.error.URLError, TimeoutError, OSError, Exception) as e:
            last_err = e
            time.sleep(1.2 * (attempt + 1))

    if last_err:
        raise last_err
    return {}

def get_stored_playlists() -> List[str]:
    if not DEFAULT_PLAYLIST_FILE.exists():
        legacy_file = Path(__file__).resolve().parent.parent.parent.parent / "OLD_LAG" / "playlists.txt"
        if legacy_file.exists():
            DEFAULT_PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(legacy_file, "r", encoding="utf-8") as rf, open(
                DEFAULT_PLAYLIST_FILE, "w", encoding="utf-8"
            ) as wf:
                wf.write(rf.read())
        else:
            return []

    with open(DEFAULT_PLAYLIST_FILE, "r", encoding="utf-8") as f:
        raw_lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

    seen = set()
    unique_urls = []
    for u in raw_lines:
        if u not in seen:
            seen.add(u)
            unique_urls.append(u)
    return unique_urls

def save_stored_playlists(urls: List[str]):
    DEFAULT_PLAYLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DEFAULT_PLAYLIST_FILE, "w", encoding="utf-8") as f:
        for url in urls:
            clean = url.strip()
            if clean:
                f.write(clean + "\n")

def extract_playlist_or_video(url: str) -> tuple:
    """
    Extracts either a YouTube Playlist ID or a single Video ID from any URL format.
    Returns (type: 'playlist' | 'video', id: str).
    """
    clean = url.strip()
    if clean.startswith("PL") or clean.startswith("UU") or clean.startswith("FL") or clean.startswith("RD"):
        return ("playlist", clean)

    parsed = urllib.parse.urlparse(clean)
    query = urllib.parse.parse_qs(parsed.query)

    # 1. Check for playlist list parameter
    if "list" in query and query["list"]:
        return ("playlist", query["list"][0])

    path_parts = parsed.path.strip("/").split("/")
    if "playlist" in path_parts and "list" in query:
        return ("playlist", query["list"][0])

    # 2. Check for single video ID
    if "v" in query and query["v"]:
        return ("video", query["v"][0])

    if "youtu.be" in parsed.netloc:
        vid = parsed.path.strip("/")
        if len(vid) == 11:
            return ("video", vid)

    if len(path_parts) >= 2 and path_parts[0] in ["shorts", "embed", "v"]:
        if len(path_parts[1]) == 11:
            return ("video", path_parts[1])

    # Raw 11-char video ID
    if len(clean) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", clean):
        return ("video", clean)

    raise ValueError(f"Could not extract playlist or video ID from: {url}")

def playlist_id_from_url(url: str) -> str:
    return extract_playlist_or_video(url)[1]

def get_blocked_ids() -> Set[str]:
    """Retrieves all video IDs from blocked.db to ensure they are excluded from re-ingestion."""
    if not BLOCKED_DB_FILE.exists():
        return set()
    try:
        with sqlite3.connect(BLOCKED_DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            tables = cursor.fetchall()
            if not tables:
                return set()
            cursor.execute(f"SELECT id FROM {tables[0][0]}")
            return {row[0] for row in cursor.fetchall() if row[0]}
    except Exception:
        return set()

def get_blacklisted_ids() -> Set[str]:
    return get_blocked_ids()

def check_existing_ids_in_db(db_path: Path, ids: List[str]) -> Set[str]:
    """Efficiently queries only the requested IDs instead of loading 160k rows into RAM."""
    if not db_path.exists() or not ids:
        return set()
    found = set()
    try:
        with sqlite3.connect(db_path, timeout=30.0) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            if not tables:
                return set()
            tbl = tables[0][0]
            chunk_size = 500
            for i in range(0, len(ids), chunk_size):
                chunk = ids[i : i + chunk_size]
                placeholders = ",".join(["?"] * len(chunk))
                cursor.execute(f"SELECT id FROM {tbl} WHERE id IN ({placeholders})", chunk)
                found.update(row[0] for row in cursor.fetchall() if row[0])
    except Exception as e:
        print(f"[Curler Engine] Error querying existing IDs: {e}")
    return found

def get_catalog_count(db_path: Path) -> int:
    """Fast COUNT(*) without loading hundreds of thousands of records into Python RAM."""
    if not db_path.exists():
        return 0
    try:
        with sqlite3.connect(db_path, timeout=30.0) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            if not tables:
                return set()
            cursor.execute(f"SELECT COUNT(*) FROM {tables[0][0]}")
            row = cursor.fetchone()
            return row[0] if row else 0
    except Exception:
        return 0

def get_existing_video_ids(db_path: Path) -> Set[str]:
    return set()

def get_playlist_video_ids(playlist_id: str, max_items: Optional[int] = None) -> List[str]:
    video_ids = []
    page_token = None

    while True:
        params: Dict[str, Any] = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
        }
        if page_token:
            params["pageToken"] = page_token

        data = fetch_youtube_api("playlistItems", params)

        for item in data.get("items", []):
            vid = item.get("contentDetails", {}).get("videoId")
            if vid:
                video_ids.append(vid)
                if max_items and len(video_ids) >= max_items:
                    return video_ids

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return video_ids

def chunks(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]

def get_video_metadata(video_ids: List[str]) -> List[Dict[str, Any]]:
    videos = []
    for batch in chunks(video_ids, 50):
        params = {
            "part": "snippet,contentDetails",
            "id": ",".join(batch),
        }
        data = fetch_youtube_api("videos", params)
        videos.extend(data.get("items", []))
    return videos

def pick_best_thumbnail(thumbnails: dict) -> str:
    priority = ["maxres", "standard", "high", "medium", "default"]
    for key in priority:
        if key in thumbnails and "url" in thumbnails[key]:
            return thumbnails[key]["url"]
    return ""

def extract_sql_tuple(video: dict) -> tuple:
    vid = video.get("id")
    snippet = video.get("snippet", {})
    content = video.get("contentDetails", {})
    duration = parse_iso8601_duration(content.get("duration", "PT0S"))

    return (
        vid,
        snippet.get("title", ""),
        pick_best_thumbnail(snippet.get("thumbnails", {})),
        duration,
        snippet.get("publishedAt", ""),
        snippet.get("channelId", ""),
        snippet.get("channelTitle", ""),
        "[]",
    )

def save_to_target_databases(parsed_songs: list):
    if not parsed_songs:
        return

    target_dbs = [APP_STATIC_DB_FILE]

    for db_path in target_dbs:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with sqlite3.connect(db_path, timeout=30.0) as conn:
                conn.execute("PRAGMA busy_timeout = 30000;")
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS layer1_static (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        thumbnail TEXT,
                        duration INTEGER DEFAULT 0,
                        published_at TEXT,
                        channel_id TEXT,
                        channel_name TEXT,
                        chapters TEXT DEFAULT '[]'
                    )
                """)
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                target_table = tables[0][0] if tables else "layer1_static"

                cursor.executemany(
                    f"""
                    INSERT OR IGNORE INTO {target_table}
                    (id, title, thumbnail, duration, published_at, channel_id, channel_name, chapters)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    parsed_songs,
                )
                conn.commit()

            # When new songs are ingested into a channel/playlist, revert its status to 'cleaning'
            pl_file = db_path.parent / "playlists.db"
            if pl_file.parent.exists():
                try:
                    with sqlite3.connect(pl_file, timeout=30.0) as conn_pl:
                        conn_pl.execute("PRAGMA busy_timeout = 30000;")
                        cur_pl = conn_pl.cursor()
                        cur_pl.execute("""
                            CREATE TABLE IF NOT EXISTS channel_meta (
                                id TEXT PRIMARY KEY,
                                channel_name TEXT,
                                status TEXT DEFAULT 'raw',
                                notes TEXT,
                                updated_at TEXT
                            )
                        """)
                        now_iso = datetime.datetime.now().isoformat()
                        ingested_channels = set()
                        for s in parsed_songs:
                            ch_id = s[5]
                            ch_name = s[6]
                            if ch_id or ch_name:
                                ingested_channels.add((ch_id, ch_name))

                        for ch_id, ch_name in ingested_channels:
                            key = ch_id or ch_name
                            cur_pl.execute("SELECT status FROM channel_meta WHERE id = ? OR channel_name = ?", (key, ch_name))
                            row = cur_pl.fetchone()
                            if row:
                                cur_pl.execute(
                                    "UPDATE channel_meta SET status = 'cleaning', notes = '', updated_at = ? WHERE id = ? OR channel_name = ?",
                                    (now_iso, key, ch_name)
                                )
                            else:
                                cur_pl.execute(
                                    "INSERT INTO channel_meta (id, channel_name, status, notes, updated_at) VALUES (?, ?, 'cleaning', '', ?)",
                                    (key, ch_name, now_iso)
                                )
                        conn_pl.commit()
                except Exception as e_pl:
                    print(f"[Curler Engine] Error updating channel status to cleaning: {e_pl}")
        except Exception as e:
            print(f"[Curler Engine] Error updating {db_path.name}: {e}")

def stream_playlist_curl(
    playlist_urls: Optional[List[str]] = None,
    max_playlists: Optional[int] = None,
    max_per_playlist: Optional[int] = None,
) -> Generator[Dict[str, Any], None, None]:
    def now_str():
        return datetime.datetime.now().strftime("%H:%M:%S")

    if playlist_urls is not None:
        if isinstance(playlist_urls, str):
            raw_items = playlist_urls.splitlines()
        else:
            raw_items = []
            for u in playlist_urls:
                if isinstance(u, str):
                    raw_items.extend(u.splitlines())
                elif u:
                    raw_items.append(str(u))
        cleaned_urls = []
        seen = set()
        for item in raw_items:
            c = item.strip().strip("\"'")
            if c and not c.startswith("#") and c not in seen:
                seen.add(c)
                cleaned_urls.append(c)
        playlist_urls = cleaned_urls
    else:
        playlist_urls = get_stored_playlists()

    if max_playlists and max_playlists > 0:
        playlist_urls = playlist_urls[:max_playlists]

    if not playlist_urls:
        yield {
            "type": "error",
            "category": "red",
            "message": "No playlist URLs found in configuration (playlists.txt is empty).",
            "timestamp": now_str(),
        }
        return

    blocked_ids = get_blocked_ids()
    initial_catalog_count = get_catalog_count(APP_STATIC_DB_FILE)

    blocked_msg = f", {len(blocked_ids):,} blocked" if blocked_ids else ""
    yield {
        "type": "init",
        "category": "green",
        "timestamp": now_str(),
        "total_playlists": len(playlist_urls),
        "initial_catalog_count": initial_catalog_count,
        "target_db": str(APP_STATIC_DB_FILE.name),
        "target_path": str(APP_STATIC_DB_FILE.resolve()),
        "message": f"Initialized Ingestion Engine. Target output: {APP_STATIC_DB_FILE.name} ({initial_catalog_count:,} existing songs{blocked_msg}).",
    }

    total_new = 0
    total_scanned_videos = 0
    total_green = 0
    total_yellow = 0
    total_red = 0
    reports = []

    for idx, url in enumerate(playlist_urls, 1):
        try:
            target_type, target_id = extract_playlist_or_video(url)
            is_single_video = (target_type == "video")

            yield {
                "type": "playlist_start",
                "category": "info",
                "timestamp": now_str(),
                "index": idx,
                "total": len(playlist_urls),
                "playlist_id": target_id,
                "url": url,
                "message": f"[{idx}/{len(playlist_urls)}] Ingesting {'Single Song' if is_single_video else 'Playlist'}: {target_id}",
            }

            if is_single_video:
                scraped_ids = [target_id]
            else:
                scraped_ids = get_playlist_video_ids(target_id, max_items=max_per_playlist)

            total_in_pl = len(scraped_ids)
            total_scanned_videos += total_in_pl

            # Fast indexed query for IDs of THIS playlist only
            existing_in_db = check_existing_ids_in_db(APP_STATIC_DB_FILE, scraped_ids)
            blocked_in_pl = {vid for vid in scraped_ids if vid in blocked_ids}
            known_ids_for_pl = existing_in_db.union(blocked_in_pl)

            missing_ids = [vid for vid in scraped_ids if vid not in known_ids_for_pl]
            new_inserted_for_pl = 0
            unavailable_count = 0

            if missing_ids:
                meta_list = get_video_metadata(missing_ids)
                fetched_ids = {v.get("id") for v in meta_list if v.get("id")}
                unavailable_count = len(missing_ids) - len(fetched_ids)

                db_batch = []
                for v in meta_list:
                    tup = extract_sql_tuple(v)
                    if tup[0] and tup[0] not in known_ids_for_pl:
                        db_batch.append(tup)
                        known_ids_for_pl.add(tup[0])

                if db_batch:
                    save_to_target_databases(db_batch)
                    new_inserted_for_pl = len(db_batch)
                    total_new += new_inserted_for_pl

            in_db_count = sum(1 for vid in scraped_ids if vid in known_ids_for_pl)

            label_name = "Song" if is_single_video else "Playlist"
            if unavailable_count > 0 or in_db_count < total_in_pl:
                total_red += 1
                category = "red"
                status = "unavailable"
                msg = f"🔴 [RED - UNAVAILABLE] {label_name} [{target_id}]: {in_db_count}/{total_in_pl} in DB ({unavailable_count} unavailable on YouTube)."
            elif new_inserted_for_pl > 0:
                total_yellow += 1
                category = "yellow"
                status = "curled_new"
                msg = f"🟡 [YELLOW - CURLED NEW] {label_name} [{target_id}]: Curled +{new_inserted_for_pl} new song(s) into database."
            else:
                total_green += 1
                category = "green"
                status = "all_taken"
                msg = f"🟢 [GREEN - ALL TAKEN] {label_name} [{target_id}]: Already present in DB (100% Synced)."

            reports.append({
                "playlist_id": target_id,
                "url": url,
                "total_in_playlist": total_in_pl,
                "in_db_count": in_db_count,
                "new_added": new_inserted_for_pl,
                "unavailable_count": unavailable_count,
                "category": category,
                "status": status,
                "message": msg,
            })

            yield {
                "type": "playlist_done",
                "category": category,
                "status": status,
                "timestamp": now_str(),
                "index": idx,
                "total": len(playlist_urls),
                "playlist_id": target_id,
                "new_added": new_inserted_for_pl,
                "total_in_playlist": total_in_pl,
                "in_db_count": in_db_count,
                "unavailable_count": unavailable_count,
                "total_new_cumulative": total_new,
                "message": msg,
            }

        except Exception as e:
            total_red += 1
            err_msg = str(e)
            fail_msg = f"🔴 [RED - FAILED] Playlist [{url}]: FAILED - {err_msg}"
            reports.append({
                "playlist_id": url,
                "url": url,
                "total_in_playlist": 0,
                "in_db_count": 0,
                "new_added": 0,
                "unavailable_count": 0,
                "category": "red",
                "status": "failed",
                "error": err_msg,
                "message": fail_msg,
            })
            yield {
                "type": "playlist_error",
                "category": "red",
                "status": "failed",
                "timestamp": now_str(),
                "index": idx,
                "total": len(playlist_urls),
                "playlist_id": url,
                "error": err_msg,
                "message": fail_msg,
            }

    # Sync channel approval status ONCE after the entire batch finishes if new songs were added
    if total_new > 0:
        try:
            from core.storage_engine import sync_channel_approval_status
            sync_channel_approval_status(APP_STATIC_DB_FILE.parent)
        except Exception as e_sync:
            print(f"[Curler Engine] Post-ingestion sync error: {e_sync}")

    final_catalog_count = get_catalog_count(APP_STATIC_DB_FILE)

    summary_msg = (
        f"=== INGESTION FINISHED === "
        f"🟢 All Taken: {total_green} | 🟡 Curled New: {total_yellow} | 🔴 Issues/Dead: {total_red} | "
        f"New Songs Added: +{total_new} | Final Sound Pool: {final_catalog_count:,}"
    )

    yield {
        "type": "complete",
        "category": "green" if total_red == 0 else "yellow",
        "timestamp": now_str(),
        "total_playlists": len(playlist_urls),
        "total_green": total_green,
        "total_yellow": total_yellow,
        "total_red": total_red,
        "total_scanned_videos": total_scanned_videos,
        "total_new_added": total_new,
        "final_catalog_count": final_catalog_count,
        "target_db": str(APP_STATIC_DB_FILE.name),
        "reports": reports,
        "message": summary_msg,
    }

def run_playlist_curl(
    playlist_urls: Optional[List[str]] = None,
    max_playlists: Optional[int] = None,
    max_per_playlist: Optional[int] = None,
) -> Dict[str, Any]:
    last_event = None
    for event in stream_playlist_curl(playlist_urls, max_playlists, max_per_playlist):
        if event.get("type") == "complete":
            last_event = event

    if last_event:
        return {
            "status": "success",
            "total_playlists": last_event.get("total_playlists", 0),
            "total_green": last_event.get("total_green", 0),
            "total_yellow": last_event.get("total_yellow", 0),
            "total_red": last_event.get("total_red", 0),
            "total_scanned_videos": last_event.get("total_scanned_videos", 0),
            "total_new_added": last_event.get("total_new_added", 0),
            "total_catalog_now": last_event.get("final_catalog_count", 0),
            "target_db": last_event.get("target_db", APP_STATIC_DB_FILE.name),
            "reports": last_event.get("reports", []),
        }

    return {
        "status": "skipped",
        "message": "No events processed",
        "total_green": 0,
        "total_yellow": 0,
        "total_red": 0,
        "total_new_added": 0,
        "total_catalog_now": len(get_existing_video_ids(APP_STATIC_DB_FILE)),
        "reports": [],
    }

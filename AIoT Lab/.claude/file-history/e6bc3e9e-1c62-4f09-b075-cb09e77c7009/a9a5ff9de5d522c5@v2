"""backend/integrations/heraclitus/yellow_pool_repo.py

Tier 2 Repository tier for Yellow Time Pool state persistence.
Authoritative SQLite ACID Single Source of Truth (SSOT).
Database: backend/data/projects/universe_25/app_data/heraclitus/yellow_pool.db
"""

import json
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
HERACLITUS_DIR = BACKEND_ROOT / "data" / "projects" / "universe_25" / "app_data" / "heraclitus"
DB_FILE = HERACLITUS_DIR / "yellow_pool.db"
JSON_BACKUP_FILE = HERACLITUS_DIR / "yellow_time_pool.json"


class PoolTransaction(BaseModel):
    id: str
    timestamp: str
    source: str
    category: str
    seconds: float
    formatted: str
    speed: float = 1.0
    notes: Optional[str] = None


class YellowTimePoolState(BaseModel):
    balance_seconds: float = 0.0
    total_earned_seconds: float = 0.0
    formatted_balance: str = "0s"
    formatted_total_earned: str = "0s"
    transactions: List[PoolTransaction] = []


def format_duration(seconds: float) -> str:
    total_int = int(seconds)
    days, rem = divmod(total_int, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, secs = divmod(rem, 60)

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0 or days > 0:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def get_connection() -> sqlite3.Connection:
    if not HERACLITUS_DIR.exists():
        HERACLITUS_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_FILE), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS pool_state (
                id TEXT PRIMARY KEY,
                balance_seconds REAL NOT NULL DEFAULT 0.0,
                total_earned_seconds REAL NOT NULL DEFAULT 0.0,
                updated_at TEXT NOT NULL
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'grind',
                seconds REAL NOT NULL,
                formatted TEXT NOT NULL,
                speed REAL NOT NULL DEFAULT 1.0,
                notes TEXT
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp DESC);")

        # Check if pool_state row exists; if not, check for migration from JSON
        cur = conn.execute("SELECT balance_seconds, total_earned_seconds FROM pool_state WHERE id = 'main';")
        row = cur.fetchone()
        if not row:
            balance = 0.0
            earned = 0.0
            if JSON_BACKUP_FILE.exists():
                try:
                    with open(JSON_BACKUP_FILE, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    balance = float(data.get("balance_seconds", 0.0))
                    earned = float(data.get("total_earned_seconds", 0.0))
                    raw_txs = data.get("transactions", [])
                    for t in raw_txs:
                        conn.execute("""
                            INSERT OR IGNORE INTO transactions
                            (id, timestamp, source, category, seconds, formatted, speed, notes)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                        """, (
                            t.get("id") or f"tx_{uuid.uuid4().hex[:10]}",
                            t.get("timestamp") or datetime.now().isoformat(),
                            t.get("source") or "Migrated Deposit",
                            t.get("category") or "grind",
                            float(t.get("seconds", 0.0)),
                            t.get("formatted") or format_duration(float(t.get("seconds", 0.0))),
                            float(t.get("speed", 1.0)),
                            t.get("notes")
                        ))
                except Exception as e:
                    print(f"[YellowPoolRepo] Migration from JSON failed: {e}")

            conn.execute("""
                INSERT INTO pool_state (id, balance_seconds, total_earned_seconds, updated_at)
                VALUES ('main', ?, ?, ?);
            """, (round(balance, 2), round(earned, 2), datetime.now().isoformat()))


def load_pool_state() -> YellowTimePoolState:
    init_db()
    with get_connection() as conn:
        cur = conn.execute("SELECT balance_seconds, total_earned_seconds FROM pool_state WHERE id = 'main';")
        state_row = cur.fetchone()
        if not state_row:
            return YellowTimePoolState()

        balance = float(state_row["balance_seconds"])
        earned = float(state_row["total_earned_seconds"])

        cur_txs = conn.execute("""
            SELECT id, timestamp, source, category, seconds, formatted, speed, notes
            FROM transactions
            ORDER BY timestamp DESC
            LIMIT 50;
        """)
        tx_rows = cur_txs.fetchall()
        transactions = [
            PoolTransaction(
                id=r["id"],
                timestamp=r["timestamp"],
                source=r["source"],
                category=r["category"],
                seconds=float(r["seconds"]),
                formatted=r["formatted"],
                speed=float(r["speed"]),
                notes=r["notes"]
            )
            for r in tx_rows
        ]

        return YellowTimePoolState(
            balance_seconds=round(balance, 2),
            total_earned_seconds=round(earned, 2),
            formatted_balance=format_duration(balance),
            formatted_total_earned=format_duration(earned),
            transactions=transactions
        )


def record_deposit(
    seconds: float,
    source: str,
    category: str = "grind",
    speed: float = 1.0,
    notes: Optional[str] = None
) -> YellowTimePoolState:
    init_db()
    deposit_amount = max(0.0, float(seconds))
    tx_id = f"tx_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now().isoformat()
    formatted = format_duration(deposit_amount)

    with get_connection() as conn:
        # Atomic SQLite Transaction
        conn.execute("""
            INSERT INTO transactions (id, timestamp, source, category, seconds, formatted, speed, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (tx_id, now_iso, source, category, round(deposit_amount, 2), formatted, speed, notes))

        conn.execute("""
            UPDATE pool_state
            SET balance_seconds = balance_seconds + ?,
                total_earned_seconds = total_earned_seconds + ?,
                updated_at = ?
            WHERE id = 'main';
        """, (round(deposit_amount, 2), round(deposit_amount, 2), now_iso))

    return load_pool_state()

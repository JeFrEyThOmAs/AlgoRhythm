"""
AlgoRhythm Database Layer - SQLite
Thread-safe SQLite storage with WAL mode, busy timeout, and connection safeguards.
"""
import os
import sqlite3
import json
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "algorhythm.db"))
_db_lock = threading.Lock()

def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode and normal synchronous for high-concurrency read/write
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=30000;")
    return conn

def init_db():
    with _db_lock:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                favorite_artists TEXT,
                seed_tracks TEXT
            )
            """)
            
            # Interactions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                track_id INTEGER NOT NULL,
                artist TEXT NOT NULL,
                title TEXT NOT NULL,
                interaction_type TEXT NOT NULL,
                play_count INTEGER DEFAULT 1,
                weight REAL DEFAULT 1.0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Metadata cache table (for iTunes artwork & previews)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata_cache (
                track_key TEXT PRIMARY KEY,
                artwork_url TEXT,
                preview_url TEXT,
                album_name TEXT,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type)")
            conn.commit()
        finally:
            conn.close()

# Auto-initialize on import
init_db()

def create_or_update_user(user_id: str, favorite_artists: List[str], seed_tracks: List[Dict[str, Any]]):
    artists_json = json.dumps(favorite_artists)
    seed_tracks_json = json.dumps(seed_tracks)
    
    with _db_lock:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO users (user_id, favorite_artists, seed_tracks)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                favorite_artists = excluded.favorite_artists,
                seed_tracks = excluded.seed_tracks
            """, (user_id, artists_json, seed_tracks_json))
            
            # Also record seed tracks as onboarding interactions
            for track in seed_tracks:
                tid = track.get("track_id") or track.get("id")
                art = track.get("artist", "")
                trk = track.get("title", "")
                cursor.execute("""
                INSERT INTO interactions (user_id, track_id, artist, title, interaction_type, play_count, weight)
                VALUES (?, ?, ?, ?, 'seed_choice', 1, 4.0)
                """, (user_id, tid, art, trk))
                
            conn.commit()
        finally:
            conn.close()

def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "user_id": row["user_id"],
            "created_at": row["created_at"],
            "favorite_artists": json.loads(row["favorite_artists"] or "[]"),
            "seed_tracks": json.loads(row["seed_tracks"] or "[]")
        }
    finally:
        conn.close()

def record_interaction(
    user_id: str,
    track_id: int,
    artist: str,
    title: str,
    interaction_type: str,
    play_count: int = 1
) -> Dict[str, Any]:
    weight_map = {
        "like": 3.0,
        "favorite": 5.0,
        "play": 1.5,
        "replay": 2.5,
        "skip": -0.5,
        "seed_choice": 4.0
    }
    weight = weight_map.get(interaction_type.lower(), 1.0)
    
    with _db_lock:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO interactions (user_id, track_id, artist, title, interaction_type, play_count, weight)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, track_id, artist, title, interaction_type, play_count, weight))
            conn.commit()
            row_id = cursor.lastrowid
        finally:
            conn.close()
    
    return {
        "id": row_id,
        "user_id": user_id,
        "track_id": track_id,
        "artist": artist,
        "title": title,
        "interaction_type": interaction_type,
        "play_count": play_count,
        "weight": weight,
        "timestamp": datetime.now().isoformat()
    }

def get_user_interactions(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, user_id, track_id, artist, title, interaction_type, play_count, weight, timestamp
        FROM interactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        """, (user_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_user_effective_preferences(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id, SUM(weight) as total_weight, COUNT(*) as interaction_count
        FROM interactions
        WHERE user_id = ?
        GROUP BY track_id
        HAVING total_weight > 0
        """, (user_id,))
        rows = cursor.fetchall()
        return [{"track_id": r["track_id"], "weight": r["total_weight"]} for r in rows]
    finally:
        conn.close()

def get_cached_metadata(track_key: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT artwork_url, preview_url, album_name FROM metadata_cache WHERE track_key = ?", (track_key,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def set_cached_metadata(track_key: str, artwork_url: str, preview_url: str, album_name: str):
    with _db_lock:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO metadata_cache (track_key, artwork_url, preview_url, album_name)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(track_key) DO UPDATE SET
                artwork_url = excluded.artwork_url,
                preview_url = excluded.preview_url,
                album_name = excluded.album_name
            """, (track_key, artwork_url, preview_url, album_name))
            conn.commit()
        finally:
            conn.close()

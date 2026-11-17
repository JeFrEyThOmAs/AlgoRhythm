"""
AlgoRhythm Metadata Service
Resolves album artwork and 30-second audio preview URLs using iTunes Search API
with persistent SQLite caching and deterministic offline fallbacks.
"""
import os
import sys
import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Optional

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import get_cached_metadata, set_cached_metadata

_MEM_CACHE: Dict[str, Dict[str, Any]] = {}

def get_track_metadata(artist: str, title: str) -> Dict[str, Any]:
    track_key = f"{artist.strip().lower()} ::: {title.strip().lower()}"
    
    # 1. Fast in-memory cache check
    if track_key in _MEM_CACHE:
        return _MEM_CACHE[track_key]

    # 2. Check SQLite cache
    try:
        cached = get_cached_metadata(track_key)
        if cached:
            _MEM_CACHE[track_key] = cached
            return cached
    except Exception:
        pass

    # 3. Query iTunes Search API
    artwork_url = None
    preview_url = None
    album_name = None
    
    try:
        query = f"{artist} {title}"
        params = urllib.parse.urlencode({
            "term": query,
            "entity": "song",
            "limit": 1
        })
        url = f"https://itunes.apple.com/search?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "AlgoRhythm/1.0"})
        
        with urllib.request.urlopen(req, timeout=1.5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                results = data.get("results", [])
                if results:
                    first = results[0]
                    # Get high resolution artwork (replace 100x100 with 600x600)
                    art = first.get("artworkUrl100", "")
                    if art:
                        artwork_url = art.replace("100x100bb.jpg", "600x600bb.jpg")
                    preview_url = first.get("previewUrl")
                    album_name = first.get("collectionName")
    except Exception:
        # Graceful fallback on network timeout or sandbox mode
        pass
        
    # If no artwork found, generate fallback color gradient
    if not artwork_url:
        artwork_url = f"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
        
    result = {
        "artwork_url": artwork_url,
        "preview_url": preview_url,
        "album_name": album_name
    }
    _MEM_CACHE[track_key] = result
    
    try:
        set_cached_metadata(track_key, artwork_url or "", preview_url or "", album_name or "")
    except Exception as e:
        # Never fail recommendation if SQLite cache write has a temporary delay
        pass
        
    return result

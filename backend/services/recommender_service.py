"""
AlgoRhythm Recommender Service
High-level service coordinating ALS recommendations, database interactions,
and enrichment with metadata/artwork.
"""
import os
import json
from typing import List, Dict, Any, Optional
from backend.recommender.recommend import ALSRecommender
from backend.database import get_user, get_user_effective_preferences
from backend.services.metadata_service import get_track_metadata

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

class RecommenderService:
    _instance = None

    def __init__(self):
        self.recommender = ALSRecommender()
        self.catalog_meta = self._load_catalog_metadata()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_catalog_metadata(self) -> Dict[str, Any]:
        p = os.path.join(MODELS_DIR, "catalog_metadata.json")
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def get_recommendations_for_user(self, user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        user_info = get_user(user_id)
        favorite_artists = user_info["favorite_artists"] if user_info else []
        
        # Get live cumulative interactions from SQLite
        effective_prefs = get_user_effective_preferences(user_id)
        
        # If user has seed tracks stored in user profile but no rows in effective_prefs, use seeds
        if not effective_prefs and user_info and user_info.get("seed_tracks"):
            effective_prefs = [
                {"track_id": s["track_id"] if "track_id" in s else s["id"], "weight": 4.0}
                for s in user_info["seed_tracks"]
            ]

        raw_recs = self.recommender.recommend_for_user_interactions(
            interactions=effective_prefs,
            favorite_artists=favorite_artists,
            top_n=top_n,
            filter_interacted=True
        )

        # Enrich recommendations with artwork & preview
        enriched = []
        for r in raw_recs:
            meta = get_track_metadata(r["artist"], r["title"])
            enriched.append({
                "track_id": int(r["track_id"]),
                "artist": str(r["artist"]),
                "title": str(r["title"]),
                "score": float(r["score"]),
                "total_plays": int(r["total_plays"]),
                "artwork_url": meta.get("artwork_url"),
                "preview_url": meta.get("preview_url"),
                "album_name": meta.get("album_name")
            })

        return enriched

    def get_catalog_artists(self) -> List[Dict[str, Any]]:
        return self.catalog_meta.get("top_artists", [])

    def get_catalog_songs(self, artist: Optional[str] = None, search: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        tracks = self.recommender.tracks
        filtered = tracks
        
        if artist:
            art_clean = artist.strip().lower()
            filtered = [t for t in filtered if art_clean in t["artist"].lower()]
            
        if search:
            s_clean = search.strip().lower()
            filtered = [t for t in filtered if s_clean in t["title"].lower() or s_clean in t["artist"].lower()]
            
        return filtered[:limit]

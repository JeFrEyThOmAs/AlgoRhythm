"""
AlgoRhythm Recommender - Recommendation Engine
Generates recommendations using Implicit ALS, handling cold-start
via closed-form user factor projection / recalculate_user.
"""
import os
import json
import pickle
import numpy as np
import scipy.sparse as sp
from typing import List, Dict, Any, Optional

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

class ALSRecommender:
    def __init__(self, model_filename: str = "als_model.pkl"):
        self.model = None
        self.tracks: List[Dict[str, Any]] = []
        self.track_key_to_id: Dict[str, int] = {}
        self.artist_to_track_ids: Dict[str, List[int]] = {}
        self.num_items = 0
        self.alpha = 40.0
        self.load(model_filename)

    def load(self, model_filename: str = "als_model.pkl"):
        model_path = os.path.join(MODELS_DIR, model_filename)
        tracks_path = os.path.join(MODELS_DIR, "tracks_index.json")
        
        if not os.path.exists(model_path) or not os.path.exists(tracks_path):
            raise FileNotFoundError(f"Model or track index missing in {MODELS_DIR}")
            
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)
            
        with open(tracks_path, "r", encoding="utf-8") as f:
            self.tracks = json.load(f)
            
        self.num_items = len(self.tracks)
        self.track_key_to_id = {}
        self.artist_to_track_ids = {}
        
        for t in self.tracks:
            tid = t["id"]
            art = t["artist"]
            trk = t["title"]
            key = f"{art.lower()} ::: {trk.lower()}"
            self.track_key_to_id[key] = tid
            self.artist_to_track_ids.setdefault(art.lower(), []).append(tid)

    def recommend_for_user_interactions(
        self,
        interactions: List[Dict[str, Any]],
        favorite_artists: Optional[List[str]] = None,
        top_n: int = 10,
        filter_interacted: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Cold-start & warm-start recommendation:
        Takes a list of interaction records: [{'track_id': int, 'weight': float}, ...]
        Constructs a sparse implicit feedback vector and recalculates the user factor vector.
        """
        cols = []
        data = []
        interacted_ids = set()
        
        # 1. Process track interactions (likes, plays, favorites)
        for item in interactions:
            tid = item.get("track_id")
            if tid is not None and 0 <= tid < self.num_items:
                w = float(item.get("weight", 3.0))
                # Implicit confidence: c_ui = 1 + alpha * log(1 + weight)
                conf = 1.0 + self.alpha * np.log1p(w)
                cols.append(tid)
                data.append(conf)
                interacted_ids.add(tid)
                
        # 2. Incorporate favorite artists if provided
        if favorite_artists:
            for art in favorite_artists:
                art_lower = art.strip().lower()
                matching_tids = self.artist_to_track_ids.get(art_lower, [])
                # Take top 2 popular tracks for this artist to seed preference
                for tid in matching_tids[:2]:
                    if tid not in interacted_ids:
                        conf = 1.0 + self.alpha * np.log1p(2.0)
                        cols.append(tid)
                        data.append(conf)
                        interacted_ids.add(tid)

        if not cols:
            # Fallback to globally popular songs if no preferences are provided at all
            popular_items = sorted(self.tracks[:top_n], key=lambda x: x["total_plays"], reverse=True)
            return [
                {
                    "track_id": t["id"],
                    "artist": t["artist"],
                    "title": t["title"],
                    "score": 0.05,
                    "total_plays": t["total_plays"]
                }
                for t in popular_items
            ]

        rows = [0] * len(cols)
        user_items = sp.csr_matrix(
            (np.array(data, dtype=np.float32), (rows, cols)),
            shape=(1, self.num_items),
            dtype=np.float32
        )

        # Fold-in using model.recommend with recalculate_user=True
        # Fetch slightly more than top_n to safely filter out any interacted tracks
        fetch_n = min(self.num_items, top_n + len(interacted_ids) + 5)
        rec_ids, scores = self.model.recommend(
            0,
            user_items,
            N=fetch_n,
            recalculate_user=True
        )

        results = []
        for tid, score in zip(rec_ids, scores):
            tid_int = int(tid)
            if filter_interacted and tid_int in interacted_ids:
                continue
            t = self.tracks[tid_int]
            results.append({
                "track_id": int(tid_int),
                "artist": str(t["artist"]),
                "title": str(t["title"]),
                "score": round(float(score), 4),
                "total_plays": int(t["total_plays"])
            })
            if len(results) >= top_n:
                break

        return results

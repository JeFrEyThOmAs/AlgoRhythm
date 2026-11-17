"""
AlgoRhythm API - User Profile & Listening Analytics Endpoints
"""
from fastapi import APIRouter, Path
from collections import Counter
from backend.database import get_user_interactions, get_user

router = APIRouter(prefix="/api", tags=["Profile"])

@router.get("/profile/{user_id}")
def get_user_profile(user_id: str = Path(..., description="Demo user ID")):
    user_info = get_user(user_id)
    interactions = get_user_interactions(user_id)
    
    total_interactions = len(interactions)
    likes_count = sum(1 for i in interactions if i["interaction_type"] == "like")
    favorites_count = sum(1 for i in interactions if i["interaction_type"] == "favorite")
    plays_count = sum(i["play_count"] for i in interactions if i["interaction_type"] in ("play", "replay"))
    skips_count = sum(1 for i in interactions if i["interaction_type"] == "skip")
    
    # Artist frequency distribution
    artist_counts = Counter(i["artist"] for i in interactions if i["artist"])
    top_artists = [
        {"name": artist, "count": count}
        for artist, count in artist_counts.most_common(6)
    ]
    
    # Most played / interacted songs
    song_counts = Counter(f"{i['artist']} - {i['title']}" for i in interactions)
    top_songs = [
        {"song": song, "count": count}
        for song, count in song_counts.most_common(5)
    ]
    
    # Interaction type breakdown for pie/bar chart
    interaction_types = [
        {"type": "Likes", "count": likes_count, "color": "#10B981"},      # Emerald
        {"type": "Favourites", "count": favorites_count, "color": "#EC4899"}, # Pink
        {"type": "Plays", "count": plays_count, "color": "#8B5CF6"},      # Purple
        {"type": "Skips", "count": skips_count, "color": "#EF4444"},      # Red
    ]

    return {
        "status": "success",
        "user_id": user_id,
        "favorite_artists": user_info["favorite_artists"] if user_info else [],
        "seed_tracks": user_info["seed_tracks"] if user_info else [],
        "stats": {
            "total_interactions": total_interactions,
            "likes_count": likes_count,
            "favorites_count": favorites_count,
            "plays_count": plays_count,
            "skips_count": skips_count
        },
        "top_artists": top_artists,
        "top_songs": top_songs,
        "interaction_breakdown": interaction_types
    }

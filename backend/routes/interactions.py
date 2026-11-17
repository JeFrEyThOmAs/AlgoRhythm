"""
AlgoRhythm API - User Interactions & History Endpoints
"""
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field
from typing import Optional
from backend.database import record_interaction, get_user_interactions, get_user

router = APIRouter(prefix="/api", tags=["Interactions"])

class InteractionRequest(BaseModel):
    user_id: str = Field(..., description="Demo user ID")
    track_id: int = Field(..., description="Catalog track ID")
    artist: str = Field(..., description="Artist name")
    title: str = Field(..., description="Track title")
    interaction_type: str = Field(..., description="Type: like, favorite, play, replay, skip")
    play_count: Optional[int] = Field(1, description="Play count increment")

@router.post("/interactions")
def post_interaction(payload: InteractionRequest):
    valid_types = {"like", "favorite", "play", "replay", "skip"}
    if payload.interaction_type.lower() not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid interaction type. Choose from: {valid_types}")
        
    result = record_interaction(
        user_id=payload.user_id,
        track_id=payload.track_id,
        artist=payload.artist,
        title=payload.title,
        interaction_type=payload.interaction_type.lower(),
        play_count=payload.play_count or 1
    )
    
    return {
        "status": "success",
        "message": f"Recorded '{payload.interaction_type}' interaction",
        "interaction": result
    }

@router.get("/history/{user_id}")
def get_history(user_id: str = Path(..., description="Demo user ID")):
    user_info = get_user(user_id)
    interactions = get_user_interactions(user_id)
    
    return {
        "status": "success",
        "user_id": user_id,
        "favorite_artists": user_info["favorite_artists"] if user_info else [],
        "seed_tracks": user_info["seed_tracks"] if user_info else [],
        "total_interactions": len(interactions),
        "history": interactions
    }

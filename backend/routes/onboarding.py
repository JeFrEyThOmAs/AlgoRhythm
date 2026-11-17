"""
AlgoRhythm API - Onboarding Endpoint
"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.database import create_or_update_user

router = APIRouter(prefix="/api", tags=["Onboarding"])

class OnboardingRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Demo user ID or leave empty to auto-generate")
    favorite_artists: List[str] = Field(..., description="List of favorite artist names")
    seed_tracks: List[Dict[str, Any]] = Field(..., description="List of selected seed songs")

@router.post("/onboarding")
def submit_onboarding(payload: OnboardingRequest):
    if not payload.seed_tracks and not payload.favorite_artists:
        raise HTTPException(status_code=400, detail="Please select at least 1 artist or song to discover recommendations.")
        
    user_id = payload.user_id or f"demo_user_{uuid.uuid4().hex[:8]}"
    
    create_or_update_user(
        user_id=user_id,
        favorite_artists=payload.favorite_artists,
        seed_tracks=payload.seed_tracks
    )
    
    return {
        "status": "success",
        "message": "Preferences saved successfully",
        "user_id": user_id,
        "selected_artists_count": len(payload.favorite_artists),
        "selected_tracks_count": len(payload.seed_tracks)
    }

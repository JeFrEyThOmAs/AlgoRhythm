"""
AlgoRhythm API - Catalog Endpoints
"""
from fastapi import APIRouter, Query
from typing import Optional
from backend.services.recommender_service import RecommenderService

router = APIRouter(prefix="/api", tags=["Catalog"])

@router.get("/artists")
def get_artists():
    service = RecommenderService.get_instance()
    artists = service.get_catalog_artists()
    return {"status": "success", "count": len(artists), "artists": artists}

@router.get("/songs")
def get_songs(
    artist: Optional[str] = Query(None, description="Filter songs by artist name"),
    search: Optional[str] = Query(None, description="Search term for title or artist"),
    limit: int = Query(50, ge=1, le=200, description="Max songs to return")
):
    service = RecommenderService.get_instance()
    songs = service.get_catalog_songs(artist=artist, search=search, limit=limit)
    return {"status": "success", "count": len(songs), "songs": songs}

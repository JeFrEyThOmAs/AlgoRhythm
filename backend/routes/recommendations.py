"""
AlgoRhythm API - Recommendations Endpoint
"""
from fastapi import APIRouter, Path, Query
from backend.services.recommender_service import RecommenderService

router = APIRouter(prefix="/api", tags=["Recommendations"])

@router.get("/recommendations/{user_id}")
def get_recommendations(
    user_id: str = Path(..., description="Demo user ID"),
    top_n: int = Query(10, ge=1, le=50, description="Number of recommendations")
):
    service = RecommenderService.get_instance()
    recommendations = service.get_recommendations_for_user(user_id=user_id, top_n=top_n)
    
    return {
        "status": "success",
        "user_id": user_id,
        "count": len(recommendations),
        "algorithm": "Implicit Feedback Matrix Factorization (ALS)",
        "cold_start_method": "Closed-Form ALS Factor Projection (recalculate_user)",
        "recommendations": recommendations
    }

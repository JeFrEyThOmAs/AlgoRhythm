"""
AlgoRhythm API - Model Information & Evaluation Endpoints
"""
import os
import json
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Evaluation"])

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

@router.get("/evaluation")
def get_evaluation():
    eval_path = os.path.join(MODELS_DIR, "evaluation_results.json")
    if os.path.exists(eval_path):
        with open(eval_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"status": "success", "data": data}
            
    return {
        "status": "error",
        "message": "Evaluation results not found. Please run evaluate.py."
    }

@router.get("/model-info")
def get_model_info():
    model_meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    meta = {}
    if os.path.exists(model_meta_path):
        with open(model_meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
    return {
        "status": "success",
        "project": "AlgoRhythm",
        "topic": "Topic 18 – Music Streaming Autoplay Engine",
        "title": "Personalized Music Recommendation System Using Implicit Feedback-Based Matrix Factorization (ALS)",
        "dataset": {
            "name": "Last.fm 1K User Interaction Dataset",
            "source": "Hugging Face (matthewfranglen/lastfm-1k)",
            "total_raw_scrobbles": "16,936,134 listening events",
            "historical_timeframe": "February 2005 - June 2009",
            "num_catalog_tracks": meta.get("num_items", 101309),
            "num_dataset_users": meta.get("num_users", 992),
            "non_zero_interactions": meta.get("non_zeros", 2316654)
        },
        "model_parameters": {
            "algorithm": "Implicit Alternating Least Squares (Hu, Koren, Volinsky)",
            "latent_factors": meta.get("factors", 50),
            "regularization_lambda": meta.get("regularization", 0.1),
            "confidence_rate_alpha": 40.0,
            "training_iterations": meta.get("iterations", 15),
            "confidence_formula": "c_ui = 1 + alpha * log(1 + play_count_ui)",
            "training_time_seconds": meta.get("training_time_seconds", 5.62)
        },
        "concepts": {
            "matrix_factorization": "Decomposes the high-dimensional sparse user-item matrix into the product of two lower-rank dense matrices: User Factors (X) and Item Factors (Y), capturing latent musical preferences like genre, acoustic timbre, and tempo.",
            "implicit_feedback": "Unlike star ratings or reviews, music streaming interactions are implicit (scrobbles, plays, repeats). Absence of a play does not imply dislike—it could mean the user has not discovered the track yet. Therefore, binary preferences p_ui are paired with varying confidence values c_ui.",
            "als_optimization": "Because the objective function with confidence weights is non-convex when optimizing both X and Y simultaneously, ALS alternates: fixing item factors Y to solve for user factors X via quadratic optimization, then fixing X to solve for Y.",
            "cold_start_strategy": "When a new user selects 3-5 seed songs during onboarding, they have no row in the offline matrix. We solve the closed-form ALS user update step using the pre-trained item factors: u = (Y^T C_u Y + lambda I)^(-1) Y^T C_u p_u. This instantly 'folds' the new user into the latent space without retraining the global model."
        }
    }

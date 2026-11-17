"""
AlgoRhythm - Personalized Music Recommendation System
FastAPI Application Entry Point
"""
import os
import sys

# Ensure project root is in sys.path so 'backend.*' imports resolve when run as 'python backend/main.py'
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import init_db
from backend.routes import catalog, onboarding, recommendations, interactions, profile, evaluation

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing AlgoRhythm database...")
    init_db()
    print("AlgoRhythm backend ready.")
    yield

app = FastAPI(
    title="AlgoRhythm API",
    description="Music Recommendation System Using Implicit Feedback-Based Matrix Factorization (ALS)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Vite frontend (usually runs on port 5173 or localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(catalog.router)
app.include_router(onboarding.router)
app.include_router(recommendations.router)
app.include_router(interactions.router)
app.include_router(profile.router)
app.include_router(evaluation.router)

# Serve compiled frontend static files if available
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def health_check():
        return {
            "status": "online",
            "service": "AlgoRhythm Recommendation Engine",
            "version": "1.0.0",
            "docs_url": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

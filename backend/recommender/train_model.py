"""
AlgoRhythm Recommender - Model Training Pipeline
Trains an Implicit Feedback Alternating Least Squares (ALS) model
on user-song interaction matrices and persists model weights.
"""
import os
import time
import json
import pickle
import numpy as np
import scipy.sparse as sp
import implicit

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

def train_als_model(
    factors: int = 50,
    regularization: float = 0.1,
    iterations: int = 15,
    random_state: int = 42,
    matrix_filename: str = "user_item_matrix.npz",
    output_model_name: str = "als_model.pkl"
):
    print("=" * 60)
    print(f"AlgoRhythm: Training Implicit ALS (Factors={factors}, Reg={regularization}, Iter={iterations})...")
    print("=" * 60)
    
    matrix_path = os.path.join(MODELS_DIR, matrix_filename)
    if not os.path.exists(matrix_path):
        raise FileNotFoundError(f"Matrix file not found at {matrix_path}. Run preprocessing first.")
        
    t0 = time.time()
    user_item_matrix = sp.load_npz(matrix_path)
    print(f"Loaded matrix: {user_item_matrix.shape[0]} users x {user_item_matrix.shape[1]} items ({user_item_matrix.nnz:,} non-zeros)")
    
    # Initialize implicit ALS model
    model = implicit.als.AlternatingLeastSquares(
        factors=factors,
        regularization=regularization,
        iterations=iterations,
        random_state=random_state
    )
    
    t_fit_start = time.time()
    model.fit(user_item_matrix)
    training_time = time.time() - t_fit_start
    print(f"Training completed in {training_time:.2f} seconds.")
    
    # Save model
    model_path = os.path.join(MODELS_DIR, output_model_name)
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Saved trained ALS model to {model_path}")
    
    # Save training info
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    meta = {
        "algorithm": "Implicit Feedback Matrix Factorization (ALS)",
        "factors": factors,
        "regularization": regularization,
        "iterations": iterations,
        "training_time_seconds": round(training_time, 2),
        "num_users": user_item_matrix.shape[0],
        "num_items": user_item_matrix.shape[1],
        "non_zeros": user_item_matrix.nnz,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved model training metadata to {meta_path}")
    
    return model, meta

if __name__ == "__main__":
    train_als_model()

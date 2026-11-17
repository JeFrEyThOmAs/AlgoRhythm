"""
AlgoRhythm Recommender - Model Evaluation Pipeline
Evaluates ALS on temporal train/test split:
Precision@10, Recall@10, NDCG@10, MAP@10, and training time across 20, 50, 100 factors.
"""
import os
import json
import time
import numpy as np
import scipy.sparse as sp
import implicit

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

def evaluate_ranking(
    model,
    train_matrix: sp.csr_matrix,
    test_gt: dict,
    k: int = 10
):
    num_users = train_matrix.shape[0]
    precisions = []
    recalls = []
    ndcgs = []
    maps = []
    
    # Batch recommend top-k unseen items for all users
    # In implicit: recommend(userids, user_items, N, filter_already_liked_items=True)
    rec_ids, _ = model.recommend(
        np.arange(num_users),
        train_matrix,
        N=k,
        filter_already_liked_items=True
    )
    
    # Precompute discount factors for NDCG
    discounts = 1.0 / np.log2(np.arange(2, k + 2))
    
    for uidx in range(num_users):
        user_key = str(uidx)
        gt_items = test_gt.get(user_key) or test_gt.get(uidx)
        if not gt_items:
            continue
            
        gt_set = set(gt_items)
        top_k = rec_ids[uidx]
        hits = [1 if item in gt_set else 0 for item in top_k]
        n_hits = sum(hits)
        
        # Precision@K
        p_at_k = n_hits / float(k)
        precisions.append(p_at_k)
        
        # Recall@K
        r_at_k = n_hits / float(len(gt_set))
        recalls.append(r_at_k)
        
        # NDCG@K
        dcg = sum(h * d for h, d in zip(hits, discounts))
        idcg_len = min(k, len(gt_set))
        idcg = sum(discounts[:idcg_len])
        ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
        
        # MAP@K (Mean Average Precision at K)
        cum_hits = 0
        ap = 0.0
        for rank_idx, h in enumerate(hits):
            if h:
                cum_hits += 1
                ap += cum_hits / (rank_idx + 1.0)
        maps.append(ap / float(idcg_len) if idcg_len > 0 else 0.0)
        
    return {
        f"precision@{k}": float(np.mean(precisions)),
        f"recall@{k}": float(np.mean(recalls)),
        f"ndcg@{k}": float(np.mean(ndcgs)),
        f"map@{k}": float(np.mean(maps)),
        "evaluated_users": len(precisions)
    }

def run_evaluation_suite(factors_list=(20, 50, 100)):
    print("=" * 60)
    print("AlgoRhythm: Running ALS Multi-Configuration Evaluation Suite...")
    print("=" * 60)
    
    train_matrix_path = os.path.join(MODELS_DIR, "temporal_train_matrix.npz")
    test_gt_path = os.path.join(MODELS_DIR, "temporal_test_gt.json")
    
    if not os.path.exists(train_matrix_path) or not os.path.exists(test_gt_path):
        raise FileNotFoundError("Temporal train matrix or test ground truth not found. Run preprocessing first.")
        
    train_matrix = sp.load_npz(train_matrix_path)
    with open(test_gt_path, "r", encoding="utf-8") as f:
        test_gt = json.load(f)
        
    print(f"Loaded temporal train matrix: {train_matrix.shape[0]} users x {train_matrix.shape[1]} tracks")
    print(f"Loaded ground truth test sets for {len(test_gt)} users")
    
    results = {}
    comparison_table = []
    
    for f in factors_list:
        print(f"\n--- Training & Evaluating ALS with Factors = {f} ---")
        model = implicit.als.AlternatingLeastSquares(
            factors=f,
            regularization=0.1,
            iterations=15,
            random_state=42
        )
        
        t_start = time.time()
        model.fit(train_matrix)
        train_time = time.time() - t_start
        print(f"Fit completed in {train_time:.2f}s. Evaluating ranking...")
        
        t_eval_start = time.time()
        metrics = evaluate_ranking(model, train_matrix, test_gt, k=10)
        eval_time = time.time() - t_eval_start
        
        metrics["training_time_seconds"] = round(train_time, 2)
        metrics["evaluation_time_seconds"] = round(eval_time, 2)
        metrics["factors"] = f
        
        results[f"factors_{f}"] = metrics
        comparison_table.append({
            "factors": f,
            "precision_at_10": round(metrics["precision@10"], 4),
            "recall_at_10": round(metrics["recall@10"], 4),
            "ndcg_at_10": round(metrics["ndcg@10"], 4),
            "map_at_10": round(metrics["map@10"], 4),
            "training_time": round(train_time, 2)
        })
        
        print(f"  Precision@10: {metrics['precision@10']:.4f}")
        print(f"  Recall@10:    {metrics['recall@10']:.4f}")
        print(f"  NDCG@10:      {metrics['ndcg@10']:.4f}")
        print(f"  MAP@10:       {metrics['map@10']:.4f}")
        print(f"  Training Time: {train_time:.2f}s")
        
    output_path = os.path.join(MODELS_DIR, "evaluation_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "split_strategy": "Temporal Split (Earliest 80% interactions -> Train, Latest 20% -> Test per user)",
            "benchmark_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "configurations": results,
            "comparison_summary": comparison_table
        }, f, indent=2)
        
    print(f"\nSaved complete evaluation benchmark results to {output_path}")
    return results

if __name__ == "__main__":
    run_evaluation_suite()

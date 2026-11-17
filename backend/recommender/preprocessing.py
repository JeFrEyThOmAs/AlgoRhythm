"""
AlgoRhythm Recommender - Preprocessing Pipeline
Aggregates Last.fm 1K scrobbles, builds vocabulary, filters tracks,
and creates sparse interaction matrices with implicit confidence.
"""
import os
import json
import time
import numpy as np
import polars as pl
import scipy.sparse as sp

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

def load_and_preprocess(min_track_users: int = 8, alpha: float = 40.0):
    print("=" * 60)
    print("AlgoRhythm: Starting Dataset Preprocessing...")
    print("=" * 60)
    t0 = time.time()
    
    splits = []
    for split in ['train', 'valid', 'test']:
        p = os.path.join(DATA_DIR, f"{split}.gz.parquet")
        if os.path.exists(p):
            print(f"Reading {split}.gz.parquet...")
            df_split = pl.read_parquet(p).select(['user_id', 'artist_name', 'track_name', 'timestamp'])
            splits.append(df_split)
    
    if not splits:
        raise FileNotFoundError(f"No parquet splits found in {DATA_DIR}")
    
    df = pl.concat(splits)
    raw_count = len(df)
    print(f"Loaded {raw_count:,} raw listening events in {time.time()-t0:.2f}s")
    
    # 1. Clean missing/invalid records
    df = df.filter(
        pl.col('artist_name').is_not_null() &
        pl.col('track_name').is_not_null() &
        (pl.col('artist_name').str.strip_chars() != '') &
        (pl.col('track_name').str.strip_chars() != '')
    )
    print(f"Cleaned records: {len(df):,} ({raw_count - len(df):,} invalid removed)")
    
    # 2. Aggregate listening counts and timestamps per user-track pair
    print("Aggregating user-track implicit interactions...")
    agg = df.group_by(['user_id', 'artist_name', 'track_name']).agg([
        pl.len().alias('play_count'),
        pl.col('timestamp').min().alias('first_play'),
        pl.col('timestamp').max().alias('last_play')
    ])
    print(f"Distinct user-track interaction pairs: {len(agg):,}")
    
    # 3. Filter tracks with support threshold
    print(f"Filtering tracks listened to by >= {min_track_users} unique users...")
    track_stats = agg.group_by(['artist_name', 'track_name']).agg([
        pl.col('play_count').sum().alias('total_plays'),
        pl.col('user_id').n_unique().alias('num_users')
    ]).filter(pl.col('num_users') >= min_track_users)
    
    valid_tracks_df = track_stats.select(['artist_name', 'track_name', 'total_plays', 'num_users'])
    num_retained_tracks = len(valid_tracks_df)
    print(f"Retained {num_retained_tracks:,} high-quality candidate tracks")
    
    # Join filtered tracks back with agg
    filtered_agg = agg.join(valid_tracks_df, on=['artist_name', 'track_name'], how='inner')
    print(f"Total filtered interactions: {len(filtered_agg):,}")
    
    # 4. Map users and tracks to contiguous integer indices
    unique_users = sorted(filtered_agg['user_id'].unique().to_list())
    user2idx = {u: i for i, u in enumerate(unique_users)}
    
    # Sort tracks by total plays descending so index 0 is most popular
    sorted_tracks = valid_tracks_df.sort('total_plays', descending=True)
    track_list = []
    track2idx = {}
    track_metadata = []
    
    for idx, row in enumerate(sorted_tracks.iter_rows(named=True)):
        art = row['artist_name']
        trk = row['track_name']
        tot = row['total_plays']
        n_u = row['num_users']
        track_key = f"{art} ::: {trk}"
        track2idx[track_key] = idx
        track_list.append(track_key)
        track_metadata.append({
            "id": idx,
            "artist": art,
            "title": trk,
            "total_plays": int(tot),
            "num_users": int(n_u)
        })
    
    # 5. Extract top artists for onboarding catalog
    artist_summary = sorted_tracks.group_by('artist_name').agg([
        pl.col('total_plays').sum().alias('artist_plays'),
        pl.col('track_name').n_unique().alias('num_tracks')
    ]).sort('artist_plays', descending=True)
    
    top_artists = []
    for row in artist_summary.iter_rows(named=True):
        top_artists.append({
            "artist": row['artist_name'],
            "total_plays": int(row['artist_plays']),
            "num_tracks": int(row['num_tracks'])
        })
    
    # Save processed catalog & metadata JSON
    catalog_path = os.path.join(MODELS_DIR, "catalog_metadata.json")
    print(f"Saving catalog metadata to {catalog_path}...")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump({
            "num_users": len(unique_users),
            "num_tracks": len(track_metadata),
            "total_interactions": len(filtered_agg),
            "top_artists": top_artists[:100],  # top 100 artists for onboarding
            "popular_tracks": track_metadata[:200],  # top 200 tracks for quick picks
        }, f, indent=2)
        
    # Save full track list lookup
    tracks_json_path = os.path.join(MODELS_DIR, "tracks_index.json")
    with open(tracks_json_path, "w", encoding="utf-8") as f:
        json.dump(track_metadata, f)
        
    # 6. Build User-Song Sparse Interaction Matrix
    print("Constructing SciPy CSR user-song matrix...")
    u_idx = [user2idx[u] for u in filtered_agg['user_id'].to_list()]
    t_keys = [f"{a} ::: {t}" for a, t in zip(filtered_agg['artist_name'].to_list(), filtered_agg['track_name'].to_list())]
    t_idx = [track2idx[k] for k in t_keys]
    plays = filtered_agg['play_count'].to_numpy()
    
    # Confidence: c_ui = 1 + alpha * log(1 + play_count)
    confidences = 1.0 + alpha * np.log1p(plays)
    
    interaction_matrix = sp.csr_matrix(
        (confidences.astype(np.float32), (u_idx, t_idx)),
        shape=(len(unique_users), len(track_list)),
        dtype=np.float32
    )
    
    matrix_path = os.path.join(MODELS_DIR, "user_item_matrix.npz")
    sp.save_npz(matrix_path, interaction_matrix)
    print(f"Saved interaction matrix to {matrix_path}")
    print(f"Matrix shape: {interaction_matrix.shape}, non-zeros: {interaction_matrix.nnz:,}")
    
    # Save temporal split data for evaluation
    print("Performing temporal train/test split per user for evaluation...")
    filtered_agg = filtered_agg.sort(['user_id', 'last_play'])
    filtered_agg = filtered_agg.with_columns([
        pl.col('play_count').cum_count().over('user_id').alias('cum_idx'),
        pl.col('play_count').count().over('user_id').alias('total_user_tracks')
    ])
    
    train_df = filtered_agg.filter(pl.col('cum_idx') <= (pl.col('total_user_tracks') * 0.8))
    test_df = filtered_agg.filter(pl.col('cum_idx') > (pl.col('total_user_tracks') * 0.8))
    
    # Train matrix
    u_tr = [user2idx[u] for u in train_df['user_id'].to_list()]
    t_tr_keys = [f"{a} ::: {t}" for a, t in zip(train_df['artist_name'].to_list(), train_df['track_name'].to_list())]
    t_tr = [track2idx[k] for k in t_tr_keys]
    plays_tr = train_df['play_count'].to_numpy()
    conf_tr = 1.0 + alpha * np.log1p(plays_tr)
    
    train_matrix = sp.csr_matrix(
        (conf_tr.astype(np.float32), (u_tr, t_tr)),
        shape=(len(unique_users), len(track_list)),
        dtype=np.float32
    )
    train_matrix_path = os.path.join(MODELS_DIR, "temporal_train_matrix.npz")
    sp.save_npz(train_matrix_path, train_matrix)
    
    # Test ground truth map: user_idx -> list of track_idx
    test_gt = {}
    for u, a, t in zip(test_df['user_id'].to_list(), test_df['artist_name'].to_list(), test_df['track_name'].to_list()):
        uidx = user2idx[u]
        tidx = track2idx[f"{a} ::: {t}"]
        test_gt.setdefault(uidx, []).append(tidx)
        
    test_gt_path = os.path.join(MODELS_DIR, "temporal_test_gt.json")
    with open(test_gt_path, "w", encoding="utf-8") as f:
        json.dump(test_gt, f)
        
    print(f"Preprocessing completed in {time.time()-t0:.2f}s!")
    return interaction_matrix, track_metadata, top_artists

if __name__ == "__main__":
    load_and_preprocess()

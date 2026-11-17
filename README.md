# AlgoRhythm – Personalized Music Recommendation System Using Implicit Feedback-Based Matrix Factorization (ALS)

**College Information Retrieval and Recommender Systems Project**  
**Original Topic:** Topic 18 – Music Streaming Autoplay Engine  

---

## 1. Project Overview

**AlgoRhythm** is a music recommendation web application that demonstrates implicit feedback-based matrix factorization. Rather than building a commercial music streaming service, this project demonstrates how machine learning algorithms (specifically Alternating Least Squares) uncover latent musical patterns from historical user listening behavior and generate personalized recommendations for new users.

### Key Objectives
1. **Implicit Feedback Modeling:** Aggregate repeated user-track scrobbles from the **Last.fm 1K** dataset into implicit confidence values:
   $$c_{ui} = 1 + \alpha \cdot \log(1 + r_{ui})$$
2. **Sparse Matrix Factorization:** Train an Alternating Least Squares (ALS) model that decomposes user-item interactions into $k$-dimensional latent spaces.
3. **Mathematically Sound Cold-Start Strategy:** Handle newly onboarded users who do not exist in the pretrained offline matrix by solving the closed-form ALS user update step (folding-in) using precomputed item factor vectors.
4. **Live Interaction Collection:** Collect user feedback (Likes, Favourites, Plays, Skips) stored in SQLite for incremental session re-ranking.
5. **Empirical Model Evaluation:** Benchmark real Information Retrieval metrics (**Precision@10**, **Recall@10**, **NDCG@10**, **MAP@10**, and **Training Time**) using a temporal train/test split.

---

## 2. Technology Stack

* **Machine Learning:** Python, NumPy, SciPy (Sparse CSR matrices), Polars, Pandas, `implicit` library (Cython-accelerated ALS).
* **Backend:** FastAPI, Uvicorn, SQLite, Pydantic.
* **Frontend:** React, Vite, Tailwind CSS, Recharts (data visualizations), Lucide React (icons).

---

## 3. System Architecture

```
React Frontend (Vite + Tailwind CSS + Recharts)
           │
           ▼  (REST API calls via /api/*)
FastAPI Backend (Uvicorn ASGI Server)
     │                     │
     ▼                     ▼
SQLite Database      Recommender Service (ALS Engine)
(Users & Live Logs)        │
                           ├─► Item Factors Matrix (Y ∈ ℝ^(n × k))
                           ├─► User Factors Matrix (X ∈ ℝ^(m × k))
                           └─► Closed-Form User Fold-In (model.recalculate_user)
                                   │
                                   ▼
                      Last.fm 1K Dataset (16.9M Scrobbles)
```

---

## 4. Mathematical Methodology

### 4.1 Implicit Feedback ALS (Hu, Koren, Volinsky)
In music streaming, explicit star ratings are rare. A user listening to a song 50 times indicates strong preference, but absence of listening does not mean dislike—it usually means the user has not discovered the track yet.

* **Binary Preference:**
  $$p_{ui} = \begin{cases} 1 & \text{if } r_{ui} > 0 \\ 0 & \text{if } r_{ui} = 0 \end{cases}$$
* **Confidence Weighting:**
  $$c_{ui} = 1 + \alpha \cdot \log(1 + r_{ui}) \quad (\alpha = 40.0)$$
* **ALS Optimization Objective:**
  $$\min_{\mathbf{x}_*, \mathbf{y}_*} \sum_{u, i} c_{ui} (p_{ui} - \mathbf{x}_u^T \mathbf{y}_i)^2 + \lambda \left( \sum_u \|\mathbf{x}_u\|_2^2 + \sum_i \|\mathbf{y}_i\|_2^2 \right)$$

### 4.2 Cold-Start Handling via Item Factor Projection (Fold-In)
When a new website user registers, they have no pre-trained latent vector $\mathbf{x}_{\text{new}}$. Rather than fabricating an embedding or returning random items, the system utilizes the closed-form ALS user solve step:
$$\mathbf{x}_{\text{new}} = \left( \mathbf{Y}^T \mathbf{C}_u \mathbf{Y} + \lambda \mathbf{I} \right)^{-1} \mathbf{Y}^T \mathbf{C}_u \mathbf{p}_u$$
where $\mathbf{Y} \in \mathbb{R}^{n \times k}$ is the pre-trained item factor matrix, $\mathbf{C}_u$ is the diagonal matrix of confidence values for the user's selected seeds, and $\mathbf{p}_u$ is their binary preference vector. Candidate songs are then ranked by predicted score:
$$\hat{s}_i = \mathbf{x}_{\text{new}}^T \mathbf{y}_i$$

---

## 5. Dataset Specifications

* **Source:** Hugging Face `matthewfranglen/lastfm-1k` (Last.fm 1K user interaction dataset).
* **Timeframe:** February 2005 – June 2009.
* **Raw Scrobbles:** 16,936,134 timestamped listening events across 992 users.
* **Support Threshold:** Filtered to tracks listened to by $\ge 8$ unique users, yielding **101,309 high-quality candidate tracks** and **2,316,654 non-zero interactions** in the sparse matrix.
* **Matrix Density:** $2.3052\%$ sparsity representation using SciPy `csr_matrix`.

---

## 6. Empirical Evaluation Benchmark

All evaluation metrics are calculated on a **temporal train/test split** (the earliest 80% of interactions per user form the training matrix; the remaining 20% form the test ground-truth).

| Latent Factors ($k$) | Precision@10 | Recall@10 | NDCG@10 | MAP@10 | Training Time (M4) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **$k = 20$** | 0.1538 | 0.0072 | 0.1555 | 0.0825 | **2.94s** |
| **$k = 50$ (Default)** | 0.1603 | 0.0087 | 0.1659 | 0.0847 | **4.80s** |
| **$k = 100$** | **0.1887** | **0.0103** | **0.1954** | **0.1059** | 17.71s |

*Note: In top-10 recommendation out of 101,309 candidate tracks, a Precision@10 of ~0.16–0.19 corresponds to ~1.6–1.9 relevant hits in the top 10 future tracks per user, which is a strong result on Last.fm 1K.*

---

## 7. Website Pages & Demo Flow

1. **Page 1: Taste Onboarding (`/`)**
   * Landing banner introducing AlgoRhythm and the ALS engine.
   * Interactive selection: choose favourite artists and 3–5 favourite songs from the Last.fm dataset.
   * Assigns demo user ID and persists preferences to SQLite.
2. **Page 2: Personalized Recommendations (`/recommendations`)**
   * Displays top 10 recommended tracks computed via ALS fold-in.
   * Album artwork, recommendation score badge, and 30-second audio preview player.
   * Like (+3.0), Favourite (+5.0), and Skip (-0.5) feedback buttons.
   * "Re-rank with Live Feedback" button to immediately update recommendations based on newly collected interactions.
3. **Page 3: Listening Activity (`/history`)**
   * Searchable and filterable log of all session actions (Likes, Favourites, Plays, Skips).
4. **Page 4: My Music Profile (`/profile`)**
   * Interactive analytics powered by **Recharts**:
     * Total interaction statistics.
     * Interaction breakdown donut chart.
     * Top artists horizontal bar chart.
     * Most played songs in the current session.
5. **Page 5: Model Information & Evaluation (`/model-info`)**
   * Educational breakdown of Matrix Factorization, Implicit Feedback, ALS, and Cold-Start Fold-In.
   * Live comparative evaluation table and charts across $k \in [20, 50, 100]$.

---

## 8. Setup & Execution Instructions

### Prerequisites
* Python 3.11+
* Node.js v18+ and npm

### Step 1: Clone Repository & Setup Python Environment
```bash
cd AlgoRhythm

# Create virtual environment with inherited system packages or standard venv
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Preprocess Dataset & Train ALS Model
*(Data files and pre-trained model weights are already prepared in `data/` and `models/`)*
```bash
# If you wish to re-run the pipeline from scratch:
python backend/recommender/preprocessing.py
python backend/recommender/train_model.py
python backend/recommender/evaluate.py
```

### Step 3: Run the Application

#### Option A: Single-Command Production Mode
FastAPI serves both the REST API and the compiled React frontend:
```bash
# In the project root with .venv activated:
python backend/main.py
```
Open **`http://localhost:8000`** in your browser.

#### Option B: Full-Stack Development Mode
* **Terminal 1 (Backend):**
  ```bash
  source .venv/bin/activate
  uvicorn backend.main:app --reload --port 8000
  ```
* **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
Open **`http://localhost:5173`** in your browser.

---

## 9. Interaction Schema & Retraining Workflow

All live user actions on the website are captured in SQLite (`data/algorhythm.db`):

| Interaction Type | Weight | Stored Fields | Purpose |
| :--- | :---: | :--- | :--- |
| **Like** | `+3.0` | `user_id`, `track_id`, `artist`, `title`, timestamp | Boosts user factor toward item factor |
| **Favourite** | `+5.0` | `user_id`, `track_id`, `artist`, `title`, timestamp | Strongest positive taste anchor |
| **Play** | `+1.5` | `user_id`, `track_id`, `play_count`, timestamp | Standard implicit consumption signal |
| **Skip** | `-0.5` | `user_id`, `track_id`, timestamp | Down-weights track relevance |
| **Seed Choice** | `+4.0` | `user_id`, `track_id`, timestamp | Cold-start initialization anchor |

### Retraining vs. Fold-In Distinction
* **Fold-In (Real-Time):** Each click immediately updates the user's vector $\mathbf{x}_u$ via linear projection against the existing fixed item matrix $\mathbf{Y}$. This takes **< 4 milliseconds** and does not require full model refitting.
* **Periodic Retraining (Offline):** To update the global item factors $\mathbf{Y}$, new interaction rows from SQLite can be periodically appended to the historical sparse matrix and retrained via `backend/recommender/train_model.py`.

---

## 10. Limitations & Considerations

1. **Dataset Age:** The Last.fm 1K dataset reflects listening habits from 2005 to 2009. Modern releases after 2010 do not exist in the training corpus.
2. **Cold-Start Scope:** While ALS factor fold-in effectively resolves user cold-start (new listener), item cold-start (brand new unlistened song) cannot be factored without hybrid content-based acoustic/metadata features.
3. **Audio Previews:** 30-second previews are fetched dynamically from the public iTunes Search API. For tracks with variations in naming or non-English titles, previews may occasionally be unavailable, in which case the system provides fallback visual indicators while logging the interaction.

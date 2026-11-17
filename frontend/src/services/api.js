/**
 * AlgoRhythm API Client
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Catalog
  getArtists: () => request('/api/artists'),
  getSongs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.artist) query.append('artist', params.artist);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    return request(`/api/songs?${query.toString()}`);
  },

  // Onboarding
  submitOnboarding: (data) =>
    request('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Recommendations
  getRecommendations: (userId, topN = 10) =>
    request(`/api/recommendations/${userId}?top_n=${topN}`),

  // Interactions
  recordInteraction: (data) =>
    request('/api/interactions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // History & Profile
  getHistory: (userId) => request(`/api/history/${userId}`),
  getProfile: (userId) => request(`/api/profile/${userId}`),

  // Evaluation & Model info
  getEvaluation: () => request('/api/evaluation'),
  getModelInfo: () => request('/api/model-info')
};

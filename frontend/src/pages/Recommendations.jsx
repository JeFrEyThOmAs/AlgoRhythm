import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Music, 
  Layers, 
  Zap, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import SongCard from '../components/SongCard';
import { api } from '../services/api';

export default function Recommendations({ userId, onNavigateToOnboarding }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchRecommendations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.getRecommendations(userId, 10);
      setRecommendations(res.recommendations || []);
      
      if (isRefresh) {
        showToast("Re-computed ALS fold-in recommendations with your latest interactions!");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTogglePlay = (track) => {
    if (!track.preview_url) {
      // Still log play interaction
      handlePlay(track);
      showToast(`Logged listen for "${track.title}" (no 30s audio clip available)`);
      return;
    }

    if (activeTrack && activeTrack.track_id === track.track_id && isPlaying) {
      // Pause
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play new track
      setActiveTrack(track);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = track.preview_url;
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
      handlePlay(track);
    }
  };

  const handlePlay = async (track) => {
    try {
      await api.recordInteraction({
        user_id: userId,
        track_id: track.track_id,
        artist: track.artist,
        title: track.title,
        interaction_type: 'play'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (track, isLiked) => {
    try {
      await api.recordInteraction({
        user_id: userId,
        track_id: track.track_id,
        artist: track.artist,
        title: track.title,
        interaction_type: isLiked ? 'like' : 'skip'
      });
      showToast(isLiked ? `Liked "${track.title}"! Implicit preference updated.` : `Unliked "${track.title}"`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavorite = async (track, isFavorited) => {
    try {
      await api.recordInteraction({
        user_id: userId,
        track_id: track.track_id,
        artist: track.artist,
        title: track.title,
        interaction_type: isFavorited ? 'favorite' : 'skip'
      });
      showToast(isFavorited ? `Added "${track.title}" to Favourites! (+5.0 confidence)` : `Removed from Favourites`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkip = async (track) => {
    try {
      await api.recordInteraction({
        user_id: userId,
        track_id: track.track_id,
        artist: track.artist,
        title: track.title,
        interaction_type: 'skip'
      });
      showToast(`Skipped "${track.title}". Down-weighted in future sessions.`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!userId) {
    return (
      <div className="p-12 text-center rounded-3xl bg-dark-800 border border-dark-600 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
          <Music className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active User Session</h2>
        <p className="text-slate-400 text-sm">
          Please complete the onboarding step first to select your initial taste preferences.
        </p>
        <button
          onClick={onNavigateToOnboarding}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition"
        >
          Go to Taste Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Hidden audio element for preview playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Implicit ALS Matrix Factorization</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Top 10 Personalized Recommendations
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Calculated via closed-form item factor fold-in <code className="text-purple-300 bg-dark-900 px-1 py-0.5 rounded font-mono">model.recalculate_user()</code>
          </p>
        </div>

        {/* Refresh / Re-rank button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing || loading}
            className="px-4 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 border border-dark-500 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            title="Re-run ALS fold-in with newly collected likes and favorites"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            <span>{refreshing ? 'Re-calculating...' : 'Re-rank with Live Feedback'}</span>
          </button>
        </div>
      </div>

      {/* Cold-Start Strategy Explanation Alert */}
      <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-semibold text-purple-200">How Cold-Start Works Here:</span>{' '}
          As a new user, you do not exist in the pre-trained Last.fm offline user matrix. Your selected seed songs and live interactions are mapped onto the pre-computed item factor matrix <code className="text-purple-300 font-mono">Y</code> to solve the linear system <code className="text-purple-300 font-mono">x_u = (Y^T C_u Y + λI)^(-1) Y^T C_u p_u</code> in real-time.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommendations List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-dark-800/60 border border-dark-700 animate-pulse"></div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-dark-800 border border-dark-600 text-slate-400">
          No recommendations generated yet. Try choosing more songs during onboarding.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((track, index) => (
            <SongCard
              key={track.track_id}
              track={track}
              rank={index + 1}
              onLike={handleLike}
              onFavorite={handleFavorite}
              onPlay={handlePlay}
              onSkip={handleSkip}
              isPlaying={activeTrack && activeTrack.track_id === track.track_id && isPlaying}
              onTogglePlay={handleTogglePlay}
            />
          ))}
        </div>
      )}
    </div>
  );
}

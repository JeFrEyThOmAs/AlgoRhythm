import React, { useState } from 'react';
import { Heart, Star, Play, Pause, FastForward, Check, Disc, Volume2 } from 'lucide-react';

export default function SongCard({
  track,
  rank,
  onLike,
  onFavorite,
  onPlay,
  onSkip,
  isPlaying,
  onTogglePlay
}) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike && onLike(track, !liked);
  };

  const handleFavorite = () => {
    setFavorited(!favorited);
    onFavorite && onFavorite(track, !favorited);
  };

  const handleSkip = () => {
    setSkipped(true);
    onSkip && onSkip(track);
  };

  if (skipped) {
    return (
      <div className="p-4 rounded-2xl bg-dark-800/40 border border-dark-600/40 text-slate-500 text-xs flex items-center justify-between transition-all">
        <span className="italic">"{track.title}" by {track.artist} skipped</span>
        <span className="text-[10px] bg-dark-700 px-2 py-0.5 rounded text-slate-400">Recorded skip</span>
      </div>
    );
  }

  // Format score percentage
  const scorePercent = track.score !== undefined ? (track.score * 100).toFixed(1) : null;

  return (
    <div className="group relative bg-dark-800 hover:bg-dark-700/80 border border-dark-600 hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-300 shadow-lg hover:shadow-purple-950/20">
      <div className="flex items-center gap-4">
        {/* Rank indicator */}
        <div className="w-6 text-center font-mono font-bold text-slate-400 group-hover:text-purple-400 text-sm shrink-0">
          {rank < 10 ? `0${rank}` : rank}
        </div>

        {/* Album Artwork with Play Overlay */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-dark-700 border border-dark-600 shrink-0 shadow-md">
          {track.artwork_url ? (
            <img
              src={track.artwork_url}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-dark-700 flex items-center justify-center">
              <Disc className="w-8 h-8 text-purple-400/60 animate-spin-slow" />
            </div>
          )}

          {/* Audio preview overlay if preview available */}
          {track.preview_url && (
            <button
              onClick={() => onTogglePlay && onTogglePlay(track)}
              title={isPlaying ? "Pause Preview" : "Play 30s Preview"}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white backdrop-blur-xs"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-brand-emerald fill-current" />
              ) : (
                <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Track Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 truncate text-sm hover:text-purple-300 transition" title={track.title}>
              {track.title}
            </h3>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                <Volume2 className="w-3 h-3 animate-bounce" /> Playing
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5" title={track.artist}>
            {track.artist}
          </p>

          {/* Recommendation Score Badge */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-dark-900/80 px-2.5 py-1 rounded-lg border border-dark-600/80">
              <span className="text-[10px] uppercase font-mono text-slate-400">ALS Score:</span>
              <span className="text-xs font-mono font-semibold text-brand-purpleLight">
                {track.score !== undefined ? track.score.toFixed(4) : 'N/A'}
              </span>
            </div>

            {scorePercent && (
              <span className="text-[10px] font-mono text-purple-400/80">
                ({scorePercent}% match)
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play preview button if available */}
          {track.preview_url ? (
            <button
              onClick={() => onTogglePlay && onTogglePlay(track)}
              className={`p-2 rounded-xl transition ${
                isPlaying
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-dark-700 hover:bg-dark-600 text-slate-300 hover:text-white border border-dark-600'
              }`}
              title={isPlaying ? "Pause Preview" : "Play 30s Audio Preview"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          ) : (
            <button
              onClick={() => onPlay && onPlay(track)}
              className="p-2 rounded-xl bg-dark-700/60 hover:bg-dark-600 text-slate-400 hover:text-slate-200 border border-dark-600/60 text-xs"
              title="Log listen (no audio preview available)"
            >
              <Disc className="w-4 h-4" />
            </button>
          )}

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`p-2 rounded-xl transition ${
              liked
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                : 'bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-emerald-400 border border-dark-600'
            }`}
            title={liked ? "Unlike" : "Like Song"}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-xl transition ${
              favorited
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm shadow-pink-950'
                : 'bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-pink-400 border border-dark-600'
            }`}
            title={favorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-red-400 border border-dark-600 transition"
            title="Skip Track (Implicit Negative)"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

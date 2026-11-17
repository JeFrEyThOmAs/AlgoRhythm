import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Heart, 
  Star, 
  Play, 
  FastForward, 
  Sparkles, 
  Filter, 
  Calendar, 
  Music 
} from 'lucide-react';
import { api } from '../services/api';

export default function History({ userId }) {
  const [history, setHistory] = useState([]);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [seedTracks, setSeedTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getHistory(userId);
      setHistory(res.history || []);
      setFavoriteArtists(res.favorite_artists || []);
      setSeedTracks(res.seed_tracks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = filterType === 'all' 
    ? history 
    : history.filter(item => item.interaction_type === filterType);

  const getBadgeForType = (type) => {
    switch (type) {
      case 'like':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            <Heart className="w-3 h-3 fill-current" /> Like (+3.0)
          </span>
        );
      case 'favorite':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-pink-950/60 text-pink-400 border border-pink-500/30">
            <Star className="w-3 h-3 fill-current" /> Favourite (+5.0)
          </span>
        );
      case 'play':
      case 'replay':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-950/60 text-purple-400 border border-purple-500/30">
            <Play className="w-3 h-3 fill-current" /> Play (+1.5)
          </span>
        );
      case 'skip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-red-950/60 text-red-400 border border-red-500/30">
            <FastForward className="w-3 h-3" /> Skip (-0.5)
          </span>
        );
      case 'seed_choice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-950/60 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-3 h-3" /> Seed (+4.0)
          </span>
        );
      default:
        return <span className="text-xs text-slate-400 font-mono">{type}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>SQLite Interaction Store</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Listening Activity & Interaction Log
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Historical events collected from current session for model updating & retraining
          </p>
        </div>

        <div className="text-xs text-right font-mono text-slate-400">
          <div>User: <span className="text-purple-300 font-semibold">{userId}</span></div>
          <div className="text-slate-500">{history.length} total logged actions</div>
        </div>
      </div>

      {/* Onboarding Preferences Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Favorite Artists */}
        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Onboarded Favourite Artists</span>
            <span className="text-purple-400">({favoriteArtists.length})</span>
          </h2>
          {favoriteArtists.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {favoriteArtists.map((art) => (
                <span
                  key={art}
                  className="px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-medium"
                >
                  {art}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No initial artists selected</p>
          )}
        </div>

        {/* Selected Seed Songs */}
        <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Initial Seed Songs</span>
            <span className="text-emerald-400">({seedTracks.length})</span>
          </h2>
          {seedTracks.length > 0 ? (
            <div className="space-y-1.5">
              {seedTracks.map((trk, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-center gap-2 truncate">
                  <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200 truncate">{trk.title}</span>
                  <span className="text-slate-500 truncate">• {trk.artist}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No initial seed tracks selected</p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Interactions' },
          { id: 'like', label: 'Likes' },
          { id: 'favorite', label: 'Favourites' },
          { id: 'play', label: 'Plays' },
          { id: 'skip', label: 'Skips' },
          { id: 'seed_choice', label: 'Seed Choices' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              filterType === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-slate-200 border border-dark-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactions Table */}
      <div className="bg-dark-800 border border-dark-600 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-dark-600 bg-dark-700/50 text-slate-400 font-mono uppercase">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Track Title</th>
                <th className="py-3 px-4">Artist</th>
                <th className="py-3 px-4 text-center">Implicit Weight</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Loading interactions...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                    No interactions logged under "{filterType}" yet. Like or play songs on the Recommendations page!
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-700/40 transition">
                    <td className="py-3 px-4">{getBadgeForType(item.interaction_type)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200 max-w-xs truncate">{item.title}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{item.artist}</td>
                    <td className="py-3 px-4 text-center font-mono text-purple-300">
                      +{item.weight || 1.0}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

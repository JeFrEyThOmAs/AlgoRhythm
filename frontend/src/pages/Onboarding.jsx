import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Music, 
  Check, 
  Plus, 
  X, 
  ArrowRight, 
  Sliders, 
  Headphones,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function Onboarding({ onOnboardingComplete, userId, setUserId }) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Catalog items
  const [artists, setArtists] = useState([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [songSearch, setSongSearch] = useState('');

  // Selected preferences
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [artRes, songRes] = await Promise.all([
        api.getArtists(),
        api.getSongs({ limit: 40 })
      ]);
      setArtists(artRes.artists || []);
      setSongs(songRes.songs || []);
      setError(null);
    } catch (err) {
      console.error("Error loading catalog:", err);
      setError("Failed to connect to backend recommender service. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSongs = async (term) => {
    setSongSearch(term);
    if (!term.trim()) {
      const res = await api.getSongs({ limit: 40 });
      setSongs(res.songs || []);
      return;
    }
    try {
      const res = await api.getSongs({ search: term, limit: 30 });
      setSongs(res.songs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleArtist = (artistName) => {
    if (selectedArtists.includes(artistName)) {
      setSelectedArtists(selectedArtists.filter(a => a !== artistName));
    } else {
      setSelectedArtists([...selectedArtists, artistName]);
    }
  };

  const toggleSong = (song) => {
    const isAlready = selectedSongs.some(s => s.id === song.id);
    if (isAlready) {
      setSelectedSongs(selectedSongs.filter(s => s.id !== song.id));
    } else {
      if (selectedSongs.length >= 5) {
        alert("You have already selected 5 favourite songs. You can proceed or remove one to choose another!");
        return;
      }
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSongs.length < 1 && selectedArtists.length < 1) {
      alert("Please select at least 1 song or artist so the ALS model can fold in your taste vector!");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const currentUserId = userId || `demo_user_${Math.random().toString(36).substring(2, 8)}`;
      
      const payload = {
        user_id: currentUserId,
        favorite_artists: selectedArtists,
        seed_tracks: selectedSongs.map(s => ({
          track_id: s.id,
          artist: s.artist,
          title: s.title
        }))
      };

      const res = await api.submitOnboarding(payload);
      setUserId(res.user_id);
      localStorage.setItem('algorhythm_user_id', res.user_id);
      
      // Notify parent to transition to recommendations page
      onOnboardingComplete(res.user_id);
    } catch (err) {
      setError(err.message || "Failed to submit preferences");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArtists = artists.filter(a => 
    a.artist.toLowerCase().includes(artistSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* SECTION 1: Landing Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-800 via-dark-800 to-purple-950/40 border border-dark-600 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IR & Recommender Systems Project • Topic 18</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            AlgoRhythm – Discover Music That Matches Your Taste
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            A demonstrable recommender system powered by 
            <span className="text-purple-300 font-semibold"> Implicit Alternating Least Squares (ALS)</span> matrix factorization.
            Pick your favourite artists and tracks to fold your taste profile into the latent factor space.
          </p>

          {!started && (
            <div className="pt-4">
              <button
                onClick={() => setStarted(true)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold text-base shadow-lg shadow-purple-900/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 2: Taste Selection Interface */}
      {started && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Step Progress Tracker */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-dark-800 border border-dark-600">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold font-mono">
                01
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Configure Taste Preferences</h2>
                <p className="text-xs text-slate-400">Select artists and 3–5 songs from Last.fm 1K historical data</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-dark-700 text-purple-300 border border-dark-600">
                {selectedArtists.length} Artists Selected
              </span>
              <span className={`px-3 py-1.5 rounded-lg border ${
                selectedSongs.length >= 3 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                  : 'bg-dark-700 text-slate-300 border-dark-600'
              }`}>
                {selectedSongs.length}/5 Songs Selected
              </span>
            </div>
          </div>

          {/* Part A: Select Favourite Artists */}
          <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-400" />
                  <span>1. Select Favourite Artists</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose from top artists in the Last.fm dataset to seed latent genre preferences
                </p>
              </div>

              {/* Artist Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter artists (e.g. Radiohead)..."
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Selected Artists Pills */}
            {selectedArtists.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-dark-700/60">
                <span className="text-xs text-purple-400 font-mono self-center mr-1">Your Picks:</span>
                {selectedArtists.map(artist => (
                  <span
                    key={artist}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/40 text-purple-200 text-xs font-medium"
                  >
                    <span>{artist}</span>
                    <button onClick={() => toggleArtist(artist)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Artist Grid */}
            <div className="max-h-56 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {filteredArtists.slice(0, 40).map((a) => {
                  const isSelected = selectedArtists.includes(a.artist);
                  return (
                    <button
                      key={a.artist}
                      onClick={() => toggleArtist(a.artist)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30 border border-purple-400'
                          : 'bg-dark-700/70 hover:bg-dark-600 text-slate-300 border border-dark-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{a.artist}</span>
                      <span className="text-[10px] opacity-60 font-mono">({a.num_tracks})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Part B: Select 3-5 Favourite Songs */}
          <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-brand-emerald" />
                  <span>2. Pick 3 to 5 Favourite Songs</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specific tracks allow ALS cold-start fold-in to compute your custom user vector
                </p>
              </div>

              {/* Song Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search songs or artists..."
                  value={songSearch}
                  onChange={(e) => handleSearchSongs(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Selected Songs Banner */}
            {selectedSongs.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                  <span>Selected Tracks for Implicit Folding ({selectedSongs.length}/5)</span>
                  {selectedSongs.length >= 3 && (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready to recommend
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedSongs.map(song => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-dark-800/80 border border-emerald-500/20 text-xs"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-slate-200">{song.title}</span>
                        <span className="text-slate-400 ml-1.5">• {song.artist}</span>
                      </div>
                      <button
                        onClick={() => toggleSong(song)}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Song Grid List */}
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
              {songs.map((song) => {
                const isSelected = selectedSongs.some(s => s.id === song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSong(song)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                        : 'bg-dark-700/50 hover:bg-dark-700 border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-dark-600 text-slate-400'
                      }`}>
                        {isSelected ? <Check className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <p className={`text-sm truncate font-medium ${isSelected ? 'text-emerald-200' : 'text-slate-200'}`}>
                          {song.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {song.artist} <span className="font-mono opacity-50 ml-1">({song.total_plays.toLocaleString()} plays)</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      <button
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-dark-600 hover:bg-dark-500 text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Pick'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Part C: Submit Action Bar */}
          <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-dark-800/90 backdrop-blur-md border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Target User Profile:</span>{' '}
              <span className="font-mono text-purple-400">{userId || 'Auto-generated demo ID'}</span>
              <p className="text-slate-400 mt-0.5">
                Preferences will be stored in SQLite and folded into the pre-trained ALS item vectors.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || (selectedSongs.length === 0 && selectedArtists.length === 0)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-emerald hover:from-purple-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Computing ALS Fold-in Vector...</span>
                </>
              ) : (
                <>
                  <span>Generate Personalized Recommendations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

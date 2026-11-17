import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Star, 
  Play, 
  BarChart3, 
  PieChart as PieIcon, 
  Music, 
  TrendingUp, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Profile({ userId }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile(userId);
      setProfileData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!profileData && !loading) {
    return <div className="text-center p-12 text-slate-400">Profile data not available</div>;
  }

  const stats = profileData?.stats || {
    total_interactions: 0,
    likes_count: 0,
    favorites_count: 0,
    plays_count: 0,
    skips_count: 0
  };

  const topArtists = profileData?.top_artists || [];
  const topSongs = profileData?.top_songs || [];
  const interactionBreakdown = (profileData?.interaction_breakdown || []).filter(i => i.count > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-emerald flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>User Taste Profile & Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {userId || 'Demo User'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative implicit feedback representation across listening sessions
            </p>
          </div>
        </div>

        <div className="text-xs font-mono px-4 py-2 rounded-xl bg-dark-700 border border-dark-600 text-slate-300">
          Status: <span className="text-emerald-400 font-semibold">Active Session</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Interactions"
          value={stats.total_interactions}
          subtext="Logged in SQLite"
          icon={Layers}
          color="purple"
        />
        <MetricCard
          label="Liked Songs"
          value={stats.likes_count}
          subtext="+3.0 implicit weight"
          icon={Heart}
          color="emerald"
        />
        <MetricCard
          label="Favourites"
          value={stats.favorites_count}
          subtext="+5.0 implicit weight"
          icon={Star}
          color="pink"
        />
        <MetricCard
          label="Total Plays"
          value={stats.plays_count}
          subtext="Audio sessions & repeats"
          icon={Play}
          color="blue"
        />
      </div>

      {/* Analytics Visualizations with Recharts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Interaction Type Distribution */}
        <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <span>Interaction Distribution</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Implicit signals breakdown by action type</p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {interactionBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interactionBreakdown}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {interactionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181C30',
                      borderColor: '#232842',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 italic">No interactions yet to render chart</p>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-dark-700/60 text-xs">
            {interactionBreakdown.map((entry) => (
              <div key={entry.type} className="flex items-center gap-1.5 font-mono">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-300">{entry.type}:</span>
                <span className="text-slate-400 font-semibold">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Top Interacted Artists */}
        <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-emerald" />
                <span>Top Artists by Interaction</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Frequency of engagements per artist</p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {topArtists.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topArtists} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181C30',
                      borderColor: '#232842',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 italic">No artist interactions logged yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Frequently Played Songs List */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-400" />
          <span>Most Frequently Interacted Songs in This Session</span>
        </h2>

        {topSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topSongs.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-dark-700/60 border border-dark-600 flex items-center justify-between text-xs">
                <div className="truncate mr-3">
                  <span className="font-semibold text-slate-200">{s.song}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-dark-600 text-purple-300 font-mono text-[11px] shrink-0">
                  {s.count} {s.count === 1 ? 'event' : 'events'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Interacting with recommendations will highlight your top songs here.</p>
        )}
      </div>
    </div>
  );
}

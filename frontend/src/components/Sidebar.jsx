import React from 'react';
import { 
  Sparkles, 
  Compass, 
  History, 
  User, 
  Cpu, 
  Music, 
  LogOut,
  Radio
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, userId, onResetUser }) {
  const navItems = [
    { id: 'onboarding', label: 'Taste Onboarding', icon: Compass, badge: 'Step 1' },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, badge: 'ALS' },
    { id: 'history', label: 'Listening Activity', icon: History },
    { id: 'profile', label: 'My Music Profile', icon: User },
    { id: 'model-info', label: 'Model & Evaluation', icon: Cpu, badge: 'IR Metrics' },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-600 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-emerald flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
              AlgoRhythm
            </h1>
            <p className="text-xs text-purple-400 font-mono">Implicit ALS Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
          System Sections
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/30 text-white border border-purple-500/30 shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-purpleLight' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-brand-purple/40 text-purple-200' : 'bg-dark-600 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Status / Reset footer */}
      <div className="p-4 border-t border-dark-600 bg-dark-900/40">
        <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-purple-300" />
            </div>
            <div className="truncate">
              <p className="text-xs text-slate-400 font-mono">Current User</p>
              <p className="text-xs font-semibold text-slate-200 truncate">{userId || 'Not initialized'}</p>
            </div>
          </div>

          <button
            onClick={onResetUser}
            title="Reset Session / Onboard Again"
            className="p-1.5 hover:bg-dark-600 rounded-lg text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 px-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Topic 18</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Online
          </span>
        </div>
      </div>
    </aside>
  );
}

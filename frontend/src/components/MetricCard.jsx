import React from 'react';

export default function MetricCard({ label, value, subtext, icon: Icon, color = "purple" }) {
  const colorMap = {
    purple: {
      bg: "from-purple-900/30 to-purple-800/10",
      border: "border-purple-500/30",
      text: "text-purple-300",
      iconBg: "bg-purple-600/20 text-purple-300"
    },
    emerald: {
      bg: "from-emerald-900/30 to-emerald-800/10",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      iconBg: "bg-emerald-600/20 text-emerald-300"
    },
    pink: {
      bg: "from-pink-900/30 to-pink-800/10",
      border: "border-pink-500/30",
      text: "text-pink-300",
      iconBg: "bg-pink-600/20 text-pink-300"
    },
    blue: {
      bg: "from-blue-900/30 to-blue-800/10",
      border: "border-blue-500/30",
      text: "text-blue-300",
      iconBg: "bg-blue-600/20 text-blue-300"
    }
  };

  const scheme = colorMap[color] || colorMap.purple;

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${scheme.bg} border ${scheme.border} backdrop-blur-xs flex items-center justify-between shadow-lg`}>
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-2xl font-bold font-mono mt-1 ${scheme.text}`}>{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-xl ${scheme.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

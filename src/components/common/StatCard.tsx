import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-cyan-500/15',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'hover:shadow-cyan-500/20',
      pill: 'bg-cyan-400',
    },
    emerald: {
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'hover:shadow-emerald-500/20',
      pill: 'bg-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'hover:shadow-amber-500/20',
      pill: 'bg-amber-400',
    },
    red: {
      bg: 'bg-red-500/15',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'hover:shadow-red-500/20',
      pill: 'bg-red-400',
    },
    purple: {
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'hover:shadow-purple-500/20',
      pill: 'bg-purple-400',
    },
  };

  const theme = colorMap[color];

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex items-center justify-between ${theme.glow}`}>
      {/* Background soft glow gradient */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${theme.pill}`} />
          <span className="text-xs font-bold text-slate-300 tracking-wide">{title}</span>
        </div>
        <div className="text-2xl font-black font-mono text-white tracking-tight pt-1">{value}</div>
        {subtitle && <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>}
      </div>

      <div className={`p-3.5 rounded-2xl border ${theme.bg} ${theme.border} ${theme.text} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};


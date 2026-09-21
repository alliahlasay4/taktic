import React from 'react';
import { Award, Zap, Flame, ShieldCheck, Gem } from 'lucide-react';
import { Habit } from '../../types';

interface MilestoneTrophyShelfProps {
  habits: Habit[];
}

interface Milestone {
  id: string;
  name: string;
  days: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'spark_7',
    name: '7-Day Spark',
    days: 7,
    icon: Zap,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    description: '1 week of solid consistency',
  },
  {
    id: 'flame_14',
    name: '14-Day Flame',
    days: 14,
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30',
    description: '2 weeks unbroken rhythm',
  },
  {
    id: 'titan_30',
    name: '30-Day Titan',
    days: 30,
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    description: '1 full month habit mastery',
  },
  {
    id: 'master_90',
    name: '90-Day Master',
    days: 90,
    icon: Gem,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30',
    description: 'Quarterly lifestyle transformation',
  },
];

export const MilestoneTrophyShelf: React.FC<MilestoneTrophyShelfProps> = ({ habits }) => {
  const maxStreak = Math.max(0, ...habits.map((h) => h.streak || 0));

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <Award className="h-4 w-4 text-[#CFA052]" />
        <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
          Habit Consistency Trophy Shelf
        </h3>
        <span className="ml-auto text-[11px] font-semibold text-[var(--text-muted)]">
          Best Streak: <strong className="text-[#CFA052]">{maxStreak} Days</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MILESTONES.map((m) => {
          const isUnlocked = maxStreak >= m.days;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              className={`flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition-all ${
                isUnlocked
                  ? `${m.borderColor} ${m.bgColor} shadow-xs scale-[1.02]`
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 opacity-40 grayscale'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2 ${
                  isUnlocked ? `${m.bgColor} ${m.color}` : 'bg-[var(--border-subtle)]/50 text-[var(--text-muted)]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <h4 className={`text-xs font-bold ${isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {m.name}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                  {m.description}
                </p>
              </div>

              <span
                className={`mt-2.5 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {isUnlocked ? 'Unlocked!' : `${m.days} Days Req.`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

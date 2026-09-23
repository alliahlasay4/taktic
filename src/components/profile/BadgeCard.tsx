import React from 'react';
import { Badge } from '../../types';
import { Flame, Clock, CheckCircle2, Users, Lock, Check } from 'lucide-react';

interface BadgeCardProps {
  badge: Badge;
}

const TIER_STYLES = {
  bronze: {
    bg: 'border-[var(--accent-warm-ochre)]/40 bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]',
    iconBg: 'bg-[var(--accent-warm-ochre)]/20 border-[var(--accent-warm-ochre)]/40 text-[var(--accent-warm-ochre)]',
    bar: 'bg-[var(--accent-warm-ochre)]',
  },
  silver: {
    bg: 'border-[var(--border-subtle)] bg-[var(--card-hover)]/60 text-[var(--text-primary)]',
    iconBg: 'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-primary)]',
    bar: 'bg-[var(--text-secondary)]',
  },
  gold: {
    bg: 'border-[var(--accent-terracotta)]/40 bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]',
    iconBg: 'bg-[var(--accent-terracotta)]/20 border-[var(--accent-terracotta)]/40 text-[var(--accent-terracotta)]',
    bar: 'bg-[var(--accent-terracotta)]',
  },
  diamond: {
    bg: 'border-[var(--accent-dusty-rose)]/40 bg-[var(--accent-dusty-rose)]/10 text-[var(--accent-dusty-rose)]',
    iconBg: 'bg-[var(--accent-dusty-rose)]/20 border-[var(--accent-dusty-rose)]/40 text-[var(--accent-dusty-rose)]',
    bar: 'bg-[var(--accent-dusty-rose)]',
  },
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const styles = TIER_STYLES[badge.tier];
  const progressPercent = Math.min(
    100,
    Math.round((badge.currentProgress / badge.targetProgress) * 100)
  );

  const getCategoryIcon = () => {
    switch (badge.category) {
      case 'streak':
        return <Flame className="w-4 h-4" strokeWidth={1.5} />;
      case 'focus':
        return <Clock className="w-4 h-4" strokeWidth={1.5} />;
      case 'habit':
        return <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />;
      case 'social':
        return <Users className="w-4 h-4" strokeWidth={1.5} />;
      default:
        return <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />;
    }
  };

  return (
    <div
      className={`relative p-4 rounded-xl border flex flex-col transition-all duration-200 ${
        badge.isUnlocked
          ? `bg-[var(--card-surface)] border-[var(--border-subtle)] shadow-xs hover:border-[var(--accent-terracotta)]/30`
          : 'bg-[var(--bg-main)]/50 border-[var(--border-subtle)] opacity-75'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2.5 rounded-lg border ${
            badge.isUnlocked
              ? styles.iconBg
              : 'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {badge.isUnlocked ? getCategoryIcon() : <Lock className="w-4 h-4" strokeWidth={1.5} />}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            badge.isUnlocked
              ? styles.bg
              : 'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {badge.tier}
        </span>
      </div>

      <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">{badge.title}</h4>
      <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2">{badge.description}</p>

      {/* Progress Bar */}
      <div className="mt-auto">
        <div className="flex justify-between items-center text-[11px] mb-1.5 font-mono">
          <span className="text-[var(--text-muted)] flex items-center gap-1">
            {badge.isUnlocked ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Unlocked
              </span>
            ) : (
              `${badge.currentProgress} / ${badge.targetProgress}`
            )}
          </span>
          <span className="font-semibold text-[var(--text-primary)]">{progressPercent}%</span>
        </div>
        <div
          className="w-full bg-[var(--border-subtle)] h-1.5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              badge.isUnlocked ? styles.bar : 'bg-[var(--text-muted)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

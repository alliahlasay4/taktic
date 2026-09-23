import React from 'react';
import { Flame, Check, Trash2, Sun, Sunrise, Moon, Shield, BarChart2 } from 'lucide-react';
import { Habit } from '../../types';
import { soundEngine } from '../../lib/audio';
import { IconRenderer } from '../common/IconRenderer';

interface HabitItemProps {
  habit: Habit;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggleHabit, onDeleteHabit }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completedDates.includes(today);

  // Calculate past 7 days completion count
  const now = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const completedThisWeek = habit.completedDates.filter((d) => past7Days.includes(d)).length;
  const targetWeekly = habit.targetDaysPerWeek || 7;

  const handleCheck = () => {
    if (!isCompletedToday) {
      soundEngine.playCheckoffSound();
    }
    onToggleHabit(habit.id);
  };

  const getTimeOfDayConfig = (timeOfDay?: 'morning' | 'afternoon' | 'evening') => {
    switch (timeOfDay) {
      case 'afternoon':
        return { label: 'Afternoon', icon: Sun, color: 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-300' };
      case 'evening':
        return { label: 'Evening', icon: Moon, color: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500 dark:text-indigo-300' };
      default:
        return { label: 'Morning', icon: Sunrise, color: 'bg-sky-500/15 border-sky-500/30 text-sky-500 dark:text-sky-300' };
    }
  };

  const timeOfDayConfig = getTimeOfDayConfig(habit.timeOfDay);
  const TimeIcon = timeOfDayConfig.icon;

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 transition-all hover:border-[var(--text-muted)] hover:shadow-2xs">
      {/* Icon & Details */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={handleCheck}
          aria-label={isCompletedToday ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} completed`}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all ${
            isCompletedToday
              ? 'bg-[var(--accent-terracotta)]/20 border-2 border-[var(--accent-terracotta)] shadow-xs text-[var(--accent-terracotta)]'
              : 'bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
          }`}
        >
          {isCompletedToday ? (
            <Check className="h-5 w-5 text-[var(--accent-terracotta)] stroke-[3]" />
          ) : (
            <IconRenderer name={habit.icon || habit.category} className="h-5 w-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold text-sm text-[var(--text-primary)] ${
                isCompletedToday ? 'line-through text-[var(--text-muted)]' : ''
              }`}
            >
              {habit.title}
            </span>

            <span className="rounded-md bg-[var(--border-subtle)]/60 px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] capitalize">
              {habit.category}
            </span>

            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${timeOfDayConfig.color}`}>
              <TimeIcon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              <span>{timeOfDayConfig.label}</span>
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-[#C06C4C]">
              <Flame className="h-3.5 w-3.5 fill-[#C06C4C]" />
              {habit.streak} Day Streak
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
              <BarChart2 className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={1.5} />
              <span>{completedThisWeek}/{targetWeekly} this week</span>
            </span>

            {/* Monthly 3-Streak Freeze Shield Badge */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
              <span>{habit.freezeShieldsRemaining ?? 3}/3 Freeze Shields</span>
            </span>
          </div>
        </div>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDeleteHabit(habit.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/15 hover:text-rose-500"
        title="Delete Habit"
        aria-label={`Delete ${habit.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

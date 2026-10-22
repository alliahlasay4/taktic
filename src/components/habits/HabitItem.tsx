import React from 'react';
import { Flame, Check, Trash2, Sun, Sunrise, Moon, Shield, BarChart2 } from 'lucide-react';
import { Habit } from '../../types';
import { soundEngine } from '../../lib/audio';
import { IconRenderer } from '../common/IconRenderer';
import { getLocalDateString, getDateWithOffset } from '../../lib/streak';

interface HabitItemProps {
  habit: Habit;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggleHabit, onDeleteHabit }) => {
  const today = getLocalDateString();
  const isCompletedToday = habit.completedDates.includes(today);

  // Calculate past 7 days completion count
  const past7Days = Array.from({ length: 7 }, (_, i) => getDateWithOffset(today, -i));
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
    <div
      className={`group relative flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 sm:p-3.5 transition-all duration-200 hover:border-[var(--accent-terracotta)]/40 hover:shadow-xs ${
        isCompletedToday ? 'opacity-55 bg-[var(--card-hover)]/30' : ''
      }`}
    >
      {/* Header Row: Checkbox, Title & Badges, Actions */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleCheck}
            aria-label={isCompletedToday ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} completed`}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
              isCompletedToday
                ? 'border-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)] text-white shadow-xs'
                : 'border-[var(--text-muted)]/60 hover:border-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 text-[var(--text-muted)]'
            }`}
            title={isCompletedToday ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isCompletedToday ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <IconRenderer name={habit.icon || habit.category} className="h-3 w-3 opacity-60" />
            )}
          </button>

          <div className="flex items-center gap-1.5 flex-wrap min-w-0 pt-0.5">
            <span
              className={`font-medium text-xs text-[var(--text-primary)] leading-snug break-words ${
                isCompletedToday ? 'line-through text-[var(--text-muted)]' : ''
              }`}
            >
              {habit.title}
            </span>

            {/* Category Pill */}
            <span className="inline-flex items-center rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] capitalize shrink-0">
              {habit.category}
            </span>

            {/* Time of Day Pill */}
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${timeOfDayConfig.color}`}>
              <TimeIcon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              <span>{timeOfDayConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => onDeleteHabit(habit.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-rose-500/15 hover:text-rose-500 cursor-pointer"
            title="Delete Habit"
            aria-label={`Delete ${habit.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta Details & Consistency Chips - Full width horizontal row across the card */}
      <div className="pl-7.5 flex flex-row flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)] w-full">
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-terracotta)] shrink-0">
          <Flame className="h-3 w-3 fill-[var(--accent-terracotta)] text-[var(--accent-terracotta)]" />
          {habit.streak} Day Streak
        </span>

        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] shrink-0">
          <BarChart2 className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={1.5} />
          <span>{completedThisWeek}/{targetWeekly} this week</span>
        </span>

        {/* Monthly 3-Streak Freeze Shield Badge */}
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <Shield className="h-3 w-3 text-emerald-500" />
          <span>{habit.freezeShieldsRemaining ?? 3}/3 Freeze Shields</span>
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { Flame, Check, ShieldCheck, Trash2, Sun, Sunset, Moon, Shield } from 'lucide-react';
import { Habit } from '../../types';
import { soundEngine } from '../../lib/audio';

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

  const timeOfDayLabel =
    habit.timeOfDay === 'afternoon'
      ? '☀️ Afternoon'
      : habit.timeOfDay === 'evening'
      ? '🌙 Evening'
      : '🌅 Morning';

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 transition-all hover:border-[var(--text-muted)]">
      {/* Icon & Details */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={handleCheck}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-all ${
            isCompletedToday
              ? 'bg-[#C87D87]/20 border-2 border-[#C87D87] shadow-xs'
              : 'bg-[var(--bg-main)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)]'
          }`}
        >
          {isCompletedToday ? <Check className="h-5 w-5 text-[#C87D87] stroke-[3]" /> : habit.icon}
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

            <span className="rounded-md bg-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] capitalize">
              {habit.category}
            </span>

            <span className="rounded-md bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
              {timeOfDayLabel}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-[#C06C4C]">
              <Flame className="h-3.5 w-3.5 fill-[#C06C4C]" />
              {habit.streak} Day Streak
            </span>

            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              📊 {completedThisWeek}/{targetWeekly} this week
            </span>

            {/* Monthly 3-Streak Freeze Shield Badge */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3 text-emerald-400" />
              {habit.freezeShieldsRemaining ?? 3}/3 Freeze Shields
            </span>
          </div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDeleteHabit(habit.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/15 hover:text-rose-500"
        title="Delete Habit"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};


import React from 'react';
import { Sparkles, Flame, CheckCircle, Clock, Repeat, X, Share2 } from 'lucide-react';

interface EndOfDaySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  tasksCompleted: number;
  totalTasks: number;
  habitsCompleted: number;
  totalHabits: number;
  focusMinutes: number;
  userStreak: number;
}

export const EndOfDaySummary: React.FC<EndOfDaySummaryProps> = ({
  isOpen,
  onClose,
  tasksCompleted,
  totalTasks,
  habitsCompleted,
  totalHabits,
  focusMinutes,
  userStreak,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Card Title Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C87D87] to-[#CFA052] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
              Daily Reflection Card
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4">
            <div className="flex items-center gap-2 text-[#6B8E6E] mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Tasks Done</span>
            </div>
            <p className="font-heading font-bold text-2xl text-[var(--text-primary)]">
              {tasksCompleted} / {totalTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4">
            <div className="flex items-center gap-2 text-[#C87D87] mb-1">
              <Repeat className="h-4 w-4" />
              <span className="text-xs font-semibold">Habits Kept</span>
            </div>
            <p className="font-heading font-bold text-2xl text-[var(--text-primary)]">
              {habitsCompleted} / {totalHabits}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4">
            <div className="flex items-center gap-2 text-[#CFA052] mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">Focus Minutes</span>
            </div>
            <p className="font-heading font-bold text-2xl text-[var(--text-primary)]">
              {focusMinutes}m
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4">
            <div className="flex items-center gap-2 text-[#C06C4C] mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-semibold">Streak</span>
            </div>
            <p className="font-heading font-bold text-2xl text-[var(--text-primary)]">
              {userStreak} Days
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              alert('Daily reflection summary copied to clipboard!');
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] flex-1"
          >
            <Share2 className="h-4 w-4" />
            Share Card
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#C87D87] py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

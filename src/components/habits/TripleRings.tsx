import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Flame, Clock, Sparkles } from 'lucide-react';

interface TripleRingsProps {
  tasksCompleted: number;
  totalTasks: number;
  habitsCompleted: number;
  totalHabits: number;
  focusMinutes: number;
  targetFocusMinutes: number;
  onRingClick?: (ring: 'tasks' | 'habits' | 'focus') => void;
}

export const TripleRings: React.FC<TripleRingsProps> = ({
  tasksCompleted,
  totalTasks,
  habitsCompleted,
  totalHabits,
  focusMinutes,
  targetFocusMinutes,
  onRingClick,
}) => {
  const taskPct = totalTasks > 0 ? Math.min(100, Math.round((tasksCompleted / totalTasks) * 100)) : 0;
  const habitPct = totalHabits > 0 ? Math.min(100, Math.round((habitsCompleted / totalHabits) * 100)) : 0;
  const focusPct = targetFocusMinutes > 0 ? Math.min(100, Math.round((focusMinutes / targetFocusMinutes) * 100)) : 0;

  const allClosed = taskPct >= 100 && habitPct >= 100 && focusPct >= 100;

  // SVG Concentric Ring Dimensions (220x220 canvas with generous inner clear radius)
  const center = 110;

  // Ring 1: Outer - Tasks (Botanical Sage)
  const r1 = 88;
  const c1 = 2 * Math.PI * r1;
  const strokeDashoffset1 = c1 - (c1 * taskPct) / 100;

  // Ring 2: Middle - Habits (Dusty Rose)
  const r2 = 68;
  const c2 = 2 * Math.PI * r2;
  const strokeDashoffset2 = c2 - (c2 * habitPct) / 100;

  // Ring 3: Inner - Focus Time (Warm Ochre)
  const r3 = 48;
  const c3 = 2 * Math.PI * r3;
  const strokeDashoffset3 = c3 - (c3 * focusPct) / 100;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-7 shadow-xs w-full max-w-full relative overflow-hidden group transition-colors duration-300">
      {/* Ambient Background Aura */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-[var(--accent-warm-ochre)]/10 via-[var(--accent-terracotta)]/5 to-transparent blur-2xl pointer-events-none" />

      {/* SVG Concentric Rings */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg viewBox="0 0 220 220" className="w-48 h-48 sm:w-56 sm:h-56 rotate-[-90deg]">
          <defs>
            {/* Task Ring Gradient */}
            <linearGradient id="tripleTaskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4E7A52" />
              <stop offset="100%" stopColor="#7BB280" />
            </linearGradient>

            {/* Habit Ring Gradient */}
            <linearGradient id="tripleHabitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B85D6A" />
              <stop offset="100%" stopColor="#E58A97" />
            </linearGradient>

            {/* Focus Ring Gradient */}
            <linearGradient id="tripleFocusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CFA052" />
              <stop offset="100%" stopColor="#E6B870" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="tripleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#CFA052" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Ring 1 Track & Fill - Tasks */}
          <circle
            cx={center}
            cy={center}
            r={r1}
            stroke="#6B8E6E"
            strokeWidth="12"
            fill="transparent"
            opacity="0.15"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={r1}
            stroke="url(#tripleTaskGradient)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={c1}
            animate={{ strokeDashoffset: strokeDashoffset1 }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('tasks')}
          />

          {/* Ring 2 Track & Fill - Habits */}
          <circle
            cx={center}
            cy={center}
            r={r2}
            stroke="#C87D87"
            strokeWidth="12"
            fill="transparent"
            opacity="0.15"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={r2}
            stroke="url(#tripleHabitGradient)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={c2}
            animate={{ strokeDashoffset: strokeDashoffset2 }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('habits')}
          />

          {/* Ring 3 Track & Fill - Focus Time */}
          <circle
            cx={center}
            cy={center}
            r={r3}
            stroke="#CFA052"
            strokeWidth="12"
            fill="transparent"
            opacity="0.15"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={r3}
            stroke="url(#tripleFocusGradient)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={c3}
            animate={{ strokeDashoffset: strokeDashoffset3 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('focus')}
            filter="url(#tripleGlow)"
          />
        </svg>

        {/* Center Percentage & High-Impact Glassmorphic Pill Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10 px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={Math.round((taskPct + habitPct + focusPct) / 3)}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex flex-col items-center"
            >
              <span className="font-heading text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-none tracking-tight">
                {Math.round((taskPct + habitPct + focusPct) / 3)}%
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Styled Glassmorphic Pill with Live Status Indicator */}
          <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card-surface)]/95 dark:bg-[#25201D]/95 border border-[var(--border-subtle)] shadow-md backdrop-blur-md">
            <span className={`h-1.5 w-1.5 rounded-full ${allClosed ? 'bg-emerald-500 animate-ping' : 'bg-[#CFA052] animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] bg-clip-text text-transparent whitespace-nowrap">
              {allClosed ? 'All Closed! 🎉' : 'Daily Rhythm'}
            </span>
          </div>
        </div>
      </div>

      {/* Ring Legend & Stats */}
      <div className="flex-1 space-y-3.5 w-full">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <div className="flex items-center gap-2 text-[#6B8E6E] dark:text-[#7B9E7E]">
              <CheckCircle className="h-4 w-4" />
              <span>Tasks Completed</span>
            </div>
            <span className="text-[var(--text-primary)]">
              {tasksCompleted}/{totalTasks} ({taskPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <motion.div
              className="h-full bg-[#6B8E6E] dark:bg-[#7B9E7E]"
              initial={{ width: 0 }}
              animate={{ width: `${taskPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <div className="flex items-center gap-2 text-[#C87D87] dark:text-[#D88E98]">
              <Flame className="h-4 w-4" />
              <span>Habits Maintained</span>
            </div>
            <span className="text-[var(--text-primary)]">
              {habitsCompleted}/{totalHabits} ({habitPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <motion.div
              className="h-full bg-[#C87D87] dark:bg-[#D88E98]"
              initial={{ width: 0 }}
              animate={{ width: `${habitPct}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <div className="flex items-center gap-2 text-[#CFA052] dark:text-[#E0AF5E]">
              <Clock className="h-4 w-4" />
              <span>Focus Logged </span>
            </div>
            <span className="text-[var(--text-primary)]">
              {focusMinutes}/{targetFocusMinutes}m ({focusPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <motion.div
              className="h-full bg-[#CFA052] dark:bg-[#E0AF5E]"
              initial={{ width: 0 }}
              animate={{ width: `${focusPct}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

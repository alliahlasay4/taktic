import React from 'react';
import { motion } from 'framer-motion';
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

  // SVG Concentric Ring Dimensions
  const center = 110;

  // Ring 1: Outer - Tasks (Botanical Sage)
  const r1 = 90;
  const c1 = 2 * Math.PI * r1;
  const strokeDashoffset1 = c1 - (c1 * taskPct) / 100;

  // Ring 2: Middle - Habits (Dusty Rose)
  const r2 = 68;
  const c2 = 2 * Math.PI * r2;
  const strokeDashoffset2 = c2 - (c2 * habitPct) / 100;

  // Ring 3: Inner - Focus Time (Warm Ochre)
  const r3 = 46;
  const c3 = 2 * Math.PI * r3;
  const strokeDashoffset3 = c3 - (c3 * focusPct) / 100;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-xs">
      {/* SVG Concentric Rings */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="rotate-[-90deg]">
          {/* Ring 1 Track - Tasks */}
          <circle
            cx={center}
            cy={center}
            r={r1}
            stroke="var(--border-subtle)"
            strokeWidth="14"
            fill="transparent"
            className="opacity-40"
          />
          {/* Ring 1 Fill */}
          <motion.circle
            cx={center}
            cy={center}
            r={r1}
            stroke="var(--ring-tasks)"
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={c1}
            animate={{ strokeDashoffset: strokeDashoffset1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('tasks')}
          />

          {/* Ring 2 Track - Habits */}
          <circle
            cx={center}
            cy={center}
            r={r2}
            stroke="var(--border-subtle)"
            strokeWidth="14"
            fill="transparent"
            className="opacity-40"
          />
          {/* Ring 2 Fill */}
          <motion.circle
            cx={center}
            cy={center}
            r={r2}
            stroke="var(--ring-habits)"
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={c2}
            animate={{ strokeDashoffset: strokeDashoffset2 }}
            transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('habits')}
          />

          {/* Ring 3 Track - Focus Time */}
          <circle
            cx={center}
            cy={center}
            r={r3}
            stroke="var(--border-subtle)"
            strokeWidth="14"
            fill="transparent"
            className="opacity-40"
          />
          {/* Ring 3 Fill */}
          <motion.circle
            cx={center}
            cy={center}
            r={r3}
            stroke="var(--ring-focus)"
            strokeWidth="14"
            fill="transparent"
            strokeDasharray={c3}
            animate={{ strokeDashoffset: strokeDashoffset3 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
            strokeLinecap="round"
            className="cursor-pointer hover:opacity-90"
            onClick={() => onRingClick?.('focus')}
          />
        </svg>

        {/* Center Icon / Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {allClosed ? (
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex flex-col items-center"
            >
              <Sparkles className="h-7 w-7 text-[#C87D87] animate-bounce" />
              <span className="text-[10px] font-bold text-[#C87D87] uppercase tracking-wider mt-0.5">
                All Closed!
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-heading text-xl font-bold text-[var(--text-primary)]">
                {Math.round((taskPct + habitPct + focusPct) / 3)}%
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                Daily Rhythm
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ring Legend & Stats */}
      <div className="flex-1 space-y-3.5 w-full">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <div className="flex items-center gap-2 text-[#6B8E6E] dark:text-[#7B9E7E]">
              <CheckCircle className="h-4 w-4" />
              <span>Tasks Completed (Sage)</span>
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
              <span>Habits Maintained (Dusty Rose)</span>
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
              <span>Focus Logged (Warm Ochre)</span>
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

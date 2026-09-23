import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles, Zap, Smile, Frown, X, Coffee } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { Task } from '../../types';
import { useTimer, TimerMode, PresetOption } from '../../context/TimerContext';

interface PomodoroTimerProps {
  selectedTask?: Task | null;
  onFocusComplete?: (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => void;
  activeSoundscape?: string | null;
  setActiveSoundscape?: (sound: string | null) => void;
}

const BREAK_GUIDANCE_TIPS = [
  'Hydration Check: Drink a glass of clean water to rehydrate your mind.',
  '20-20-20 Eye Rest: Look at an object at least 20 feet away for 20 seconds.',
  'Posture Reset: Stand up, roll your shoulders back, and stretch your spine.',
  'Deep Breathing: Take 4 deep belly breaths to lower cognitive tension.',
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  selectedTask,
}) => {
  const {
    mode,
    preset,
    customMinutesInput,
    timeLeft,
    totalDuration,
    isRunning,
    autoStartBreak,
    showRatingModal,
    pendingSessionData,
    toggleTimer,
    resetTimer,
    setMode,
    setPreset,
    setCustomMinutesInput,
    setAutoStartBreak,
    setSelectedTask,
    submitSessionComplete,
  } = useTimer();

  // Sync selected task from props if passed
  useEffect(() => {
    if (selectedTask !== undefined) {
      setSelectedTask(selectedTask);
    }
  }, [selectedTask, setSelectedTask]);

  // Break guidance rotating index
  const [breakTipIndex, setBreakTipIndex] = useState(0);

  // Rotate break tips
  useEffect(() => {
    if (mode === 'shortBreak' || mode === 'longBreak') {
      const tipInterval = setInterval(() => {
        setBreakTipIndex((prev) => (prev + 1) % BREAK_GUIDANCE_TIPS.length);
      }, 7000);
      return () => clearInterval(tipInterval);
    }
  }, [mode]);

  // Handle rating confirmation
  const handleConfirmEnergyRating = (quality: 'high_flow' | 'moderate' | 'distracted') => {
    submitSessionComplete(quality);
  };

  // Progress Calculation
  const progressPercent = mode === 'stopwatch'
    ? 100
    : totalDuration > 0
      ? Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100))
      : 0;

  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs transition-colors duration-300 relative overflow-hidden">
      {/* Top Mode Segmented Selector */}
      <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] mb-6 w-full max-w-sm" role="tablist">
        {(
          [
            { id: 'pomodoro', label: 'Pomodoro' },
            { id: 'shortBreak', label: 'Short Break' },
            { id: 'longBreak', label: 'Long Break' },
            { id: 'stopwatch', label: 'Stopwatch' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id as TimerMode)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === tab.id
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode Specific Status Pill */}
      <div className="mb-4">
        {mode === 'pomodoro' && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-terracotta)]">
            <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Deep Focus Mode</span>
          </div>
        )}
        {mode === 'shortBreak' && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-botanical-sage)]">
            <Coffee className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Short Break (5m)</span>
          </div>
        )}
        {mode === 'longBreak' && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Coffee className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Long Break (15m)</span>
          </div>
        )}
        {mode === 'stopwatch' && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-warm-ochre)]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Open Stopwatch Flow</span>
          </div>
        )}
      </div>

      {/* Preset Duration Chips (Only in Pomodoro Mode) */}
      {mode === 'pomodoro' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {([25, 50, 90, 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p as PresetOption)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                preset === p
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shadow-2xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
              }`}
            >
              {p === 'custom' ? 'Custom' : `${p}m`}
            </button>
          ))}
        </div>
      )}

      {/* Custom Duration Input Box */}
      {mode === 'pomodoro' && preset === 'custom' && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 text-xs text-[var(--text-primary)] animate-in fade-in">
          <label htmlFor="custom-pomodoro-minutes" className="font-medium text-[var(--text-secondary)]">Minutes:</label>
          <input
            id="custom-pomodoro-minutes"
            name="customMinutes"
            type="number"
            min={1}
            max={360}
            value={customMinutesInput}
            onChange={(e) => setCustomMinutesInput(Number(e.target.value))}
            className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-2 py-1 text-center font-mono font-bold focus:border-[var(--accent-terracotta)] focus:outline-none"
          />
        </div>
      )}

      {/* Active Task Badge */}
      {selectedTask && (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] shadow-2xs max-w-sm w-full">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent-terracotta)] shrink-0" strokeWidth={1.5} />
            <span className="truncate">Focusing on: <strong className="font-semibold text-[var(--accent-terracotta)]">{selectedTask.title}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTask(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded cursor-pointer shrink-0"
            title="Clear active task"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Oversized Circular Progress Countdown Ring */}
      <div className="relative my-4 flex items-center justify-center">
        <svg className="h-64 w-64 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-[var(--border-subtle)]/40 fill-none"
            strokeWidth="4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-[var(--accent-terracotta)] fill-none"
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>

        {/* Big Display Clock Inside Ring */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-mono text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold font-heading">
            {isRunning ? 'Session Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Break Guidance Box */}
      {(mode === 'shortBreak' || mode === 'longBreak') && (
        <div className="my-3 w-full max-w-sm rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 text-center text-xs text-[var(--accent-botanical-sage)] animate-in fade-in">
          <p className="font-medium leading-relaxed">{BREAK_GUIDANCE_TIPS[breakTipIndex]}</p>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTimer}
          className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 min-h-[48px] text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/40 hover:bg-[var(--accent-warm-ochre)]/30'
              : 'bg-[var(--accent-terracotta)] text-white hover:opacity-90 shadow-[var(--accent-terracotta)]/20'
          }`}
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-all cursor-pointer active:scale-95"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Auto-Start Break Switch */}
      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4 mt-6 w-full justify-center text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          id="autoStartBreak"
          checked={autoStartBreak}
          onChange={(e) => setAutoStartBreak(e.target.checked)}
          className="rounded border-[var(--border-subtle)] accent-[var(--accent-terracotta)] cursor-pointer"
        />
        <label htmlFor="autoStartBreak" className="font-medium cursor-pointer">
          Auto-start break when timer completes
        </label>
      </div>

      {/* Post-Session Energy & Quality Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Session Complete
              </h4>
              <button
                type="button"
                onClick={() => handleConfirmEnergyRating('moderate')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-1"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-5">
              How was your focus quality during this {pendingSessionData?.mins}m session?
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConfirmEnergyRating('high_flow')}
                className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  High Flow State
                </span>
                <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">Deep focus</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmEnergyRating('moderate')}
                className="w-full flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Moderate Focus
                </span>
                <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">Normal pace</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmEnergyRating('distracted')}
                className="w-full flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Distracted
                </span>
                <span className="text-[10px] font-normal text-rose-600 dark:text-rose-400">Frequent breaks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

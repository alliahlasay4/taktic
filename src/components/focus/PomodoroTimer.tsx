import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles, Sliders, Zap, Smile, Frown, X } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import { soundEngine } from '../../lib/audio';
import { Task } from '../../types';

interface PomodoroTimerProps {
  selectedTask?: Task | null;
  onFocusComplete: (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => void;
  activeSoundscape: string | null;
  setActiveSoundscape: (sound: string | null) => void;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch';
type PresetOption = 25 | 50 | 90 | 'custom';

const BREAK_GUIDANCE_TIPS = [
  'Hydration Check: Drink a glass of clean water to rehydrate your mind.',
  '20-20-20 Eye Rest: Look at an object at least 20 feet away for 20 seconds.',
  'Posture Reset: Stand up, roll your shoulders back, and stretch your spine.',
  'Deep Breathing: Take 4 deep belly breaths to lower cognitive tension.',
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  selectedTask,
  onFocusComplete,
  activeSoundscape,
  setActiveSoundscape,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [preset, setPreset] = useState<PresetOption>(25);
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(45);
  const [autoStartBreak, setAutoStartBreak] = useState<boolean>(false);

  // Calculate current mode duration in seconds
  const getDurationSeconds = (): number => {
    if (mode === 'shortBreak') return 5 * 60;
    if (mode === 'longBreak') return 15 * 60;
    if (mode === 'stopwatch') return 0;
    if (preset === 'custom') return Math.max(1, customMinutesInput) * 60;
    return preset * 60;
  };

  const totalDuration = getDurationSeconds();
  const [timeLeft, setTimeLeft] = useState<number>(totalDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Energy Check-in Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingSessionData, setPendingSessionData] = useState<{ mins: number; title?: string } | null>(null);

  // Break guidance rotating index
  const [breakTipIndex, setBreakTipIndex] = useState(0);

  useEffect(() => {
    setTimeLeft(getDurationSeconds());
    setIsRunning(false);
  }, [mode, preset, customMinutesInput]);

  // Rotate break tips
  useEffect(() => {
    if (mode === 'shortBreak' || mode === 'longBreak') {
      const tipInterval = setInterval(() => {
        setBreakTipIndex((prev) => (prev + 1) % BREAK_GUIDANCE_TIPS.length);
      }, 7000);
      return () => clearInterval(tipInterval);
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'stopwatch') {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            soundEngine.playTimerCompleteSound();

            const elapsedMins = Math.max(1, Math.round(totalDuration / 60));

            // Prompt energy check-in modal
            setPendingSessionData({ mins: elapsedMins, title: selectedTask?.title });
            setShowRatingModal(true);

            // Auto-start break flow if enabled
            if (mode === 'pomodoro' && autoStartBreak) {
              setTimeout(() => {
                setMode('shortBreak');
                setIsRunning(true);
              }, 1000);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, totalDuration, selectedTask, autoStartBreak]);

  const handleTogglePlay = () => {
    if (!isRunning && activeSoundscape) {
      soundEngine.playSoundscape(activeSoundscape);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDurationSeconds());
  };

  const handleManualCompleteLog = () => {
    const elapsedMins = mode === 'stopwatch'
      ? Math.max(1, Math.round(timeLeft / 60))
      : Math.max(1, Math.round((totalDuration - timeLeft) / 60) || 1);

    soundEngine.playTimerCompleteSound();
    setPendingSessionData({ mins: elapsedMins, title: selectedTask?.title });
    setShowRatingModal(true);
  };

  const handleConfirmEnergyRating = (quality: 'high_flow' | 'moderate' | 'distracted') => {
    if (pendingSessionData) {
      onFocusComplete(pendingSessionData.mins, pendingSessionData.title, quality);
    }
    setShowRatingModal(false);
    setPendingSessionData(null);
  };

  // Progress percentage for SVG ring
  const progressPct =
    mode === 'stopwatch'
      ? Math.min(100, (timeLeft / 3600) * 100)
      : Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100);

  const center = 120;
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPct) / 100;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-8 shadow-md relative">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-1 mb-4 flex-wrap justify-center">
        {(['pomodoro', 'shortBreak', 'longBreak', 'stopwatch'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
              mode === m
                ? 'bg-gradient-to-r from-[#CFA052] to-[#C06C4C] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {m === 'pomodoro'
              ? 'Focus Mode'
              : m === 'shortBreak'
              ? '5m Rest'
              : m === 'longBreak'
              ? '15m Rest'
              : 'Stopwatch'}
          </button>
        ))}
      </div>

      {/* Focus Duration Presets (Only visible in Pomodoro focus mode) */}
      {mode === 'pomodoro' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">Presets:</span>
          {([25, 50, 90] as number[]).map((mins) => (
            <button
              key={mins}
              onClick={() => setPreset(mins as PresetOption)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                preset === mins
                  ? 'bg-[#CFA052] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mins}m
            </button>
          ))}
          <button
            onClick={() => setPreset('custom')}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              preset === 'custom'
                ? 'bg-[#CFA052] text-white shadow-xs'
                : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Custom
          </button>

          {preset === 'custom' && (
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(Number(e.target.value))}
              className="w-14 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2 py-0.5 text-[11px] text-[var(--text-primary)] text-center font-bold focus:outline-none"
            />
          )}
        </div>
      )}

      {/* Selected Task Indicator */}
      {selectedTask && (
        <div className="mb-4 flex items-center gap-2 rounded-full border border-[#CFA052]/30 bg-[#CFA052]/10 px-4 py-1.5 text-xs font-semibold text-[#CFA052]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Focusing on: {selectedTask.title}</span>
        </div>
      )}

      {/* Circular Timer SVG Display */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="240" height="240" className="rotate-[-90deg]">
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--border-subtle)"
            strokeWidth="12"
            fill="transparent"
            className="opacity-40"
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            stroke="var(--ring-focus)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
            {formatTime(timeLeft)}
          </span>
          <span className="mt-1 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {mode === 'stopwatch' ? 'Elapsed Time' : isRunning ? 'In Deep Focus' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Text-Only Active Break Guidance (No Emojis as requested) */}
      {(mode === 'shortBreak' || mode === 'longBreak') && (
        <div className="mb-6 w-full rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-center text-xs text-sky-200">
          <p className="font-semibold text-sky-400 mb-0.5">Active Break Tip:</p>
          <p className="italic font-medium">{BREAK_GUIDANCE_TIPS[breakTipIndex]}</p>
        </div>
      )}

      {/* Timer Controls */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={handleReset}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]"
          title="Reset Timer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={handleTogglePlay}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#CFA052] to-[#C06C4C] text-white shadow-lg shadow-[#CFA052]/30 transition-transform hover:scale-105 active:scale-95"
        >
          {isRunning ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
        </button>

        <button
          onClick={handleManualCompleteLog}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[#6B8E6E] transition-all hover:bg-[#6B8E6E]/15"
          title="Log Completed Session & Rating"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      </div>

      {/* Auto-Start Break Switch */}
      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3.5 w-full justify-center text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          id="autoStartBreak"
          checked={autoStartBreak}
          onChange={(e) => setAutoStartBreak(e.target.checked)}
          className="rounded border-[var(--border-subtle)] text-[#CFA052] focus:ring-[#CFA052]"
        />
        <label htmlFor="autoStartBreak" className="font-medium cursor-pointer">
          Auto-start break when timer ends
        </label>
      </div>

      {/* Post-Session Energy & Quality Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Session Complete!
              </h4>
              <button
                onClick={() => handleConfirmEnergyRating('moderate')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-5">
              How was your focus quality during this {pendingSessionData?.mins}m session?
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleConfirmEnergyRating('high_flow')}
                className="w-full flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  High Flow State
                </span>
                <span className="text-[10px] font-normal text-emerald-400/80">Deep focus</span>
              </button>

              <button
                onClick={() => handleConfirmEnergyRating('moderate')}
                className="w-full flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-amber-400" />
                  Moderate Focus
                </span>
                <span className="text-[10px] font-normal text-amber-400/80">Normal pace</span>
              </button>

              <button
                onClick={() => handleConfirmEnergyRating('distracted')}
                className="w-full flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-rose-400" />
                  Distracted
                </span>
                <span className="text-[10px] font-normal text-rose-400/80">Frequent breaks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



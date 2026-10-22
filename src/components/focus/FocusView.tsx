import React, { useState, useRef, useEffect } from 'react';
import { Target, Clock, Minimize2, Sparkles, Zap, CheckCircle2, ChevronDown, Plus, Settings2, Check, Eye, EyeOff, History, Trash2 } from 'lucide-react';
import { Task, TimeBlockSlot, FocusSession } from '../../types';
import { PomodoroTimer } from './PomodoroTimer';
import { TimeBlockGrid } from './TimeBlockGrid';
import { useTimerState } from '../../context/TimerContext';
import { getLocalDateString } from '../../lib/streak';

interface FocusViewProps {
  tasks: Task[];
  onFocusComplete: (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => void;
  onUpdateTimeBlock: (taskId: string, slot: TimeBlockSlot) => void;
  activeSoundscape: string | null;
  setActiveSoundscape: (sound: string | null) => void;
  totalFocusMinutesToday?: number;
  focusSessions?: FocusSession[];
  onDeleteFocusSession?: (id: string) => void;
  onExitImmersive?: () => void;
}

const TARGET_PRESETS = [50, 75, 100, 120, 150];

export const FocusView: React.FC<FocusViewProps> = ({
  tasks,
  onFocusComplete,
  onUpdateTimeBlock,
  activeSoundscape,
  setActiveSoundscape,
  totalFocusMinutesToday = 75,
  focusSessions = [],
  onDeleteFocusSession,
  onExitImmersive,
}) => {
  const { selectedTask, setSelectedTask, toggleTimer, resetTimer } = useTimerState();
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isTargetPopoverOpen, setIsTargetPopoverOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taktic_focus_zen_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleZenMode = () => {
    setIsZenMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taktic_focus_zen_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };
  const [targetMinutes, setTargetMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('taktic_daily_focus_target');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 720) return parsed;
      }
    } catch {
      // ignore
    }
    return 100;
  });
  const [customTargetInput, setCustomTargetInput] = useState<string>('');

  const quickLogRef = useRef<HTMLDivElement>(null);
  const targetPopoverRef = useRef<HTMLDivElement>(null);

  const handleUpdateTarget = (minutes: number) => {
    const valid = Math.max(15, Math.min(720, minutes));
    setTargetMinutes(valid);
    try {
      localStorage.setItem('taktic_daily_focus_target', valid.toString());
    } catch {
      // ignore
    }
    setIsTargetPopoverOpen(false);
    setCustomTargetInput('');
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const todayStr = getLocalDateString();
  const todaySessions = (focusSessions || []).filter(
    (s) => s.completedAt && s.completedAt.startsWith(todayStr)
  );

  const progressPct = Math.min(100, Math.round((totalFocusMinutesToday / targetMinutes) * 100));
  const isGoalReached = totalFocusMinutesToday >= targetMinutes;

  // Circular ring geometry (radius 22, viewBox 52x52)
  const ringRadius = 20;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (progressPct / 100) * ringCircumference;

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickLogRef.current && !quickLogRef.current.contains(e.target as Node)) {
        setIsQuickLogOpen(false);
      }
      if (targetPopoverRef.current && !targetPopoverRef.current.contains(e.target as Node)) {
        setIsTargetPopoverOpen(false);
      }
    };
    if (isQuickLogOpen || isTargetPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuickLogOpen, isTargetPopoverOpen]);

  // Global Keyboard Shortcuts (Space = Play/Pause, R = Reset, Z = Zen Mode, Esc = Close popover / Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement | null)?.isContentEditable;

      // Escape handles closing dropdowns first, then exiting if callback is provided
      if (e.key === 'Escape') {
        if (isQuickLogOpen) {
          setIsQuickLogOpen(false);
          e.preventDefault();
          return;
        }
        if (isTargetPopoverOpen) {
          setIsTargetPopoverOpen(false);
          e.preventDefault();
          return;
        }
        if (isZenMode) {
          setIsZenMode(false);
          e.preventDefault();
          return;
        }
        if (onExitImmersive && !isInput) {
          onExitImmersive();
          e.preventDefault();
          return;
        }
      }

      // Do not intercept hotkeys if typing in input/textarea
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        resetTimer();
      } else if (e.key.toLowerCase() === 'z' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleZenMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuickLogOpen, isTargetPopoverOpen, isZenMode, onExitImmersive, toggleTimer, resetTimer]);

  return (
    <div className="space-y-3 sm:space-y-4 p-2.5 sm:p-6 pb-20 sm:pb-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Daily Focus Target Header Card - Warm Ochre Focus Theme */}
      <div className={`rounded-2xl border ${isGoalReached ? 'border-[#CFA052]/40 bg-gradient-to-r from-[var(--card-surface)] to-[#CFA052]/5 shadow-[#CFA052]/10' : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'} p-3 sm:p-5 shadow-xs transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          {/* Left: Progress Circle & Target Info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Circular Focus Ring Indicator */}
            <div className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 shrink-0">
              <svg className="h-10 w-10 sm:h-12 sm:w-12 -rotate-90 transform" viewBox="0 0 52 52">
                {/* Background Ring Track */}
                <circle
                  cx="26"
                  cy="26"
                  r={ringRadius}
                  className="stroke-[#CFA052]/15"
                  strokeWidth="4.5"
                  fill="transparent"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="26"
                  cy="26"
                  r={ringRadius}
                  stroke="url(#focusRingGradient)"
                  strokeWidth="4.5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="focusRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#CFA052" />
                    <stop offset="100%" stopColor="#E6B870" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center icon / percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isGoalReached ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#CFA052] dark:text-[#E0AF5E] animate-in zoom-in-75 duration-300" />
                ) : (
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#CFA052] dark:text-[#E0AF5E]" strokeWidth={1.75} aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] tracking-tight truncate">
                  Daily Deep Work Target
                </h2>
                {/* Target adjustment trigger button directly attached to the title */}
                <div className="relative" ref={targetPopoverRef}>
                  <button
                    type="button"
                    onClick={() => setIsTargetPopoverOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#CFA052]/40 transition cursor-pointer"
                    title="Change daily goal (minutes)"
                    aria-expanded={isTargetPopoverOpen}
                    aria-haspopup="true"
                  >
                    <Settings2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#CFA052]" />
                    <span>{targetMinutes}m goal</span>
                  </button>

                  {isTargetPopoverOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-60 sm:w-64 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-md p-3 shadow-xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-xs font-bold text-[var(--text-primary)] mb-1">
                        Daily Focus Target
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mb-2.5">
                        Select how many minutes of deep work you want to achieve today.
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                        {TARGET_PRESETS.map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleUpdateTarget(mins)}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                              targetMinutes === mins
                                ? 'bg-[#CFA052] text-white border-[#CFA052] shadow-2xs'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            {targetMinutes === mins && <Check className="h-3 w-3" />}
                            <span>{mins}m</span>
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = parseInt(customTargetInput, 10);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateTarget(val);
                          }
                        }}
                        className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]"
                      >
                        <input
                          type="number"
                          min={15}
                          max={720}
                          step={5}
                          placeholder="Custom mins"
                          value={customTargetInput}
                          onChange={(e) => setCustomTargetInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#CFA052] placeholder:text-[var(--text-muted)]"
                        />
                        <button
                          type="submit"
                          disabled={!customTargetInput}
                          className="px-3 py-1.5 text-xs rounded-xl bg-[#CFA052] text-white font-medium hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                        >
                          Set
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {isGoalReached ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CFA052]/15 border border-[#CFA052]/30 px-2 py-0.5 text-[10px] font-bold text-[#B88636] dark:text-[#E0AF5E] animate-pulse">
                    <CheckCircle2 className="h-3 w-3" />
                    Closed! 🎉
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                    {Math.max(0, targetMinutes - totalFocusMinutesToday)}m left
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5">
                {totalFocusMinutesToday} / {targetMinutes} Mins Focused ({progressPct}%)
              </p>
            </div>
          </div>

          {/* Clean, Unified Right Action Toolbar (Mobile: Full-width scrollable/compact row) */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-[var(--text-secondary)] flex-wrap sm:flex-nowrap justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]/50">
            {/* Unified Stats Pill: Logged minutes + Sessions clickable drawer */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={`flex items-center divide-x divide-[var(--border-subtle)] rounded-xl border transition cursor-pointer shadow-2xs active:scale-95 ${
                isHistoryOpen
                  ? 'border-[#CFA052] bg-[#CFA052]/15 text-[#CFA052] ring-1 ring-[#CFA052]/30'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#CFA052]/40'
              }`}
              title="Click to toggle today's session log"
              aria-expanded={isHistoryOpen}
            >
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#CFA052]" />
                <span className="font-semibold text-[var(--text-primary)] text-[11px] sm:text-xs">{totalFocusMinutesToday}m</span>
              </span>
              <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-[11px]">
                <History className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>{todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'}</span>
              </span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Quick Log Dropdown */}
              <div className="relative" ref={quickLogRef}>
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen((prev) => !prev)}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:border-[#CFA052]/40 transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Quick log past focus session"
                  aria-expanded={isQuickLogOpen}
                  aria-haspopup="true"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#CFA052]" />
                  <span>Log</span>
                  <ChevronDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--text-muted)] transition-transform duration-200 ${isQuickLogOpen ? 'rotate-180' : ''}`} />
                </button>

                {isQuickLogOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-56 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-md p-1.5 shadow-xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Log Focus Session
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onFocusComplete(25, selectedTask?.title || 'Pomodoro Sprint', 'high_flow');
                        setIsQuickLogOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#CFA052]" />
                        <span>+25m Pomodoro</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Sprint</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onFocusComplete(50, selectedTask?.title || 'Deep Work Block', 'high_flow');
                        setIsQuickLogOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-[#CFA052]" />
                        <span>+50m Deep Block</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Deep</span>
                    </button>

                    <div className="my-1 border-t border-[var(--border-subtle)]" />

                    <button
                      type="button"
                      onClick={() => {
                        const needed = Math.max(25, targetMinutes - totalFocusMinutesToday);
                        onFocusComplete(needed, selectedTask?.title || 'Daily Goal Target', 'high_flow');
                        setIsQuickLogOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-[#B88636] dark:text-[#E0AF5E] hover:bg-[#CFA052]/10 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-[#CFA052]" />
                        <span>{isGoalReached ? '+25m Extra Focus' : 'Fulfill Goal'}</span>
                      </span>
                      <span className="text-[10px] font-mono">+{Math.max(25, targetMinutes - totalFocusMinutesToday)}m</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Zen Mode Button */}
              <button
                type="button"
                onClick={toggleZenMode}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  isZenMode
                    ? 'bg-[#CFA052] text-white border-[#CFA052] shadow-xs'
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[#CFA052]/40'
                }`}
                title="Toggle Zen Mode (Press Z)"
                aria-pressed={isZenMode}
              >
                {isZenMode ? (
                  <>
                    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>Exit Zen</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#CFA052]" />
                    <span>Zen</span>
                  </>
                )}
              </button>

              {/* Exit Focus View Button */}
              {onExitImmersive && (
                <button
                  type="button"
                  onClick={onExitImmersive}
                  className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-[#CFA052] text-white hover:opacity-90 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CFA052]"
                  aria-label="Exit Immersive Focus Mode"
                >
                  <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} aria-hidden="true" />
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar Line - Warm Ochre Focus Theme */}
        <div
          className="h-2 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden"
          role="progressbar"
          aria-label="Daily focus progress"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${totalFocusMinutesToday} of ${targetMinutes} minutes focused (${progressPct}%)`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#CFA052] to-[#E6B870] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Keyboard shortcut legend hints (Desktop only - not applicable on mobile) */}
        <div className="mt-2.5 hidden sm:flex items-center justify-end gap-3 text-[11px] text-[var(--text-muted)] select-none flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-hover)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)]">Space</kbd>
            <span>Play/Pause</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-hover)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)]">R</kbd>
            <span>Reset</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-hover)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)]">Z</kbd>
            <span>Zen Mode</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-hover)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-secondary)]">Esc</kbd>
            <span>Exit</span>
          </span>
        </div>
      </div>

      {/* Today's Focus Session History Drawer */}
      {isHistoryOpen && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-[var(--accent-warm-ochre)]" />
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Today's Focus Log
              </h3>
              <span className="text-[10px] font-semibold bg-[var(--bg-main)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                {todaySessions.length} completed
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Close
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-[var(--text-muted)]">No focus sessions recorded yet today.</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Start the timer or use Quick Log to track your deep work.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] max-h-64 overflow-y-auto pr-1">
              {todaySessions.map((s) => {
                const formattedTime = s.completedAt
                  ? new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                const qualityBadge =
                  s.focusQuality === 'high_flow' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      High Flow
                    </span>
                  ) : s.focusQuality === 'distracted' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      Low Energy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
                      Standard
                    </span>
                  );

                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0 font-mono text-xs font-bold">
                        {s.durationMinutes}m
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {s.taskTitle || 'Deep Work Sprint'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                          <span>{formattedTime}</span>
                          {s.soundscape && <span>• {s.soundscape}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {qualityBadge}
                      {onDeleteFocusSession && (
                        <button
                          type="button"
                          onClick={() => onDeleteFocusSession(s.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Delete logged session"
                          aria-label={`Delete session ${s.taskTitle || 'Deep Work'}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Focus Content: Zen Mode (Single centered spotlight) vs Normal Grid */}
      {isZenMode ? (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full">
            <PomodoroTimer
              onFocusComplete={onFocusComplete}
              activeSoundscape={activeSoundscape}
              setActiveSoundscape={setActiveSoundscape}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Cockpit with Pomodoro Timer + Integrated Ambient Tray */}
          <div className="lg:col-span-5">
            <PomodoroTimer
              onFocusComplete={onFocusComplete}
              activeSoundscape={activeSoundscape}
              setActiveSoundscape={setActiveSoundscape}
            />
          </div>

          {/* Right Column (7 cols): Full-Height & Spacious Time-Block Schedule Grid */}
          <div className="lg:col-span-7">
            <TimeBlockGrid
              tasks={tasks}
              onSelectFocusTask={(t) => setSelectedTask(t)}
              onUpdateTimeBlock={onUpdateTimeBlock}
            />
          </div>
        </div>
      )}
    </div>
  );
};




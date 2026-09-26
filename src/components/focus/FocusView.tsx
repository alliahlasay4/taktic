import React, { useState, useRef, useEffect } from 'react';
import { Target, Clock, Award, Minimize2, Sparkles, Zap, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { Task, TimeBlockSlot } from '../../types';
import { PomodoroTimer } from './PomodoroTimer';
import { TimeBlockGrid } from './TimeBlockGrid';
import { AmbientSoundCard } from './AmbientSoundCard';

interface FocusViewProps {
  tasks: Task[];
  onFocusComplete: (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => void;
  onUpdateTimeBlock: (taskId: string, slot: TimeBlockSlot) => void;
  activeSoundscape: string | null;
  setActiveSoundscape: (sound: string | null) => void;
  totalFocusMinutesToday?: number;
  onExitImmersive?: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  tasks,
  onFocusComplete,
  onUpdateTimeBlock,
  activeSoundscape,
  setActiveSoundscape,
  totalFocusMinutesToday = 75,
  onExitImmersive,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const quickLogRef = useRef<HTMLDivElement>(null);

  const targetMinutes = 100;
  const progressPct = Math.min(100, Math.round((totalFocusMinutesToday / targetMinutes) * 100));
  const completedPomodoros = Math.floor(totalFocusMinutesToday / 25);
  const targetPomodoros = 4;
  const isGoalReached = totalFocusMinutesToday >= targetMinutes;

  // Handle clicking outside to close Quick Log dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickLogRef.current && !quickLogRef.current.contains(e.target as Node)) {
        setIsQuickLogOpen(false);
      }
    };
    if (isQuickLogOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuickLogOpen]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Daily Focus Target Header Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--accent-terracotta)] to-[var(--accent-warm-ochre)] text-white shadow-xs">
              <Target className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base text-[var(--text-primary)] tracking-tight">
                  Daily Deep Work Target
                </h2>
                {isGoalReached && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Focus Ring Closed! 🎉
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {totalFocusMinutesToday} / {targetMinutes} Mins Focused ({progressPct}%)
              </p>
            </div>
          </div>

          {/* Header Action Metrics & Controls */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 shadow-2xs">
              <Clock className="h-4 w-4 text-[var(--accent-warm-ochre)]" strokeWidth={1.5} aria-hidden="true" />
              <span>{totalFocusMinutesToday}m Logged</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 shadow-2xs">
              <Award className="h-4 w-4 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
              <span>{completedPomodoros} / {targetPomodoros} Sessions</span>
            </div>

            {/* Discreet Quick Log Session Dropdown */}
            <div className="relative" ref={quickLogRef}>
              <button
                type="button"
                onClick={() => setIsQuickLogOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:border-[var(--accent-warm-ochre)]/40 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Quick log past focus session"
                aria-expanded={isQuickLogOpen}
                aria-haspopup="true"
              >
                <Plus className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
                <span>Quick Log</span>
                <ChevronDown className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${isQuickLogOpen ? 'rotate-180' : ''}`} />
              </button>

              {isQuickLogOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-56 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-md p-1.5 shadow-xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
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
                      <Clock className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
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
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
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
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{isGoalReached ? '+25m Extra Focus' : 'Fulfill 100m Goal'}</span>
                    </span>
                    <span className="text-[10px] font-mono">+{Math.max(25, targetMinutes - totalFocusMinutesToday)}m</span>
                  </button>
                </div>
              )}
            </div>

            {onExitImmersive && (
              <button
                type="button"
                onClick={onExitImmersive}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-3.5 py-1.5 min-h-[38px] text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Exit Immersive Focus Mode"
              >
                <Minimize2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                <span>Exit Focus View</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Line */}
        <div
          className="h-2 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-warm-ochre)] to-[var(--accent-terracotta)] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Oversized Clean Pomodoro Timer Card */}
        <div className="lg:col-span-5">
          <PomodoroTimer
            selectedTask={selectedTask}
            onFocusComplete={onFocusComplete}
            activeSoundscape={activeSoundscape}
            setActiveSoundscape={setActiveSoundscape}
          />
        </div>

        {/* Right Column (7 cols): Today's Time-Block Schedule Grid + Horizontal Ambient Sound Card below */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <TimeBlockGrid
            tasks={tasks}
            onSelectFocusTask={(t) => setSelectedTask(t)}
            onUpdateTimeBlock={onUpdateTimeBlock}
          />

          <AmbientSoundCard
            activeSoundscape={activeSoundscape}
            setActiveSoundscape={setActiveSoundscape}
          />
        </div>
      </div>
    </div>
  );
};




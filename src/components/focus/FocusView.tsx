import React, { useState } from 'react';
import { Target, Clock, Award, Minimize2 } from 'lucide-react';
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

  const targetMinutes = 200;
  const progressPct = Math.min(100, Math.round((totalFocusMinutesToday / targetMinutes) * 100));
  const completedPomodoros = Math.floor(totalFocusMinutesToday / 25);
  const targetPomodoros = 8;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Daily Focus Target & Exit Button Header */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--accent-terracotta)] to-[var(--accent-warm-ochre)] text-white shadow-xs">
              <Target className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)] tracking-tight">
                Daily Deep Work Target
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {totalFocusMinutesToday} / {targetMinutes} Mins Focused ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-secondary)] flex-wrap">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 shadow-2xs">
              <Clock className="h-4 w-4 text-[var(--accent-warm-ochre)]" strokeWidth={1.5} aria-hidden="true" />
              <span>{totalFocusMinutesToday}m Logged</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5 shadow-2xs">
              <Award className="h-4 w-4 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
              <span>{completedPomodoros} / {targetPomodoros} Sessions</span>
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




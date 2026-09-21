import React, { useState } from 'react';
import { Target, Flame, Clock, Award } from 'lucide-react';
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
}

export const FocusView: React.FC<FocusViewProps> = ({
  tasks,
  onFocusComplete,
  onUpdateTimeBlock,
  activeSoundscape,
  setActiveSoundscape,
  totalFocusMinutesToday = 75,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const targetMinutes = 200;
  const progressPct = Math.min(100, Math.round((totalFocusMinutesToday / targetMinutes) * 100));
  const completedPomodoros = Math.floor(totalFocusMinutesToday / 25);
  const targetPomodoros = 8;

  return (
    <div className="space-y-6">
      {/* Daily Focus Target & Pomodoro Count Progress Header */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#CFA052] to-[#C06C4C] text-white shadow-xs">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Daily Deep Work Target
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {totalFocusMinutesToday} / {targetMinutes} Mins Focused ({progressPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5">
              <Clock className="h-4 w-4 text-[#CFA052]" />
              <span>{totalFocusMinutesToday}m Total</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-1.5">
              <Award className="h-4 w-4 text-[#C06C4C]" />
              <span>{completedPomodoros} / {targetPomodoros} Sessions</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="h-2.5 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#CFA052] to-[#C06C4C] transition-all duration-500"
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




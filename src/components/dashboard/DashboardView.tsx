import React from 'react';
import { Sparkles, ArrowRight, Flame, Clock, CheckCircle2, Users, Check } from 'lucide-react';
import { Task, Habit, ActiveTab, CircleMember } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TripleRings } from '../habits/TripleRings';
import { TaskItem } from '../inbox/TaskItem';
import { IconRenderer } from '../common/IconRenderer';
import { soundEngine } from '../../lib/audio';

interface DashboardViewProps {
  tasks: Task[];
  habits: Habit[];
  focusMinutes: number;
  userStreak: number;
  members: CircleMember[];
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleHabit: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSummary: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  habits,
  focusMinutes,
  userStreak,
  members,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onToggleHabit,
  setActiveTab,
  onOpenSummary,
}) => {
  const { profile } = useAuth();
  const firstName = profile?.fullName?.trim()?.split(/\s+/)[0] || 'there';
  const today = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter((t) => !t.archived);
  const focusTasks = activeTasks.filter((t) => t.isTodayFocus);
  const tasksCompletedToday = activeTasks.filter((t) => t.completed && t.completedAt?.startsWith(today)).length;
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(today)).length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] p-4 sm:p-6 md:p-8 text-white shadow-lg shadow-[#C06C4C]/15">
        <div className="relative z-10 max-w-xl space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Tactical Focus & Social Rhythm</span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            You're on a <strong className="underline decoration-white/40">{userStreak}-day streak</strong>! Keep your momentum steady by executing your 3 focus priorities today.
          </p>
        </div>
      </div>

      {/* Triple Progress Rings */}
      <TripleRings
        tasksCompleted={tasksCompletedToday}
        totalTasks={Math.max(1, focusTasks.length)}
        habitsCompleted={habitsCompletedToday}
        totalHabits={habits.length}
        focusMinutes={focusMinutes}
        targetFocusMinutes={100}
      />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Focus Queue Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#CFA052]" />
                <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                  Today's Priority Focus Queue
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inbox')}
                className="flex items-center gap-1 text-xs font-semibold text-[#C06C4C] hover:underline"
              >
                Manage Inbox <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {focusTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No focus tasks starred for today. Visit the Master Inbox to pick 3–5 items!
              </div>
            ) : (
              <div className="space-y-2.5">
                {focusTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onToggleTodayFocus={onToggleTodayFocus}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Habit Rhythm & Social Room Snippet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Habits List */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Habit Rhythm Checklist
              </h3>
              <button
                onClick={() => setActiveTab('habits')}
                className="text-xs font-semibold text-[#C87D87] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {habits.slice(0, 3).map((habit) => {
                const isDone = habit.completedDates.includes(today);
                const handleToggle = () => {
                  if (!isDone) {
                    soundEngine.playCheckoffSound();
                  }
                  onToggleHabit(habit.id);
                };

                return (
                  <div
                    key={habit.id}
                    onClick={handleToggle}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer transition-all ${
                      isDone
                        ? 'border-[var(--border-subtle)] bg-[var(--card-hover)]/40 opacity-75'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-[#C87D87]/60 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle();
                        }}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs transition-all cursor-pointer ${
                          isDone
                            ? 'bg-[#C87D87]/20 border-[#C87D87] text-[#C87D87]'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-muted)] hover:border-[#C87D87]'
                        }`}
                        aria-label={isDone ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5 text-[#C87D87] stroke-[3]" /> : null}
                      </button>
                      <IconRenderer name={habit.icon} className={`h-4 w-4 shrink-0 ${isDone ? 'text-[var(--text-muted)]' : 'text-[#C87D87]'}`} strokeWidth={1.5} />
                      <span className={`font-medium truncate ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                        {habit.title}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-[#C06C4C] text-[11px] shrink-0 ml-2">
                      <Flame className="h-3 w-3 fill-[#C06C4C]" strokeWidth={1.5} aria-hidden="true" />
                      {habit.streak}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Circles Live Snippet */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#B08B9E]" />
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Co-Working Circle
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('circles')}
                className="text-xs font-semibold text-[#B08B9E] hover:underline"
              >
                Join Room
              </button>
            </div>

            {members.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {members.map((m) => (
                  <div key={m.id} className="relative group shrink-0" title={`${m.name}: ${m.statusText}`}>
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="h-9 w-9 rounded-xl object-cover ring-2 ring-emerald-500/50"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-[var(--card-surface)]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-3 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">
                  No partners in your circle yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('circles')}
                  className="mt-1.5 text-xs font-semibold text-[var(--accent-terracotta)] hover:underline"
                >
                  Invite Friends & Co-Work &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

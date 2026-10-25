import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Flame,
  CheckCircle2,
  Circle,
  Sparkles,
  Timer,
  Users2,
  CalendarDays,
  Target,
  Plus,
} from 'lucide-react';
import { Task, Habit, ActiveTab, CircleMember } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TripleRings } from '../habits/TripleRings';
import { IconRenderer } from '../common/IconRenderer';
import { soundEngine } from '../../lib/audio';
import { getLocalDateString } from '../../lib/streak';
import { QuickTaskPayload, parseQuickTaskInput, SLASH_COMMANDS, SlashCommand } from '../layout/Sidebar';

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
  onOpenSummary?: () => void;
  onQuickAddTask?: (taskData: QuickTaskPayload) => void;
}

const DashboardViewComponent: React.FC<DashboardViewProps> = ({
  tasks,
  habits,
  focusMinutes,
  userStreak,
  members,
  onToggleComplete,
  onToggleHabit,
  setActiveTab,
  onQuickAddTask,
}) => {
  const { profile } = useAuth();
  const firstName = profile?.fullName?.trim()?.split(/\s+/)[0] || 'there';
  const today = getLocalDateString();

  // Quick Task Capture State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const slashIndex = quickTaskTitle.lastIndexOf('/');
  const isSlashActive = isSlashMenuOpen && slashIndex !== -1;
  const slashQuery = slashIndex !== -1 ? quickTaskTitle.slice(slashIndex + 1).toLowerCase() : '';

  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.token.slice(1).toLowerCase().startsWith(slashQuery) ||
      cmd.label.toLowerCase().includes(slashQuery) ||
      cmd.category.toLowerCase().includes(slashQuery)
  );

  const applySlashCommand = (cmd: SlashCommand) => {
    if (slashIndex === -1) return;
    const before = quickTaskTitle.slice(0, slashIndex);
    const nextValue = `${before}${cmd.token} `;
    setQuickTaskTitle(nextValue);
    setIsSlashMenuOpen(false);
    setSelectedSlashIndex(0);
    if (quickInputRef.current) {
      quickInputRef.current.focus();
    }
  };

  const handleQuickTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSlashActive && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Tab') {
        if (filteredCommands[selectedSlashIndex]) {
          e.preventDefault();
          applySlashCommand(filteredCommands[selectedSlashIndex]);
          return;
        }
      }
      if (e.key === 'Enter') {
        if (slashQuery.length > 0 && filteredCommands[selectedSlashIndex]) {
          const exactTokenTyped = filteredCommands.some((c) => c.token === `/${slashQuery}`);
          if (!exactTokenTyped) {
            e.preventDefault();
            applySlashCommand(filteredCommands[selectedSlashIndex]);
            return;
          }
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSlashMenuOpen(false);
        return;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickTaskTitle(val);
    const lastSlash = val.lastIndexOf('/');
    if (lastSlash !== -1 && (lastSlash === 0 || val[lastSlash - 1] === ' ')) {
      setIsSlashMenuOpen(true);
      setSelectedSlashIndex(0);
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  // Active unarchived focus tasks (Top 3 for zen view)
  const activeTasks = tasks.filter((t) => !t.archived);
  const focusTasks = activeTasks.filter((t) => t.isTodayFocus);
  const topFocusTasks = focusTasks.slice(0, 3);

  // Metrics
  const tasksCompletedToday = tasks.filter((t) => t.completed && t.completedAt?.startsWith(today)).length;
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const onlineMembers = members.filter((m) => !m.isIncognito && m.statusText !== 'Offline');

  const handleTaskCheck = (taskId: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      soundEngine.playCheckoffSound();
    }
    onToggleComplete(taskId);
  };

  const handleHabitCheck = (habitId: string, currentlyDone: boolean) => {
    if (!currentlyDone) {
      soundEngine.playCheckoffSound();
    }
    onToggleHabit(habitId);
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden transition-all duration-300">
      {/* 1. Welcome Banner (Preserved exact design) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] p-5 sm:p-7 md:p-8 text-white shadow-lg shadow-[#C06C4C]/15">
        <div className="relative z-10 max-w-xl space-y-1.5 sm:space-y-2">
          <h1 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
            {userStreak > 0 ? (
              <>
                You're on a <strong className="underline decoration-white/40">{userStreak}-day streak</strong>! Keep your momentum steady by executing your daily priorities.
              </>
            ) : (
              <>
                Build your momentum today! Complete a habit, task, or focus sprint to start your daily streak.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 2. Triple Progress Rings (Preserved exact tracker) */}
      <TripleRings
        tasksCompleted={tasksCompletedToday}
        totalTasks={Math.max(1, focusTasks.length)}
        habitsCompleted={habitsCompletedToday}
        totalHabits={habits.length}
        focusMinutes={focusMinutes}
        targetFocusMinutes={100}
      />

      {/* 3. Zen Command Hub Grid: Clean 2-Row Split with perfectly aligned baselines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* Row 1 - Left: Today's 3 Must-Dos (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-200 h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]/60 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text-primary)] leading-tight">
                      Today's 3 Must-Dos
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                      High-leverage focus items for today
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-terracotta)] hover:opacity-85 transition-opacity cursor-pointer group"
                >
                  <span>Inbox</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Content List */}
              {topFocusTasks.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-[var(--bg-main)]/60 border border-dashed border-[var(--border-subtle)]">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] mb-2.5">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    Your slate is clear
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-3.5 leading-relaxed">
                    Select up to 3 focus priorities in your Inbox to anchor your day with clear intention.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('inbox')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                  >
                    Pick Today's Focus
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {topFocusTasks.map((task, idx) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`group flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                          task.completed
                            ? 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 opacity-70'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:border-[var(--accent-terracotta)]/40 hover:shadow-2xs'
                        }`}
                      >
                        {/* Priority Number Pill */}
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--border-subtle)]/70 text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">
                          {idx + 1}
                        </span>

                        {/* Custom Large Interactive Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleTaskCheck(task.id, task.completed)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                            task.completed
                              ? 'bg-[#6B8E6E] border-[#6B8E6E] text-white'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-transparent hover:border-[#6B8E6E] group-hover:scale-105'
                          }`}
                          aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                          ) : (
                            <Circle className="h-3 w-3 stroke-[2] opacity-0 group-hover:opacity-40 text-[#6B8E6E]" />
                          )}
                        </button>

                        {/* Task Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium leading-snug transition-all ${
                              task.completed
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-muted)]">
                              <CalendarDays className="h-3 w-3" />
                              <span>Due {task.dueDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Priority Indicator */}
                        {task.priority === 'high' && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            High
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {focusTasks.length > 3 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] font-medium transition-colors"
                >
                  + {focusTasks.length - 3} more queued in Focus list
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 1 - Right: Daily Rhythm (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]/60 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C87D87]/15 text-[#C87D87]">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                      Daily Rhythm
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium">
                      Habit consistency & streaks
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('habits')}
                  className="flex items-center gap-1 text-xs font-semibold text-[#C87D87] hover:underline cursor-pointer"
                >
                  <span>All Habits</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {habits.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No active habits configured.
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 3).map((habit) => {
                    const isDone = habit.completedDates.includes(today);

                    return (
                      <div
                        key={habit.id}
                        onClick={() => handleHabitCheck(habit.id, isDone)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 sm:p-3 text-xs cursor-pointer transition-all ${
                          isDone
                            ? 'border-[var(--border-subtle)] bg-[var(--card-hover)]/30 opacity-75'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-[#C87D87]/50 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs transition-all ${
                              isDone
                                ? 'bg-[#C87D87]/20 border-[#C87D87] text-[#C87D87]'
                                : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-muted)]'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#C87D87] stroke-[2.5]" />
                            ) : (
                              <Circle className="h-3 w-3 stroke-[2] opacity-30" />
                            )}
                          </div>
                          <IconRenderer
                            name={habit.icon}
                            className={`h-4 w-4 shrink-0 ${isDone ? 'text-[var(--text-muted)]' : 'text-[#C87D87]'}`}
                            strokeWidth={1.5}
                          />
                          <span
                            className={`font-medium truncate ${
                              isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {habit.title}
                          </span>
                        </div>

                        <span className="flex items-center gap-1 font-semibold text-[#C06C4C] text-[11px] shrink-0 ml-2">
                          <Flame className="h-3 w-3 fill-[#C06C4C]" strokeWidth={1.5} />
                          {habit.streak}d
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {habits.length > 3 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('habits')}
                  className="text-xs text-[var(--text-muted)] hover:text-[#C87D87] font-medium transition-colors cursor-pointer"
                >
                  + {habits.length - 3} more habits in rhythm
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 - Left: Quick Task Capture (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Quick Task Capture Widget (with interactive slash commands) */}
          <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-[var(--text-primary)]">
                    Quick Task Capture
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                    Type <code className="font-mono text-[var(--accent-terracotta)] font-semibold">/</code> for tags, dates & priorities
                  </p>
                </div>
              </div>

              {/* Quick helper hint chips */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">/today</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">/urgent</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">/25m</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim() && onQuickAddTask) {
                  const parsed = parseQuickTaskInput(quickTaskTitle.trim());
                  onQuickAddTask(parsed);
                  setQuickTaskTitle('');
                  setIsSlashMenuOpen(false);
                }
              }}
              className="relative"
            >
              {/* Slash Command Dropdown Popover */}
              {isSlashActive && filteredCommands.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSlashMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-64 sm:w-72 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)]/60 mb-1">
                      Quick Slash Commands
                    </div>
                    <div className="space-y-0.5">
                      {filteredCommands.map((cmd, idx) => {
                        const Icon = cmd.icon;
                        const isSelected = idx === selectedSlashIndex;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            title={cmd.description}
                            onClick={() => applySlashCommand(cmd)}
                            onMouseEnter={() => setSelectedSlashIndex(idx)}
                            className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs text-left transition cursor-pointer group ${
                              isSelected
                                ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-xs'
                                : 'text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface-sunken)] shrink-0 ${cmd.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-xs text-[var(--accent-terracotta)] tracking-tight mr-1.5">
                                  {cmd.token}
                                </span>
                                <span className="text-[11px] text-[var(--text-muted)] truncate">
                                  {cmd.label}
                                </span>
                              </div>
                            </div>

                            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] shrink-0 bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
                              {cmd.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  ref={quickInputRef}
                  id="dashboard-quick-task-input"
                  name="quickTaskTitle"
                  type="text"
                  value={quickTaskTitle}
                  onChange={handleInputChange}
                  onKeyDown={handleQuickTaskKeyDown}
                  onFocus={() => {
                    if (quickTaskTitle.includes('/')) {
                      setIsSlashMenuOpen(true);
                    }
                  }}
                  placeholder="e.g. Finalize proposal /today /urgent /25m"
                  aria-label="Dashboard quick capture task input"
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-all min-h-[38px]"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  className="flex h-[38px] px-3.5 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-xs cursor-pointer text-xs font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="Add Task"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  <span className="hidden sm:inline">Capture</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Row 2 - Right: Quick Launchpad (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Quick Launchpad
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-[var(--accent-warm-ochre)]/60 hover:bg-[var(--card-hover)] text-left transition-all group cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] group-hover:scale-105 transition-transform">
                  <Timer className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Focus Timer</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Start deep session</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('partners')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-[#B08B9E]/60 hover:bg-[var(--card-hover)] text-left transition-all group cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#B08B9E]/15 text-[#B08B9E] group-hover:scale-105 transition-transform">
                  <Users2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Co-Working</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {onlineMembers.length > 0 ? `${onlineMembers.length} active` : 'Circle partners'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const DashboardView = React.memo(DashboardViewComponent);

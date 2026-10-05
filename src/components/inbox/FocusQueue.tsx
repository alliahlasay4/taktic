import React from 'react';
import { Star, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';
import { TaskItem } from './TaskItem';

interface FocusQueueProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onOpenNewTaskModal: () => void;
}

export const FocusQueue: React.FC<FocusQueueProps> = ({
  tasks,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onEditTask,
  onOpenNewTaskModal,
}) => {
  // Only consider active, unarchived, non-someday focus tasks
  const focusTasks = tasks.filter((t) => !t.archived && !t.isSomeday && t.isTodayFocus);
  const activeFocusTasks = focusTasks.filter((t) => !t.completed);
  const completedFocusTasks = focusTasks.filter((t) => t.completed);

  const isOverlimit = activeFocusTasks.length > 5;
  const isOptimal = activeFocusTasks.length >= 3 && activeFocusTasks.length <= 5;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30">
            <Star className="h-4 w-4 fill-[var(--accent-warm-ochre)] text-[var(--accent-warm-ochre)]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Today's Focus Queue
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Select 3–5 high priority tasks to prevent burnout.
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          {completedFocusTasks.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 px-2.5 py-1 text-xs font-bold text-[#4D6C4F] dark:text-[#7B9E7E] border border-[var(--accent-botanical-sage)]/30">
              <CheckCircle2 className="h-3 w-3" />
              <span>{completedFocusTasks.length} Done</span>
            </div>
          )}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
              isOverlimit
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : isOptimal
                ? 'bg-[var(--accent-botanical-sage)]/15 text-[#4D6C4F] dark:text-[#7B9E7E] border border-[var(--accent-botanical-sage)]/30'
                : 'bg-[var(--card-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
            }`}
          >
            <span>{activeFocusTasks.length} / 5 Active Focus</span>
          </div>
        </div>
      </div>

      {/* Constraint Warning Banner */}
      {isOverlimit && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Overload Warning:</strong> You have {activeFocusTasks.length} active focus tasks queued. Research shows focusing on 3–5 items maximizes output and clarity.
          </span>
        </div>
      )}

      {/* Focus Tasks List */}
      {focusTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center bg-[var(--bg-main)]/50">
          <Star className="h-8 w-8 text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            No focus tasks queued for today
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
            Star 3–5 tasks from your backlog below or create a new priority task.
          </p>
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent-terracotta)] hover:opacity-90 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Priority Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Focus Tasks */}
          {activeFocusTasks.length > 0 && (
            <div className="space-y-2">
              {activeFocusTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onToggleTodayFocus={onToggleTodayFocus}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                />
              ))}
            </div>
          )}

          {/* Completed Focus Tasks in subtle section */}
          {completedFocusTasks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Completed Focus ({completedFocusTasks.length})
              </div>
              <div className="space-y-2 opacity-75">
                {completedFocusTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onToggleTodayFocus={onToggleTodayFocus}
                    onDeleteTask={onDeleteTask}
                    onEditTask={onEditTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

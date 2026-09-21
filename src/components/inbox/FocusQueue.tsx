import React from 'react';
import { Star, AlertCircle, Plus, CheckCircle } from 'lucide-react';
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
  const focusTasks = tasks.filter((t) => t.isTodayFocus);
  const isOverlimit = focusTasks.length > 5;
  const isOptimal = focusTasks.length >= 3 && focusTasks.length <= 5;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CFA052]/20 text-[#CFA052]">
            <Star className="h-4 w-4 fill-[#CFA052]" />
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
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isOverlimit
              ? 'bg-rose-500/20 text-rose-500'
              : isOptimal
              ? 'bg-[#6B8E6E]/20 text-[#6B8E6E]'
              : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
          }`}
        >
          <span>{focusTasks.length} / 5 Max</span>
        </div>
      </div>

      {/* Constraint Warning Banner */}
      {isOverlimit && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Overload Warning:</strong> You have selected {focusTasks.length} focus tasks. Research shows focusing on 3–5 items maximizes output and clarity.
          </span>
        </div>
      )}

      {/* Focus Tasks List */}
      {focusTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
          <Star className="h-8 w-8 text-[var(--text-muted)] mb-2" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No focus tasks queued for today
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
            Star 3–5 tasks from your backlog below or create a new priority task.
          </p>
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#C87D87] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#C06C4C]/20 transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Priority Task
          </button>
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
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};


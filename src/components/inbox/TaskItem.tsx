import React from 'react';
import { Check, Star, Trash2, Clock, Tag, AlertCircle, Pencil } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';
import { soundEngine } from '../../lib/audio';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onUpdateTimeBlock?: (id: string, timeBlock: TimeBlockSlot) => void;
}

const priorityColors: Record<PriorityLevel, string> = {
  high: 'bg-[#C06C4C]/15 text-[#C06C4C] border-[#C06C4C]/30',
  medium: 'bg-[#CFA052]/15 text-[#CFA052] border-[#CFA052]/30',
  low: 'bg-[#6B8E6E]/15 text-[#6B8E6E] border-[#6B8E6E]/30',
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onEditTask,
  onUpdateTimeBlock,
}) => {
  const handleCheck = () => {
    if (!task.completed) {
      soundEngine.playCheckoffSound();
    }
    onToggleComplete(task.id);
  };

  return (
    <div
      className={`group flex items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 transition-all hover:border-[var(--text-muted)] ${
        task.completed ? 'opacity-60 bg-[var(--card-hover)]/40' : ''
      }`}
    >
      {/* Checkbox & Details */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={handleCheck}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
            task.completed
              ? 'border-[#6B8E6E] bg-[#6B8E6E] text-white shadow-xs'
              : 'border-[var(--text-muted)] hover:border-[#6B8E6E] hover:bg-[#6B8E6E]/10'
          }`}
        >
          {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium text-sm text-[var(--text-primary)] ${
                task.completed ? 'line-through text-[var(--text-muted)]' : ''
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <span
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Tags & Time estimation */}
          <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-[var(--text-muted)]">
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                <Clock className="h-3 w-3" />
                {task.estimatedMinutes}m
              </span>
            )}

            {task.timeBlock && (
              <span className="rounded-md bg-[var(--card-hover)] px-2 py-0.5 font-medium capitalize text-[var(--text-secondary)]">
                {task.timeBlock} Block
              </span>
            )}

            {task.recurring && (
              <span className="flex items-center gap-1 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-semibold capitalize">
                🔄 {task.recurring}
              </span>
            )}

            {task.isSomeday && (
              <span className="rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-semibold">
                💡 Someday
              </span>
            )}

            {task.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 rounded-md bg-[var(--border-subtle)]/50 px-1.5 py-0.5 text-[10px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Edit Task Button */}
        {onEditTask && (
          <button
            onClick={() => onEditTask(task)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[#C06C4C]/15 hover:text-[#C06C4C] transition-all"
            title="Edit task details"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}

        {/* Star for Today's Focus Queue */}
        <button
          onClick={() => onToggleTodayFocus(task.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            task.isTodayFocus
              ? 'bg-[#CFA052]/20 text-[#CFA052]'
              : 'text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[#CFA052]'
          }`}
          title={task.isTodayFocus ? 'Remove from Today Focus Queue' : 'Star for Today Focus Queue'}
        >
          <Star className={`h-4 w-4 ${task.isTodayFocus ? 'fill-[#CFA052]' : ''}`} />
        </button>

        {/* Delete Task */}
        <button
          onClick={() => onDeleteTask(task.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/15 hover:text-rose-500"
          title="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


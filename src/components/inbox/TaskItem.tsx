import React from 'react';
import { Check, Star, Trash2, Clock, Pencil, Repeat, Tag as TagIcon, Sunrise, Sun, Moon, Lightbulb, Archive } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';
import { soundEngine } from '../../lib/audio';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onUpdateTimeBlock?: (id: string, timeBlock: TimeBlockSlot) => void;
}

const priorityConfig: Record<PriorityLevel, { label: string; dot: string; bg: string }> = {
  high: {
    label: 'High',
    dot: 'bg-rose-500',
    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onArchiveTask,
  onEditTask,
}) => {
  const handleCheck = () => {
    if (!task.completed) {
      soundEngine.playCheckoffSound();
    }
    onToggleComplete(task.id);
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 sm:p-3.5 transition-all duration-200 hover:border-[var(--accent-terracotta)]/40 hover:shadow-xs ${
        task.completed ? 'opacity-55 bg-[var(--card-hover)]/30' : ''
      }`}
    >
      {/* Header Row: Checkbox, Title & Priority, Action Controls */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            onClick={handleCheck}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
              task.completed
                ? 'border-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)] text-white shadow-xs'
                : 'border-[var(--text-muted)]/60 hover:border-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10'
            }`}
            title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>

          <div className="flex items-center gap-1.5 flex-wrap min-w-0 pt-0.5">
            <span
              className={`font-medium text-xs text-[var(--text-primary)] leading-snug break-words ${
                task.completed ? 'line-through text-[var(--text-muted)]' : ''
              }`}
            >
              {task.title}
            </span>

            {/* Priority Indicator Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${priority.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
          {/* Edit Button */}
          {onEditTask && (
            <button
              onClick={() => onEditTask(task)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent-terracotta)]/15 hover:text-[var(--accent-terracotta)] transition-all cursor-pointer"
              title="Edit task details"
              aria-label="Edit task details"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Star Button for Today's Focus Queue */}
          <button
            onClick={() => onToggleTodayFocus(task.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              task.isTodayFocus
                ? 'bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--accent-warm-ochre)]'
            }`}
            title={task.isTodayFocus ? 'Remove from Today Focus Queue' : 'Star for Today Focus Queue'}
            aria-label={task.isTodayFocus ? 'Remove from Today Focus Queue' : 'Star for Today Focus Queue'}
          >
            <Star className={`h-3.5 w-3.5 ${task.isTodayFocus ? 'fill-[var(--accent-warm-ochre)] text-[var(--accent-warm-ochre)]' : ''}`} />
          </button>

          {/* Archive Button (prominent if completed, hoverable if active) */}
          {onArchiveTask && (
            <button
              onClick={() => onArchiveTask(task.id)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--accent-terracotta)]/15 hover:text-[var(--accent-terracotta)] cursor-pointer ${
                task.completed ? 'opacity-100' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
              title="Archive task to History"
              aria-label="Archive task to History"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDeleteTask(task.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description spanning full width (aligned with text offset) */}
      {task.description && (
        <p className="pl-7.5 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta Details & Tag Chips - Full width horizontal row across the card */}
      {(task.estimatedMinutes || task.timeBlock || task.recurring || task.isSomeday || (task.tags && task.tags.length > 0)) && (
        <div className="pl-7.5 flex flex-row flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)] w-full">
          {task.estimatedMinutes && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] shrink-0">
              <Clock className="h-3 w-3 text-[var(--accent-terracotta)]" />
              {task.estimatedMinutes}m
            </span>
          )}

          {task.timeBlock && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-secondary)] shrink-0">
              {task.timeBlock === 'morning' ? (
                <Sunrise className="h-3 w-3 text-amber-500" strokeWidth={1.5} aria-hidden="true" />
              ) : task.timeBlock === 'afternoon' ? (
                <Sun className="h-3 w-3 text-amber-600" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Moon className="h-3 w-3 text-indigo-400" strokeWidth={1.5} aria-hidden="true" />
              )}{' '}
              {task.timeBlock}
            </span>
          )}

          {task.recurring && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-botanical-sage)]/10 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/25 px-2 py-0.5 text-[10px] font-semibold capitalize shrink-0">
              <Repeat className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              {task.recurring}
            </span>
          )}

          {task.isSomeday && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-dusty-mauve)]/15 text-[var(--accent-dusty-mauve)] border border-[var(--accent-dusty-mauve)]/30 px-2 py-0.5 text-[10px] font-semibold shrink-0">
              <Lightbulb className="h-3 w-3 text-[var(--accent-dusty-mauve)]" strokeWidth={1.5} aria-hidden="true" />
              Someday
            </span>
          )}

          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 text-[10px] font-medium shrink-0"
            >
              <TagIcon className="h-2.5 w-2.5 opacity-60" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


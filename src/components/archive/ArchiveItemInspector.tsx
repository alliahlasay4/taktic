import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Tag,
  Flame,
  Trophy,
  Target,
  Shield,
  Square,
  CheckSquare,
} from 'lucide-react';
import { Task, QuickNote, Habit } from '../../types';
import { COLOR_THEMES } from './ArchiveShared';
import { IconRenderer } from '../common/IconRenderer';

interface ArchiveItemInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'task' | 'note' | 'habit' | null;
  task: Task | null;
  note: QuickNote | null;
  habit: Habit | null;
  onUnarchiveTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onUnarchiveNote?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onUnarchiveHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => void;
}

export const ArchiveItemInspector: React.FC<ArchiveItemInspectorProps> = ({
  isOpen,
  onClose,
  itemType,
  task,
  note,
  habit,
  onUnarchiveTask,
  onDeleteTask,
  onUnarchiveNote,
  onDeleteNote,
  onUnarchiveHabit,
  onDeleteHabit,
}) => {
  const [copiedNote, setCopiedNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !itemType) return null;

  const handleCopyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Task View Header */}
            {itemType === 'task' && task && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
                    Archived Task
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                  {task.title}
                </h2>
              </div>
            )}

            {/* Note View Header */}
            {itemType === 'note' && note && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                      COLOR_THEMES[note.color]?.badge || 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {COLOR_THEMES[note.color]?.label || 'Note'}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Archived Scratchpad Note</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                  {note.title || 'Untitled Scratchpad Note'}
                </h2>
              </div>
            )}

            {/* Habit View Header */}
            {itemType === 'habit' && habit && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                  <IconRenderer name={habit.icon || habit.category} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                    {habit.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)]">
                      {habit.category}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {habit.frequency === 'daily' ? 'Daily Routine' : 'Weekly Routine'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= TASK BODY ================= */}
        {itemType === 'task' && task && (
          <div className="space-y-4">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                  Archived Date
                </span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {task.archivedAt ? new Date(task.archivedAt).toLocaleDateString() : 'Historical'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                  Estimated Time
                </span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {task.estimatedMinutes ? `${task.estimatedMinutes} mins` : '25 mins'}
                </span>
              </div>
              {task.dueDate && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                    Original Due Date
                  </span>
                  <span className="font-medium text-[var(--text-secondary)]">{task.dueDate}</span>
                </div>
              )}
              {task.timeBlock && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                    Time Block Slot
                  </span>
                  <span className="font-medium text-[var(--text-secondary)] capitalize">
                    {task.timeBlock}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description ? (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Description
                </span>
                <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </div>
              </div>
            ) : null}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 text-xs font-medium rounded-lg bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= NOTE BODY ================= */}
        {itemType === 'note' && note && (
          <div className="space-y-4">
            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
              <span>
                Archived: {note.archivedAt ? new Date(note.archivedAt).toLocaleDateString() : 'Recently'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyNote(`${note.title ? note.title + '\n' : ''}${note.content}`)}
                className="flex items-center gap-1 text-[var(--accent-botanical-sage)] hover:underline cursor-pointer font-medium"
              >
                {copiedNote ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Content with markdown checkbox support */}
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-1 whitespace-pre-wrap">
              {note.content.split('\n').map((line, idx) => {
                const isUnchecked = line.startsWith('- [ ]');
                const isChecked = line.startsWith('- [x]') || line.startsWith('- [X]');
                if (isUnchecked || isChecked) {
                  const text = line.replace(/^- \[[ xX]\]\s*/, '');
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        )}
                      </span>
                      <span className={isChecked ? 'line-through text-[var(--text-muted)]' : ''}>
                        {text}
                      </span>
                    </div>
                  );
                }
                return <div key={idx}>{line || '\u00A0'}</div>;
              })}
            </div>
          </div>
        )}

        {/* ================= HABIT BODY ================= */}
        {itemType === 'habit' && habit && (
          <div className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1 text-[var(--text-muted)] mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  <span>Streak</span>
                </div>
                <div className="text-sm font-bold text-[var(--accent-terracotta)]">
                  {habit.streak} Days
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1 text-[var(--text-muted)] mb-0.5">
                  <Trophy className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
                  <span>Total Check-ins</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {habit.completedDates.length}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1 text-[var(--text-muted)] mb-0.5">
                  <Target className="w-3.5 h-3.5 text-sky-500" />
                  <span>Target</span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {habit.targetDaysPerWeek || 7} / Week
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1 text-[var(--text-muted)] mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Freeze Shields</span>
                </div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {habit.freezeShieldsRemaining ?? 3}/3 Preserved
                </div>
              </div>
            </div>

            {/* Completion History */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Recent History</span>
                <span className="text-[10px] font-normal">{habit.completedDates.length} logged</span>
              </span>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5 max-h-36 overflow-y-auto space-y-1 text-xs">
                {habit.completedDates.length > 0 ? (
                  [...habit.completedDates]
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .slice(0, 5)
                    .map((dateStr) => (
                      <div
                        key={dateStr}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[11px]"
                      >
                        <span className="text-[var(--text-secondary)]">
                          {new Date(dateStr).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Logged</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-2 text-[var(--text-muted)]">No past check-ins</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions: Restore / Delete */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* Restore Button */}
          <button
            type="button"
            onClick={() => {
              if (itemType === 'task' && task) onUnarchiveTask?.(task.id);
              if (itemType === 'note' && note) onUnarchiveNote?.(note.id);
              if (itemType === 'habit' && habit) onUnarchiveHabit?.(habit.id);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore to Active</span>
          </button>

          {/* Delete Action */}
          {confirmDelete ? (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Permanently delete? This cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (itemType === 'task' && task) onDeleteTask?.(task.id);
                    if (itemType === 'note' && note) onDeleteNote?.(note.id);
                    if (itemType === 'habit' && habit) onDeleteHabit?.(habit.id);
                    setConfirmDelete(false);
                    onClose();
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-[var(--card-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Permanently</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

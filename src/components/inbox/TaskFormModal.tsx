import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Tag as TagIcon, Trash2, CheckCircle2, Sparkles, AlertCircle, Repeat, Sun, Sunset, Moon } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';

interface TaskFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  task?: Task | null;
  defaultDate?: string | null;
  defaultIsSomeday?: boolean;
  availableTags?: string[];
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    priority: PriorityLevel;
    tags: string[];
    dueDate?: string;
    timeBlock: TimeBlockSlot;
    estimatedMinutes: number;
    isTodayFocus: boolean;
    isSomeday: boolean;
    recurring: 'daily' | 'weekly' | 'monthly' | null;
  }) => void;
  onDelete?: (id: string) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  mode,
  task,
  defaultDate,
  defaultIsSomeday = false,
  availableTags = [],
  onClose,
  onSave,
  onDelete,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [timeBlock, setTimeBlock] = useState<TimeBlockSlot>('morning');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(25);
  const [recurring, setRecurring] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [isTodayFocus, setIsTodayFocus] = useState(false);
  const [isSomeday, setIsSomeday] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      
      let initialDueDate = task.dueDate || '';
      if (initialDueDate === 'Today') initialDueDate = todayStr;
      else if (initialDueDate === 'Tomorrow') initialDueDate = tomorrowStr;
      setDueDate(initialDueDate);

      setTimeBlock(task.timeBlock || 'morning');
      setEstimatedMinutes(task.estimatedMinutes || 25);
      setRecurring(task.recurring || null);
      setIsTodayFocus(Boolean(task.isTodayFocus));
      setIsSomeday(Boolean(task.isSomeday));
      setTags(task.tags || []);
    } else {
      // Create mode
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultDate || todayStr);
      setTimeBlock('morning');
      setEstimatedMinutes(25);
      setRecurring(null);
      setIsTodayFocus(defaultDate === todayStr || !defaultDate);
      setIsSomeday(defaultIsSomeday);
      setTags(['work']);
    }
    setTagInput('');

    // Auto-focus title after open animation
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, mode, task, defaultDate, defaultIsSomeday, todayStr, tomorrowStr]);

  // Global keyboard shortcuts (Esc to close, Ctrl/Cmd + Enter to save)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, description, priority, tags, dueDate, timeBlock, estimatedMinutes, isTodayFocus, isSomeday, recurring]);

  if (!isOpen) return null;

  const handleAddTag = (rawTag: string) => {
    const formatted = rawTag.trim().toLowerCase().replace(/^#/, '');
    if (formatted && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      tags: tags.length > 0 ? tags : ['general'],
      dueDate: dueDate || undefined,
      timeBlock,
      estimatedMinutes: Number(estimatedMinutes) || 25,
      isTodayFocus: isTodayFocus || dueDate === todayStr,
      isSomeday,
      recurring,
    });
    onClose();
  };

  const durationOptions = [15, 25, 45, 60, 90];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl transition-all my-auto text-[var(--text-primary)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-heading"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-2.5 py-1 rounded-md">
              {mode === 'edit' ? 'Edit Task' : 'New Task'}
            </span>
            <h2 id="task-modal-heading" className="text-sm font-semibold text-[var(--text-primary)]">
              {mode === 'edit' ? 'Modify Task Details & Schedule' : 'Create & Schedule Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task modal"
            className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleFormSubmit}>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
            {/* Left Column (60% / 7 cols) - Core Information */}
            <div className="lg:col-span-7 space-y-5">
              {/* Task Title */}
              <div>
                <label 
                  htmlFor="task-modal-title" 
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Task Title <span className="text-[var(--accent-terracotta)]">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="task-modal-title"
                  name="title"
                  type="text"
                  required
                  placeholder="What needs to get done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-3 text-base font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-all"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label 
                  htmlFor="task-modal-description" 
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Description & Context
                </label>
                <textarea
                  id="task-modal-description"
                  name="description"
                  rows={4}
                  placeholder="Add background context, checklist items, links, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-3.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-all resize-y leading-relaxed"
                />
              </div>

              {/* Interactive Tag System */}
              <div>
                <label 
                  htmlFor="task-modal-tag-input" 
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                >
                  Tags & Categories
                </label>
                
                {/* Active Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2 min-h-[28px]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] shadow-xs"
                    >
                      <TagIcon className="h-3 w-3 text-[var(--accent-terracotta)]" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] ml-0.5"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-[var(--text-muted)] italic">No tags assigned yet</span>
                  )}
                </div>

                {/* Tag Input Field */}
                <div className="flex items-center gap-2">
                  <input
                    id="task-modal-tag-input"
                    name="tagInput"
                    type="text"
                    placeholder="Type tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Add
                  </button>
                </div>

                {/* Tag suggestions from workspace */}
                {availableTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] mr-1">Suggested:</span>
                    {availableTags.slice(0, 6).map((sTag) => {
                      const isAdded = tags.includes(sTag);
                      return (
                        <button
                          key={sTag}
                          type="button"
                          onClick={() => handleAddTag(sTag)}
                          disabled={isAdded}
                          className={`text-[11px] rounded-md px-2 py-0.5 border transition ${
                            isAdded
                              ? 'border-transparent text-[var(--text-muted)] opacity-50 cursor-default'
                              : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]'
                          }`}
                        >
                          +{sTag}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (40% / 5 cols) - Scheduling & Attributes */}
            <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-[var(--border-subtle)] lg:pl-6">
              {/* Priority Selector */}
              <div>
                <div className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Priority Level
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => {
                    const isSelected = priority === p;
                    const labels: Record<PriorityLevel, string> = {
                      low: 'Low',
                      medium: 'Medium',
                      high: 'High',
                    };
                    const colorStyles: Record<PriorityLevel, string> = {
                      low: isSelected ? 'border-[var(--accent-sage-moss)] bg-[var(--accent-sage-moss)]/15 text-[var(--text-primary)] font-bold ring-1 ring-[var(--accent-sage-moss)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
                      medium: isSelected ? 'border-[var(--accent-dusty-mauve)] bg-[var(--accent-dusty-mauve)]/15 text-[var(--text-primary)] font-bold ring-1 ring-[var(--accent-dusty-mauve)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
                      high: isSelected ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--text-primary)] font-bold ring-1 ring-[var(--accent-terracotta)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
                    };

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-xl border py-2.5 text-xs text-center transition-all ${colorStyles[p]} hover:bg-[var(--card-hover)]`}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Date with Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="task-modal-due-date" 
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Scheduled Due Date
                  </label>
                </div>
                <input
                  id="task-modal-due-date"
                  name="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setDueDate(selected);
                    if (selected && selected !== todayStr) {
                      setIsTodayFocus(false);
                    } else if (selected === todayStr) {
                      setIsTodayFocus(true);
                    }
                  }}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                />

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(todayStr);
                      setIsTodayFocus(true);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      dueDate === todayStr
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(tomorrowStr);
                      setIsTodayFocus(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      dueDate === tomorrowStr
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate(nextWeekStr);
                      setIsTodayFocus(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      dueDate === nextWeekStr
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Next Week
                  </button>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="text-[11px] px-2 py-1 text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] ml-auto"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Time Block & Recurring */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label 
                    htmlFor="task-modal-time-block" 
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                  >
                    Time Block
                  </label>
                  <select
                    id="task-modal-time-block"
                    name="timeBlock"
                    value={timeBlock || ''}
                    onChange={(e) => setTimeBlock((e.target.value as TimeBlockSlot) || null)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>

                <div>
                  <label 
                    htmlFor="task-modal-recurring" 
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                  >
                    Routine
                  </label>
                  <select
                    id="task-modal-recurring"
                    name="recurring"
                    value={recurring || ''}
                    onChange={(e) => setRecurring((e.target.value as any) || null)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  >
                    <option value="">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Estimated Duration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="task-modal-est-minutes" 
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Est. Duration (Minutes)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="task-modal-est-minutes"
                    name="estimatedMinutes"
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  />
                  <div className="flex flex-wrap items-center gap-1 flex-1">
                    {durationOptions.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEstimatedMinutes(mins)}
                        className={`text-[11px] px-2 py-1 rounded-md border transition ${
                          estimatedMinutes === mins
                            ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-bold'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Queue Toggles (Today Focus & Someday) */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5">
                {/* Someday Switch */}
                <label htmlFor="task-modal-is-someday" className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 cursor-pointer hover:bg-[var(--card-hover)] transition">
                  <div className="pr-2">
                    <span className="block text-xs font-semibold text-[var(--text-primary)]">Someday / Backlog</span>
                    <span className="block text-[11px] text-[var(--text-muted)]">Park for later without scheduling pressure</span>
                  </div>
                  <input
                    type="checkbox"
                    id="task-modal-is-someday"
                    name="isSomeday"
                    checked={isSomeday}
                    onChange={(e) => setIsSomeday(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--accent-dusty-mauve)] cursor-pointer"
                  />
                </label>

                {/* Today Focus Queue */}
                <label htmlFor="task-modal-is-today-focus" className={`flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 transition ${
                  (!dueDate || dueDate === todayStr) ? 'cursor-pointer hover:bg-[var(--card-hover)]' : 'opacity-50 cursor-not-allowed'
                }`}>
                  <div className="pr-2">
                    <span className="block text-xs font-semibold text-[var(--text-primary)]">Star for Today Focus</span>
                    <span className="block text-[11px] text-[var(--text-muted)]">Pin directly into today's action queue</span>
                  </div>
                  <input
                    type="checkbox"
                    id="task-modal-is-today-focus"
                    name="isTodayFocus"
                    disabled={Boolean(dueDate && dueDate !== todayStr)}
                    checked={(!dueDate || dueDate === todayStr) && isTodayFocus}
                    onChange={(e) => setIsTodayFocus(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--accent-terracotta)] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/80">
            {/* Delete button (Edit mode only) */}
            <div>
              {mode === 'edit' && task && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                      onDelete(task.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Task</span>
                </button>
              )}
            </div>

            {/* Cancel & Submit buttons */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[10px]">Ctrl+Enter</kbd> to save
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-5 py-2.5 text-xs font-bold shadow-sm transition"
              >
                {mode === 'edit' ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

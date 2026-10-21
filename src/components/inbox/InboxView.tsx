import React, { useState } from 'react';
import { Plus, Search, Inbox, Tag as TagIcon, X, Calendar as CalendarIcon, Zap, RefreshCw, Sparkles, FolderArchive, SlidersHorizontal, RotateCcw, ChevronDown, Archive } from 'lucide-react';
import { Task, PriorityLevel } from '../../types';
import { TaskItem } from './TaskItem';
import { FocusQueue } from './FocusQueue';
import { TaskFormModal } from './TaskFormModal';
import { Pagination } from '../common/Pagination';

import { getLocalDateString, getDateWithOffset } from '../../lib/streak';
import { parseQuickTaskInput } from '../layout/Sidebar';

interface InboxViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask?: (id: string, updatedFields: Partial<Task>) => void;
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onSweepCompleted?: () => void;
  onRolloverOverdueTasks?: () => void;
  selectedCalendarDate?: string | null;
  onSelectCalendarDate?: (date: string | null) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onArchiveTask,
  onSweepCompleted,
  onRolloverOverdueTasks,
  selectedCalendarDate: externalSelectedCalendarDate,
  onSelectCalendarDate: externalOnSelectCalendarDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [localSelectedCalendarDate, setLocalSelectedCalendarDate] = useState<string | null>(null);

  const selectedCalendarDate = externalSelectedCalendarDate !== undefined
    ? externalSelectedCalendarDate
    : localSelectedCalendarDate;

  const setSelectedCalendarDate = externalOnSelectCalendarDate || setLocalSelectedCalendarDate;

  const [showCompleted, setShowCompleted] = useState(true);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultIsTodayFocus, setDefaultIsTodayFocus] = useState(false);

  // Ideal UX Feature States
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'someday'>('active');
  const [sortMode, setSortMode] = useState<'recent' | 'quick_wins' | 'priority' | 'due_date'>('recent');
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter out archived tasks for active view
  const activeInboxTasks = tasks.filter((t) => !t.archived);
  const completedUnarchivedCount = activeInboxTasks.filter((t) => t.completed).length;
  const activeFocusCount = tasks.filter((t) => !t.archived && !t.isSomeday && t.isTodayFocus && !t.completed).length;
  const isFocusQueueFull = activeFocusCount >= 5;

  // Extract unique tags
  const allTags = Array.from(new Set(activeInboxTasks.flatMap((t) => t.tags)));

  const todayStr = getLocalDateString();
  const tomorrowStr = getDateWithOffset(todayStr, 1);

  // Calculate Overdue Tasks
  const overdueTasks = activeInboxTasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date(todayStr);
    return due < today;
  });

  // Calculate tab counts
  const activeCount = activeInboxTasks.filter((t) => !t.completed && !t.isSomeday).length;
  const somedayCount = activeInboxTasks.filter((t) => !t.completed && t.isSomeday).length;

  const filteredTasks = activeInboxTasks.filter((t) => {
    const matchesBucket = activeInboxTab === 'someday' ? Boolean(t.isSomeday) : !t.isSomeday;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? t.tags.includes(selectedTag) : true;
    const matchesPriority = selectedPriority !== 'all' ? t.priority === selectedPriority : true;
    const matchesCompleted = showCompleted ? true : !t.completed;

    let matchesCalendarDate = true;
    if (selectedCalendarDate) {
      if (!t.dueDate) {
        matchesCalendarDate = false;
      } else {
        const due = t.dueDate.trim().toLowerCase();
        if (due === 'today') {
          matchesCalendarDate = selectedCalendarDate === todayStr;
        } else if (due === 'tomorrow') {
          matchesCalendarDate = selectedCalendarDate === tomorrowStr;
        } else {
          matchesCalendarDate = due === selectedCalendarDate;
        }
      }
    }

    return matchesBucket && matchesSearch && matchesTag && matchesPriority && matchesCompleted && matchesCalendarDate;
  });

  // Smart Sorting logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortMode === 'quick_wins') {
      return (a.estimatedMinutes || 999) - (b.estimatedMinutes || 999);
    }
    if (sortMode === 'priority') {
      const pMap: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    if (sortMode === 'due_date') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return 0; // 'recent'
  });

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTasks = sortedTasks.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    // Use smart natural language parser (extracts /today, /tomorrow, /urgent, /15m, #tag, etc.)
    const parsed = parseQuickTaskInput(quickAddTitle.trim());

    // Extract hashtags from input if any (e.g., #design #ops)
    const hashtagMatches = quickAddTitle.match(/#([\w-]+)/g);
    const customTags = hashtagMatches ? hashtagMatches.map((t) => t.slice(1)) : [];
    const mergedTags = Array.from(new Set([...(parsed.tags || ['quick-add']), ...customTags]));

    onAddTask({
      title: parsed.title,
      priority: parsed.priority || 'medium',
      tags: mergedTags,
      dueDate: parsed.dueDate || selectedCalendarDate || todayStr,
      timeBlock: parsed.timeBlock || 'morning',
      estimatedMinutes: parsed.estimatedMinutes || 25,
      isTodayFocus: parsed.isTodayFocus || false,
      isSomeday: activeInboxTab === 'someday',
      recurring: null,
    });

    setQuickAddTitle('');
  };

  const handleOpenCreateModal = (focusMode: boolean = false) => {
    setTaskToEdit(null);
    setTaskModalMode('create');
    setDefaultIsTodayFocus(focusMode);
    setIsTaskModalOpen(true);
  };

  const handleStartEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalMode('edit');
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Today's Focus Queue Section */}
      <FocusQueue
        tasks={tasks}
        onToggleComplete={onToggleComplete}
        onToggleTodayFocus={onToggleTodayFocus}
        onDeleteTask={onDeleteTask}
        onEditTask={handleStartEditTask}
        onOpenNewTaskModal={() => handleOpenCreateModal(true)}
      />

      {/* Master Backlog Inbox Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-300">
        {/* Top Header: Title, Segmented Tabs, and Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          {/* Left: Section Title & Tab Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                <Inbox className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <span>Backlog Inbox</span>
                  <span className="rounded-full bg-[var(--accent-terracotta)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--accent-terracotta)]">
                    {sortedTasks.length}
                  </span>
                </h2>
              </div>
            </div>

            {/* Segmented Control for Active vs Someday */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveInboxTab('active');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                  activeInboxTab === 'active'
                    ? 'bg-[var(--card-surface)] text-[var(--accent-terracotta)] shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Active</span>
                <span className="ml-0.5 text-[10px] font-bold opacity-75 px-1.5 py-0.2 rounded-full bg-[var(--bg-main)]">
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveInboxTab('someday');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                  activeInboxTab === 'someday'
                    ? 'bg-[var(--card-surface)] text-[var(--accent-dusty-mauve)] shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FolderArchive className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Someday</span>
                <span className="ml-0.5 text-[10px] font-bold opacity-75 px-1.5 py-0.2 rounded-full bg-[var(--bg-main)]">
                  {somedayCount}
                </span>
              </button>
            </div>
          </div>

          {/* Right: + New Task Button */}
          <button
            type="button"
            onClick={() => handleOpenCreateModal(false)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2.5 text-xs font-semibold shadow-xs transition-all min-h-[40px] shrink-0 sm:ml-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <span>New Task</span>
          </button>
        </div>

        {/* Quick Add Bar with Instant Natural Syntax Detection */}
        <div className="relative">
          <form onSubmit={handleQuickAddSubmit} className="relative flex items-center">
            <Sparkles className="absolute left-3.5 h-4 w-4 text-[var(--accent-terracotta)] shrink-0 pointer-events-none" />
            <input
              id="inbox-quick-add-input"
              name="quickAddTitle"
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Quick add: e.g. 'Review slide deck tomorrow #design /urgent'..."
              aria-label="Quick add task title"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 pl-10 pr-24 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] transition-all min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!quickAddTitle.trim()}
              className="absolute right-1.5 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition shadow-2xs min-h-[34px] cursor-pointer"
            >
              Add Task
            </button>
          </form>
        </div>

        {/* Search, Filter Bar, and Sort Controls */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                id="inbox-search-filter-input"
                name="searchQuery"
                type="text"
                placeholder="Search tasks..."
                aria-label="Filter tasks by keyword"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/50 pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] min-h-[38px] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors"
                  aria-label="Clear search query"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Select */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium min-h-[38px] transition-all cursor-pointer ${
                    selectedPriority !== 'all'
                      ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  aria-label="Priority filter options"
                  aria-expanded={isPriorityDropdownOpen}
                >
                  <span>
                    {selectedPriority === 'all'
                      ? 'Priority'
                      : selectedPriority === 'high'
                      ? 'High Priority'
                      : selectedPriority === 'medium'
                      ? 'Medium Priority'
                      : 'Low Priority'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </button>

                {isPriorityDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPriorityDropdownOpen(false)} />
                    <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-20 w-40 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setSelectedPriority(p);
                            setIsPriorityDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                            selectedPriority === p ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {p === 'all' ? 'All Priorities' : `${p.charAt(0).toUpperCase() + p.slice(1)} Priority`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium min-h-[38px] transition-all cursor-pointer ${
                    sortMode !== 'recent'
                      ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  aria-label="Sort options"
                  aria-expanded={isSortDropdownOpen}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span>
                    {sortMode === 'recent'
                      ? 'Default Sort'
                      : sortMode === 'quick_wins'
                      ? 'Quick Wins'
                      : sortMode === 'priority'
                      ? 'Priority First'
                      : 'Due Date'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {[
                        { id: 'recent', label: 'Default (Recent)' },
                        { id: 'quick_wins', label: '⚡ Quick Wins (< 15m)' },
                        { id: 'priority', label: '🔥 Highest Priority' },
                        { id: 'due_date', label: '📅 Nearest Due Date' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSortMode(item.id as typeof sortMode);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                            sortMode === item.id ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Toggle Completed Tasks */}
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all min-h-[38px] cursor-pointer ${
                  !showCompleted
                    ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
              >
                {showCompleted ? 'Hide Done' : 'Show Done'}
              </button>

              {/* Reset Filter Button if active */}
              {(searchQuery || selectedPriority !== 'all' || selectedTag || sortMode !== 'recent' || !showCompleted || selectedCalendarDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPriority('all');
                    setSelectedTag(null);
                    setSortMode('recent');
                    setShowCompleted(true);
                    setSelectedCalendarDate(null);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/50 p-2 text-xs text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/40 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Reset all active filters"
                  aria-label="Reset all active filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Tag Filter Chips Horizontal Ribbon */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
              <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                <TagIcon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" /> Tags:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedTag === null
                    ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                    : 'bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[var(--accent-terracotta)] text-white font-semibold shadow-2xs'
                      : 'bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Banners & Context Banners */}
        <div className="space-y-2">
          {/* Sweep Completed Banner */}
          {completedUnarchivedCount > 0 && onSweepCompleted && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 px-3.5 py-2.5 text-xs text-[var(--accent-terracotta)]">
              <div className="flex items-center gap-2 font-medium">
                <Archive className="h-4 w-4 text-[var(--accent-terracotta)] shrink-0" />
                <span>
                  <strong>{completedUnarchivedCount} completed {completedUnarchivedCount === 1 ? 'task' : 'tasks'}</strong> ready to be moved to History.
                </span>
              </div>
              <button
                onClick={onSweepCompleted}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-3 py-1.5 text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive Completed</span>
              </button>
            </div>
          )}

          {/* Overdue Rollover Banner */}
          {overdueTasks.length > 0 && onRolloverOverdueTasks && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 px-3.5 py-2.5 text-xs text-[#9E7328] dark:text-[#E0AF5E]">
              <div className="flex items-center gap-2 font-medium">
                <RefreshCw className="h-4 w-4 text-[var(--accent-warm-ochre)] shrink-0" />
                <span>
                  <strong>{overdueTasks.length} {overdueTasks.length === 1 ? 'task is' : 'tasks are'} overdue</strong> from past dates.
                </span>
              </div>
              <button
                onClick={onRolloverOverdueTasks}
                className="flex items-center gap-1 rounded-lg bg-[var(--accent-warm-ochre)] text-slate-950 hover:opacity-90 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Rollover All</span>
              </button>
            </div>
          )}

          {/* Calendar Date Filter Banner */}
          {selectedCalendarDate && (
            <div className="flex items-center justify-between rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 px-3.5 py-2 text-xs text-[var(--accent-botanical-sage)]">
              <span className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-4 w-4 text-[var(--accent-botanical-sage)]" />
                Filtered by Due Date: <strong>{selectedCalendarDate}</strong>
              </span>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="rounded-lg bg-[var(--accent-botanical-sage)]/20 border border-[var(--accent-botanical-sage)]/40 px-2.5 py-1 text-[11px] font-bold text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/30 transition cursor-pointer"
              >
                Clear Date Filter
              </button>
            </div>
          )}
        </div>

        {/* Task List Section */}
        {sortedTasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)]/30 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--card-hover)] text-[var(--text-muted)]">
              <Inbox className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No tasks found</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                {searchQuery || selectedPriority !== 'all' || selectedTag || selectedCalendarDate
                  ? 'No tasks match your active filters. Try resetting the filters or modifying your query.'
                  : activeInboxTab === 'someday'
                  ? 'Your someday incubator is clean. Add aspirational ideas and long-term goals here.'
                  : 'Your active backlog is clear! Type a task above to quick-capture it.'}
              </p>
            </div>
            {(searchQuery || selectedPriority !== 'all' || selectedTag || selectedCalendarDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPriority('all');
                  setSelectedTag(null);
                  setSelectedCalendarDate(null);
                  setShowCompleted(true);
                }}
                className="mt-2 text-xs font-semibold text-[var(--accent-terracotta)] hover:underline cursor-pointer"
              >
                Reset active filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              {paginatedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onToggleTodayFocus={onToggleTodayFocus}
                  onDeleteTask={onDeleteTask}
                  onArchiveTask={onArchiveTask}
                  onEditTask={handleStartEditTask}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {sortedTasks.length > pageSize && (
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <Pagination
                  currentPage={safeCurrentPage}
                  totalItems={sortedTasks.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemName="tasks"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unified Task Modal (Create / Edit) */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        mode={taskModalMode}
        task={taskToEdit}
        defaultDate={selectedCalendarDate || todayStr}
        defaultIsSomeday={activeInboxTab === 'someday'}
        defaultIsTodayFocus={defaultIsTodayFocus}
        isFocusQueueFull={isFocusQueueFull}
        availableTags={allTags}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={(taskData) => {
          if (taskModalMode === 'edit' && taskToEdit && onUpdateTask) {
            onUpdateTask(taskToEdit.id, taskData);
          } else {
            onAddTask(taskData);
          }
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onDelete={(id) => {
          if (onDeleteTask) {
            onDeleteTask(id);
          }
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
      />
    </div>
  );
};

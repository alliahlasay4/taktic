import React, { useState } from 'react';
import { Plus, Search, Inbox, Tag as TagIcon, X, Calendar as CalendarIcon, Zap, RefreshCw, Sparkles, FolderArchive, SlidersHorizontal, RotateCcw, ChevronDown, Archive, Star } from 'lucide-react';
import { Task, PriorityLevel } from '../../types';
import { TaskItem } from './TaskItem';
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
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Mobile dedicated UI state
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultIsTodayFocus, setDefaultIsTodayFocus] = useState(false);

  // Ideal UX Feature States (Tabbed View: Focus Queue, Backlog Inbox, Someday Incubator)
  const [activeInboxTab, setActiveInboxTab] = useState<'focus' | 'backlog' | 'someday'>('focus');
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
  const focusCount = activeInboxTasks.filter((t) => !t.completed && !t.isSomeday && t.isTodayFocus).length;
  const backlogCount = activeInboxTasks.filter((t) => !t.completed && !t.isSomeday && !t.isTodayFocus).length;
  const somedayCount = activeInboxTasks.filter((t) => !t.completed && t.isSomeday).length;

  const filteredTasks = activeInboxTasks.filter((t) => {
    // Filter by active tab bucket
    if (activeInboxTab === 'focus') {
      if (!t.isTodayFocus || t.isSomeday) return false;
    } else if (activeInboxTab === 'backlog') {
      if (t.isTodayFocus || t.isSomeday) return false;
    } else if (activeInboxTab === 'someday') {
      if (!t.isSomeday) return false;
    }

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

    return matchesSearch && matchesTag && matchesPriority && matchesCompleted && matchesCalendarDate;
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
      isTodayFocus: parsed.isTodayFocus || activeInboxTab === 'focus',
      isSomeday: activeInboxTab === 'someday',
      recurring: null,
    });

    setQuickAddTitle('');
  };

  const handleOpenCreateModal = (focusMode: boolean = false) => {
    setTaskToEdit(null);
    setTaskModalMode('create');
    setDefaultIsTodayFocus(focusMode || activeInboxTab === 'focus');
    setIsTaskModalOpen(true);
  };

  const handleStartEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalMode('edit');
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Master Task Hub Container */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 sm:p-6 shadow-xs space-y-2.5 sm:space-y-4 transition-colors duration-300">
        {/* Top Header: Segmented Tabs & Action Controls */}
        <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-3 border-b border-[var(--border-subtle)]">
          {/* Top Row on Mobile: Segmented Tab Bar (Full Width, 3 Equal Columns - Zero Horizontal Scroll) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            {/* Sleek Segmented Switcher (Focus, Backlog, Someday) */}
            <div className="w-full sm:w-auto">
              <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-inner">
                {/* 1. Today's Focus */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveInboxTab('focus');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    activeInboxTab === 'focus'
                      ? 'bg-[var(--card-surface)] text-[var(--accent-warm-ochre)] shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Star className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 ${activeInboxTab === 'focus' ? 'fill-[var(--accent-warm-ochre)]' : ''}`} />
                  <span className="leading-none">Focus</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeInboxTab === 'focus'
                      ? 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {focusCount}/5
                  </span>
                </button>

                {/* 2. Backlog */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveInboxTab('backlog');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    activeInboxTab === 'backlog'
                      ? 'bg-[var(--card-surface)] text-[var(--accent-terracotta)] shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Inbox className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="leading-none">Backlog</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeInboxTab === 'backlog'
                      ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {backlogCount}
                  </span>
                </button>

                {/* 3. Someday */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveInboxTab('someday');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    activeInboxTab === 'someday'
                      ? 'bg-[var(--card-surface)] text-[var(--accent-dusty-mauve)] shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FolderArchive className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="leading-none">Someday</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeInboxTab === 'someday'
                      ? 'bg-[var(--accent-dusty-mauve)]/15 text-[var(--accent-dusty-mauve)]'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {somedayCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop Right: + New Task Button */}
            <button
              type="button"
              onClick={() => handleOpenCreateModal(activeInboxTab === 'focus')}
              className="hidden sm:flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2 text-xs font-semibold shadow-xs transition-all min-h-[36px] shrink-0 sm:ml-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Quick Add Bar with Search & Filter Action on Mobile */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleQuickAddSubmit} className="relative flex items-center flex-1 min-w-0">
            <Sparkles className="absolute left-3 h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0 pointer-events-none" />
            <input
              id="inbox-quick-add-input"
              name="quickAddTitle"
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Quick add: e.g. 'Review deck tomorrow #ops /urgent'..."
              aria-label="Quick add task title"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 pl-9 pr-16 sm:pr-20 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] transition-all min-h-[36px] sm:min-h-[38px]"
            />
            <button
              type="submit"
              disabled={!quickAddTitle.trim()}
              className="absolute right-1 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 transition shadow-2xs min-h-[28px] sm:min-h-[30px] cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Mobile Right Quick Action Icons: Search & Filter Drawer Trigger */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileSearchVisible((prev) => !prev)}
              aria-label="Toggle search input"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isMobileSearchVisible || searchQuery
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              aria-label="Open filter options"
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                selectedPriority !== 'all' || selectedTag || sortMode !== 'recent' || !showCompleted
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {(selectedPriority !== 'all' || selectedTag || sortMode !== 'recent' || !showCompleted) && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-[var(--accent-terracotta)] ring-2 ring-[var(--card-surface)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchVisible && (
          <div className="sm:hidden relative animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              id="inbox-mobile-search-filter-input"
              name="mobileSearchQuery"
              type="text"
              placeholder="Search active tasks..."
              aria-label="Filter tasks by keyword"
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-[var(--accent-terracotta)]/40 bg-[var(--bg-main)]/70 pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] min-h-[36px]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMobileSearchVisible(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mobile Active Filter Chips Row (Only renders when at least one filter is active) */}
        {(Boolean(searchQuery) || selectedPriority !== 'all' || sortMode !== 'recent' || Boolean(selectedTag) || !showCompleted) && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] shrink-0">
                <Search className="h-3 w-3 text-[var(--text-muted)]" />
                "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="ml-1 text-[var(--text-muted)] hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedPriority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[11px] font-semibold text-[var(--accent-terracotta)] shrink-0">
                Priority: {selectedPriority.toUpperCase()}
                <button type="button" onClick={() => setSelectedPriority('all')} className="ml-1 hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {sortMode !== 'recent' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] shrink-0">
                Sort: {sortMode === 'quick_wins' ? 'Quick Wins' : sortMode === 'priority' ? 'Priority' : 'Due Date'}
                <button type="button" onClick={() => setSortMode('recent')} className="ml-1 text-[var(--text-muted)] hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] shrink-0">
                #{selectedTag}
                <button type="button" onClick={() => setSelectedTag(null)} className="ml-1 text-[var(--text-muted)] hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {!showCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] shrink-0">
                Active Only
                <button type="button" onClick={() => setShowCompleted(true)} className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

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
              className="text-[11px] text-rose-500 hover:underline px-1 py-0.5 shrink-0 whitespace-nowrap cursor-pointer font-medium"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Desktop Filter Bar & Sort Controls (Hidden on mobile < 640px) */}
        <div className="hidden sm:block space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input Box */}
            <div className="relative flex-1 w-full min-w-0">
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
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/50 pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] min-h-[36px] transition-colors"
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

            {/* Quick Filter Actions Toolbar */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-start sm:justify-end overflow-x-auto no-scrollbar py-0.5">
              {/* Priority Select */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium min-h-[36px] transition-all cursor-pointer ${
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
                      : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </button>

                {isPriorityDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPriorityDropdownOpen(false)} />
                    <div className="absolute left-0 sm:left-0 sm:right-auto top-full mt-1.5 z-20 w-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setSelectedPriority(p);
                            setIsPriorityDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-[var(--card-hover)] transition-colors ${
                            selectedPriority === p ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {p === 'all' ? 'All Priorities' : `${p.charAt(0).toUpperCase() + p.slice(1)}`}
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
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium min-h-[36px] transition-all cursor-pointer ${
                    sortMode !== 'recent'
                      ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  aria-label="Sort options"
                  aria-expanded={isSortDropdownOpen}
                >
                  <SlidersHorizontal className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span>
                    {sortMode === 'recent'
                      ? 'Sort'
                      : sortMode === 'quick_wins'
                      ? 'Quick Wins'
                      : sortMode === 'priority'
                      ? 'Priority'
                      : 'Due Date'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                </button>

                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 z-20 w-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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

              {/* Tag Filter Dropdown */}
              {allTags.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium min-h-[36px] transition-all cursor-pointer ${
                      selectedTag
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] font-semibold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    aria-label="Tag filter options"
                    aria-expanded={isTagDropdownOpen}
                  >
                    <TagIcon className="h-3 w-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span>{selectedTag ? `#${selectedTag}` : 'Tags'}</span>
                    <ChevronDown className="h-3 w-3 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  </button>

                  {isTagDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsTagDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 z-20 w-40 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTag(null);
                            setIsTagDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-[var(--card-hover)] transition-colors ${
                            selectedTag === null ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          All Tags
                        </button>
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTag(tag);
                              setIsTagDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-[var(--card-hover)] transition-colors ${
                              selectedTag === tag ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Toggle Completed Tasks */}
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all min-h-[36px] cursor-pointer whitespace-nowrap ${
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
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]/50 p-1.5 text-xs text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/40 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Reset all active filters"
                  aria-label="Reset all active filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
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
                  : activeInboxTab === 'focus'
                  ? "No focus tasks queued for today. Star tasks from your Backlog to queue today's priorities."
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
          <div className="space-y-3 pt-1 pb-20 sm:pb-0">
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

      {/* Mobile Floating Action Button (FAB) for '+ New Task' */}
      <button
        type="button"
        onClick={() => handleOpenCreateModal(activeInboxTab === 'focus')}
        className="sm:hidden fixed bottom-6 left-6 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[var(--accent-terracotta)] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Create new task"
        title="Create new task"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Mobile Filter & Sort Bottom Sheet Drawer */}
      {isMobileFiltersOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Sheet Content */}
          <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center">
              <div className="h-1 w-10 rounded-full bg-[var(--text-muted)]/30 mb-3" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--accent-terracotta)]" />
                  <span className="font-heading font-bold text-sm text-[var(--text-primary)]">Filter & Sort Tasks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter: Priority */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Priority Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPriority(p);
                      setCurrentPage(1);
                    }}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPriority === p
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-2xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                    }`}
                  >
                    {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter: Sort Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Sort Order</label>
              <div className="grid grid-cols-2 gap-1.5">
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
                      setCurrentPage(1);
                    }}
                    className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-left transition-all cursor-pointer ${
                      sortMode === item.id
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-2xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter: Tags */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Tags</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                      selectedTag === null
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                    }`}
                  >
                    All Tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                        selectedTag === tag
                          ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter: Completion Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Show Completed Tasks</span>
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  showCompleted
                    ? 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                    : 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                }`}
              >
                {showCompleted ? 'Shown' : 'Hidden'}
              </button>
            </div>

            {/* Action Buttons in Sheet */}
            <div className="flex items-center gap-2 pt-2">
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
                  setIsMobileFiltersOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent-terracotta)] text-white text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

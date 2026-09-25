import React, { useState, useEffect } from 'react';
import { Plus, Search, Inbox, Tag as TagIcon, X, Calendar as CalendarIcon, Zap, RefreshCw, Sparkles, FolderArchive, SlidersHorizontal, RotateCcw, ChevronDown, Archive } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';
import { TaskItem } from './TaskItem';
import { FocusQueue } from './FocusQueue';
import { InboxCalendarCard } from './InboxCalendarCard';
import { TaskFormModal } from './TaskFormModal';
import { Pagination } from '../common/Pagination';

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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

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

  // Extract unique tags
  const allTags = Array.from(new Set(activeInboxTasks.flatMap((t) => t.tags)));

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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

  // Reset pagination on filter, search, sort, or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, selectedPriority, selectedCalendarDate, showCompleted, activeInboxTab, sortMode]);

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTasks = sortedTasks.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    onAddTask({
      title: quickAddTitle.trim(),
      priority: 'medium',
      tags: ['quick-add'],
      dueDate: selectedCalendarDate || todayStr,
      timeBlock: 'morning',
      estimatedMinutes: 15,
      isTodayFocus: selectedCalendarDate === todayStr || !selectedCalendarDate,
      isSomeday: activeInboxTab === 'someday',
      recurring: null,
    });

    setQuickAddTitle('');
  };

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setTaskModalMode('create');
    setIsTaskModalOpen(true);
  };

  const handleStartEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalMode('edit');
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Main 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mini-Calendar Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <InboxCalendarCard
            tasks={tasks}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
          />
        </div>

        {/* Right Column: Today's Focus Queue + Master Backlog Inbox (8 cols stacked) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Focus Queue Section */}
          <FocusQueue
            tasks={tasks}
            onToggleComplete={onToggleComplete}
            onToggleTodayFocus={onToggleTodayFocus}
            onDeleteTask={onDeleteTask}
            onEditTask={handleStartEditTask}
            onOpenNewTaskModal={handleOpenCreateModal}
          />

          {/* Master Backlog Inbox Card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-6 shadow-xs space-y-4 transition-colors duration-300 overflow-hidden">
            {/* Header & Main Actions - Clean Single-Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              {/* Left: Title + Count Badge + Active/Someday Tabs */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                    <Inbox className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h2 className="font-heading font-bold text-base text-[var(--text-primary)] whitespace-nowrap flex items-center gap-2">
                    Master Backlog Inbox
                    <span className="rounded-full bg-[var(--accent-terracotta)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--accent-terracotta)]">
                      {sortedTasks.length}
                    </span>
                  </h2>
                </div>

                {/* Bucket Segment Tabs (Inline next to title) */}
                <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setActiveInboxTab('active')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                      activeInboxTab === 'active'
                        ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>Active</span>
                    <span className="ml-1 text-[10px] opacity-80">({activeCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInboxTab('someday')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                      activeInboxTab === 'someday'
                        ? 'bg-[var(--accent-dusty-mauve)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FolderArchive className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>Someday</span>
                    <span className="ml-1 text-[10px] opacity-80">({somedayCount})</span>
                  </button>
                </div>
              </div>

              {/* Right: + New Task Button */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2.5 text-xs font-semibold shadow-xs transition-all min-h-[44px] shrink-0 sm:ml-auto"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                <span>New Task</span>
              </button>
            </div>

            {/* Quick Add Bar with Filter & Sort Toggle */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleQuickAddSubmit} className="flex-1 min-w-0">
                <div className="relative flex items-center">
                  <Sparkles className="absolute left-3.5 h-4 w-4 text-[var(--accent-terracotta)] shrink-0" />
                  <input
                    id="inbox-quick-add-input"
                    name="quickAddTitle"
                    type="text"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder="Quick add task title..."
                    aria-label="Quick add task title"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 pl-10 pr-24 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] transition-colors min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={!quickAddTitle.trim()}
                    className="absolute right-1.5 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition shadow-2xs min-h-[36px]"
                  >
                    Add Task
                  </button>
                </div>
              </form>

              {/* Collapsible Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] shrink-0 ${
                  isFilterOpen || searchQuery || selectedPriority !== 'all' || selectedTag || sortMode !== 'recent'
                    ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                aria-expanded={isFilterOpen}
                aria-label="Toggle Filter Options"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
                {(searchQuery || selectedPriority !== 'all' || selectedTag || sortMode !== 'recent') && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-terracotta)]" />
                )}
              </button>
            </div>

            {/* Collapsible Filter & Sort Toolbar Drawer */}
            {isFilterOpen && (
              <div className="space-y-3.5 bg-[var(--bg-main)]/80 p-4 rounded-xl border border-[var(--border-subtle)] animate-in fade-in duration-200">
                {/* Row 1: Search & Filter Selects in structured responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                  {/* Search Input (5 cols on desktop) */}
                  <div className="sm:col-span-2 lg:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <input
                      id="inbox-search-filter-input"
                      name="searchQuery"
                      type="text"
                      placeholder="Search by keyword..."
                      aria-label="Filter tasks by keyword"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] min-h-[40px] shadow-2xs"
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

                  {/* Priority Custom Dropdown (3 cols on desktop) */}
                  <div className="lg:col-span-3 relative">
                    <button
                      type="button"
                      onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)] min-h-[40px] shadow-2xs hover:bg-[var(--card-hover)] transition-colors"
                      aria-label="Priority filter options"
                      aria-expanded={isPriorityDropdownOpen}
                    >
                      <span className="truncate">
                        {selectedPriority === 'all'
                          ? 'All Priorities'
                          : selectedPriority === 'high'
                          ? 'High Priority'
                          : selectedPriority === 'medium'
                          ? 'Medium Priority'
                          : 'Low Priority'}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 ml-1" strokeWidth={1.5} aria-hidden="true" />
                    </button>

                    {isPriorityDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsPriorityDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs divide-y divide-[var(--border-subtle)]/40 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPriority('all');
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              selectedPriority === 'all' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            All Priorities
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPriority('high');
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              selectedPriority === 'high' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            High Priority
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPriority('medium');
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              selectedPriority === 'medium' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Medium Priority
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPriority('low');
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              selectedPriority === 'low' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Low Priority
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Smart Sort Custom Dropdown (2 cols on desktop) */}
                  <div className="lg:col-span-2 relative">
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)] min-h-[40px] font-medium shadow-2xs hover:bg-[var(--card-hover)] transition-colors"
                      aria-label="Sort options"
                      aria-expanded={isSortDropdownOpen}
                    >
                      <span className="truncate">
                        {sortMode === 'recent' ? 'Sort' : sortMode === 'quick_wins' ? 'Quick Wins' : sortMode === 'priority' ? 'Priority' : 'Due Date'}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 ml-1" strokeWidth={1.5} aria-hidden="true" />
                    </button>

                    {isSortDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-lg py-1 text-xs divide-y divide-[var(--border-subtle)]/40 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSortMode('recent');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              sortMode === 'recent' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Default
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortMode('quick_wins');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              sortMode === 'quick_wins' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Quick Wins
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortMode('priority');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              sortMode === 'priority' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Priority
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortMode('due_date');
                              setIsSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-[var(--card-hover)] transition-colors ${
                              sortMode === 'due_date' ? 'text-[var(--accent-terracotta)] font-semibold bg-[var(--accent-terracotta)]/10' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            Due Date
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hide/Show Completed Toggle & Reset (2 cols on desktop) */}
                  <div className="lg:col-span-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all min-h-[40px] shadow-2xs flex items-center justify-center ${
                        showCompleted
                          ? 'border-[var(--border-subtle)] bg-[var(--card-hover)] text-[var(--text-primary)]'
                          : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {showCompleted ? 'Hide Done' : 'Show Done'}
                    </button>

                    {(searchQuery || selectedPriority !== 'all' || selectedTag || sortMode !== 'recent' || !showCompleted) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedPriority('all');
                          setSelectedTag(null);
                          setSortMode('recent');
                          setShowCompleted(true);
                        }}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2 text-xs text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0 shadow-2xs"
                        title="Reset all filters"
                        aria-label="Reset all filters"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Tag Chips with Horizontal Scroll Ribbon */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border-subtle)]/70">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                      <TagIcon className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" /> Tags:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 min-h-[28px] ${
                          selectedTag === null
                            ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                            : 'bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        All
                      </button>
                      {allTags.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 min-h-[28px] ${
                            selectedTag === tag
                              ? 'bg-[var(--accent-terracotta)] text-white font-semibold shadow-2xs'
                              : 'bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Banners (Overdue, Date Filter, & Sweep Completed) */}
            {completedUnarchivedCount > 0 && onSweepCompleted && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 p-2.5 px-3.5 text-xs text-[var(--accent-terracotta)]">
                <div className="flex items-center gap-2 font-medium">
                  <Archive className="h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0" />
                  <span>
                    <strong>{completedUnarchivedCount} completed {completedUnarchivedCount === 1 ? 'task' : 'tasks'}</strong> ready to be archived.
                  </span>
                </div>
                <button
                  onClick={onSweepCompleted}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-3 py-1 text-[11px] font-bold transition shadow-2xs"
                >
                  <Archive className="h-3 w-3" />
                  Sweep to Archive
                </button>
              </div>
            )}

            {overdueTasks.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 p-2.5 px-3.5 text-xs text-[#9E7328] dark:text-[#E0AF5E]">
                <div className="flex items-center gap-2 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                  <span>
                    <strong>{overdueTasks.length} task(s)</strong> are overdue from past dates!
                  </span>
                </div>
                <button
                  onClick={onRolloverOverdueTasks}
                  className="flex items-center gap-1 rounded-lg bg-[var(--accent-warm-ochre)] text-slate-950 hover:opacity-90 px-2.5 py-0.5 text-[11px] font-bold transition"
                >
                  <Zap className="h-3 w-3" />
                  Rollover All
                </button>
              </div>
            )}

            {selectedCalendarDate && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-2.5 px-3.5 text-xs text-[var(--accent-botanical-sage)]">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarIcon className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
                  Filtered by Date: <strong>{selectedCalendarDate}</strong>
                </span>
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="rounded-lg bg-[var(--accent-botanical-sage)]/20 border border-[var(--accent-botanical-sage)]/40 px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/30 transition"
                >
                  Show All Tasks
                </button>
              </div>
            )}

            {/* Task List */}
            {sortedTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card-hover)] text-[var(--text-muted)]">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">No tasks in this view</p>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                  Your backlog is empty or all tasks are filtered out. Quick add a task above to get started!
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
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
                <Pagination
                  currentPage={safeCurrentPage}
                  totalItems={sortedTasks.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemName="tasks"
                />
              </>
            )}
          </div>
      </div>
    </div>

      {/* Unified Task Modal (Create / Edit) */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        mode={taskModalMode}
        task={taskToEdit}
        defaultDate={selectedCalendarDate || todayStr}
        defaultIsSomeday={activeInboxTab === 'someday'}
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

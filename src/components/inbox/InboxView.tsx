import React, { useState } from 'react';
import { Plus, Search, Filter, Inbox, Tag as TagIcon, X, Pencil, Calendar as CalendarIcon, Zap, RefreshCw, Sparkles, FolderArchive, ArrowUpDown } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';
import { TaskItem } from './TaskItem';
import { FocusQueue } from './FocusQueue';
import { InboxCalendarCard } from './InboxCalendarCard';

interface InboxViewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask?: (id: string, updatedFields: Partial<Task>) => void;
  onToggleComplete: (id: string) => void;
  onToggleTodayFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRolloverOverdueTasks?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleComplete,
  onToggleTodayFocus,
  onDeleteTask,
  onRolloverOverdueTasks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Ideal UX Feature States
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'someday'>('active');
  const [sortMode, setSortMode] = useState<'recent' | 'quick_wins' | 'priority' | 'due_date'>('recent');
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newTagInput, setNewTagInput] = useState('work');
  const [newEstMinutes, setNewEstMinutes] = useState(30);
  const [newTimeBlock, setNewTimeBlock] = useState<TimeBlockSlot>('morning');
  const [newIsTodayFocus, setNewIsTodayFocus] = useState(false);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newIsSomeday, setNewIsSomeday] = useState(false);
  const [newRecurring, setNewRecurring] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  // Extract unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Calculate Overdue Tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const lower = t.dueDate.trim().toLowerCase();
    if (lower === 'today' || lower === 'tomorrow') return false;
    return t.dueDate < todayStr;
  });

  // Calculate tab counts
  const activeCount = tasks.filter((t) => !t.completed && !t.isSomeday).length;
  const somedayCount = tasks.filter((t) => !t.completed && t.isSomeday).length;

  const filteredTasks = tasks.filter((t) => {
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
    setEditingTaskId(null);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewTagInput('work');
    setNewEstMinutes(30);
    setNewTimeBlock('morning');
    setNewIsTodayFocus(selectedCalendarDate === todayStr);
    setNewDueDate(selectedCalendarDate || todayStr);
    setNewIsSomeday(activeInboxTab === 'someday');
    setNewRecurring(null);
    setIsModalOpen(true);
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTitle(task.title);
    setNewDesc(task.description || '');
    setNewPriority(task.priority);
    setNewTagInput(task.tags.join(', '));
    setNewEstMinutes(task.estimatedMinutes || 25);
    setNewTimeBlock(task.timeBlock);
    setNewIsTodayFocus(task.isTodayFocus);
    setNewIsSomeday(task.isSomeday || false);
    setNewRecurring(task.recurring || null);

    if (task.dueDate === 'Today') {
      setNewDueDate(todayStr);
    } else if (task.dueDate === 'Tomorrow') {
      setNewDueDate(tomorrowStr);
    } else {
      setNewDueDate(task.dueDate || todayStr);
    }

    setIsModalOpen(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArray = newTagInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const calculatedDueDate = newDueDate || selectedCalendarDate || (newIsTodayFocus ? 'Today' : undefined);

    if (editingTaskId && onUpdateTask) {
      onUpdateTask(editingTaskId, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        tags: tagsArray.length > 0 ? tagsArray : ['general'],
        isTodayFocus: newIsTodayFocus || newDueDate === todayStr,
        timeBlock: newTimeBlock,
        estimatedMinutes: Number(newEstMinutes) || 25,
        dueDate: calculatedDueDate,
        isSomeday: newIsSomeday,
        recurring: newRecurring,
      });
    } else {
      onAddTask({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        tags: tagsArray.length > 0 ? tagsArray : ['general'],
        isTodayFocus: newIsTodayFocus || newDueDate === todayStr,
        timeBlock: newTimeBlock,
        estimatedMinutes: Number(newEstMinutes) || 25,
        dueDate: calculatedDueDate,
        isSomeday: newIsSomeday,
        recurring: newRecurring,
      });
    }

    setEditingTaskId(null);
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
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
        onOpenNewTaskModal={handleOpenCreateModal}
      />

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

        {/* Right Column: Master Backlog Inbox (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C87D87]/20 text-[#C87D87]">
                <Inbox className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                  Master Backlog Inbox
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  All outstanding tactical tasks ({sortedTasks.length} items)
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#C87D87] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#C06C4C]/20 transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>

          {/* Ideal UX Solution #3: Active Inbox vs. Someday / Later Buckets */}
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-3">
            <button
              onClick={() => setActiveInboxTab('active')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeInboxTab === 'active'
                  ? 'bg-gradient-to-r from-[#C06C4C] to-[#C87D87] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Active Daily Inbox
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeInboxTab === 'active' ? 'bg-white/20 text-white' : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveInboxTab('someday')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeInboxTab === 'someday'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FolderArchive className="h-3.5 w-3.5 text-purple-300" />
              Someday / Later Ideas
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeInboxTab === 'someday' ? 'bg-white/20 text-white' : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}>
                {somedayCount}
              </span>
            </button>
          </div>

          {/* Ideal UX Solution #1: 2-Second Inline Quick-Add Input */}
          <form onSubmit={handleQuickAddSubmit} className="mb-4">
            <div className="relative flex items-center">
              <Sparkles className="absolute left-3.5 h-4 w-4 text-[#C06C4C]" />
              <input
                type="text"
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder="⚡ 2-Second Quick Add: Type task title & press Enter..."
                className="w-full rounded-xl border border-[#C06C4C]/40 bg-[var(--bg-main)] pl-10 pr-24 py-2.5 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/60"
              />
              <button
                type="submit"
                disabled={!quickAddTitle.trim()}
                className="absolute right-2 rounded-lg bg-[#C06C4C] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40 transition"
              >
                Quick Add
              </button>
            </div>
          </form>

          {/* Ideal UX Solution #2: 1-Click Rollover Overdue Banner */}
          {overdueTasks.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 px-4 text-xs text-amber-300 shadow-xs">
              <div className="flex items-center gap-2.5 font-medium">
                <RefreshCw className="h-4 w-4 text-amber-400 animate-spin-slow" />
                <span>
                  <strong>{overdueTasks.length} task(s)</strong> are overdue from past dates!
                </span>
              </div>
              <button
                onClick={onRolloverOverdueTasks}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 text-slate-950 px-3 py-1 text-[11px] font-bold shadow-xs hover:bg-amber-400 transition"
              >
                <Zap className="h-3.5 w-3.5" />
                Rollover All to Today
              </button>
            </div>
          )}

          {/* Active Date Filter Banner */}
          {selectedCalendarDate && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 px-3.5 text-xs text-emerald-300">
              <span className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-4 w-4 text-emerald-400" />
                Filtered by Date: <strong>{selectedCalendarDate}</strong>
              </span>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
              >
                Show All Tasks
              </button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            {/* Search input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search tasks, descriptions, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40"
              />
            </div>

            {/* Ideal UX Solution #5: Smart Sort Selector */}
            <div className="relative w-full md:w-auto">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                aria-label="Smart Sort order"
                className="w-full md:w-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40 font-medium"
              >
                <option value="recent">🎯 Sort: Default Order</option>
                <option value="quick_wins">⚡ Sort: Quick Wins First (Shortest)</option>
                <option value="priority">🔥 Sort: Priority First (High → Low)</option>
                <option value="due_date">📅 Sort: Due Date (Earliest)</option>
              </select>
            </div>

            {/* Priority filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel | 'all')}
              aria-label="Filter by priority"
              className="w-full md:w-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Toggle completed filter */}
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`w-full md:w-auto rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${showCompleted
                ? 'border-[var(--border-subtle)] bg-[var(--card-hover)] text-[var(--text-primary)]'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
            >
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </button>
          </div>

          {/* Tag Pills Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1 flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> Tags:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${selectedTag === null
                  ? 'bg-[#C06C4C] text-white'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${selectedTag === tag
                    ? 'bg-[#C06C4C] text-white'
                    : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Task List */}
          {sortedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No matching tasks found for this view.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onToggleTodayFocus={onToggleTodayFocus}
                  onDeleteTask={onDeleteTask}
                  onEditTask={handleStartEditTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating or Editing Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                {editingTaskId ? (
                  <>
                    <Pencil className="h-5 w-5 text-[#C06C4C]" />
                    <span>Edit Tactical Task</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-[#C06C4C]" />
                    <span>Create New Tactical Task</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTaskId(null);
                }}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit design token accessibility"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or acceptance criteria..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">🌱 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newEstMinutes}
                    onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Specific Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setNewDueDate(selected);
                      if (selected && selected !== todayStr) {
                        setNewIsTodayFocus(false);
                      } else if (selected === todayStr) {
                        setNewIsTodayFocus(true);
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#C06C4C]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Time Block Slot
                  </label>
                  <select
                    value={newTimeBlock || ''}
                    onChange={(e) => setNewTimeBlock((e.target.value as TimeBlockSlot) || null)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌙 Evening</option>
                  </select>
                </div>
              </div>

              {/* Ideal UX Solution #4: Recurring Routine Tasks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Repeat Routine
                  </label>
                  <select
                    value={newRecurring || ''}
                    onChange={(e) => setNewRecurring((e.target.value as any) || null)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="">None (One-time)</option>
                    <option value="daily">🔄 Daily</option>
                    <option value="weekly">📅 Weekly</option>
                    <option value="monthly">🗓️ Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="work, design"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Ideal UX Solution #3: Someday / Later Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSomeday"
                  checked={newIsSomeday}
                  onChange={(e) => setNewIsSomeday(e.target.checked)}
                  className="rounded border-[var(--border-subtle)] text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="isSomeday" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                  Mark as Someday / Backlog Idea 💡
                </label>
              </div>

              {/* Today's Focus Queue Checkbox (Disabled when scheduled for a non-today date) */}
              {(() => {
                const isDateToday = !newDueDate || newDueDate === todayStr;
                return (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isTodayFocus"
                        checked={isDateToday && newIsTodayFocus}
                        disabled={!isDateToday}
                        onChange={(e) => setNewIsTodayFocus(e.target.checked)}
                        className="rounded border-[var(--border-subtle)] text-[#C06C4C] focus:ring-[#C06C4C] disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <label
                        htmlFor="isTodayFocus"
                        className={`text-xs font-medium ${isDateToday ? 'text-[var(--text-primary)] cursor-pointer' : 'text-[var(--text-muted)] cursor-not-allowed'
                          }`}
                      >
                        Star for Today's Focus Queue 🌟
                      </label>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTaskId(null);
                  }}
                  className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#C06C4C] to-[#C87D87] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#C06C4C]/20 hover:opacity-90"
                >
                  {editingTaskId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



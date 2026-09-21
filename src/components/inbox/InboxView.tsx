import React, { useState } from 'react';
import { Plus, Search, Inbox, Tag as TagIcon, X, Pencil, Calendar as CalendarIcon, Zap, RefreshCw, Sparkles, FolderArchive } from 'lucide-react';
import { Task, PriorityLevel, TimeBlockSlot } from '../../types';
import { TaskItem } from './TaskItem';
import { FocusQueue } from './FocusQueue';
import { InboxCalendarCard } from './InboxCalendarCard';
import { EditTaskModal } from './EditTaskModal';

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
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

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
    const due = new Date(t.dueDate);
    const today = new Date(todayStr);
    return due < today;
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
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-xs space-y-4 transition-colors duration-300">
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                  <Inbox className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                    Master Backlog Inbox
                    <span className="rounded-full bg-[var(--accent-terracotta)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--accent-terracotta)]">
                      {sortedTasks.length}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Bucket Tabs */}
                <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setActiveInboxTab('active')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeInboxTab === 'active'
                        ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Active</span>
                    <span className="ml-1 text-[10px] opacity-80">({activeCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveInboxTab('someday')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeInboxTab === 'someday'
                        ? 'bg-[var(--accent-dusty-mauve)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FolderArchive className="h-3.5 w-3.5" />
                    <span>Someday</span>
                    <span className="ml-1 text-[10px] opacity-80">({somedayCount})</span>
                  </button>
                </div>

                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Task</span>
                </button>
              </div>
            </div>

            {/* Quick Add Bar & Filters in a clean control panel */}
            <div className="space-y-3 bg-[var(--bg-main)]/50 p-3.5 rounded-xl border border-[var(--border-subtle)]">
              {/* Quick Add Bar */}
              <form onSubmit={handleQuickAddSubmit}>
                <div className="relative flex items-center">
                  <Sparkles className="absolute left-3.5 h-4 w-4 text-[var(--accent-terracotta)] shrink-0" />
                  <input
                    type="text"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    placeholder="Quick add task title..."
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] pl-10 pr-24 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] transition-colors shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!quickAddTitle.trim()}
                    className="absolute right-1.5 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40 transition shadow-2xs"
                  >
                    Add Task
                  </button>
                </div>
              </form>

              {/* Search & Filter Controls Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Search Box */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Filter by keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] pl-8.5 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Dropdown Filters & Toggles */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                  {/* Priority Filter */}
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel | 'all')}
                    aria-label="Filter by priority"
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">🌱 Low</option>
                  </select>

                  {/* Smart Sort */}
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    aria-label="Smart Sort order"
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none font-medium"
                  >
                    <option value="recent">Sort: Default</option>
                    <option value="quick_wins">Sort: Quick Wins</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="due_date">Sort: Due Date</option>
                  </select>

                  {/* Hide/Show Completed Toggle */}
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      showCompleted
                        ? 'border-[var(--border-subtle)] bg-[var(--card-hover)] text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {showCompleted ? 'Hide Done' : 'Show Done'}
                  </button>
                </div>
              </div>

              {/* Tag Chips */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[var(--border-subtle)]/60">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-0.5 flex items-center gap-1">
                    <TagIcon className="h-3 w-3" /> Tags:
                  </span>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      selectedTag === null
                        ? 'bg-[var(--accent-terracotta)] text-white font-semibold'
                        : 'bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-[var(--accent-terracotta)] text-white font-semibold'
                          : 'bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Banners (Overdue & Date Filter) */}
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
    </div>

      {/* Modal for Creating or Editing Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                {editingTaskId ? (
                  <>
                    <Pencil className="h-4 w-4 text-[var(--accent-terracotta)]" />
                    <span>Edit Tactical Task</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-[var(--accent-terracotta)]" />
                    <span>Create New Tactical Task</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTaskId(null);
                }}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
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
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
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
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)] resize-none"
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
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)]"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSomeday"
                  checked={newIsSomeday}
                  onChange={(e) => setNewIsSomeday(e.target.checked)}
                  className="rounded border-[var(--border-subtle)] accent-[var(--accent-dusty-mauve)]"
                />
                <label htmlFor="isSomeday" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                  Mark as Someday / Backlog Idea 💡
                </label>
              </div>

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
                        className="rounded border-[var(--border-subtle)] accent-[var(--accent-terracotta)] disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2 text-xs font-semibold shadow-xs"
                >
                  {editingTaskId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={Boolean(taskToEdit)}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSave={(id, updatedFields) => {
          if (onUpdateTask) {
            onUpdateTask(id, updatedFields);
          }
          setTaskToEdit(null);
        }}
      />
    </div>
  );
};

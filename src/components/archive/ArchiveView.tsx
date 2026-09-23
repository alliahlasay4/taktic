import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  RotateCcw,
  Trash2,
  Download,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpDown,
  FileText,
  AlertCircle,
  Sparkles,
  CheckSquare,
  Square,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Task, PriorityLevel } from '../../types';

interface ArchiveViewProps {
  tasks: Task[];
  onUnarchiveTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onBatchUnarchiveTasks: (ids: string[]) => void;
  onBatchDeleteTasks: (ids: string[]) => void;
  onNavigateToInbox?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  tasks,
  onUnarchiveTask,
  onDeleteTask,
  onBatchUnarchiveTasks,
  onBatchDeleteTasks,
  onNavigateToInbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'today' | 'week' | 'month' | 'older'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // Filter archived tasks only
  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.archived);
  }, [tasks]);

  // Extract all unique project tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    archivedTasks.forEach((t) => {
      t.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [archivedTasks]);

  // Filtered tasks based on search & filter criteria
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedTasks.filter((t) => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesTags = t.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Tag Filter
      if (selectedTag !== 'all' && !t.tags?.includes(selectedTag)) {
        return false;
      }

      // Time Horizon Filter
      if (timeHorizon !== 'all') {
        const dateToEvaluate = t.archivedAt || t.completedAt || t.dueDate;
        if (!dateToEvaluate) return timeHorizon === 'older';

        const itemDate = new Date(dateToEvaluate);
        const itemDateStr = itemDate.toISOString().split('T')[0];

        if (timeHorizon === 'today') {
          return itemDateStr === todayStr;
        } else if (timeHorizon === 'week') {
          return itemDate >= sevenDaysAgo;
        } else if (timeHorizon === 'month') {
          return itemDate >= thirtyDaysAgo && itemDate < sevenDaysAgo;
        } else if (timeHorizon === 'older') {
          return itemDate < thirtyDaysAgo;
        }
      }

      return true;
    });
  }, [archivedTasks, searchQuery, selectedPriority, selectedTag, timeHorizon]);

  // Group tasks by date categories
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const groups: {
      today: Task[];
      yesterday: Task[];
      thisWeek: Task[];
      earlierThisMonth: Task[];
      older: Task[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlierThisMonth: [],
      older: [],
    };

    filteredTasks.forEach((task) => {
      const dateStr = task.archivedAt || task.completedAt || task.dueDate;
      if (!dateStr) {
        groups.older.push(task);
        return;
      }

      const dateObj = new Date(dateStr);
      const isoDay = dateObj.toISOString().split('T')[0];

      if (isoDay === todayStr) {
        groups.today.push(task);
      } else if (isoDay === yesterday) {
        groups.yesterday.push(task);
      } else if (dateObj >= sevenDaysAgo) {
        groups.thisWeek.push(task);
      } else if (dateObj >= thirtyDaysAgo) {
        groups.earlierThisMonth.push(task);
      } else {
        groups.older.push(task);
      }
    });

    return [
      { id: 'today', title: 'Archived Today', items: groups.today },
      { id: 'yesterday', title: 'Yesterday', items: groups.yesterday },
      { id: 'thisWeek', title: 'This Week', items: groups.thisWeek },
      { id: 'earlierThisMonth', title: 'Earlier This Month', items: groups.earlierThisMonth },
      { id: 'older', title: 'Older Records', items: groups.older },
    ].filter((g) => g.items.length > 0);
  }, [filteredTasks]);

  // Active selected task for right-pane inspector
  const activeTask = useMemo(() => {
    if (!selectedTaskId && filteredTasks.length > 0) {
      return filteredTasks[0];
    }
    return filteredTasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, filteredTasks]);

  // Handle Multi-Select Checkboxes
  const handleToggleSelectId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  };

  // Export Selected or All to CSV
  const handleExportCSV = (tasksToExport: Task[]) => {
    const rows = [
      ['Taktic Archive Export', `Exported on ${new Date().toLocaleDateString()}`],
      [],
      ['Task ID', 'Title', 'Priority', 'Tags', 'Archived Date', 'Completed Date', 'Estimated Minutes'],
      ...tasksToExport.map((t) => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.priority,
        `"${(t.tags || []).join(', ')}"`,
        t.archivedAt ? new Date(t.archivedAt).toLocaleString() : '',
        t.completedAt ? new Date(t.completedAt).toLocaleString() : '',
        t.estimatedMinutes || '',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taktic-archive-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Export JSON
  const handleExportJSON = (tasksToExport: Task[]) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tasksToExport, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `taktic-archive-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Summary Metrics
  const totalMinutesSaved = useMemo(() => {
    return archivedTasks.reduce((acc, curr) => acc + (curr.estimatedMinutes || 25), 0);
  }, [archivedTasks]);

  const priorityBreakdown = useMemo(() => {
    const high = archivedTasks.filter((t) => t.priority === 'high').length;
    const med = archivedTasks.filter((t) => t.priority === 'medium').length;
    const low = archivedTasks.filter((t) => t.priority === 'low').length;
    return { high, med, low };
  }, [archivedTasks]);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]">
              <Archive className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Archive & History
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--theme-surface-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              {archivedTasks.length} Archived
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Search, inspect, and restore completed work or keep past sprint records safely preserved.
          </p>
        </div>

        {/* Global Summary Stats & Export Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-2xs">
            <div className="text-center">
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                Focus Time Saved
              </span>
              <span className="text-sm font-bold text-[var(--accent-botanical-sage)]">
                {Math.round(totalMinutesSaved / 60)}h {totalMinutesSaved % 60}m
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[var(--border-subtle)]" />
            <div className="text-center">
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                High Priority
              </span>
              <span className="text-sm font-bold text-[var(--accent-dusty-rose)]">
                {priorityBreakdown.high}
              </span>
            </div>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={archivedTasks.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
              <span>Export History</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => handleExportCSV(filteredTasks)}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center justify-between"
                >
                  <span>Export Filtered (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{filteredTasks.length}</span>
                </button>
                <button
                  onClick={() => handleExportCSV(archivedTasks)}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center justify-between"
                >
                  <span>Export All (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{archivedTasks.length}</span>
                </button>
                <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                <button
                  onClick={() => handleExportJSON(archivedTasks)}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                >
                  Backup All (JSON)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--card-surface)] p-3 rounded-2xl border border-[var(--border-subtle)] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived tasks, tags, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-terracotta)]/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Filter */}
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="older">Older</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden"
            >
              <option value="all">All Projects</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          {/* Select All Toggle */}
          {filteredTasks.length > 0 && (
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
            >
              {selectedIds.length === filteredTasks.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
              <span>{selectedIds.length === filteredTasks.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      {archivedTasks.length === 0 ? (
        /* Empty State (No Archived Tasks in System) */
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/50 text-center space-y-4 my-8">
          <div className="p-4 rounded-2xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
            <Archive className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Your Archive is Clean & Clear
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Completed tasks can be swept to the archive from the Board and Daily Planner to keep your workspace decluttered.
            </p>
          </div>
          {onNavigateToInbox && (
            <button
              onClick={onNavigateToInbox}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 transition-opacity shadow-xs"
            >
              Go to Active Tasks
            </button>
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Search / Filter Zero State */
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-center space-y-3">
          <Filter className="w-8 h-8 text-[var(--text-muted)]" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            No archived tasks match your filters
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Try adjusting your search query or reset your priority and date filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPriority('all');
              setSelectedTag('all');
              setTimeHorizon('all');
            }}
            className="px-3 py-1.5 text-xs font-medium text-[var(--accent-terracotta)] hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Split Pane: Left Timeline List | Right Inspector Pane */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Searchable Grouped Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {groupedTasks.map((group) => (
              <div key={group.id} className="space-y-2.5">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {group.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {group.items.length} {group.items.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {group.items.map((task) => {
                    const isSelected = activeTask?.id === task.id;
                    const isChecked = selectedIds.includes(task.id);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`group relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--theme-surface-active)] border-[var(--accent-terracotta)]/40 shadow-xs'
                            : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--theme-surface-hover)]'
                        }`}
                      >
                        {/* Checkbox for Bulk Actions */}
                        <button
                          onClick={(e) => handleToggleSelectId(task.id, e)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                          ) : (
                            <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          )}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium line-through ${
                                isSelected
                                  ? 'text-[var(--text-primary)] font-semibold'
                                  : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {task.title}
                            </span>

                            {/* Priority Pill */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                task.priority === 'high'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Description Snippet */}
                          {task.description && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}

                          {/* Tags & Metadata Badges */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-[var(--text-muted)]">
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                                <span>{task.tags.join(', ')}</span>
                              </div>
                            )}

                            {task.estimatedMinutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimatedMinutes}m</span>
                              </div>
                            )}

                            {task.archivedAt && (
                              <span>
                                Archived {new Date(task.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Hover Action: 1-Click Restore */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnarchiveTask(task.id);
                            }}
                            title="Restore to Active Board"
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Pane: Inspector & Detail View (5 cols) */}
          <div className="lg:col-span-5 sticky top-6">
            {activeTask ? (
              <div className="bg-[var(--card-surface)] rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xs space-y-6">
                {/* Header with Title & Action Pill */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        activeTask.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : activeTask.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {activeTask.priority} Priority
                    </span>

                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
                      Completed
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {activeTask.title}
                  </h2>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--theme-surface-active)]/50 border border-[var(--border-subtle)] text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                      Archived Date
                    </span>
                    <span className="font-medium text-[var(--text-secondary)]">
                      {activeTask.archivedAt
                        ? new Date(activeTask.archivedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Historical Archive'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                      Estimated Duration
                    </span>
                    <span className="font-medium text-[var(--text-secondary)]">
                      {activeTask.estimatedMinutes ? `${activeTask.estimatedMinutes} mins` : '25 mins (Default)'}
                    </span>
                  </div>

                  {activeTask.dueDate && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                        Original Due Date
                      </span>
                      <span className="font-medium text-[var(--text-secondary)]">
                        {activeTask.dueDate}
                      </span>
                    </div>
                  )}

                  {activeTask.timeBlock && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                        Time Block Slot
                      </span>
                      <span className="font-medium text-[var(--text-secondary)] capitalize">
                        {activeTask.timeBlock} Block
                      </span>
                    </div>
                  )}
                </div>

                {/* Description & Notes */}
                {activeTask.description ? (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Description & Context
                    </span>
                    <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {activeTask.description}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[var(--input-bg)]/50 border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)] text-center">
                    No extra description recorded for this task.
                  </div>
                )}

                {/* Project Tags */}
                {activeTask.tags && activeTask.tags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Project Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTask.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--theme-surface-active)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions: Restore or Delete */}
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  <button
                    onClick={() => onUnarchiveTask(activeTask.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore to Active Board</span>
                  </button>

                  {confirmDeleteId === activeTask.id ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        Permanently delete this task? This cannot be undone.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            onDeleteTask(activeTask.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-[var(--theme-surface-active)] text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(activeTask.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs text-[var(--accent-dusty-rose)] hover:bg-[var(--accent-dusty-rose)]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-center text-xs text-[var(--text-muted)]">
                Select a task from the list to inspect details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-xl animate-in slide-in-from-bottom-5">
          <span className="text-xs font-semibold text-[var(--text-primary)] pr-2 border-r border-[var(--border-subtle)]">
            {selectedIds.length} {selectedIds.length === 1 ? 'task' : 'tasks'} selected
          </span>

          {/* Batch Restore */}
          <button
            onClick={() => {
              onBatchUnarchiveTasks(selectedIds);
              setSelectedIds([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Selected</span>
          </button>

          {/* Batch Export */}
          <button
            onClick={() => {
              const selectedTasksList = archivedTasks.filter((t) => selectedIds.includes(t.id));
              handleExportCSV(selectedTasksList);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
            <span>Export (CSV)</span>
          </button>

          {/* Batch Delete */}
          {confirmBatchDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onBatchDeleteTasks(selectedIds);
                  setSelectedIds([]);
                  setConfirmBatchDelete(false);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Delete ({selectedIds.length})
              </button>
              <button
                onClick={() => setConfirmBatchDelete(false)}
                className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmBatchDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Clear Selection */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] pl-2 border-l border-[var(--border-subtle)]"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
};

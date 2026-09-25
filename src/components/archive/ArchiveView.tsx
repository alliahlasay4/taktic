import React, { useState, useMemo, useEffect } from 'react';
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
  FileText,
  CheckSquare,
  Square,
  StickyNote,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Task, PriorityLevel, QuickNote, NoteColor } from '../../types';
import { Pagination } from '../common/Pagination';

interface ArchiveViewProps {
  tasks: Task[];
  notes?: QuickNote[];
  onUnarchiveTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onBatchUnarchiveTasks: (ids: string[]) => void;
  onBatchDeleteTasks: (ids: string[]) => void;
  onUnarchiveNote?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onBatchUnarchiveNotes?: (ids: string[]) => void;
  onBatchDeleteNotes?: (ids: string[]) => void;
  onNavigateToInbox?: () => void;
}

const COLOR_THEMES: Record<
  NoteColor,
  { label: string; border: string; bg: string; dot: string; text: string; badge: string }
> = {
  sage: {
    label: 'Sage',
    border: 'border-[var(--accent-botanical-sage)]/30',
    bg: 'bg-[var(--accent-botanical-sage)]/10',
    dot: 'bg-[var(--accent-botanical-sage)]',
    text: 'text-[var(--accent-botanical-sage)]',
    badge: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border-[var(--accent-botanical-sage)]/30',
  },
  terracotta: {
    label: 'Terracotta',
    border: 'border-[var(--accent-terracotta)]/30',
    bg: 'bg-[var(--accent-terracotta)]/10',
    dot: 'bg-[var(--accent-terracotta)]',
    text: 'text-[var(--accent-terracotta)]',
    badge: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/30',
  },
  ochre: {
    label: 'Ochre',
    border: 'border-[var(--accent-warm-ochre)]/30',
    bg: 'bg-[var(--accent-warm-ochre)]/10',
    dot: 'bg-[var(--accent-warm-ochre)]',
    text: 'text-[var(--accent-warm-ochre)]',
    badge: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/30',
  },
  rose: {
    label: 'Rose',
    border: 'border-[var(--accent-dusty-rose)]/30',
    bg: 'bg-[var(--accent-dusty-rose)]/10',
    dot: 'bg-[var(--accent-dusty-rose)]',
    text: 'text-[var(--accent-dusty-rose)]',
    badge: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/30',
  },
  slate: {
    label: 'Slate',
    border: 'border-[var(--border-subtle)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--text-muted)]',
    text: 'text-[var(--text-secondary)]',
    badge: 'bg-[var(--theme-surface-active)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  },
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  tasks,
  notes = [],
  onUnarchiveTask,
  onDeleteTask,
  onBatchUnarchiveTasks,
  onBatchDeleteTasks,
  onUnarchiveNote,
  onDeleteNote,
  onBatchUnarchiveNotes,
  onBatchDeleteNotes,
  onNavigateToInbox,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNoteColor, setSelectedNoteColor] = useState<NoteColor | 'all'>('all');
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'today' | 'week' | 'month' | 'older'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Pagination states
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksPageSize, setTasksPageSize] = useState<number>(10);
  const [notesPage, setNotesPage] = useState<number>(1);
  const [notesPageSize, setNotesPageSize] = useState<number>(10);

  // Filter archived items
  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.archived);
  }, [tasks]);

  const archivedNotes = useMemo(() => {
    return notes.filter((n) => n.archived);
  }, [notes]);

  // Extract all unique project tags from tasks
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

  // Filtered notes based on search & filter criteria
  const filteredNotes = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedNotes.filter((n) => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(query);
        const matchesContent = n.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      // Color Filter
      if (selectedNoteColor !== 'all' && n.color !== selectedNoteColor) {
        return false;
      }

      // Time Horizon Filter
      if (timeHorizon !== 'all') {
        const dateToEvaluate = n.archivedAt || n.updatedAt || n.createdAt;
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
  }, [archivedNotes, searchQuery, selectedNoteColor, timeHorizon]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setTasksPage(1);
  }, [searchQuery, selectedPriority, selectedTag, timeHorizon]);

  useEffect(() => {
    setNotesPage(1);
  }, [searchQuery, selectedNoteColor, timeHorizon]);

  // Pagination calculations for Tasks
  const tasksTotalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPageSize));
  const tasksSafePage = Math.min(tasksPage, tasksTotalPages);
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice((tasksSafePage - 1) * tasksPageSize, tasksSafePage * tasksPageSize);
  }, [filteredTasks, tasksSafePage, tasksPageSize]);

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

    paginatedTasks.forEach((task) => {
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
  }, [paginatedTasks]);

  // Pagination calculations for Notes
  const notesTotalPages = Math.max(1, Math.ceil(filteredNotes.length / notesPageSize));
  const notesSafePage = Math.min(notesPage, notesTotalPages);
  const paginatedNotes = useMemo(() => {
    return filteredNotes.slice((notesSafePage - 1) * notesPageSize, notesSafePage * notesPageSize);
  }, [filteredNotes, notesSafePage, notesPageSize]);

  // Group notes by date categories
  const groupedNotes = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const groups: {
      today: QuickNote[];
      yesterday: QuickNote[];
      thisWeek: QuickNote[];
      earlierThisMonth: QuickNote[];
      older: QuickNote[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlierThisMonth: [],
      older: [],
    };

    paginatedNotes.forEach((note) => {
      const dateStr = note.archivedAt || note.updatedAt || note.createdAt;
      if (!dateStr) {
        groups.older.push(note);
        return;
      }

      const dateObj = new Date(dateStr);
      const isoDay = dateObj.toISOString().split('T')[0];

      if (isoDay === todayStr) {
        groups.today.push(note);
      } else if (isoDay === yesterday) {
        groups.yesterday.push(note);
      } else if (dateObj >= sevenDaysAgo) {
        groups.thisWeek.push(note);
      } else if (dateObj >= thirtyDaysAgo) {
        groups.earlierThisMonth.push(note);
      } else {
        groups.older.push(note);
      }
    });

    return [
      { id: 'today', title: 'Archived Today', items: groups.today },
      { id: 'yesterday', title: 'Yesterday', items: groups.yesterday },
      { id: 'thisWeek', title: 'This Week', items: groups.thisWeek },
      { id: 'earlierThisMonth', title: 'Earlier This Month', items: groups.earlierThisMonth },
      { id: 'older', title: 'Older Records', items: groups.older },
    ].filter((g) => g.items.length > 0);
  }, [paginatedNotes]);

  // Active selected task for inspector
  const activeTask = useMemo(() => {
    if (!selectedTaskId && paginatedTasks.length > 0) {
      return paginatedTasks[0];
    }
    return paginatedTasks.find((t) => t.id === selectedTaskId) || paginatedTasks[0] || null;
  }, [selectedTaskId, paginatedTasks]);

  // Active selected note for inspector
  const activeNote = useMemo(() => {
    if (!selectedNoteId && paginatedNotes.length > 0) {
      return paginatedNotes[0];
    }
    return paginatedNotes.find((n) => n.id === selectedNoteId) || paginatedNotes[0] || null;
  }, [selectedNoteId, paginatedNotes]);

  // Multi-Select for Tasks
  const handleToggleSelectTaskId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredTasks = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  // Multi-Select for Notes
  const handleToggleSelectNoteId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredNotes = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map((n) => n.id));
    }
  };

  // Handle Copy Note Content
  const handleCopyNoteContent = (note: QuickNote) => {
    const textToCopy = `${note.title ? note.title + '\n' : ''}${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Export Tasks
  const handleExportTasksCSV = (tasksToExport: Task[]) => {
    const rows = [
      ['Taktic Archive Export - Tasks', `Exported on ${new Date().toLocaleDateString()}`],
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
    link.setAttribute('download', `taktic-tasks-archive-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Export Notes
  const handleExportNotesCSV = (notesToExport: QuickNote[]) => {
    const rows = [
      ['Taktic Archive Export - Scratchpad Notes', `Exported on ${new Date().toLocaleDateString()}`],
      [],
      ['Note ID', 'Title', 'Content', 'Color', 'Archived Date', 'Created Date'],
      ...notesToExport.map((n) => [
        n.id,
        `"${(n.title || '').replace(/"/g, '""')}"`,
        `"${n.content.replace(/"/g, '""')}"`,
        n.color,
        n.archivedAt ? new Date(n.archivedAt).toLocaleString() : '',
        new Date(n.createdAt).toLocaleString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taktic-notes-archive-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Export JSON
  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      tasks: archivedTasks,
      notes: archivedNotes,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `taktic-full-archive-backup-${new Date().toISOString().split('T')[0]}.json`);
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
    <div className="flex flex-col h-full w-full space-y-6 pb-20">
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
              {archivedTasks.length + archivedNotes.length} Archived
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Search, inspect, and restore completed work or deleted scratchpad notes.
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
                Notes Archived
              </span>
              <span className="text-sm font-bold text-[var(--accent-warm-ochre)]">
                {archivedNotes.length}
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
              disabled={archivedTasks.length === 0 && archivedNotes.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
              <span>Export History</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => handleExportTasksCSV(filteredTasks)}
                  disabled={filteredTasks.length === 0}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center justify-between disabled:opacity-50"
                >
                  <span>Export Filtered Tasks (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{filteredTasks.length}</span>
                </button>
                <button
                  onClick={() => handleExportNotesCSV(filteredNotes)}
                  disabled={filteredNotes.length === 0}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] flex items-center justify-between disabled:opacity-50"
                >
                  <span>Export Filtered Notes (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{filteredNotes.length}</span>
                </button>
                <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]"
                >
                  Full Backup (JSON)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Tab Switcher (Tasks vs Scratchpad Notes) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-2xs">
          <button
            onClick={() => {
              setActiveTab('tasks');
              setSearchQuery('');
              setConfirmDeleteId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Master Tasks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-[var(--theme-surface-active)] text-[var(--text-muted)]'
              }`}
            >
              {archivedTasks.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notes');
              setSearchQuery('');
              setConfirmDeleteId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Scratchpad Notes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-[var(--theme-surface-active)] text-[var(--text-muted)]'
              }`}
            >
              {archivedNotes.length}
            </span>
          </button>
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
            placeholder={
              activeTab === 'tasks'
                ? 'Search archived tasks, descriptions, or tags...'
                : 'Search archived scratchpad notes & ideas...'
            }
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

          {/* Conditional Filters for Tasks vs Notes */}
          {activeTab === 'tasks' ? (
            <>
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

              {/* Select All Toggle for Tasks */}
              {filteredTasks.length > 0 && (
                <button
                  onClick={handleSelectAllFilteredTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
                >
                  {selectedTaskIds.length === filteredTasks.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{selectedTaskIds.length === filteredTasks.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Color Theme Filter */}
              <select
                value={selectedNoteColor}
                onChange={(e) => setSelectedNoteColor(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden capitalize"
              >
                <option value="all">All Colors</option>
                <option value="sage">Sage</option>
                <option value="terracotta">Terracotta</option>
                <option value="ochre">Ochre</option>
                <option value="rose">Rose</option>
                <option value="slate">Slate</option>
              </select>

              {/* Select All Toggle for Notes */}
              {filteredNotes.length > 0 && (
                <button
                  onClick={handleSelectAllFilteredNotes}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
                >
                  {selectedNoteIds.length === filteredNotes.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{selectedNoteIds.length === filteredNotes.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======================= TASKS ARCHIVE TAB ======================= */}
      {activeTab === 'tasks' && (
        <>
          {archivedTasks.length === 0 ? (
            /* Empty State (No Archived Tasks) */
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/50 text-center space-y-4 my-8">
              <div className="p-4 rounded-2xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
                <Archive className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Your Task Archive is Clean & Clear
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
            /* Filter Zero State */
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
            /* Split Pane: Left Tasks Timeline | Right Task Inspector */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Tasks List (7 cols) */}
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
                        const isChecked = selectedTaskIds.includes(task.id);

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
                              onClick={(e) => handleToggleSelectTaskId(task.id, e)}
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

                {/* Tasks Pagination Controls */}
                <Pagination
                  currentPage={tasksSafePage}
                  totalItems={filteredTasks.length}
                  pageSize={tasksPageSize}
                  onPageChange={setTasksPage}
                  onPageSizeChange={setTasksPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemName="archived tasks"
                />
              </div>

              {/* Right Pane: Task Inspector & Detail View (5 cols) */}
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

          {/* Sticky Bottom Batch Action Bar for Tasks */}
          {selectedTaskIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-xl animate-in slide-in-from-bottom-5">
              <span className="text-xs font-semibold text-[var(--text-primary)] pr-2 border-r border-[var(--border-subtle)]">
                {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'task' : 'tasks'} selected
              </span>

              {/* Batch Restore */}
              <button
                onClick={() => {
                  onBatchUnarchiveTasks(selectedTaskIds);
                  setSelectedTaskIds([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Selected</span>
              </button>

              {/* Batch Export */}
              <button
                onClick={() => {
                  const selectedTasksList = archivedTasks.filter((t) => selectedTaskIds.includes(t.id));
                  handleExportTasksCSV(selectedTasksList);
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
                      onBatchDeleteTasks(selectedTaskIds);
                      setSelectedTaskIds([]);
                      setConfirmBatchDelete(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Confirm Delete ({selectedTaskIds.length})
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
                onClick={() => setSelectedTaskIds([])}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] pl-2 border-l border-[var(--border-subtle)]"
              >
                Deselect
              </button>
            </div>
          )}
        </>
      )}

      {/* ======================= NOTES ARCHIVE TAB ======================= */}
      {activeTab === 'notes' && (
        <>
          {archivedNotes.length === 0 ? (
            /* Empty State (No Archived Notes) */
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/50 text-center space-y-4 my-8">
              <div className="p-4 rounded-2xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
                <StickyNote className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Your Scratchpad Archive is Clean & Clear
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Deleting notes from your Scratchpad drawer automatically moves them to this Archive so you never lose ideas or fleeting thoughts.
                </p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            /* Filter Zero State */
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-center space-y-3">
              <Filter className="w-8 h-8 text-[var(--text-muted)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                No archived scratchpad notes match your filters
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Try searching for different keywords or reset your date and color filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedNoteColor('all');
                  setTimeHorizon('all');
                }}
                className="px-3 py-1.5 text-xs font-medium text-[var(--accent-terracotta)] hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Split Pane: Left Notes Timeline | Right Note Inspector */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Notes List (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {groupedNotes.map((group) => (
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
                        {group.items.length} {group.items.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      {group.items.map((note) => {
                        const isSelected = activeNote?.id === note.id;
                        const isChecked = selectedNoteIds.includes(note.id);
                        const theme = COLOR_THEMES[note.color] || COLOR_THEMES.slate;

                        return (
                          <div
                            key={note.id}
                            onClick={() => setSelectedNoteId(note.id)}
                            className={`group relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--theme-surface-active)] border-[var(--accent-terracotta)]/40 shadow-xs'
                                : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--theme-surface-hover)]'
                            }`}
                          >
                            {/* Checkbox for Bulk Actions */}
                            <button
                              onClick={(e) => handleToggleSelectNoteId(note.id, e)}
                              className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                              ) : (
                                <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                              )}
                            </button>

                            {/* Note Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                  }`}
                                >
                                  {note.title || 'Untitled Scratch Note'}
                                </span>

                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                  {theme.label}
                                </span>
                              </div>

                              {/* Note Snippet */}
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1.5 leading-relaxed">
                                {note.content}
                              </p>

                              {/* Metadata */}
                              <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-muted)]">
                                <span>
                                  Archived {note.archivedAt ? new Date(note.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                                </span>
                              </div>
                            </div>

                            {/* Quick Hover Action: 1-Click Restore */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnarchiveNote?.(note.id);
                                }}
                                title="Restore to Scratchpad"
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

                {/* Notes Pagination Controls */}
                <Pagination
                  currentPage={notesSafePage}
                  totalItems={filteredNotes.length}
                  pageSize={notesPageSize}
                  onPageChange={setNotesPage}
                  onPageSizeChange={setNotesPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  itemName="archived notes"
                />
              </div>

              {/* Right Pane: Note Inspector & Detail View (5 cols) */}
              <div className="lg:col-span-5 sticky top-6">
                {activeNote ? (
                  <div className="bg-[var(--card-surface)] rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xs space-y-6">
                    {/* Header with Title & Color Theme Pill */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${COLOR_THEMES[activeNote.color]?.badge}`}>
                          {COLOR_THEMES[activeNote.color]?.label || 'Note'}
                        </span>

                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Archive className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
                          Archived
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[var(--text-primary)] leading-snug">
                        {activeNote.title || 'Untitled Scratchpad Note'}
                      </h2>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--theme-surface-active)]/50 border border-[var(--border-subtle)] text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                          Archived Date
                        </span>
                        <span className="font-medium text-[var(--text-secondary)]">
                          {activeNote.archivedAt
                            ? new Date(activeNote.archivedAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Recently'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                          Created Date
                        </span>
                        <span className="font-medium text-[var(--text-secondary)]">
                          {new Date(activeNote.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Note Content
                        </span>
                        <button
                          onClick={() => handleCopyNoteContent(activeNote)}
                          className="flex items-center gap-1 text-[11px] text-[var(--accent-botanical-sage)] hover:underline"
                        >
                          {copiedNoteId === activeNote.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-1 whitespace-pre-wrap font-sans">
                        {activeNote.content.split('\n').map((line, idx) => {
                          const isCheckboxUnchecked = line.startsWith('- [ ]');
                          const isCheckboxChecked = line.startsWith('- [x]') || line.startsWith('- [X]');
                          if (isCheckboxUnchecked || isCheckboxChecked) {
                            const text = line.replace(/^- \[[ xX]\]\s*/, '');
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="mt-0.5 shrink-0">
                                  {isCheckboxChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                  )}
                                </span>
                                <span className={isCheckboxChecked ? 'line-through text-[var(--text-muted)]' : ''}>
                                  {text}
                                </span>
                              </div>
                            );
                          }
                          return <div key={idx}>{line || '\u00A0'}</div>;
                        })}
                      </div>
                    </div>

                    {/* Actions: Restore or Delete */}
                    <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                      <button
                        onClick={() => onUnarchiveNote?.(activeNote.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore to Scratchpad</span>
                      </button>

                      {confirmDeleteId === activeNote.id ? (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                            Permanently delete this note? This cannot be undone.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                onDeleteNote?.(activeNote.id);
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
                          onClick={() => setConfirmDeleteId(activeNote.id)}
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
                    Select a note from the list to inspect details.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Bottom Batch Action Bar for Notes */}
          {selectedNoteIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-xl animate-in slide-in-from-bottom-5">
              <span className="text-xs font-semibold text-[var(--text-primary)] pr-2 border-r border-[var(--border-subtle)]">
                {selectedNoteIds.length} {selectedNoteIds.length === 1 ? 'note' : 'notes'} selected
              </span>

              {/* Batch Restore */}
              <button
                onClick={() => {
                  onBatchUnarchiveNotes?.(selectedNoteIds);
                  setSelectedNoteIds([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Selected</span>
              </button>

              {/* Batch Export */}
              <button
                onClick={() => {
                  const selectedNotesList = archivedNotes.filter((n) => selectedNoteIds.includes(n.id));
                  handleExportNotesCSV(selectedNotesList);
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
                      onBatchDeleteNotes?.(selectedNoteIds);
                      setSelectedNoteIds([]);
                      setConfirmBatchDelete(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Confirm Delete ({selectedNoteIds.length})
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
                onClick={() => setSelectedNoteIds([])}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] pl-2 border-l border-[var(--border-subtle)]"
              >
                Deselect
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

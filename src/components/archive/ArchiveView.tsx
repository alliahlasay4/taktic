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
  X,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Shield,
  Repeat,
  Trophy,
  Target,
} from 'lucide-react';
import { Task, PriorityLevel, QuickNote, NoteColor, Habit } from '../../types';
import { Pagination } from '../common/Pagination';
import { downloadCsvFile } from '../../lib/csvSecurity';
import { IconRenderer } from '../common/IconRenderer';

interface ArchiveViewProps {
  tasks: Task[];
  notes?: QuickNote[];
  habits?: Habit[];
  onUnarchiveTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onBatchUnarchiveTasks: (ids: string[]) => void;
  onBatchDeleteTasks: (ids: string[]) => void;
  onUnarchiveNote?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onBatchUnarchiveNotes?: (ids: string[]) => void;
  onBatchDeleteNotes?: (ids: string[]) => void;
  onUnarchiveHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => void;
  onBatchUnarchiveHabits?: (ids: string[]) => void;
  onBatchDeleteHabits?: (ids: string[]) => void;
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

const HABIT_CATEGORIES: Record<
  string,
  { label: string; badge: string; icon: string }
> = {
  health: {
    label: 'Health',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: 'heart',
  },
  mindset: {
    label: 'Mindset',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: 'book',
  },
  growth: {
    label: 'Growth',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    icon: 'sunrise',
  },
  creative: {
    label: 'Creative',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: 'target',
  },
  fitness: {
    label: 'Fitness',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: 'activity',
  },
};

/**
 * Renders text with subtle matching query highlights for search terms
 */
const HighlightedText: React.FC<{ text: string; query: string; className?: string }> = ({
  text,
  query,
  className = '',
}) => {
  const trimmed = query.trim();
  if (!trimmed || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={index}
            className="bg-[var(--accent-warm-ochre)]/25 text-[var(--text-primary)] rounded-xs px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  tasks,
  notes = [],
  habits = [],
  onUnarchiveTask,
  onDeleteTask,
  onBatchUnarchiveTasks,
  onBatchDeleteTasks,
  onUnarchiveNote,
  onDeleteNote,
  onBatchUnarchiveNotes,
  onBatchDeleteNotes,
  onUnarchiveHabit,
  onDeleteHabit,
  onBatchUnarchiveHabits,
  onBatchDeleteHabits,
  onNavigateToInbox,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'habits'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNoteColor, setSelectedNoteColor] = useState<NoteColor | 'all'>('all');
  const [selectedHabitCategory, setSelectedHabitCategory] = useState<string>('all');
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'today' | 'week' | 'month' | 'older'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const [isPurgeWizardOpen, setIsPurgeWizardOpen] = useState(false);
  const [purgeTargetDays, setPurgeTargetDays] = useState<30 | 60 | 90>(30);
  const [purgeScope, setPurgeScope] = useState<'all' | 'both' | 'tasks' | 'notes' | 'habits'>('all');
  const [purgeConfirmationInput, setPurgeConfirmationInput] = useState('');

  // Pagination states
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksPageSize, setTasksPageSize] = useState<number>(10);
  const [notesPage, setNotesPage] = useState<number>(1);
  const [notesPageSize, setNotesPageSize] = useState<number>(10);
  const [habitsPage, setHabitsPage] = useState<number>(1);
  const [habitsPageSize, setHabitsPageSize] = useState<number>(10);

  // Filter archived items
  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.archived);
  }, [tasks]);

  const archivedNotes = useMemo(() => {
    return notes.filter((n) => n.archived);
  }, [notes]);

  const archivedHabits = useMemo(() => {
    return habits.filter((h) => h.archived);
  }, [habits]);

  // Extract all unique project tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    archivedTasks.forEach((t) => {
      t.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [archivedTasks]);

  // Purge Candidate Items (Calculated against purgeTargetDays: 30, 60, or 90 days)
  const { purgeCandidateTasks, purgeCandidateNotes, purgeCandidateHabits } = useMemo(() => {
    const cutoff = new Date(Date.now() - purgeTargetDays * 86400000);

    const candidateTasks = archivedTasks.filter((t) => {
      const dateToEvaluate = t.archivedAt || t.completedAt || t.dueDate;
      if (!dateToEvaluate) return false;
      return new Date(dateToEvaluate) < cutoff;
    });

    const candidateNotes = archivedNotes.filter((n) => {
      const dateToEvaluate = n.archivedAt || n.updatedAt || n.createdAt;
      if (!dateToEvaluate) return false;
      return new Date(dateToEvaluate) < cutoff;
    });

    const candidateHabits = archivedHabits.filter((h) => {
      const dateToEvaluate = h.archivedAt || h.createdAt;
      if (!dateToEvaluate) return false;
      return new Date(dateToEvaluate) < cutoff;
    });

    return {
      purgeCandidateTasks: candidateTasks,
      purgeCandidateNotes: candidateNotes,
      purgeCandidateHabits: candidateHabits,
    };
  }, [archivedTasks, archivedNotes, archivedHabits, purgeTargetDays]);

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

  // Filtered habits based on search & filter criteria
  const filteredHabits = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedHabits.filter((h) => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(query);
        const matchesCategory = h.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      // Category Filter
      if (selectedHabitCategory !== 'all' && h.category !== selectedHabitCategory) {
        return false;
      }

      // Time Horizon Filter
      if (timeHorizon !== 'all') {
        const dateToEvaluate = h.archivedAt || h.createdAt;
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
  }, [archivedHabits, searchQuery, selectedHabitCategory, timeHorizon]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setTasksPage(1);
  }, [searchQuery, selectedPriority, selectedTag, timeHorizon]);

  useEffect(() => {
    setNotesPage(1);
  }, [searchQuery, selectedNoteColor, timeHorizon]);

  useEffect(() => {
    setHabitsPage(1);
  }, [searchQuery, selectedHabitCategory, timeHorizon]);

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

  // Pagination calculations for Habits
  const habitsTotalPages = Math.max(1, Math.ceil(filteredHabits.length / habitsPageSize));
  const habitsSafePage = Math.min(habitsPage, habitsTotalPages);
  const paginatedHabits = useMemo(() => {
    return filteredHabits.slice((habitsSafePage - 1) * habitsPageSize, habitsSafePage * habitsPageSize);
  }, [filteredHabits, habitsSafePage, habitsPageSize]);

  // Group habits by date categories
  const groupedHabits = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const groups: {
      today: Habit[];
      yesterday: Habit[];
      thisWeek: Habit[];
      earlierThisMonth: Habit[];
      older: Habit[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlierThisMonth: [],
      older: [],
    };

    paginatedHabits.forEach((habit) => {
      const dateStr = habit.archivedAt || habit.createdAt;
      if (!dateStr) {
        groups.older.push(habit);
        return;
      }

      const dateObj = new Date(dateStr);
      const isoDay = dateObj.toISOString().split('T')[0];

      if (isoDay === todayStr) {
        groups.today.push(habit);
      } else if (isoDay === yesterday) {
        groups.yesterday.push(habit);
      } else if (dateObj >= sevenDaysAgo) {
        groups.thisWeek.push(habit);
      } else if (dateObj >= thirtyDaysAgo) {
        groups.earlierThisMonth.push(habit);
      } else {
        groups.older.push(habit);
      }
    });

    return [
      { id: 'today', title: 'Archived Today', items: groups.today },
      { id: 'yesterday', title: 'Yesterday', items: groups.yesterday },
      { id: 'thisWeek', title: 'This Week', items: groups.thisWeek },
      { id: 'earlierThisMonth', title: 'Earlier This Month', items: groups.earlierThisMonth },
      { id: 'older', title: 'Older Records', items: groups.older },
    ].filter((g) => g.items.length > 0);
  }, [paginatedHabits]);

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

  // Active selected habit for inspector
  const activeHabit = useMemo(() => {
    if (!selectedHabitId && paginatedHabits.length > 0) {
      return paginatedHabits[0];
    }
    return paginatedHabits.find((h) => h.id === selectedHabitId) || paginatedHabits[0] || null;
  }, [selectedHabitId, paginatedHabits]);

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

  // Multi-Select for Habits
  const handleToggleSelectHabitId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFilteredHabits = () => {
    if (selectedHabitIds.length === filteredHabits.length) {
      setSelectedHabitIds([]);
    } else {
      setSelectedHabitIds(filteredHabits.map((h) => h.id));
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
        t.title,
        t.priority,
        (t.tags || []).join(', '),
        t.archivedAt ? new Date(t.archivedAt).toLocaleString() : '',
        t.completedAt ? new Date(t.completedAt).toLocaleString() : '',
        t.estimatedMinutes || '',
      ]),
    ];

    downloadCsvFile(`taktic-tasks-archive-${new Date().toISOString().split('T')[0]}.csv`, rows);
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
        n.title || '',
        n.content,
        n.color,
        n.archivedAt ? new Date(n.archivedAt).toLocaleString() : '',
        new Date(n.createdAt).toLocaleString(),
      ]),
    ];

    downloadCsvFile(`taktic-notes-archive-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setIsExportMenuOpen(false);
  };

  // Export Habits
  const handleExportHabitsCSV = (habitsToExport: Habit[]) => {
    const rows = [
      ['Taktic Archive Export - Habit Vault', `Exported on ${new Date().toLocaleDateString()}`],
      [],
      ['Habit ID', 'Title', 'Category', 'Current Streak', 'Lifetime Completions', 'Target Days/Week', 'Archived Date', 'Created Date'],
      ...habitsToExport.map((h) => [
        h.id,
        h.title,
        h.category,
        h.streak,
        h.completedDates.length,
        h.targetDaysPerWeek || 7,
        h.archivedAt ? new Date(h.archivedAt).toLocaleString() : '',
        h.createdAt ? new Date(h.createdAt).toLocaleString() : '',
      ]),
    ];

    downloadCsvFile(`taktic-habits-archive-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setIsExportMenuOpen(false);
  };

  // Export JSON
  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      tasks: archivedTasks,
      notes: archivedNotes,
      habits: archivedHabits,
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

  const totalArchivedCount = archivedTasks.length + archivedNotes.length + archivedHabits.length;
  const completedArchivedTasksCount = useMemo(() => archivedTasks.filter((t) => t.completed).length, [archivedTasks]);
  const archiveTaskCompletionPct = archivedTasks.length > 0 ? Math.round((completedArchivedTasksCount / archivedTasks.length) * 100) : 100;

  return (
    <div className="flex flex-col h-full w-full space-y-3 sm:space-y-4 pb-20">
      {/* Page Header & Completion / Clean-Sweep Bar Card - Terracotta & Slate Archive Theme */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 sm:p-5 shadow-xs transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/20">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">
                  Archive & History
                </h1>
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                  {totalArchivedCount} items stored
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {archivedTasks.length} tasks ({completedArchivedTasksCount} completed) • {archivedNotes.length} notes • {archivedHabits.length} habits archived
              </p>
            </div>
          </div>

          {/* Quick Stats Pills & Export Actions */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs">
              <span className="text-[var(--text-muted)] text-[11px]">Saved:</span>
              <strong className="text-[var(--accent-botanical-sage)] font-bold text-xs">
                {Math.round(totalMinutesSaved / 60)}h {totalMinutesSaved % 60}m
              </strong>
              {priorityBreakdown.high > 0 && (
                <>
                  <span className="text-[var(--border-subtle)]">•</span>
                  <span className="text-[var(--text-muted)] text-[11px]">High Pri:</span>
                  <strong className="text-[var(--accent-dusty-rose)] font-bold text-xs">
                    {priorityBreakdown.high}
                  </strong>
                </>
              )}
            </div>

            {/* Purge / Retention Wizard Trigger */}
            <button
              type="button"
              onClick={() => {
                setPurgeConfirmationInput('');
                setIsPurgeWizardOpen(true);
              }}
              disabled={totalArchivedCount === 0}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--accent-dusty-rose)]/10 hover:border-[var(--accent-dusty-rose)]/40 hover:text-[var(--accent-dusty-rose)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Clean up and purge old records"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Purge Vault</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={totalArchivedCount === 0}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
                <span>Export</span>
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => handleExportTasksCSV(filteredTasks)}
                      disabled={filteredTasks.length === 0}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-50 cursor-pointer"
                    >
                      <span>Export Tasks (CSV)</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{filteredTasks.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportNotesCSV(filteredNotes)}
                      disabled={filteredNotes.length === 0}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-50 cursor-pointer"
                    >
                      <span>Export Notes (CSV)</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{filteredNotes.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportHabitsCSV(filteredHabits)}
                      disabled={filteredHabits.length === 0}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-50 cursor-pointer"
                    >
                      <span>Export Habits (CSV)</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{filteredHabits.length}</span>
                    </button>
                    <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl cursor-pointer"
                    >
                      Full Backup (JSON)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Task Completion of Archived Records Progress Bar - Terracotta */}
        <div
          className="h-2 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden"
          role="progressbar"
          aria-label="Archived tasks completion rate"
          aria-valuenow={archiveTaskCompletionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${archiveTaskCompletionPct}% of archived tasks were completed`}
        >
          <div
            className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-[#B85D43] to-[#E08A6F]"
            style={{ width: `${archiveTaskCompletionPct}%` }}
          />
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          <button
            onClick={() => {
              setActiveTab('habits');
              setSearchQuery('');
              setConfirmDeleteId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Habit Vault</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'habits' ? 'bg-white/20 text-white' : 'bg-[var(--theme-surface-active)] text-[var(--text-muted)]'
              }`}
            >
              {archivedHabits.length}
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
                : activeTab === 'notes'
                ? 'Search archived scratchpad notes & ideas...'
                : 'Search archived habits, routines, or categories...'
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
          ) : activeTab === 'notes' ? (
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
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
          ) : (
            <>
              {/* Category Filter for Habits */}
              <select
                value={selectedHabitCategory}
                onChange={(e) => setSelectedHabitCategory(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden capitalize"
              >
                <option value="all">All Categories</option>
                <option value="health">Health</option>
                <option value="mindset">Mindset</option>
                <option value="growth">Growth</option>
                <option value="creative">Creative</option>
                <option value="fitness">Fitness</option>
              </select>

              {/* Select All Toggle for Habits */}
              {filteredHabits.length > 0 && (
                <button
                  onClick={handleSelectAllFilteredHabits}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {selectedHabitIds.length === filteredHabits.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{selectedHabitIds.length === filteredHabits.length ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Filter Chips Row (Renders when at least one filter or query is active) */}
      {(Boolean(searchQuery.trim()) ||
        timeHorizon !== 'all' ||
        (activeTab === 'tasks' && (selectedPriority !== 'all' || selectedTag !== 'all')) ||
        (activeTab === 'notes' && selectedNoteColor !== 'all') ||
        (activeTab === 'habits' && selectedHabitCategory !== 'all')) && (
        <div className="flex items-center gap-2 flex-wrap py-0.5 animate-in fade-in duration-150">
          <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" />
            Active filters:
          </span>

          {/* Search Query Chip */}
          {Boolean(searchQuery.trim()) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] shadow-2xs">
              <Search className="h-3 w-3 text-[var(--text-muted)]" />
              <span>"{searchQuery.trim()}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ml-0.5 p-0.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md transition-colors"
                aria-label="Remove search query filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Time Horizon Chip */}
          {timeHorizon !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--accent-warm-ochre)]/10 border border-[var(--accent-warm-ochre)]/25 text-xs font-medium text-[var(--text-primary)] shadow-2xs">
              <Calendar className="h-3 w-3 text-[var(--accent-warm-ochre)]" />
              <span>
                {timeHorizon === 'today'
                  ? 'Archived Today'
                  : timeHorizon === 'week'
                  ? 'Past 7 Days'
                  : timeHorizon === 'month'
                  ? 'Past 30 Days'
                  : 'Older Records'}
              </span>
              <button
                type="button"
                onClick={() => setTimeHorizon('all')}
                className="ml-0.5 p-0.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md transition-colors"
                aria-label="Reset date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Priority Chip (Tasks Tab) */}
          {activeTab === 'tasks' && selectedPriority !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/25 text-xs font-semibold text-[var(--accent-terracotta)] shadow-2xs">
              <span>Priority: {selectedPriority.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => setSelectedPriority('all')}
                className="ml-0.5 p-0.5 text-[var(--accent-terracotta)] hover:text-rose-500 rounded-md transition-colors"
                aria-label="Reset priority filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Tag Chip (Tasks Tab) */}
          {activeTab === 'tasks' && selectedTag !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] shadow-2xs">
              <Tag className="h-3 w-3 text-[var(--accent-warm-ochre)]" />
              <span>#{selectedTag}</span>
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className="ml-0.5 p-0.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md transition-colors"
                aria-label="Reset tag filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Note Color Chip (Notes Tab) */}
          {activeTab === 'notes' && selectedNoteColor !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs capitalize text-[var(--text-secondary)] shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${COLOR_THEMES[selectedNoteColor]?.dot || 'bg-gray-400'}`} />
              <span>Color: {selectedNoteColor}</span>
              <button
                type="button"
                onClick={() => setSelectedNoteColor('all')}
                className="ml-0.5 p-0.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md transition-colors"
                aria-label="Reset color filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Habit Category Chip (Habits Tab) */}
          {activeTab === 'habits' && selectedHabitCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs capitalize text-[var(--text-secondary)] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-terracotta)]" />
              <span>Category: {selectedHabitCategory}</span>
              <button
                type="button"
                onClick={() => setSelectedHabitCategory('all')}
                className="ml-0.5 p-0.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                aria-label="Reset category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Reset All Filters Button */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setTimeHorizon('all');
              setSelectedPriority('all');
              setSelectedTag('all');
              setSelectedNoteColor('all');
              setSelectedHabitCategory('all');
            }}
            className="text-xs font-semibold text-[var(--accent-terracotta)] hover:underline ml-1 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

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
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setIsMobileInspectorOpen(true);
                            }}
                            className={`group relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--theme-surface-active)] border-[var(--accent-terracotta)]/40 shadow-xs'
                                : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--theme-surface-hover)]'
                            }`}
                          >
                            {/* Checkbox for Bulk Actions */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectTaskId(task.id, e)}
                              className="mt-0.5 -ml-1 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                              aria-label={isChecked ? `Deselect task ${task.title}` : `Select task ${task.title}`}
                              aria-checked={isChecked}
                              role="checkbox"
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
                                <HighlightedText
                                  text={task.title}
                                  query={searchQuery}
                                  className={`text-sm font-medium line-through ${
                                    isSelected
                                      ? 'text-[var(--text-primary)] font-semibold'
                                      : 'text-[var(--text-secondary)]'
                                  }`}
                                />

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
                                  <HighlightedText text={task.description} query={searchQuery} />
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

              {/* Right Pane: Task Inspector & Detail View (5 cols on Desktop, Slide-over Drawer on Mobile) */}
              <div
                className={`
                  fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200
                  lg:static lg:z-auto lg:block lg:col-span-5 lg:bg-transparent lg:backdrop-blur-none lg:sticky lg:top-6
                  ${isMobileInspectorOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}
                `}
                onClick={() => setIsMobileInspectorOpen(false)}
              >
                {activeTask ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[var(--card-surface)] rounded-t-3xl lg:rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-6 shadow-2xl lg:shadow-xs space-y-5 sm:space-y-6 max-h-[85vh] lg:max-h-none overflow-y-auto w-full animate-in slide-in-from-bottom-6 lg:animate-none"
                  >
                    {/* Mobile Drawer Pull Indicator */}
                    <div className="lg:hidden flex items-center justify-between pb-1 -mt-1">
                      <div className="w-10 h-1 bg-[var(--border-subtle)] rounded-full mx-auto" />
                      <button
                        type="button"
                        onClick={() => setIsMobileInspectorOpen(false)}
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] -mr-1"
                        aria-label="Close inspector"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

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

                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
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
            <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg mx-auto flex items-center justify-between gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[var(--card-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-bottom-5">
              {/* Count Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent-terracotta)] text-white text-[10px] sm:text-xs font-bold shadow-xs">
                  {selectedTaskIds.length}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  <span className="hidden sm:inline">{selectedTaskIds.length === 1 ? 'task' : 'tasks'}</span> sel
                </span>
              </div>

              <div className="h-4 w-[1px] bg-[var(--border-subtle)] shrink-0" />

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end min-w-0">
                {/* Batch Restore */}
                <button
                  onClick={() => {
                    onBatchUnarchiveTasks(selectedTaskIds);
                    setSelectedTaskIds([]);
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
                  title="Restore selected tasks"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore</span>
                </button>

                {/* Batch Export */}
                <button
                  onClick={() => {
                    const selectedTasksList = archivedTasks.filter((t) => selectedTaskIds.includes(t.id));
                    handleExportTasksCSV(selectedTasksList);
                  }}
                  className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shrink-0 cursor-pointer"
                  title="Export selected as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                  <span className="hidden xs:inline">Export</span>
                </button>

                {/* Batch Delete */}
                {confirmBatchDelete ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onBatchDeleteTasks(selectedTaskIds);
                        setSelectedTaskIds([]);
                        setConfirmBatchDelete(false);
                      }}
                      className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
                    >
                      Confirm ({selectedTaskIds.length})
                    </button>
                    <button
                      onClick={() => setConfirmBatchDelete(false)}
                      className="px-1.5 py-1 text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmBatchDelete(true)}
                    className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xs:inline">Delete</span>
                  </button>
                )}

                {/* Clear Selection */}
                <button
                  onClick={() => setSelectedTaskIds([])}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Deselect all"
                  aria-label="Deselect all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
                            onClick={() => {
                              setSelectedNoteId(note.id);
                              setIsMobileInspectorOpen(true);
                            }}
                            className={`group relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--theme-surface-active)] border-[var(--accent-terracotta)]/40 shadow-xs'
                                : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--theme-surface-hover)]'
                            }`}
                          >
                            {/* Checkbox for Bulk Actions */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectNoteId(note.id, e)}
                              className="mt-0.5 -ml-1 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                              aria-label={isChecked ? `Deselect note ${note.title || 'Untitled note'}` : `Select note ${note.title || 'Untitled note'}`}
                              aria-checked={isChecked}
                              role="checkbox"
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
                                <HighlightedText
                                  text={note.title || 'Untitled Scratch Note'}
                                  query={searchQuery}
                                  className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                  }`}
                                />

                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                  {theme.label}
                                </span>
                              </div>

                              {/* Note Snippet */}
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1.5 leading-relaxed">
                                <HighlightedText text={note.content} query={searchQuery} />
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

              {/* Right Pane: Note Inspector & Detail View (5 cols on Desktop, Slide-over Drawer on Mobile) */}
              <div
                className={`
                  fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200
                  lg:static lg:z-auto lg:block lg:col-span-5 lg:bg-transparent lg:backdrop-blur-none lg:sticky lg:top-6
                  ${isMobileInspectorOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}
                `}
                onClick={() => setIsMobileInspectorOpen(false)}
              >
                {activeNote ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[var(--card-surface)] rounded-t-3xl lg:rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-6 shadow-2xl lg:shadow-xs space-y-5 sm:space-y-6 max-h-[85vh] lg:max-h-none overflow-y-auto w-full animate-in slide-in-from-bottom-6 lg:animate-none"
                  >
                    {/* Mobile Drawer Pull Indicator */}
                    <div className="lg:hidden flex items-center justify-between pb-1 -mt-1">
                      <div className="w-10 h-1 bg-[var(--border-subtle)] rounded-full mx-auto" />
                      <button
                        type="button"
                        onClick={() => setIsMobileInspectorOpen(false)}
                        className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] -mr-1"
                        aria-label="Close inspector"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

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

                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
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
            <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg mx-auto flex items-center justify-between gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[var(--card-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-bottom-5">
              {/* Count Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent-terracotta)] text-white text-[10px] sm:text-xs font-bold shadow-xs">
                  {selectedNoteIds.length}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  <span className="hidden sm:inline">{selectedNoteIds.length === 1 ? 'note' : 'notes'}</span> sel
                </span>
              </div>

              <div className="h-4 w-[1px] bg-[var(--border-subtle)] shrink-0" />

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end min-w-0">
                {/* Batch Restore */}
                <button
                  onClick={() => {
                    onBatchUnarchiveNotes?.(selectedNoteIds);
                    setSelectedNoteIds([]);
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
                  title="Restore selected notes"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore</span>
                </button>

                {/* Batch Export */}
                <button
                  onClick={() => {
                    const selectedNotesList = archivedNotes.filter((n) => selectedNoteIds.includes(n.id));
                    handleExportNotesCSV(selectedNotesList);
                  }}
                  className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shrink-0 cursor-pointer"
                  title="Export selected as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                  <span className="hidden xs:inline">Export</span>
                </button>

                {/* Batch Delete */}
                {confirmBatchDelete ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onBatchDeleteNotes?.(selectedNoteIds);
                        setSelectedNoteIds([]);
                        setConfirmBatchDelete(false);
                      }}
                      className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
                    >
                      Confirm ({selectedNoteIds.length})
                    </button>
                    <button
                      onClick={() => setConfirmBatchDelete(false)}
                      className="px-1.5 py-1 text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmBatchDelete(true)}
                    className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xs:inline">Delete</span>
                  </button>
                )}

                {/* Clear Selection */}
                <button
                  onClick={() => setSelectedNoteIds([])}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Deselect all"
                  aria-label="Deselect all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================= HABITS ARCHIVE TAB ======================= */}
      {activeTab === 'habits' && (
        <>
          {archivedHabits.length === 0 ? (
            /* Empty State (No Archived Habits) */
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/50 text-center space-y-4 my-8">
              <div className="p-4 rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]">
                <Repeat className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Your Habit Vault is Clean & Clear
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Retired and paused habits will be safely kept here with your lifetime streaks, check-in history, and freeze shields preserved.
                </p>
              </div>
            </div>
          ) : filteredHabits.length === 0 ? (
            /* Filter Zero State */
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-center space-y-3">
              <Filter className="w-8 h-8 text-[var(--text-muted)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                No archived habits match your filters
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Try searching for different keywords or reset your category and date filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedHabitCategory('all');
                  setTimeHorizon('all');
                }}
                className="px-3 py-1.5 text-xs font-medium text-[var(--accent-terracotta)] hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Split Pane: Left Habits Timeline | Right Habit Inspector */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Habits List (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {groupedHabits.map((group) => (
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
                        {group.items.length} {group.items.length === 1 ? 'habit' : 'habits'}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      {group.items.map((habit) => {
                        const isSelected = activeHabit?.id === habit.id;
                        const isChecked = selectedHabitIds.includes(habit.id);
                        const catConfig = HABIT_CATEGORIES[habit.category] || HABIT_CATEGORIES.health;

                        return (
                          <div
                            key={habit.id}
                            onClick={() => {
                              setSelectedHabitId(habit.id);
                              setIsMobileInspectorOpen(true);
                            }}
                            className={`group relative flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--theme-surface-active)] border-[var(--accent-terracotta)]/40 shadow-xs'
                                : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--theme-surface-hover)]'
                            }`}
                          >
                            {/* Checkbox for Bulk Actions */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectHabitId(habit.id, e)}
                              className="mt-0.5 -ml-1 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                              aria-label={isChecked ? `Deselect habit ${habit.title}` : `Select habit ${habit.title}`}
                              aria-checked={isChecked}
                              role="checkbox"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                              ) : (
                                <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                              )}
                            </button>

                            {/* Habit Icon Avatar */}
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/20">
                              <IconRenderer name={habit.icon || habit.category} className="h-3.5 w-3.5" />
                            </div>

                            {/* Habit Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <HighlightedText
                                  text={habit.title}
                                  query={searchQuery}
                                  className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                  }`}
                                />

                                {/* Category Badge */}
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${catConfig.badge}`}
                                >
                                  {habit.category}
                                </span>
                              </div>

                              {/* Metadata Pills */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-[var(--text-muted)]">
                                {/* Streak Flame */}
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-terracotta)]">
                                  <Flame className="w-3 h-3 fill-[var(--accent-terracotta)] text-[var(--accent-terracotta)]" />
                                  {habit.streak}d streak
                                </span>

                                {/* Total Lifetime Completions */}
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                                  <Trophy className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                                  {habit.completedDates.length} completions
                                </span>

                                {/* Target frequency */}
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                  <Target className="w-3 h-3" />
                                  {habit.targetDaysPerWeek || 7}x / week
                                </span>

                                {/* Freeze shields */}
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Shield className="w-3 h-3 text-emerald-500" />
                                  {habit.freezeShieldsRemaining ?? 3}/3 shields
                                </span>
                              </div>
                            </div>

                            {/* Quick Actions (Restore & Delete) */}
                            <div className="flex items-center gap-1 shrink-0">
                              {onUnarchiveHabit && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUnarchiveHabit(habit.id);
                                  }}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Restore habit to active routines"
                                  aria-label={`Restore habit ${habit.title}`}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              {onDeleteHabit && (
                                confirmDeleteId === habit.id ? (
                                  <div
                                    className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg p-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteHabit(habit.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(habit.id);
                                    }}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Delete permanently"
                                    aria-label={`Delete habit ${habit.title}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <Pagination
                  currentPage={habitsSafePage}
                  totalItems={filteredHabits.length}
                  pageSize={habitsPageSize}
                  onPageChange={setHabitsPage}
                  onPageSizeChange={setHabitsPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  itemName="archived habits"
                />
              </div>

              {/* Right Pane: Habit Inspector (5 cols, Desktop) */}
              <div className="hidden lg:block lg:col-span-5 sticky top-20">
                {activeHabit ? (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-5">
                    {/* Inspector Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                        <IconRenderer name={activeHabit.icon || activeHabit.category} className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                          {activeHabit.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                              HABIT_CATEGORIES[activeHabit.category]?.badge || 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            {activeHabit.category}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {activeHabit.frequency === 'daily' ? 'Daily Routine' : 'Weekly Routine'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Habit Metrics Cards Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Streak Card */}
                      <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                          <Flame className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                          <span>Streak</span>
                        </div>
                        <div className="text-base font-bold text-[var(--accent-terracotta)]">
                          {activeHabit.streak} Days
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">Archived streak</div>
                      </div>

                      {/* Lifetime Check-ins Card */}
                      <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                          <Trophy className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
                          <span>Total Check-ins</span>
                        </div>
                        <div className="text-base font-bold text-[var(--text-primary)]">
                          {activeHabit.completedDates.length}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">Lifetime logs</div>
                      </div>

                      {/* Target Frequency Card */}
                      <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                          <Target className="w-3.5 h-3.5 text-sky-500" />
                          <span>Target</span>
                        </div>
                        <div className="text-base font-bold text-[var(--text-primary)]">
                          {activeHabit.targetDaysPerWeek || 7} / Week
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">Commitment goal</div>
                      </div>

                      {/* Freeze Shields Card */}
                      <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Freeze Shields</span>
                        </div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {activeHabit.freezeShieldsRemaining ?? 3} / 3
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">Shields preserved</div>
                      </div>
                    </div>

                    {/* History Timeline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                        <span>Recent Completion History</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          {activeHabit.completedDates.length} recorded
                        </span>
                      </div>

                      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-3 max-h-48 overflow-y-auto space-y-1.5">
                        {activeHabit.completedDates.length > 0 ? (
                          [...activeHabit.completedDates]
                            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                            .slice(0, 8)
                            .map((dateStr) => (
                              <div
                                key={dateStr}
                                className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] text-xs"
                              >
                                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">Logged</span>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                            No past completions recorded.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta Timestamps */}
                    <div className="text-[11px] text-[var(--text-muted)] space-y-1 pt-2 border-t border-[var(--border-subtle)]">
                      {activeHabit.archivedAt && (
                        <div>
                          Archived on:{' '}
                          <strong className="text-[var(--text-secondary)]">
                            {new Date(activeHabit.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </strong>
                        </div>
                      )}
                      {activeHabit.createdAt && (
                        <div>
                          Created on:{' '}
                          <strong className="text-[var(--text-secondary)]">
                            {new Date(activeHabit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Inspector Primary Actions */}
                    <div className="space-y-2 pt-1">
                      {onUnarchiveHabit && (
                        <button
                          type="button"
                          onClick={() => onUnarchiveHabit(activeHabit.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-terracotta)] hover:opacity-90 text-white font-semibold text-xs transition-opacity shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore to Active Habits</span>
                        </button>
                      )}

                      {onDeleteHabit && (
                        confirmDeleteId === activeHabit.id ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex-1">
                              Permanently delete habit and history?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteHabit(activeHabit.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer shadow-xs"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(activeHabit.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Habit Permanently</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-8 text-center text-xs text-[var(--text-muted)]">
                    Select a habit to view details
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Sliding Bottom Sheet Inspector (Habits) */}
          {isMobileInspectorOpen && activeHabit && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                onClick={() => setIsMobileInspectorOpen(false)}
              />

              {/* Sheet Content */}
              <div className="relative w-full rounded-t-3xl border-t border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
                {/* Pull Handle */}
                <div className="mx-auto w-12 h-1.5 rounded-full bg-[var(--border-subtle)] mb-2" />

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                      <IconRenderer name={activeHabit.icon || activeHabit.category} className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {activeHabit.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                            HABIT_CATEGORIES[activeHabit.category]?.badge || 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {activeHabit.category}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {activeHabit.frequency === 'daily' ? 'Daily Routine' : 'Weekly Routine'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileInspectorOpen(false)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Habit Metrics Cards Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-0.5">
                      <Flame className="w-3 h-3 text-[var(--accent-terracotta)]" />
                      <span>Streak</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--accent-terracotta)]">
                      {activeHabit.streak} Days
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-0.5">
                      <Trophy className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                      <span>Check-ins</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {activeHabit.completedDates.length}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-0.5">
                      <Target className="w-3 h-3 text-sky-500" />
                      <span>Target</span>
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {activeHabit.targetDaysPerWeek || 7} / Week
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-0.5">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span>Freeze</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {activeHabit.freezeShieldsRemaining ?? 3}/3 Preserved
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  {onUnarchiveHabit && (
                    <button
                      type="button"
                      onClick={() => {
                        onUnarchiveHabit(activeHabit.id);
                        setIsMobileInspectorOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-terracotta)] text-white font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore to Active Habits</span>
                    </button>
                  )}

                  {onDeleteHabit && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteHabit(activeHabit.id);
                        setIsMobileInspectorOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Habit Permanently</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Batch Action Bar for Habits */}
          {selectedHabitIds.length > 0 && (
            <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-lg mx-auto flex items-center justify-between gap-1.5 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[var(--card-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-bottom-5">
              {/* Count Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent-terracotta)] text-white text-[10px] sm:text-xs font-bold shadow-xs">
                  {selectedHabitIds.length}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  <span className="hidden sm:inline">{selectedHabitIds.length === 1 ? 'habit' : 'habits'}</span> sel
                </span>
              </div>

              <div className="h-4 w-[1px] bg-[var(--border-subtle)] shrink-0" />

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end min-w-0">
                {/* Batch Restore */}
                {onBatchUnarchiveHabits && (
                  <button
                    onClick={() => {
                      onBatchUnarchiveHabits(selectedHabitIds);
                      setSelectedHabitIds([]);
                    }}
                    className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
                    title="Restore selected habits"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Restore</span>
                  </button>
                )}

                {/* Batch Export */}
                <button
                  onClick={() => {
                    const selectedHabitsList = archivedHabits.filter((h) => selectedHabitIds.includes(h.id));
                    handleExportHabitsCSV(selectedHabitsList);
                  }}
                  className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[var(--theme-surface-active)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shrink-0 cursor-pointer"
                  title="Export selected habits as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                  <span className="hidden xs:inline">Export</span>
                </button>

                {/* Batch Delete */}
                {onBatchDeleteHabits && (
                  confirmBatchDelete ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          onBatchDeleteHabits(selectedHabitIds);
                          setSelectedHabitIds([]);
                          setConfirmBatchDelete(false);
                        }}
                        className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
                      >
                        Confirm ({selectedHabitIds.length})
                      </button>
                      <button
                        onClick={() => setConfirmBatchDelete(false)}
                        className="px-1.5 py-1 text-[10px] sm:text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBatchDelete(true)}
                      className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden xs:inline">Delete</span>
                    </button>
                  )
                )}

                {/* Clear Selection */}
                <button
                  onClick={() => setSelectedHabitIds([])}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Deselect all"
                  aria-label="Deselect all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* Retention & Purge Wizard Modal */}
      {/* ========================================================================= */}
      {isPurgeWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purge-wizard-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="purge-wizard-title" className="text-base font-bold text-[var(--text-primary)]">
                    Storage Hygiene & Purge
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Safely delete historical records older than a retention threshold.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPurgeWizardOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-xl transition-colors"
                aria-label="Close purge wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Retention Age Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                1. Select Age Threshold
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setPurgeTargetDays(days as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                      purgeTargetDays === days
                        ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] shadow-xs'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    &gt; {days} Days Old
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                2. Select Scope
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Vaults' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'habits', label: 'Habits' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPurgeScope(s.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                      purgeScope === s.id
                        ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] shadow-xs'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Affected Items Impact Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Affected Candidates:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'tasks') ? purgeCandidateTasks.length : 0) +
                    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'notes') ? purgeCandidateNotes.length : 0) +
                    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'habits') ? purgeCandidateHabits.length : 0)}{' '}
                  records
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                {(purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'tasks') && (
                  <div>• {purgeCandidateTasks.length} completed tasks older than {purgeTargetDays} days</div>
                )}
                {(purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'notes') && (
                  <div>• {purgeCandidateNotes.length} scratchpad notes older than {purgeTargetDays} days</div>
                )}
                {(purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'habits') && (
                  <div>• {purgeCandidateHabits.length} archived habits older than {purgeTargetDays} days</div>
                )}
              </div>
            </div>

            {/* Confirmation Safeguard Warning */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="font-bold">Permanent deletion:</strong> Purged records cannot be restored. To confirm, type <strong className="font-mono uppercase bg-amber-500/20 px-1 py-0.5 rounded-sm">PURGE</strong> below.
              </div>
            </div>

            {/* Type to Confirm Input */}
            <div>
              <input
                type="text"
                value={purgeConfirmationInput}
                onChange={(e) => setPurgeConfirmationInput(e.target.value)}
                placeholder="Type PURGE to confirm"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 uppercase font-mono"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsPurgeWizardOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  purgeConfirmationInput.trim() !== 'PURGE' ||
                  (((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'tasks') ? purgeCandidateTasks.length : 0) +
                    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'notes') ? purgeCandidateNotes.length : 0) +
                    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'habits') ? purgeCandidateHabits.length : 0) === 0)
                }
                onClick={() => {
                  if (purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'tasks') {
                    if (purgeCandidateTasks.length > 0) {
                      onBatchDeleteTasks(purgeCandidateTasks.map((t) => t.id));
                    }
                  }
                  if (purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'notes') {
                    if (purgeCandidateNotes.length > 0) {
                      onBatchDeleteNotes?.(purgeCandidateNotes.map((n) => n.id));
                    }
                  }
                  if (purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'habits') {
                    if (purgeCandidateHabits.length > 0) {
                      onBatchDeleteHabits?.(purgeCandidateHabits.map((h) => h.id));
                    }
                  }
                  setIsPurgeWizardOpen(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

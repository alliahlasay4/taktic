import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, StickyNote, Repeat } from 'lucide-react';
import { Task, PriorityLevel, QuickNote, NoteColor, Habit } from '../../types';
import { downloadCsvFile } from '../../lib/csvSecurity';

// Modular Subcomponents
import { ArchiveHeader } from './ArchiveHeader';
import { ArchiveFilters } from './ArchiveFilters';
import { ArchiveTasksList } from './ArchiveTasksList';
import { ArchiveNotesList } from './ArchiveNotesList';
import { ArchiveHabitsList } from './ArchiveHabitsList';
import { ArchiveBatchBar } from './ArchiveBatchBar';
import { ArchiveItemInspector } from './ArchiveItemInspector';
import { ArchivePurgeModal } from './ArchivePurgeModal';

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
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'habits'>('tasks');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'all' | 'today' | 'week' | 'month' | 'older'>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNoteColor, setSelectedNoteColor] = useState<NoteColor | 'all'>('all');
  const [selectedHabitCategory, setSelectedHabitCategory] = useState<string>('all');

  // Multi-Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  // Inspector State
  const [inspectorItem, setInspectorItem] = useState<{
    type: 'task' | 'note' | 'habit' | null;
    task: Task | null;
    note: QuickNote | null;
    habit: Habit | null;
  }>({ type: null, task: null, note: null, habit: null });

  // Confirmation Delete ID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Purge Wizard Modal State
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

  // Filter archived base items
  const archivedTasks = useMemo(() => tasks.filter((t) => t.archived), [tasks]);
  const archivedNotes = useMemo(() => notes.filter((n) => n.archived), [notes]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);

  // Extract all tags from tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    archivedTasks.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [archivedTasks]);

  // Purge Candidates
  const { purgeCandidateTasks, purgeCandidateNotes, purgeCandidateHabits } = useMemo(() => {
    const cutoff = new Date(Date.now() - purgeTargetDays * 86400000);

    const candidateTasks = archivedTasks.filter((t) => {
      const d = t.archivedAt || t.completedAt || t.dueDate;
      return d ? new Date(d) < cutoff : false;
    });

    const candidateNotes = archivedNotes.filter((n) => {
      const d = n.archivedAt || n.updatedAt || n.createdAt;
      return d ? new Date(d) < cutoff : false;
    });

    const candidateHabits = archivedHabits.filter((h) => {
      const d = h.archivedAt || h.createdAt;
      return d ? new Date(d) < cutoff : false;
    });

    return {
      purgeCandidateTasks: candidateTasks,
      purgeCandidateNotes: candidateNotes,
      purgeCandidateHabits: candidateHabits,
    };
  }, [archivedTasks, archivedNotes, archivedHabits, purgeTargetDays]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedTasks.filter((t) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesTags = t.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
      if (selectedTag !== 'all' && !t.tags?.includes(selectedTag)) return false;

      if (timeHorizon !== 'all') {
        const d = t.archivedAt || t.completedAt || t.dueDate;
        if (!d) return timeHorizon === 'older';
        const itemDate = new Date(d);
        const itemDateStr = itemDate.toISOString().split('T')[0];

        if (timeHorizon === 'today') return itemDateStr === todayStr;
        if (timeHorizon === 'week') return itemDate >= sevenDaysAgo;
        if (timeHorizon === 'month') return itemDate >= thirtyDaysAgo && itemDate < sevenDaysAgo;
        if (timeHorizon === 'older') return itemDate < thirtyDaysAgo;
      }

      return true;
    });
  }, [archivedTasks, searchQuery, selectedPriority, selectedTag, timeHorizon]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedNotes.filter((n) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(query);
        const matchesContent = n.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      if (selectedNoteColor !== 'all' && n.color !== selectedNoteColor) return false;

      if (timeHorizon !== 'all') {
        const d = n.archivedAt || n.updatedAt || n.createdAt;
        if (!d) return timeHorizon === 'older';
        const itemDate = new Date(d);
        const itemDateStr = itemDate.toISOString().split('T')[0];

        if (timeHorizon === 'today') return itemDateStr === todayStr;
        if (timeHorizon === 'week') return itemDate >= sevenDaysAgo;
        if (timeHorizon === 'month') return itemDate >= thirtyDaysAgo && itemDate < sevenDaysAgo;
        if (timeHorizon === 'older') return itemDate < thirtyDaysAgo;
      }

      return true;
    });
  }, [archivedNotes, searchQuery, selectedNoteColor, timeHorizon]);

  // Filtered Habits
  const filteredHabits = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return archivedHabits.filter((h) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(query);
        const matchesCategory = h.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      if (selectedHabitCategory !== 'all' && h.category !== selectedHabitCategory) return false;

      if (timeHorizon !== 'all') {
        const d = h.archivedAt || h.createdAt;
        if (!d) return timeHorizon === 'older';
        const itemDate = new Date(d);
        const itemDateStr = itemDate.toISOString().split('T')[0];

        if (timeHorizon === 'today') return itemDateStr === todayStr;
        if (timeHorizon === 'week') return itemDate >= sevenDaysAgo;
        if (timeHorizon === 'month') return itemDate >= thirtyDaysAgo && itemDate < sevenDaysAgo;
        if (timeHorizon === 'older') return itemDate < thirtyDaysAgo;
      }

      return true;
    });
  }, [archivedHabits, searchQuery, selectedHabitCategory, timeHorizon]);

  // Reset pagination on filter changes
  useEffect(() => setTasksPage(1), [searchQuery, selectedPriority, selectedTag, timeHorizon]);
  useEffect(() => setNotesPage(1), [searchQuery, selectedNoteColor, timeHorizon]);
  useEffect(() => setHabitsPage(1), [searchQuery, selectedHabitCategory, timeHorizon]);

  // Selection handlers
  const handleToggleSelectTaskId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleSelectNoteId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNoteIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleSelectHabitId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHabitIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export handlers
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
  };

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
  };

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
  };

  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      tasks: archivedTasks,
      notes: archivedNotes,
      habits: archivedHabits,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `taktic-full-archive-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setTimeHorizon('all');
    setSelectedPriority('all');
    setSelectedTag('all');
    setSelectedNoteColor('all');
    setSelectedHabitCategory('all');
  };

  const totalArchivedCount = archivedTasks.length + archivedNotes.length + archivedHabits.length;
  const completedTasksCount = archivedTasks.filter((t) => t.completed).length;

  return (
    <div className="flex flex-col h-full w-full space-y-4 pb-24">
      {/* 1. Calm, Clean Header */}
      <ArchiveHeader
        totalCount={totalArchivedCount}
        tasksCount={archivedTasks.length}
        completedTasksCount={completedTasksCount}
        notesCount={archivedNotes.length}
        habitsCount={archivedHabits.length}
        filteredTasks={filteredTasks}
        filteredNotes={filteredNotes}
        filteredHabits={filteredHabits}
        onOpenPurgeWizard={() => {
          setPurgeConfirmationInput('');
          setIsPurgeWizardOpen(true);
        }}
        onExportTasksCSV={handleExportTasksCSV}
        onExportNotesCSV={handleExportNotesCSV}
        onExportHabitsCSV={handleExportHabitsCSV}
        onExportJSON={handleExportJSON}
      />

      {/* 2. Sleek Segmented Tab Switcher */}
      <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-2xs w-full sm:w-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('tasks');
            setSearchQuery('');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Tasks</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
            }`}
          >
            {archivedTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('notes');
            setSearchQuery('');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5 shrink-0" />
          <span>Notes</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
            }`}
          >
            {archivedNotes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('habits');
            setSearchQuery('');
            setConfirmDeleteId(null);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'habits'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)]'
          }`}
        >
          <Repeat className="w-3.5 h-3.5 shrink-0" />
          <span>Habits</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'habits' ? 'bg-white/20 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
            }`}
          >
            {archivedHabits.length}
          </span>
        </button>
      </div>

      {/* 3. Streamlined Search & Filters */}
      <ArchiveFilters
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        timeHorizon={timeHorizon}
        onTimeHorizonChange={setTimeHorizon}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        allTags={allTags}
        isAllTasksSelected={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
        onToggleSelectAllTasks={() => {
          if (selectedTaskIds.length === filteredTasks.length) setSelectedTaskIds([]);
          else setSelectedTaskIds(filteredTasks.map((t) => t.id));
        }}
        hasTasks={filteredTasks.length > 0}
        selectedNoteColor={selectedNoteColor}
        onNoteColorChange={setSelectedNoteColor}
        isAllNotesSelected={filteredNotes.length > 0 && selectedNoteIds.length === filteredNotes.length}
        onToggleSelectAllNotes={() => {
          if (selectedNoteIds.length === filteredNotes.length) setSelectedNoteIds([]);
          else setSelectedNoteIds(filteredNotes.map((n) => n.id));
        }}
        hasNotes={filteredNotes.length > 0}
        selectedHabitCategory={selectedHabitCategory}
        onHabitCategoryChange={setSelectedHabitCategory}
        isAllHabitsSelected={filteredHabits.length > 0 && selectedHabitIds.length === filteredHabits.length}
        onToggleSelectAllHabits={() => {
          if (selectedHabitIds.length === filteredHabits.length) setSelectedHabitIds([]);
          else setSelectedHabitIds(filteredHabits.map((h) => h.id));
        }}
        hasHabits={filteredHabits.length > 0}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Full-Width Lists */}
      {activeTab === 'tasks' && (
        <ArchiveTasksList
          tasks={filteredTasks}
          searchQuery={searchQuery}
          selectedTaskId={inspectorItem.task?.id || null}
          onSelectTask={(task) => setInspectorItem({ type: 'task', task, note: null, habit: null })}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTaskId={handleToggleSelectTaskId}
          onUnarchiveTask={onUnarchiveTask}
          onDeleteTask={onDeleteTask}
          currentPage={tasksPage}
          pageSize={tasksPageSize}
          onPageChange={setTasksPage}
          onPageSizeChange={setTasksPageSize}
          onNavigateToInbox={onNavigateToInbox}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
        />
      )}

      {activeTab === 'notes' && (
        <ArchiveNotesList
          notes={filteredNotes}
          searchQuery={searchQuery}
          selectedNoteId={inspectorItem.note?.id || null}
          onSelectNote={(note) => setInspectorItem({ type: 'note', task: null, note, habit: null })}
          selectedNoteIds={selectedNoteIds}
          onToggleSelectNoteId={handleToggleSelectNoteId}
          onUnarchiveNote={onUnarchiveNote}
          onDeleteNote={onDeleteNote}
          currentPage={notesPage}
          pageSize={notesPageSize}
          onPageChange={setNotesPage}
          onPageSizeChange={setNotesPageSize}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
        />
      )}

      {activeTab === 'habits' && (
        <ArchiveHabitsList
          habits={filteredHabits}
          searchQuery={searchQuery}
          selectedHabitId={inspectorItem.habit?.id || null}
          onSelectHabit={(habit) => setInspectorItem({ type: 'habit', task: null, note: null, habit })}
          selectedHabitIds={selectedHabitIds}
          onToggleSelectHabitId={handleToggleSelectHabitId}
          onUnarchiveHabit={onUnarchiveHabit}
          onDeleteHabit={onDeleteHabit}
          currentPage={habitsPage}
          pageSize={habitsPageSize}
          onPageChange={setHabitsPage}
          onPageSizeChange={setHabitsPageSize}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
        />
      )}

      {/* 5. Floating Batch Action Bars (Only when items selected) */}
      {activeTab === 'tasks' && (
        <ArchiveBatchBar
          selectedCount={selectedTaskIds.length}
          itemTypeLabel="task"
          onRestore={() => {
            onBatchUnarchiveTasks(selectedTaskIds);
            setSelectedTaskIds([]);
          }}
          onExport={() => {
            const selected = archivedTasks.filter((t) => selectedTaskIds.includes(t.id));
            handleExportTasksCSV(selected);
          }}
          onDelete={() => {
            onBatchDeleteTasks(selectedTaskIds);
            setSelectedTaskIds([]);
          }}
          onClearSelection={() => setSelectedTaskIds([])}
        />
      )}

      {activeTab === 'notes' && (
        <ArchiveBatchBar
          selectedCount={selectedNoteIds.length}
          itemTypeLabel="note"
          onRestore={() => {
            onBatchUnarchiveNotes?.(selectedNoteIds);
            setSelectedNoteIds([]);
          }}
          onExport={() => {
            const selected = archivedNotes.filter((n) => selectedNoteIds.includes(n.id));
            handleExportNotesCSV(selected);
          }}
          onDelete={() => {
            onBatchDeleteNotes?.(selectedNoteIds);
            setSelectedNoteIds([]);
          }}
          onClearSelection={() => setSelectedNoteIds([])}
        />
      )}

      {activeTab === 'habits' && (
        <ArchiveBatchBar
          selectedCount={selectedHabitIds.length}
          itemTypeLabel="habit"
          onRestore={() => {
            onBatchUnarchiveHabits?.(selectedHabitIds);
            setSelectedHabitIds([]);
          }}
          onExport={() => {
            const selected = archivedHabits.filter((h) => selectedHabitIds.includes(h.id));
            handleExportHabitsCSV(selected);
          }}
          onDelete={() => {
            onBatchDeleteHabits?.(selectedHabitIds);
            setSelectedHabitIds([]);
          }}
          onClearSelection={() => setSelectedHabitIds([])}
        />
      )}

      {/* 6. Detail Inspector Modal (On-demand inspection) */}
      <ArchiveItemInspector
        isOpen={inspectorItem.type !== null}
        onClose={() => setInspectorItem({ type: null, task: null, note: null, habit: null })}
        itemType={inspectorItem.type}
        task={inspectorItem.task}
        note={inspectorItem.note}
        habit={inspectorItem.habit}
        onUnarchiveTask={onUnarchiveTask}
        onDeleteTask={onDeleteTask}
        onUnarchiveNote={onUnarchiveNote}
        onDeleteNote={onDeleteNote}
        onUnarchiveHabit={onUnarchiveHabit}
        onDeleteHabit={onDeleteHabit}
      />

      {/* 7. Purge Wizard Modal */}
      <ArchivePurgeModal
        isOpen={isPurgeWizardOpen}
        onClose={() => setIsPurgeWizardOpen(false)}
        purgeTargetDays={purgeTargetDays}
        setPurgeTargetDays={setPurgeTargetDays}
        purgeScope={purgeScope}
        setPurgeScope={setPurgeScope}
        purgeConfirmationInput={purgeConfirmationInput}
        setPurgeConfirmationInput={setPurgeConfirmationInput}
        purgeCandidateTasks={purgeCandidateTasks}
        purgeCandidateNotes={purgeCandidateNotes}
        purgeCandidateHabits={purgeCandidateHabits}
        onConfirmPurge={() => {
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
      />
    </div>
  );
};

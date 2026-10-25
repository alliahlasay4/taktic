import React, { useState } from 'react';
import { Archive, Download, Trash2, ChevronDown } from 'lucide-react';
import { Task, QuickNote, Habit } from '../../types';

interface ArchiveHeaderProps {
  totalCount: number;
  tasksCount: number;
  completedTasksCount: number;
  notesCount: number;
  habitsCount: number;
  filteredTasks: Task[];
  filteredNotes: QuickNote[];
  filteredHabits: Habit[];
  onOpenPurgeWizard: () => void;
  onExportTasksCSV: (tasks: Task[]) => void;
  onExportNotesCSV: (notes: QuickNote[]) => void;
  onExportHabitsCSV: (habits: Habit[]) => void;
  onExportJSON: () => void;
}

export const ArchiveHeader: React.FC<ArchiveHeaderProps> = ({
  totalCount,
  tasksCount,
  notesCount,
  habitsCount,
  filteredTasks,
  filteredNotes,
  filteredHabits,
  onOpenPurgeWizard,
  onExportTasksCSV,
  onExportNotesCSV,
  onExportHabitsCSV,
  onExportJSON,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--accent-terracotta)]/35 bg-gradient-to-r from-[var(--card-surface)] to-[var(--accent-terracotta)]/5 p-3.5 sm:p-5 shadow-xs shadow-[var(--accent-terracotta)]/5 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        {/* Title & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30 shadow-2xs">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">
                Archive & History
              </h1>
              <span className="text-[10px] font-bold text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-2 py-0.5 rounded-full border border-[var(--accent-terracotta)]/25">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {tasksCount} tasks • {notesCount} notes • {habitsCount} habits
            </p>
          </div>
        </div>

      {/* Top Action Buttons (Purge Vault & Export Dropdown) */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {/* Purge / Retention Wizard */}
        <button
          type="button"
          onClick={onOpenPurgeWizard}
          disabled={totalCount === 0}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-2xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Safely clean up old records by age"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Purge Vault</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={totalCount === 0}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 text-[var(--text-muted)] ml-0.5" />
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
                  onClick={() => {
                    onExportTasksCSV(filteredTasks);
                    setIsExportMenuOpen(false);
                  }}
                  disabled={filteredTasks.length === 0}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-40 cursor-pointer"
                >
                  <span>Export Tasks (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{filteredTasks.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportNotesCSV(filteredNotes);
                    setIsExportMenuOpen(false);
                  }}
                  disabled={filteredNotes.length === 0}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-40 cursor-pointer"
                >
                  <span>Export Notes (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{filteredNotes.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportHabitsCSV(filteredHabits);
                    setIsExportMenuOpen(false);
                  }}
                  disabled={filteredHabits.length === 0}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl flex items-center justify-between disabled:opacity-40 cursor-pointer"
                >
                  <span>Export Habits (CSV)</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{filteredHabits.length}</span>
                </button>
                <div className="h-[1px] bg-[var(--border-subtle)] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onExportJSON();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-xl cursor-pointer"
                >
                  Full Archive Backup (JSON)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};


import React from 'react';
import { AlertTriangle, ShieldAlert, Trash2, X } from 'lucide-react';
import { Task, QuickNote, Habit } from '../../types';

interface ArchivePurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  purgeTargetDays: 30 | 60 | 90;
  setPurgeTargetDays: (days: 30 | 60 | 90) => void;
  purgeScope: 'all' | 'both' | 'tasks' | 'notes' | 'habits';
  setPurgeScope: (scope: 'all' | 'both' | 'tasks' | 'notes' | 'habits') => void;
  purgeConfirmationInput: string;
  setPurgeConfirmationInput: (val: string) => void;
  purgeCandidateTasks: Task[];
  purgeCandidateNotes: QuickNote[];
  purgeCandidateHabits: Habit[];
  onConfirmPurge: () => void;
}

export const ArchivePurgeModal: React.FC<ArchivePurgeModalProps> = ({
  isOpen,
  onClose,
  purgeTargetDays,
  setPurgeTargetDays,
  purgeScope,
  setPurgeScope,
  purgeConfirmationInput,
  setPurgeConfirmationInput,
  purgeCandidateTasks,
  purgeCandidateNotes,
  purgeCandidateHabits,
  onConfirmPurge,
}) => {
  if (!isOpen) return null;

  const totalCandidates =
    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'tasks') ? purgeCandidateTasks.length : 0) +
    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'notes') ? purgeCandidateNotes.length : 0) +
    ((purgeScope === 'all' || purgeScope === 'both' || purgeScope === 'habits') ? purgeCandidateHabits.length : 0);

  return (
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
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-xl transition-colors cursor-pointer"
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
                onClick={() => setPurgeTargetDays(days as 30 | 60 | 90)}
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
              {totalCandidates} records
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              purgeConfirmationInput.trim() !== 'PURGE' ||
              totalCandidates === 0
            }
            onClick={onConfirmPurge}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Purge</span>
          </button>
        </div>
      </div>
    </div>
  );
};

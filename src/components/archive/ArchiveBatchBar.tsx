import React, { useState } from 'react';
import { RotateCcw, Download, Trash2, X } from 'lucide-react';

interface ArchiveBatchBarProps {
  selectedCount: number;
  itemTypeLabel: string;
  onRestore: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const ArchiveBatchBar: React.FC<ArchiveBatchBarProps> = ({
  selectedCount,
  itemTypeLabel,
  onRestore,
  onExport,
  onDelete,
  onClearSelection,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 max-w-md mx-auto flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[var(--card-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-2xl animate-in slide-in-from-bottom-5">
      {/* Count Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--accent-terracotta)] text-white text-[10px] sm:text-xs font-bold shadow-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          {selectedCount === 1 ? itemTypeLabel : `${itemTypeLabel}s`} selected
        </span>
      </div>

      <div className="h-4 w-[1px] bg-[var(--border-subtle)] shrink-0" />

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end min-w-0">
        {/* Batch Restore */}
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-botanical-sage)] text-white hover:opacity-90 transition-opacity shadow-xs shrink-0 cursor-pointer"
          title="Restore selected items"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Restore</span>
        </button>

        {/* Batch Export */}
        <button
          type="button"
          onClick={onExport}
          className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors shrink-0 cursor-pointer"
          title="Export selected as CSV"
        >
          <Download className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
          <span className="hidden xs:inline">Export</span>
        </button>

        {/* Batch Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
            >
              Confirm ({selectedCount})
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-1.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
            title="Delete permanently"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Delete</span>
          </button>
        )}

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Deselect all"
          aria-label="Deselect all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

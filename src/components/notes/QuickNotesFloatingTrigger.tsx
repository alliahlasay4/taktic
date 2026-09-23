import React from 'react';
import { StickyNote } from 'lucide-react';

interface QuickNotesFloatingTriggerProps {
  onClick: () => void;
  notesCount: number;
  isOpen: boolean;
}

export const QuickNotesFloatingTrigger: React.FC<QuickNotesFloatingTriggerProps> = ({
  onClick,
  notesCount,
  isOpen,
}) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      title="Quick Notepad (Ctrl+J)"
      aria-label="Quick Notepad"
      className="group fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-lg hover:shadow-xl hover:border-[var(--accent-warm-ochre)]/60 hover:scale-105 active:scale-95 transition-all duration-200"
    >
      <div className="relative flex items-center justify-center">
        <div className="p-2 rounded-full bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] group-hover:scale-110 transition-transform">
          <StickyNote className="w-5 h-5" />
        </div>

        {notesCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[var(--accent-warm-ochre)] text-[10px] font-bold text-black ring-2 ring-[var(--card-surface)]">
            {notesCount > 9 ? '9+' : notesCount}
          </span>
        )}
      </div>
    </button>
  );
};

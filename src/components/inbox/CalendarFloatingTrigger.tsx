import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarFloatingTriggerProps {
  onClick: () => void;
  isOpen: boolean;
  selectedDate: string | null;
  overdueCount: number;
  isFocusMode?: boolean;
}

export const CalendarFloatingTrigger: React.FC<CalendarFloatingTriggerProps> = ({
  onClick,
  isOpen,
  selectedDate,
  overdueCount,
  isFocusMode = false,
}) => {
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`sm:hidden group fixed right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-lg hover:shadow-xl hover:border-[var(--accent-botanical-sage)]/60 hover:scale-105 active:scale-95 transition-all duration-200 ${
        isFocusMode ? 'bottom-34' : 'bottom-20'
      }`}
      aria-expanded={isOpen}
      aria-label="Calendar & Schedule Overview"
      title={selectedDate ? `Filtered: ${selectedDate}` : 'Calendar & Schedule Overview'}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`p-2 rounded-full transition-all group-hover:scale-110 ${
            selectedDate
              ? 'bg-[var(--accent-botanical-sage)] text-white shadow-xs'
              : 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)]'
          }`}
        >
          <Calendar className="w-5 h-5" strokeWidth={1.75} />
        </div>

        {selectedDate ? (
          <span
            className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-[var(--accent-botanical-sage)] ring-2 ring-[var(--card-surface)]"
            title={`Active date filter: ${selectedDate}`}
          />
        ) : overdueCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#9E7328] dark:bg-[#E0AF5E] text-[10px] font-bold text-white dark:text-black ring-2 ring-[var(--card-surface)]">
            {overdueCount > 9 ? '9+' : overdueCount}
          </span>
        ) : null}
      </div>
    </button>
  );
};

import React, { useEffect } from 'react';
import { Task } from '../../types';
import { InboxCalendarCard } from './InboxCalendarCard';

interface CalendarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onSwitchToNotes?: () => void;
}

export const CalendarDrawer: React.FC<CalendarDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  selectedDate,
  onSelectDate,
  onSwitchToNotes,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto z-[71]">
        <div className="w-full sm:w-[420px] max-w-full bg-[var(--bg-main)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <InboxCalendarCard
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onClose={onClose}
            onSwitchToNotes={onSwitchToNotes}
          />
        </div>
      </div>
    </div>
  );
};

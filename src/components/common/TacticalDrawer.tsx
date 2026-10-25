import React, { useEffect } from 'react';
import { X, StickyNote, Calendar } from 'lucide-react';
import { QuickNote, NoteColor, Task } from '../../types';
import { QuickNotesDrawer } from '../notes/QuickNotesDrawer';
import { InboxCalendarCard } from '../inbox/InboxCalendarCard';

export type TacticalDrawerMode = 'notes' | 'calendar';

export interface TacticalDrawerProps {
  isOpen: boolean;
  mode: TacticalDrawerMode;
  onClose: () => void;
  onSelectMode: (mode: TacticalDrawerMode) => void;

  // Notes props
  notes: QuickNote[];
  onAddNote: (note: { title?: string; content: string; color?: NoteColor; isPinned?: boolean }) => void;
  onUpdateNote: (id: string, updates: Partial<QuickNote>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onConvertToTask: (taskData: Omit<Task, 'id' | 'completed'>) => void;

  // Calendar props
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  overdueCalendarTasksCount?: number;
}

export const TacticalDrawer: React.FC<TacticalDrawerProps> = ({
  isOpen,
  mode,
  onClose,
  onSelectMode,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onConvertToTask,
  tasks,
  selectedDate,
  onSelectDate,
}) => {
  // ESC keyboard handler
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

  const activeNotesCount = notes.filter((n) => !n.archived).length;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" role="dialog" aria-modal="true" aria-label="Tactical Drawer">
      {/* Shared Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto z-[71]">
        <div className="w-full sm:w-[440px] max-w-full bg-[var(--bg-main)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 h-full">

          {/* Header Bar: Mobile shows title & close; Desktop shows top segmented tabs & close */}
          <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--card-surface)] flex items-center justify-between shrink-0 gap-3">
            {/* Desktop Mode Switcher Tabs (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectMode('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'notes'
                    ? 'bg-[var(--accent-warm-ochre)] text-black shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                  }`}
                title="Notepad (Ctrl+J)"
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Notepad</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md ${mode === 'notes'
                      ? 'bg-black/15 text-black font-bold'
                      : 'bg-[var(--theme-surface-active)] text-[var(--text-muted)]'
                    }`}
                >
                  {activeNotesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'calendar'
                    ? 'bg-[var(--accent-botanical-sage)] text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                  }`}
                title="Interactive Calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
                {selectedDate && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                )}
              </button>
            </div>

            {/* Mobile Title Display */}
            <div className="flex sm:hidden items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${mode === 'notes'
                    ? 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]'
                    : 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)]'
                  }`}
              >
                {mode === 'notes' ? <StickyNote className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {mode === 'notes' ? 'Notepad' : 'Calendar'}
              </h2>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded-lg bg-[var(--theme-surface-active)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                {mode === 'notes' ? 'Ctrl+J' : 'Esc'}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body - Seamless tab content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {mode === 'notes' ? (
              <QuickNotesDrawer
                isOpen={true}
                isEmbedded={true}
                onClose={onClose}
                notes={notes}
                onAddNote={onAddNote}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onTogglePin={onTogglePin}
                onConvertToTask={onConvertToTask}
                onSwitchToCalendar={() => onSelectMode('calendar')}
                onScheduleNoteToDate={(_note, targetDate) => {
                  if (targetDate === 'Today') {
                    const todayStr = new Date().toISOString().split('T')[0];
                    onSelectDate(todayStr);
                  }
                }}
              />
            ) : (
              <InboxCalendarCard
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                onClose={onClose}
                isEmbedded={true}
                onSwitchToNotes={() => onSelectMode('notes')}
              />
            )}
          </div>

          {/* Mobile Bottom Navigation Bar (Toggle below for phones) */}
          <div className="sm:hidden p-3 border-t border-[var(--border-subtle)] bg-[var(--card-surface)] shrink-0">
            <div className="grid grid-cols-2 gap-2 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectMode('notes')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'notes'
                    ? 'bg-[var(--accent-warm-ochre)] text-black shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                  }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Notepad</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${mode === 'notes'
                      ? 'bg-black/15 text-black font-bold'
                      : 'bg-[var(--theme-surface-active)] text-[var(--text-muted)]'
                    }`}
                >
                  {activeNotesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('calendar')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'calendar'
                    ? 'bg-[var(--accent-botanical-sage)] text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                  }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
                {selectedDate && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

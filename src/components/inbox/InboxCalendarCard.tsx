import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Clock, CheckCircle2, X, StickyNote } from 'lucide-react';
import { Task } from '../../types';
import { getLocalDateString, getDateWithOffset } from '../../lib/streak';

export interface InboxCalendarCardProps {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  onClose?: () => void;
  onSwitchToNotes?: () => void;
  isEmbedded?: boolean;
}

export const InboxCalendarCard: React.FC<InboxCalendarCardProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
  onClose,
  onSwitchToNotes,
  isEmbedded = false,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const todayStr = getLocalDateString(now);
    onSelectDate(todayStr);
  };

  const formatDateKey = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = getLocalDateString();

  const getTasksForDate = (dateKey: string) => {
    const isTodayKey = dateKey === todayStr;
    const tomorrowStr = getDateWithOffset(todayStr, 1);
    const isTomorrowKey = dateKey === tomorrowStr;

    return tasks.filter((t) => {
      if (t.completed) return false;
      if (!t.dueDate) return false;

      const due = t.dueDate.trim().toLowerCase();
      if (due === 'today' && isTodayKey) return true;
      if (due === 'tomorrow' && isTomorrowKey) return true;
      if (due === dateKey) return true;

      return false;
    });
  };

  const todayTasksCount = tasks.filter(
    (t) => !t.completed && (t.dueDate?.toLowerCase() === 'today' || t.dueDate === todayStr || t.isTodayFocus)
  ).length;

  const overdueCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    if (t.dueDate.toLowerCase() === 'today' || t.dueDate.toLowerCase() === 'tomorrow' || t.dueDate === 'This Weekend') return false;
    return t.dueDate < todayStr;
  }).length;

  const totalScheduled = tasks.filter((t) => !t.completed && t.dueDate).length;

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="flex flex-col h-full justify-between bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Drawer Header (simplified month navigation when embedded) */}
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--card-surface)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {monthNames[month]} {year}
              </h2>
              {selectedDate && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/30">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Interactive schedule & date overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent-botanical-sage)] hover:border-[var(--accent-botanical-sage)]/50 transition"
            title="Jump to Today"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isEmbedded && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors ml-1"
              aria-label="Close calendar drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Top Quick Schedule Metrics Strip (Compact pills below header) */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--card-surface)]/60 grid grid-cols-3 gap-2 shrink-0">
        <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)] shrink-0" />
          <div className="flex items-baseline gap-1 text-left">
            <span className="font-heading font-bold text-xs text-[var(--accent-botanical-sage)]">{todayTasksCount}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Due</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xs">
          <AlertCircle className="h-3.5 w-3.5 text-[#9E7328] dark:text-[#E0AF5E] shrink-0" />
          <div className="flex items-baseline gap-1 text-left">
            <span className={`font-heading font-bold text-xs ${overdueCount > 0 ? 'text-[#9E7328] dark:text-[#E0AF5E]' : 'text-[var(--text-muted)]'}`}>
              {overdueCount}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Overdue</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0" />
          <div className="flex items-baseline gap-1 text-left">
            <span className="font-heading font-bold text-xs text-[var(--accent-terracotta)]">{totalScheduled}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Total</span>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Day of Week Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider font-heading">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`pad-${idx}`} className="h-10 rounded-xl" />;
            }

            const dateKey = formatDateKey(dayNum);
            const isToday = dateKey === todayStr;
            const isSelected = selectedDate === dateKey;
            const dayTasks = getTasksForDate(dateKey);
            const taskCount = dayTasks.length;

            return (
              <button
                key={dateKey}
                onClick={() => {
                  if (isSelected) {
                    onSelectDate(null);
                  } else {
                    onSelectDate(dateKey);
                  }
                }}
                className={`relative flex flex-col items-center justify-between py-1.5 px-1 h-11 rounded-xl text-xs font-semibold transition group ${
                  isSelected
                    ? 'bg-[var(--accent-botanical-sage)] text-white shadow-xs font-bold z-10 scale-105'
                    : isToday
                      ? 'border-2 border-[var(--accent-botanical-sage)]/70 bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] font-bold'
                      : 'bg-[var(--card-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-botanical-sage)]/50 hover:bg-[var(--card-hover)]'
                }`}
              >
                <span className="leading-none text-[11px]">{dayNum}</span>

                {/* Density-Aware Task Indicators */}
                {taskCount > 0 && (
                  <div className="flex items-center justify-center">
                    {taskCount === 1 ? (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-[var(--accent-botanical-sage)]'
                        }`}
                        title="1 task scheduled"
                      />
                    ) : taskCount <= 3 ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: taskCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-[var(--accent-botanical-sage)]'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`text-[9px] font-bold px-1 rounded-full leading-none font-mono ${
                          isSelected
                            ? 'bg-white/30 text-white'
                            : 'bg-[var(--accent-botanical-sage)]/25 text-[var(--accent-botanical-sage)]'
                        }`}
                      >
                        {taskCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Tasks Preview */}
        {selectedDate && (
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
                Tasks for {selectedDate === todayStr ? 'Today' : selectedDate}
              </span>
              <button
                onClick={() => onSelectDate(null)}
                className="text-[11px] text-[var(--accent-botanical-sage)] hover:underline font-medium"
              >
                Clear filter
              </button>
            </div>

            {getTasksForDate(selectedDate).length === 0 ? (
              <div className="py-3 px-3 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-center">
                <p className="text-[11px] text-[var(--text-muted)] italic">No tasks scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {getTasksForDate(selectedDate).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-botanical-sage)]/40 transition-colors text-xs text-[var(--text-primary)] shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.priority === 'high'
                            ? 'bg-[var(--accent-terracotta)]'
                            : t.priority === 'medium'
                              ? 'bg-[var(--accent-warm-ochre)]'
                              : 'bg-[var(--accent-botanical-sage)]'
                        }`}
                      />
                      <span className="truncate font-medium">{t.title}</span>
                    </div>
                    {t.estimatedMinutes ? (
                      <span className="text-[10px] font-mono text-[var(--accent-terracotta)] shrink-0 ml-2 px-1.5 py-0.5 rounded-md bg-[var(--accent-terracotta)]/10">
                        {t.estimatedMinutes}m
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Info (shown only when standalone) */}
      {!isEmbedded && (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--card-surface)] flex items-center justify-between text-[11px] text-[var(--text-muted)] gap-2 shrink-0">
          {onSwitchToNotes ? (
            <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xs">
              <button
                type="button"
                onClick={onSwitchToNotes}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-all"
                title="Switch to Notepad"
              >
                <StickyNote className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                <span>Notepad</span>
              </button>
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--accent-botanical-sage)] text-white shadow-2xs">
                <Calendar className="w-3 h-3" />
                <span>Calendar</span>
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
              <span>Click any date to filter your master inbox</span>
            </span>
          )}
          <span className="hidden sm:inline-block shrink-0 text-[10px] opacity-75">Esc to close</span>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';

interface InboxCalendarCardProps {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export const InboxCalendarCard: React.FC<InboxCalendarCardProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
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
    const todayStr = now.toISOString().split('T')[0];
    onSelectDate(todayStr);
  };

  const formatDateKey = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getTasksForDate = (dateKey: string) => {
    const isTodayKey = dateKey === todayStr;
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
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
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-xs flex flex-col justify-between space-y-5 transition-colors duration-300">
      {/* Card Header & Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/30">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {monthNames[month]} {year}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]"> Schedule Overview</p>
            </div>
          </div>

          {/* Prev/Next Navigation */}
          <div className="flex items-center gap-1">
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
          </div>
        </div>

        {/* Day of Week Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider font-heading">
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
                className={`relative flex flex-col items-center justify-center h-10 rounded-xl text-xs font-semibold transition group ${isSelected
                  ? 'bg-[var(--accent-botanical-sage)] text-white shadow-xs font-bold z-10 scale-105'
                  : isToday
                    ? 'border-2 border-[var(--accent-botanical-sage)]/60 bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] font-bold'
                    : 'bg-[var(--bg-main)]/60 text-[var(--text-primary)] hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)]'
                  }`}
              >
                <span className="leading-none">{dayNum}</span>

                {/* Subtle Dot Indicator */}
                {taskCount > 0 && (
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full transition-all ${isSelected
                        ? 'bg-white'
                        : isToday
                          ? 'bg-[var(--accent-botanical-sage)]'
                          : 'bg-[var(--accent-botanical-sage)]'
                      }`}
                    title={`${taskCount} task(s) scheduled`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks Preview */}
      {selectedDate && (
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
              Tasks for {selectedDate === todayStr ? 'Today' : selectedDate}
            </span>
            <span className="text-[11px] font-mono text-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 px-2 py-0.5 rounded-md">
              {getTasksForDate(selectedDate).length} scheduled
            </span>
          </div>

          {getTasksForDate(selectedDate).length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] italic">No tasks scheduled for this date.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {getTasksForDate(selectedDate).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                >
                  <span className="truncate font-medium">{t.title}</span>
                  <span className="text-[10px] font-mono text-[var(--accent-terracotta)] shrink-0 ml-2">
                    {t.estimatedMinutes ? `${t.estimatedMinutes}m` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Schedule Statistics */}
      <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1 font-semibold">
            <Clock className="h-3 w-3 text-[var(--accent-botanical-sage)]" /> Due Today
          </p>
          <p className="font-heading font-bold text-sm text-[var(--accent-botanical-sage)] mt-0.5">{todayTasksCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1 font-semibold">
            <AlertCircle className="h-3 w-3 text-[#9E7328] dark:text-[#E0AF5E]" /> Overdue
          </p>
          <p className={`font-heading font-bold text-sm mt-0.5 ${overdueCount > 0 ? 'text-[#9E7328] dark:text-[#E0AF5E]' : 'text-[var(--text-muted)]'}`}>
            {overdueCount}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2.5">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3 text-[var(--accent-terracotta)]" /> Scheduled
          </p>
          <p className="font-heading font-bold text-sm text-[var(--accent-terracotta)] mt-0.5">{totalScheduled}</p>
        </div>
      </div>
    </div>
  );
};

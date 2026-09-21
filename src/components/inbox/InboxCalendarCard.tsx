import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
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

  // First day of current month (0 = Sun, 1 = Mon, ...)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Total days in current month
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

  // Helper to format date key YYYY-MM-DD
  const formatDateKey = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to check if task matches a specific date key (YYYY-MM-DD)
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

  // Calculate stats
  const todayTasksCount = tasks.filter(
    (t) => !t.completed && (t.dueDate?.toLowerCase() === 'today' || t.dueDate === todayStr || t.isTodayFocus)
  ).length;

  const overdueCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    if (t.dueDate.toLowerCase() === 'today' || t.dueDate.toLowerCase() === 'tomorrow' || t.dueDate === 'This Weekend') return false;
    return t.dueDate < todayStr;
  }).length;

  const totalScheduled = tasks.filter((t) => !t.completed && t.dueDate).length;

  // Build calendar days array
  const calendarCells = [];
  // Padding cells for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs flex flex-col justify-between space-y-4">
      {/* Card Header & Controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                {monthNames[month]} {year}
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)]">Task Schedule Overview</p>
            </div>
          </div>

          {/* Prev/Next Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:border-emerald-500/40 transition"
              title="Jump to Today"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] p-1 text-[var(--text-secondary)] hover:text-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] p-1 text-[var(--text-secondary)] hover:text-white transition"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--text-muted)] mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`pad-${idx}`} className="h-8 rounded-lg" />;
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
                    onSelectDate(null); // Toggle off filter
                  } else {
                    onSelectDate(dateKey);
                  }
                }}
                className={`relative flex flex-col items-center justify-center h-8 rounded-xl text-xs font-semibold transition group ${
                  isSelected
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 scale-105 font-bold z-10'
                    : isToday
                    ? 'border-2 border-emerald-500/60 bg-emerald-950/20 text-emerald-400 font-bold'
                    : 'bg-[var(--bg-main)]/60 text-[var(--text-primary)] hover:border-gray-700 hover:bg-[var(--card-hover)]'
                }`}
              >
                <span>{dayNum}</span>

                {/* Task Count Badge / Dot */}
                {taskCount > 0 && (
                  <span
                    className={`absolute -bottom-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-bold ${
                      isSelected
                        ? 'bg-black text-emerald-400'
                        : isToday
                        ? 'bg-emerald-500 text-black'
                        : 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {taskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Schedule Statistics */}
      <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-emerald-400" /> Due Today
          </p>
          <p className="font-heading font-bold text-sm text-emerald-400 mt-0.5">{todayTasksCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3 text-amber-400" /> Overdue
          </p>
          <p className={`font-heading font-bold text-sm mt-0.5 ${overdueCount > 0 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
            {overdueCount}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-2">
          <p className="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-teal-400" /> Total Scheduled
          </p>
          <p className="font-heading font-bold text-sm text-teal-400 mt-0.5">{totalScheduled}</p>
        </div>
      </div>
    </div>
  );
};

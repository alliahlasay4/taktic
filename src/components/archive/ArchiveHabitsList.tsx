import React from 'react';
import { Calendar, Repeat, RotateCcw, Trash2, Flame, Trophy, Target, Shield, Square, CheckSquare } from 'lucide-react';
import { Habit } from '../../types';
import { Pagination } from '../common/Pagination';
import { IconRenderer } from '../common/IconRenderer';
import { HighlightedText } from './ArchiveShared';

const HABIT_CATEGORIES: Record<
  string,
  { label: string; badge: string; icon: string }
> = {
  health: {
    label: 'Health',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: 'heart',
  },
  mindset: {
    label: 'Mindset',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: 'book',
  },
  growth: {
    label: 'Growth',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    icon: 'sunrise',
  },
  creative: {
    label: 'Creative',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: 'target',
  },
  fitness: {
    label: 'Fitness',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: 'activity',
  },
};

interface ArchiveHabitsListProps {
  habits: Habit[];
  searchQuery: string;
  selectedHabitId: string | null;
  onSelectHabit: (habit: Habit) => void;
  selectedHabitIds: string[];
  onToggleSelectHabitId: (id: string, e: React.MouseEvent) => void;
  onUnarchiveHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

export const ArchiveHabitsList: React.FC<ArchiveHabitsListProps> = ({
  habits,
  searchQuery,
  selectedHabitId,
  onSelectHabit,
  selectedHabitIds,
  onToggleSelectHabitId,
  onUnarchiveHabit,
  onDeleteHabit,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  confirmDeleteId,
  setConfirmDeleteId,
}) => {
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/40 text-center space-y-3 my-4">
        <div className="p-3.5 rounded-2xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]">
          <Repeat className="w-7 h-7" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No archived habits found
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Retired habits will stay securely stored here along with all past streak and check-in history.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(habits.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedHabits = habits.slice((safePage - 1) * pageSize, safePage * pageSize);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const groups = {
    today: [] as Habit[],
    yesterday: [] as Habit[],
    thisWeek: [] as Habit[],
    earlierThisMonth: [] as Habit[],
    older: [] as Habit[],
  };

  paginatedHabits.forEach((habit) => {
    const dateStr = habit.archivedAt || habit.createdAt;
    if (!dateStr) {
      groups.older.push(habit);
      return;
    }
    const dateObj = new Date(dateStr);
    const isoDay = dateObj.toISOString().split('T')[0];

    if (isoDay === todayStr) {
      groups.today.push(habit);
    } else if (isoDay === yesterdayStr) {
      groups.yesterday.push(habit);
    } else if (dateObj >= sevenDaysAgo) {
      groups.thisWeek.push(habit);
    } else if (dateObj >= thirtyDaysAgo) {
      groups.earlierThisMonth.push(habit);
    } else {
      groups.older.push(habit);
    }
  });

  const grouped = [
    { id: 'today', title: 'Archived Today', items: groups.today },
    { id: 'yesterday', title: 'Yesterday', items: groups.yesterday },
    { id: 'thisWeek', title: 'This Week', items: groups.thisWeek },
    { id: 'earlierThisMonth', title: 'Earlier This Month', items: groups.earlierThisMonth },
    { id: 'older', title: 'Older Records', items: groups.older },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.id} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                {group.title}
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {group.items.length} {group.items.length === 1 ? 'habit' : 'habits'}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-1.5">
            {group.items.map((habit) => {
              const isChecked = selectedHabitIds.includes(habit.id);
              const isSelected = selectedHabitId === habit.id;
              const catConfig = HABIT_CATEGORIES[habit.category] || HABIT_CATEGORIES.health;

              return (
                <div
                  key={habit.id}
                  onClick={() => onSelectHabit(habit)}
                  className={`group relative flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card-hover)] border-[var(--accent-terracotta)]/40 shadow-xs'
                      : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--card-hover)]'
                  }`}
                >
                  {/* Bulk Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => onToggleSelectHabitId(habit.id, e)}
                    className="p-1 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                    aria-label={isChecked ? `Deselect ${habit.title}` : `Select ${habit.title}`}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                    ) : (
                      <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Habit Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/20">
                    <IconRenderer name={habit.icon || habit.category} className="h-4 w-4" />
                  </div>

                  {/* Habit Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <HighlightedText
                        text={habit.title}
                        query={searchQuery}
                        className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate"
                      />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${catConfig.badge}`}>
                        {habit.category}
                      </span>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-terracotta)]">
                        <Flame className="w-3 h-3 fill-[var(--accent-terracotta)] text-[var(--accent-terracotta)]" />
                        {habit.streak}d streak
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                        <Trophy className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                        {habit.completedDates.length} logs
                      </span>

                      <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                        <Target className="w-3 h-3" />
                        {habit.targetDaysPerWeek || 7}x/wk
                      </span>

                      <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        {habit.freezeShieldsRemaining ?? 3}/3 shields
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onUnarchiveHabit && (
                      <button
                        type="button"
                        onClick={() => onUnarchiveHabit(habit.id)}
                        title="Restore to Active Habits"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteHabit && (
                      confirmDeleteId === habit.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteHabit(habit.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(habit.id)}
                          title="Delete permanently"
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalItems={habits.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50]}
        itemName="archived habits"
      />
    </div>
  );
};

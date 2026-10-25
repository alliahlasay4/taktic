import React from 'react';
import { Calendar, CheckCircle2, RotateCcw, Trash2, Tag, Clock, Square, CheckSquare } from 'lucide-react';
import { Task } from '../../types';
import { Pagination } from '../common/Pagination';
import { HighlightedText } from './ArchiveShared';

interface ArchiveTasksListProps {
  tasks: Task[];
  searchQuery: string;
  selectedTaskId: string | null;
  onSelectTask: (task: Task) => void;
  selectedTaskIds: string[];
  onToggleSelectTaskId: (id: string, e: React.MouseEvent) => void;
  onUnarchiveTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNavigateToInbox?: () => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

export const ArchiveTasksList: React.FC<ArchiveTasksListProps> = ({
  tasks,
  searchQuery,
  selectedTaskId,
  onSelectTask,
  selectedTaskIds,
  onToggleSelectTaskId,
  onUnarchiveTask,
  onDeleteTask,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onNavigateToInbox,
  confirmDeleteId,
  setConfirmDeleteId,
}) => {
  // Empty State
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/40 text-center space-y-3 my-4">
        <div className="p-3.5 rounded-2xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No archived tasks found
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Tasks moved from your active board will appear here cleanly preserved.
          </p>
        </div>
        {onNavigateToInbox && (
          <button
            type="button"
            onClick={onNavigateToInbox}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            Go to Active Tasks
          </button>
        )}
      </div>
    );
  }

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = tasks.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Group by date categories
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const groups = {
    today: [] as Task[],
    yesterday: [] as Task[],
    thisWeek: [] as Task[],
    earlierThisMonth: [] as Task[],
    older: [] as Task[],
  };

  paginatedTasks.forEach((task) => {
    const dateStr = task.archivedAt || task.completedAt || task.dueDate;
    if (!dateStr) {
      groups.older.push(task);
      return;
    }
    const dateObj = new Date(dateStr);
    const isoDay = dateObj.toISOString().split('T')[0];

    if (isoDay === todayStr) {
      groups.today.push(task);
    } else if (isoDay === yesterdayStr) {
      groups.yesterday.push(task);
    } else if (dateObj >= sevenDaysAgo) {
      groups.thisWeek.push(task);
    } else if (dateObj >= thirtyDaysAgo) {
      groups.earlierThisMonth.push(task);
    } else {
      groups.older.push(task);
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
              {group.items.length} {group.items.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-1.5">
            {group.items.map((task) => {
              const isChecked = selectedTaskIds.includes(task.id);
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`group relative flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card-hover)] border-[var(--accent-terracotta)]/40 shadow-xs'
                      : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--card-hover)]'
                  }`}
                >
                  {/* Bulk Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => onToggleSelectTaskId(task.id, e)}
                    className="p-1 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                    aria-label={isChecked ? `Deselect ${task.title}` : `Select ${task.title}`}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                    ) : (
                      <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <HighlightedText
                        text={task.title}
                        query={searchQuery}
                        className="text-xs sm:text-sm font-medium line-through text-[var(--text-secondary)] truncate"
                      />

                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                          task.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Metadata Subline */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-[var(--text-muted)]">
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
                          <span>#{task.tags.join(', #')}</span>
                        </div>
                      )}

                      {task.estimatedMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedMinutes}m</span>
                        </div>
                      )}

                      {task.archivedAt && (
                        <span>
                          Archived {new Date(task.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onUnarchiveTask(task.id)}
                      title="Restore to Active Board"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {confirmDeleteId === task.id ? (
                      <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTask(task.id);
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
                        onClick={() => setConfirmDeleteId(task.id)}
                        title="Delete permanently"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        totalItems={tasks.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50]}
        itemName="archived tasks"
      />
    </div>
  );
};

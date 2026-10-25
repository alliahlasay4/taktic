import React from 'react';
import { Search, Filter, Calendar, Tag, CheckSquare, Square, X } from 'lucide-react';
import { PriorityLevel, NoteColor } from '../../types';
import { COLOR_THEMES } from './ArchiveShared';

interface ArchiveFiltersProps {
  activeTab: 'tasks' | 'notes' | 'habits';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  timeHorizon: 'all' | 'today' | 'week' | 'month' | 'older';
  onTimeHorizonChange: (horizon: 'all' | 'today' | 'week' | 'month' | 'older') => void;
  // Tasks specific
  selectedPriority: PriorityLevel | 'all';
  onPriorityChange: (p: PriorityLevel | 'all') => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  allTags: string[];
  isAllTasksSelected: boolean;
  onToggleSelectAllTasks: () => void;
  hasTasks: boolean;
  // Notes specific
  selectedNoteColor: NoteColor | 'all';
  onNoteColorChange: (c: NoteColor | 'all') => void;
  isAllNotesSelected: boolean;
  onToggleSelectAllNotes: () => void;
  hasNotes: boolean;
  // Habits specific
  selectedHabitCategory: string;
  onHabitCategoryChange: (cat: string) => void;
  isAllHabitsSelected: boolean;
  onToggleSelectAllHabits: () => void;
  hasHabits: boolean;
  // Reset all
  onResetFilters: () => void;
}

export const ArchiveFilters: React.FC<ArchiveFiltersProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  timeHorizon,
  onTimeHorizonChange,
  selectedPriority,
  onPriorityChange,
  selectedTag,
  onTagChange,
  allTags,
  isAllTasksSelected,
  onToggleSelectAllTasks,
  hasTasks,
  selectedNoteColor,
  onNoteColorChange,
  isAllNotesSelected,
  onToggleSelectAllNotes,
  hasNotes,
  selectedHabitCategory,
  onHabitCategoryChange,
  isAllHabitsSelected,
  onToggleSelectAllHabits,
  hasHabits,
  onResetFilters,
}) => {
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      timeHorizon !== 'all' ||
      (activeTab === 'tasks' && (selectedPriority !== 'all' || selectedTag !== 'all')) ||
      (activeTab === 'notes' && selectedNoteColor !== 'all') ||
      (activeTab === 'habits' && selectedHabitCategory !== 'all')
  );

  return (
    <div className="space-y-2.5">
      {/* Primary Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-[var(--card-surface)] p-2.5 sm:p-3 rounded-2xl border border-[var(--border-subtle)] shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              activeTab === 'tasks'
                ? 'Search tasks by title, note, or tag...'
                : activeTab === 'notes'
                ? 'Search scratchpad notes...'
                : 'Search habits by title or category...'
            }
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-terracotta)]/40 transition-shadow"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Horizon */}
          <select
            value={timeHorizon}
            onChange={(e) => onTimeHorizonChange(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="older">Older</option>
          </select>

          {/* Tab Specific Filters */}
          {activeTab === 'tasks' && (
            <>
              <select
                value={selectedPriority}
                onChange={(e) => onPriorityChange(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {allTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => onTagChange(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              )}

              {hasTasks && (
                <button
                  type="button"
                  onClick={onToggleSelectAllTasks}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {isAllTasksSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{isAllTasksSelected ? 'Deselect' : 'Select All'}</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'notes' && (
            <>
              <select
                value={selectedNoteColor}
                onChange={(e) => onNoteColorChange(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden capitalize cursor-pointer"
              >
                <option value="all">All Colors</option>
                <option value="sage">Sage</option>
                <option value="terracotta">Terracotta</option>
                <option value="ochre">Ochre</option>
                <option value="rose">Rose</option>
                <option value="slate">Slate</option>
              </select>

              {hasNotes && (
                <button
                  type="button"
                  onClick={onToggleSelectAllNotes}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {isAllNotesSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{isAllNotesSelected ? 'Deselect' : 'Select All'}</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'habits' && (
            <>
              <select
                value={selectedHabitCategory}
                onChange={(e) => onHabitCategoryChange(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-hidden capitalize cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="health">Health</option>
                <option value="mindset">Mindset</option>
                <option value="growth">Growth</option>
                <option value="creative">Creative</option>
                <option value="fitness">Fitness</option>
              </select>

              {hasHabits && (
                <button
                  type="button"
                  onClick={onToggleSelectAllHabits}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-[var(--card-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                >
                  {isAllHabitsSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>{isAllHabitsSelected ? 'Deselect' : 'Select All'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Filter Chips Row - Only rendered when filters are active */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap px-1 text-xs text-[var(--text-muted)] animate-in fade-in duration-150">
          <span className="flex items-center gap-1 text-[11px] font-medium shrink-0">
            <Filter className="w-3 h-3" />
            Filtered by:
          </span>

          {Boolean(searchQuery.trim()) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              <span>"{searchQuery.trim()}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {timeHorizon !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              <Calendar className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
              <span>
                {timeHorizon === 'today'
                  ? 'Today'
                  : timeHorizon === 'week'
                  ? 'Past 7 Days'
                  : timeHorizon === 'month'
                  ? 'Past 30 Days'
                  : 'Older'}
              </span>
              <button
                type="button"
                onClick={() => onTimeHorizonChange('all')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeTab === 'tasks' && selectedPriority !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--accent-terracotta)] font-semibold capitalize">
              <span>Priority: {selectedPriority}</span>
              <button
                type="button"
                onClick={() => onPriorityChange('all')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeTab === 'tasks' && selectedTag !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <Tag className="w-3 h-3 text-[var(--accent-warm-ochre)]" />
              <span>#{selectedTag}</span>
              <button
                type="button"
                onClick={() => onTagChange('all')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeTab === 'notes' && selectedNoteColor !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] capitalize">
              <span className={`w-2 h-2 rounded-full ${COLOR_THEMES[selectedNoteColor]?.dot || 'bg-gray-400'}`} />
              <span>{selectedNoteColor}</span>
              <button
                type="button"
                onClick={() => onNoteColorChange('all')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeTab === 'habits' && selectedHabitCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] capitalize">
              <span>{selectedHabitCategory}</span>
              <button
                type="button"
                onClick={() => onHabitCategoryChange('all')}
                className="hover:text-rose-500 rounded-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

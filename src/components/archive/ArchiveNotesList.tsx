import React from 'react';
import { Calendar, StickyNote, RotateCcw, Trash2, Square, CheckSquare } from 'lucide-react';
import { QuickNote } from '../../types';
import { Pagination } from '../common/Pagination';
import { HighlightedText, COLOR_THEMES } from './ArchiveShared';

interface ArchiveNotesListProps {
  notes: QuickNote[];
  searchQuery: string;
  selectedNoteId: string | null;
  onSelectNote: (note: QuickNote) => void;
  selectedNoteIds: string[];
  onToggleSelectNoteId: (id: string, e: React.MouseEvent) => void;
  onUnarchiveNote?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

export const ArchiveNotesList: React.FC<ArchiveNotesListProps> = ({
  notes,
  searchQuery,
  selectedNoteId,
  onSelectNote,
  selectedNoteIds,
  onToggleSelectNoteId,
  onUnarchiveNote,
  onDeleteNote,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  confirmDeleteId,
  setConfirmDeleteId,
}) => {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/40 text-center space-y-3 my-4">
        <div className="p-3.5 rounded-2xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
          <StickyNote className="w-7 h-7" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No archived notes found
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Scratchpad notes cleared from your drawer will be safely preserved here.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotes = notes.slice((safePage - 1) * pageSize, safePage * pageSize);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const groups = {
    today: [] as QuickNote[],
    yesterday: [] as QuickNote[],
    thisWeek: [] as QuickNote[],
    earlierThisMonth: [] as QuickNote[],
    older: [] as QuickNote[],
  };

  paginatedNotes.forEach((note) => {
    const dateStr = note.archivedAt || note.updatedAt || note.createdAt;
    if (!dateStr) {
      groups.older.push(note);
      return;
    }
    const dateObj = new Date(dateStr);
    const isoDay = dateObj.toISOString().split('T')[0];

    if (isoDay === todayStr) {
      groups.today.push(note);
    } else if (isoDay === yesterdayStr) {
      groups.yesterday.push(note);
    } else if (dateObj >= sevenDaysAgo) {
      groups.thisWeek.push(note);
    } else if (dateObj >= thirtyDaysAgo) {
      groups.earlierThisMonth.push(note);
    } else {
      groups.older.push(note);
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
              {group.items.length} {group.items.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-1.5">
            {group.items.map((note) => {
              const isChecked = selectedNoteIds.includes(note.id);
              const isSelected = selectedNoteId === note.id;
              const theme = COLOR_THEMES[note.color] || COLOR_THEMES.slate;

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`group relative flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--card-hover)] border-[var(--accent-terracotta)]/40 shadow-xs'
                      : 'bg-[var(--card-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--card-hover)]'
                  }`}
                >
                  {/* Bulk Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => onToggleSelectNoteId(note.id, e)}
                    className="p-1 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
                    aria-label={isChecked ? `Deselect ${note.title || 'note'}` : `Select ${note.title || 'note'}`}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[var(--accent-terracotta)]" />
                    ) : (
                      <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>

                  {/* Note Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                      <HighlightedText
                        text={note.title || 'Untitled Scratch Note'}
                        query={searchQuery}
                        className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate"
                      />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                        {theme.label}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      <HighlightedText text={note.content} query={searchQuery} />
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                      <span>
                        Archived {note.archivedAt ? new Date(note.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onUnarchiveNote && (
                      <button
                        type="button"
                        onClick={() => onUnarchiveNote(note.id)}
                        title="Restore to Scratchpad"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteNote && (
                      confirmDeleteId === note.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteNote(note.id);
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
                          onClick={() => setConfirmDeleteId(note.id)}
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
        totalItems={notes.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50]}
        itemName="archived notes"
      />
    </div>
  );
};

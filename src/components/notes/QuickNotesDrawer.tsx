import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Copy,
  Check,
  Zap,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { QuickNote, NoteColor, Task } from '../../types';

interface QuickNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: QuickNote[];
  onAddNote: (note: { title?: string; content: string; color?: NoteColor; isPinned?: boolean }) => void;
  onUpdateNote: (id: string, updates: Partial<QuickNote>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onConvertToTask: (taskData: Omit<Task, 'id' | 'completed'>) => void;
  onSwitchToCalendar?: () => void;
  onScheduleNoteToDate?: (note: QuickNote, targetDate: string) => void;
  isEmbedded?: boolean;
}

const COLOR_THEMES: Record<
  NoteColor,
  { label: string; stripe: string; bg: string; dot: string; text: string; badge: string }
> = {
  sage: {
    label: 'Sage',
    stripe: 'border-l-[var(--accent-botanical-sage)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--accent-botanical-sage)]',
    text: 'text-[var(--accent-botanical-sage)]',
    badge: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border-[var(--accent-botanical-sage)]/30',
  },
  terracotta: {
    label: 'Terracotta',
    stripe: 'border-l-[var(--accent-terracotta)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--accent-terracotta)]',
    text: 'text-[var(--accent-terracotta)]',
    badge: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/30',
  },
  ochre: {
    label: 'Ochre',
    stripe: 'border-l-[var(--accent-warm-ochre)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--accent-warm-ochre)]',
    text: 'text-[var(--accent-warm-ochre)]',
    badge: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/30',
  },
  rose: {
    label: 'Rose',
    stripe: 'border-l-[var(--accent-dusty-rose)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--accent-dusty-rose)]',
    text: 'text-[var(--accent-dusty-rose)]',
    badge: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/30',
  },
  slate: {
    label: 'Slate',
    stripe: 'border-l-[var(--text-muted)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--text-muted)]',
    text: 'text-[var(--text-secondary)]',
    badge: 'bg-[var(--theme-surface-active)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  },
};

export const QuickNotesDrawer: React.FC<QuickNotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onConvertToTask,
  onSwitchToCalendar,
  onScheduleNoteToDate,
  isEmbedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState<NoteColor>('sage');
  const [newPinned, setNewPinned] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [convertedNoteId, setConvertedNoteId] = useState<string | null>(null);
  const [activeScheduleNoteId, setActiveScheduleNoteId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when creation mode opens
  useEffect(() => {
    if (isCreating && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isCreating]);

  // Filter active (non-archived) notes
  const activeNotes = useMemo(() => notes.filter((n) => !n.archived), [notes]);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    return activeNotes.filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    });
  }, [activeNotes, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const regularNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // Handle Note Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    onAddNote({
      title: newTitle.trim() || undefined,
      content: newContent.trim(),
      color: newColor,
      isPinned: newPinned,
    });

    setNewTitle('');
    setNewContent('');
    setNewColor('sage');
    setNewPinned(false);
    setIsCreating(false);
  };

  // Handle Copy Note Content
  const handleCopyNote = (note: QuickNote) => {
    const text = note.title ? `${note.title}\n\n${note.content}` : note.content;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Handle Convert to Master Task
  const handleConvertToTaskAction = (note: QuickNote, targetDueDate?: string) => {
    const taskTitle = note.title || note.content.split('\n')[0].replace(/^[-*•]\s*(\[[ xX]\]\s*)?/, '').slice(0, 60);
    const taskDesc = note.title ? note.content : (note.content.split('\n').length > 1 ? note.content : undefined);

    onConvertToTask({
      title: taskTitle,
      description: taskDesc,
      priority: 'medium',
      tags: ['notepad'],
      isTodayFocus: targetDueDate === 'Today',
      dueDate: targetDueDate,
      timeBlock: null,
    });

    setConvertedNoteId(note.id);
    setActiveScheduleNoteId(null);
    setTimeout(() => setConvertedNoteId(null), 2500);

    if (targetDueDate && onScheduleNoteToDate) {
      onScheduleNoteToDate(note, targetDueDate);
    }
  };

  // Toggle Markdown Checkbox inside note
  const handleToggleCheckbox = (note: QuickNote, lineIndex: number) => {
    const lines = note.content.split('\n');
    const targetLine = lines[lineIndex];
    if (!targetLine) return;

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]') || targetLine.includes('- [X]')) {
      lines[lineIndex] = targetLine.replace(/- \[[xX]\]/, '- [ ]');
    }

    onUpdateNote(note.id, { content: lines.join('\n') });
  };

  if (!isOpen) return null;

  const contentBody = (
    <div className="flex flex-col h-full justify-between bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Drawer Header (shown only when standalone) */}
      {!isEmbedded && (
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--card-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Notepad</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--theme-surface-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {notes.length}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Instant scratchpad for fleeting thoughts and ideas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono rounded-lg bg-[var(--theme-surface-active)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              Ctrl+J
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors"
              aria-label="Close scratchpad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Quick Action Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--border-subtle)] bg-[var(--card-surface)]/50 space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes & keywords..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-terracotta)]"
          />
        </div>

        {/* Modern Quick-Capture Bar (Desktop & Tablets: expands inline. Mobile: hidden when collapsed in favor of floating FAB) */}
        {isCreating ? (() => {
          const activeTheme = COLOR_THEMES[newColor] || COLOR_THEMES.sage;
          return (
            <form
              onSubmit={handleCreateSubmit}
              className={`p-3.5 rounded-2xl border border-[var(--border-subtle)] border-l-4 ${activeTheme.stripe} bg-[var(--card-surface)] shadow-md space-y-2.5 animate-in fade-in duration-200 transition-all`}
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (optional)..."
                className="w-full px-2.5 py-1 text-xs font-bold bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
              />

              <textarea
                ref={textareaRef}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Take a note or checklist (- [ ] task)..."
                rows={3}
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-terracotta)] resize-none leading-relaxed transition-colors"
              />

              {/* Color Pills & Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  {(Object.keys(COLOR_THEMES) as NoteColor[]).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-4 h-4 rounded-full ${COLOR_THEMES[c].dot} transition-all duration-150 ${newColor === c
                          ? 'scale-125 ring-2 ring-offset-2 ring-offset-[var(--card-surface)] ring-[var(--text-primary)] shadow-2xs'
                          : 'opacity-50 hover:opacity-100'
                        }`}
                      title={COLOR_THEMES[c].label}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setNewPinned(!newPinned)}
                    className={`p-1 rounded-lg text-xs transition-colors ${newPinned
                        ? 'bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                      }`}
                    title={newPinned ? 'Pinned note' : 'Pin note to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${newPinned ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--accent-terracotta)] text-white hover:opacity-90 disabled:opacity-50 shadow-2xs transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          );
        })() : (
          <div
            onClick={() => setIsCreating(true)}
            className="hidden sm:flex items-center justify-between p-2.5 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/60 hover:bg-[var(--card-surface)] hover:border-[var(--accent-terracotta)]/50 cursor-pointer text-xs text-[var(--text-muted)] transition-all shadow-2xs"
          >
            <span>Take a note or checklist...</span>
            <span className="p-1 rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>

      {/* Notes Stack Content (Scrollable with mobile floating action button) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Mobile Floating Action Button (+ Note) */}
        {!isCreating && (
          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
            }}
            className="sm:hidden absolute right-4 bottom-4 z-30 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[var(--accent-terracotta)] text-white shadow-lg hover:shadow-xl active:scale-95 transition-all border border-white/20 backdrop-blur-xs font-semibold text-xs tracking-wide"
            title="Create New Note"
            aria-label="Create New Note"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Note</span>
          </button>
        )}

        {filteredNotes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[var(--card-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <StickyNote className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">No notes found</p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                Tap <strong>"+"</strong> to capture thoughts, sprint links, or quick checklists.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)]">
                  <Pin className="w-3 h-3 fill-current" />
                  <span>Pinned Notes</span>
                </div>

                <div className="space-y-2.5">
                  {pinnedNotes.map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}

            {/* Regular Notes Section */}
            {regularNotes.length > 0 && (
              <div className="space-y-2">
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <span>All Notes</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  {regularNotes.map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer Footer Info (shown only when standalone, hidden in embedded drawer which has bottom nav) */}
      {!isEmbedded && (
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--card-surface)] flex items-center justify-between text-[11px] text-[var(--text-muted)] gap-2 shrink-0">
          {onSwitchToCalendar ? (
            <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-2xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--accent-warm-ochre)] text-black shadow-2xs">
                <StickyNote className="w-3 h-3" />
                <span>Notepad</span>
              </span>
              <button
                type="button"
                onClick={onSwitchToCalendar}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-all"
                title="Switch to Calendar Drawer"
              >
                <Calendar className="w-3 h-3 text-[var(--accent-botanical-sage)]" />
                <span>Calendar</span>
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" />
              <span>Notes sync live across all modules</span>
            </span>
          )}
          <span className="hidden sm:inline-block shrink-0 text-[10px] opacity-75">Esc to close</span>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return contentBody;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-[420px] max-w-full bg-[var(--bg-main)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {contentBody}
        </div>
      </div>
    </div>
  );

  // Render Individual Note Card
  function renderNoteCard(note: QuickNote) {
    const theme = COLOR_THEMES[note.color] || COLOR_THEMES.slate;
    const isCopied = copiedNoteId === note.id;
    const isConverted = convertedNoteId === note.id;
    const lines = note.content.split('\n');

    return (
      <div
        key={note.id}
        className={`group relative p-3 rounded-2xl border border-[var(--border-subtle)] border-l-4 ${theme.stripe} bg-[var(--card-surface)] transition-all duration-150 hover:border-r-[var(--border-strong)] hover:shadow-2xs`}
      >
        {/* Card Header & Controls */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            {note.title ? (
              <h4 className="text-xs font-bold text-[var(--text-primary)] leading-snug truncate">
                {note.title}
              </h4>
            ) : (
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {theme.label} Note
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 opacity-80 sm:opacity-40 group-hover:opacity-100 transition-opacity">
            {/* Direct Schedule to Calendar / Date */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveScheduleNoteId(activeScheduleNoteId === note.id ? null : note.id)}
                className={`p-1 rounded-md transition-colors ${activeScheduleNoteId === note.id
                    ? 'bg-[var(--accent-botanical-sage)] text-white shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10'
                  }`}
                title="Schedule this note onto your Calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>

              {/* Quick Date Scheduler Dropdown */}
              {activeScheduleNoteId === note.id && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-44 p-1.5 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-xl animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)]/50">
                    Schedule as Task
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConvertToTaskAction(note, 'Today')}
                    className="w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-[var(--card-hover)] hover:text-[var(--accent-botanical-sage)] font-medium transition-colors"
                  >
                    📅 Due Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertToTaskAction(note, 'Tomorrow')}
                    className="w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-[var(--card-hover)] hover:text-[var(--accent-botanical-sage)] font-medium transition-colors"
                  >
                    🌅 Due Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertToTaskAction(note, 'This Weekend')}
                    className="w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-[var(--card-hover)] hover:text-[var(--accent-botanical-sage)] font-medium transition-colors"
                  >
                    🏖️ This Weekend
                  </button>
                  {onSwitchToCalendar && (
                    <button
                      type="button"
                      onClick={() => {
                        handleConvertToTaskAction(note, 'Today');
                        onSwitchToCalendar();
                      }}
                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 font-bold border-t border-[var(--border-subtle)]/50 pt-1 mt-1 transition-colors"
                    >
                      → Schedule & Open Calendar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Convert to Master Task */}
            <button
              onClick={() => handleConvertToTaskAction(note)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] hover:bg-[var(--accent-botanical-sage)]/10 transition-colors"
              title="Convert this note into a Master Task"
            >
              {isConverted ? (
                <Check className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)] stroke-[2.5]" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Copy Content */}
            <button
              onClick={() => handleCopyNote(note)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors"
              title="Copy note content"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)] stroke-[2.5]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Pin Toggle */}
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-1 rounded-md transition-colors ${note.isPinned
                  ? 'text-[var(--accent-warm-ochre)] hover:bg-[var(--accent-warm-ochre)]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* Archive Note */}
            <button
              onClick={() => onDeleteNote(note.id)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Archive note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Body with Interactive Checkboxes & Formatting */}
        <div className="text-xs text-[var(--text-secondary)] space-y-1 leading-relaxed">
          {lines.map((line, idx) => {
            const isCheckboxUnchecked = line.startsWith('- [ ]');
            const isCheckboxChecked = line.startsWith('- [x]') || line.startsWith('- [X]');
            const isBullet = line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ');

            if (isCheckboxUnchecked || isCheckboxChecked) {
              const labelText = line.replace(/^- \[[ xX]\]\s*/, '');
              return (
                <div
                  key={idx}
                  onClick={() => handleToggleCheckbox(note, idx)}
                  className="flex items-start gap-2 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                >
                  <button type="button" className="mt-0.5 shrink-0">
                    {isCheckboxChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-botanical-sage)]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                  </button>
                  <span className={isCheckboxChecked ? 'line-through text-[var(--text-muted)]' : ''}>
                    {labelText}
                  </span>
                </div>
              );
            }

            return (
              <p key={idx} className={isBullet ? 'pl-2.5 relative' : ''}>
                {isBullet && <span className="absolute left-0">•</span>}
                {isBullet ? line.replace(/^[-*•]\s*/, '') : line}
              </p>
            );
          })}
        </div>

        {/* Converted Confirmation Banner */}
        {isConverted && (
          <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle)]/40 flex items-center justify-between text-[11px] text-[var(--accent-botanical-sage)] font-semibold animate-in fade-in">
            <span>✓ Task created in Master Inbox</span>
          </div>
        )}
      </div>
    );
  }
};

import React from 'react';
import { NoteColor } from '../../types';

export const COLOR_THEMES: Record<
  NoteColor,
  { label: string; border: string; bg: string; dot: string; text: string; badge: string }
> = {
  sage: {
    label: 'Sage',
    border: 'border-[var(--accent-botanical-sage)]/30',
    bg: 'bg-[var(--accent-botanical-sage)]/10',
    dot: 'bg-[var(--accent-botanical-sage)]',
    text: 'text-[var(--accent-botanical-sage)]',
    badge: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border-[var(--accent-botanical-sage)]/30',
  },
  terracotta: {
    label: 'Terracotta',
    border: 'border-[var(--accent-terracotta)]/30',
    bg: 'bg-[var(--accent-terracotta)]/10',
    dot: 'bg-[var(--accent-terracotta)]',
    text: 'text-[var(--accent-terracotta)]',
    badge: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/30',
  },
  ochre: {
    label: 'Ochre',
    border: 'border-[var(--accent-warm-ochre)]/30',
    bg: 'bg-[var(--accent-warm-ochre)]/10',
    dot: 'bg-[var(--accent-warm-ochre)]',
    text: 'text-[var(--accent-warm-ochre)]',
    badge: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/30',
  },
  rose: {
    label: 'Rose',
    border: 'border-[var(--accent-dusty-rose)]/30',
    bg: 'bg-[var(--accent-dusty-rose)]/10',
    dot: 'bg-[var(--accent-dusty-rose)]',
    text: 'text-[var(--accent-dusty-rose)]',
    badge: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/30',
  },
  slate: {
    label: 'Slate',
    border: 'border-[var(--border-subtle)]',
    bg: 'bg-[var(--card-surface)]',
    dot: 'bg-[var(--text-muted)]',
    text: 'text-[var(--text-secondary)]',
    badge: 'bg-[var(--theme-surface-active)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  },
};

/**
 * Highlights matches cleanly without harsh colors
 */
export const HighlightedText: React.FC<{ text: string; query: string; className?: string }> = ({
  text,
  query,
  className = '',
}) => {
  const trimmed = query.trim();
  if (!trimmed || !text) {
    return <span className={className}>{text}</span>;
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={index}
            className="bg-[var(--accent-warm-ochre)]/25 text-[var(--text-primary)] rounded-xs px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

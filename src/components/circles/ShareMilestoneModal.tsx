import React, { useState } from 'react';
import { X, Sparkles, Flame, Trophy, Zap, Target, Lock, Users } from 'lucide-react';
import { CircleFeedPost } from '../../types';

interface ShareMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (type: CircleFeedPost['type'], title: string, detail: string, isPrivate?: boolean) => void;
}

const CATEGORIES = [
  {
    id: 'ring_closed' as const,
    label: 'Rings Closed',
    sublabel: 'Daily goals complete',
    icon: Trophy,
    placeholderTitle: 'e.g., Completed all daily focus goals',
    placeholderDetail: 'Add details or reflections about today’s progress...',
    colorClass: 'text-[var(--accent-warm-ochre)]',
    bgClass: 'bg-[var(--accent-warm-ochre)]/15',
    activeBorder: 'border-[var(--accent-warm-ochre)]',
    suggestions: ['Completed 3/3 daily rings', 'Hit 100% daily target', 'Finished all focus blocks'],
  },
  {
    id: 'streak_milestone' as const,
    label: 'Streak',
    sublabel: 'Consistency streak',
    icon: Flame,
    placeholderTitle: 'e.g., Reached a 14-day streak',
    placeholderDetail: 'Notes on staying consistent...',
    colorClass: 'text-[var(--accent-terracotta)]',
    bgClass: 'bg-[var(--accent-terracotta)]/15',
    activeBorder: 'border-[var(--accent-terracotta)]',
    suggestions: ['7-day focus streak', '14-day streak', '30-day streak'],
  },
  {
    id: 'focus_marathon' as const,
    label: 'Focus Session',
    sublabel: 'Deep work sprint',
    icon: Zap,
    placeholderTitle: 'e.g., Finished 90-minute focus session',
    placeholderDetail: 'What you worked on during this session...',
    colorClass: 'text-[var(--accent-botanical-sage)]',
    bgClass: 'bg-[var(--accent-botanical-sage)]/15',
    activeBorder: 'border-[var(--accent-botanical-sage)]',
    suggestions: ['90-min deep focus session', '120-min work sprint', 'Morning focus block'],
  },
  {
    id: 'habit_mastered' as const,
    label: 'Habit',
    sublabel: 'Routine completed',
    icon: Target,
    placeholderTitle: 'e.g., Maintained daily routine for 2 weeks',
    placeholderDetail: 'Reflections on building this habit...',
    colorClass: 'text-[var(--accent-dusty-mauve)]',
    bgClass: 'bg-[var(--accent-dusty-mauve)]/15',
    activeBorder: 'border-[var(--accent-dusty-mauve)]',
    suggestions: ['Completed daily routine', 'Morning habits done', 'Evening review finished'],
  },
];

export const ShareMilestoneModal: React.FC<ShareMilestoneModalProps> = ({
  isOpen,
  onClose,
  onShare,
}) => {
  const [type, setType] = useState<CircleFeedPost['type']>('ring_closed');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [audience, setAudience] = useState<'circle' | 'masked'>('circle');

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === type) || CATEGORIES[0];
  const isPrivate = audience === 'masked';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onShare(type, title.trim(), detail.trim(), isPrivate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                isPrivate
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
              }`}
            >
              {isPrivate ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                {isPrivate ? 'Add Private Milestone' : 'Share Milestone'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {isPrivate
                  ? 'Saved to your personal timeline only.'
                  : 'Share an achievement with your circle.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: 2-column side-by-side on tablet/desktop (sm: & md:), vertical on mobile */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form id="milestone-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Column 1: Audience & Category */}
            <div className="space-y-4">
              {/* Audience */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudience('circle')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      audience === 'circle'
                        ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 shrink-0 ${
                        audience === 'circle' ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">Circle</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">Visible to partners</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience('masked')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      audience === 'masked'
                        ? 'border-amber-500 bg-amber-500/10 text-[var(--text-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Lock
                      className={`h-4 w-4 shrink-0 ${
                        audience === 'masked' ? 'text-amber-500' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">Private</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">Only you</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = type === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setType(cat.id)}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? `${cat.activeBorder} bg-[var(--surface-sunken)] shadow-2xs`
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`p-1.5 rounded-lg ${cat.bgClass} ${cat.colorClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-terracotta)]" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] truncate">
                          {cat.sublabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: Title & Details */}
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="milestone-title" className="text-xs font-semibold text-[var(--text-secondary)]">
                    Title
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)]">{title.length}/60</span>
                </div>
                <input
                  id="milestone-title"
                  name="title"
                  type="text"
                  maxLength={60}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={currentCategory.placeholderTitle}
                  required
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none"
                />

                {/* Suggestions */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[var(--text-muted)]">Suggestions:</span>
                  {currentCategory.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTitle(suggestion)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        title === suggestion
                          ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] text-white'
                          : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Input */}
              <div>
                <label htmlFor="milestone-detail" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Notes <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                </label>
                <textarea
                  id="milestone-detail"
                  name="detail"
                  rows={4}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={currentCategory.placeholderDetail}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none resize-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="milestone-form"
            className="rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            {isPrivate ? 'Save Milestone' : 'Share Milestone'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Flame, Trophy, Zap, Target, Heart, Eye } from 'lucide-react';
import { CircleFeedPost } from '../../types';

interface ShareMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (type: CircleFeedPost['type'], title: string, detail: string) => void;
}

const CATEGORIES = [
  {
    id: 'ring_closed' as const,
    label: 'Rings Closed',
    sublabel: 'Daily Focus Completion',
    icon: Trophy,
    presetTitle: 'Closed 3/3 Daily Focus Rings',
    presetDetail: 'Completed all focus, habit, and deep sprint rings today.',
    theme: {
      border: 'border-[var(--accent-warm-ochre)]/40',
      bg: 'bg-[var(--accent-warm-ochre)]/10',
      text: 'text-[var(--accent-warm-ochre)]',
      selectedBg: 'bg-[var(--accent-warm-ochre)]/15',
    },
    chipSuggestions: ['Closed 3/3 Daily Rings', 'Hit 100% Flow Target', 'Flawless Ring Sweep'],
  },
  {
    id: 'streak_milestone' as const,
    label: 'Streak Milestone',
    sublabel: 'Consistency & Momentum',
    icon: Flame,
    presetTitle: 'Reached 14-Day Consistency Streak',
    presetDetail: 'Showing up every day in silent accountability.',
    theme: {
      border: 'border-[var(--accent-terracotta)]/40',
      bg: 'bg-[var(--accent-terracotta)]/10',
      text: 'text-[var(--accent-terracotta)]',
      selectedBg: 'bg-[var(--accent-terracotta)]/15',
    },
    chipSuggestions: ['14-Day Focus Streak', '30-Day Discipline Milestone', '7-Day Unbroken Streak'],
  },
  {
    id: 'focus_marathon' as const,
    label: 'Sprint Marathon',
    sublabel: 'Deep Work Session',
    icon: Zap,
    presetTitle: 'Completed 120-Min Deep Work Sprint',
    presetDetail: 'Zero distraction silent co-working block.',
    theme: {
      border: 'border-[var(--accent-botanical-sage)]/40',
      bg: 'bg-[var(--accent-botanical-sage)]/10',
      text: 'text-[var(--accent-botanical-sage)]',
      selectedBg: 'bg-[var(--accent-botanical-sage)]/15',
    },
    chipSuggestions: ['120-Min Deep Focus Sprint', '90-Min Morning Flow Block', 'Double Focus Marathon'],
  },
  {
    id: 'habit_mastered' as const,
    label: 'Habit Mastered',
    sublabel: 'Routine Discipline',
    icon: Target,
    presetTitle: 'Mastered 5 Daily Routines',
    presetDetail: 'Completed morning routine and intentional planning.',
    theme: {
      border: 'border-[var(--accent-dusty-mauve)]/40',
      bg: 'bg-[var(--accent-dusty-mauve)]/10',
      text: 'text-[var(--accent-dusty-mauve)]',
      selectedBg: 'bg-[var(--accent-dusty-mauve)]/15',
    },
    chipSuggestions: ['Mastered 5 Daily Routines', 'Perfect Routine Execution', 'Morning Habit Streak'],
  },
];

export const ShareMilestoneModal: React.FC<ShareMilestoneModalProps> = ({
  isOpen,
  onClose,
  onShare,
}) => {
  const [type, setType] = useState<CircleFeedPost['type']>('ring_closed');
  const [title, setTitle] = useState(CATEGORIES[0].presetTitle);
  const [detail, setDetail] = useState(CATEGORIES[0].presetDetail);

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === type) || CATEGORIES[0];
  const CategoryIcon = currentCategory.icon;

  const handleSelectCategory = (selectedType: CircleFeedPost['type']) => {
    const cat = CATEGORIES.find((c) => c.id === selectedType);
    setType(selectedType);
    if (cat) {
      setTitle(cat.presetTitle);
      setDetail(cat.presetDetail);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onShare(type, title.trim(), detail.trim() || 'Achieved in silent focus sprint.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Broadcast Milestone
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <ShieldCheck className="h-3 w-3" /> Private Broadcast
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Broadcast an achievement badge to your accountability circle.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Two-column horizontal layout on Tablet & Desktop */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form id="broadcast-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            {/* Left Column (Category Selection & Live Feed Preview) */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
                  1. Choose Milestone Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = type === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? `${cat.theme.border} ${cat.theme.selectedBg} ring-2 ring-[var(--accent-warm-ochre)]/40 shadow-xs scale-[1.01]`
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-xl ${cat.theme.bg} ${cat.theme.text}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-[var(--accent-warm-ochre)]" />
                          )}
                        </div>
                        <span className="font-heading font-bold text-xs text-[var(--text-primary)] leading-snug">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                          {cat.sublabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <Eye className="h-3 w-3 text-[var(--accent-warm-ochre)]" /> Live Feed Preview
                  </span>
                  <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] px-2 py-0.5 text-[9px] font-bold">
                    Clean & Masked
                  </span>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-terracotta)] text-white text-[10px] font-bold">
                        Y
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">You (Broadcaster)</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Just now • Social Circle</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${currentCategory.theme.bg} ${currentCategory.theme.text}`}
                    >
                      <CategoryIcon className="h-2.5 w-2.5" />
                      <span>{currentCategory.label}</span>
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                    {title || 'Achievement Title'}
                  </p>

                  {detail && (
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
                      "{detail}"
                    </p>
                  )}

                  <div className="pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1 text-[var(--accent-terracotta)]">
                      <Heart className="h-3 w-3 fill-[var(--accent-terracotta)]" /> 0 Claps
                    </span>
                    <span>Private to Circle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Form Inputs & Privacy Shield) */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="broadcast-title" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      2. Achievement Title
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">{title.length}/60</span>
                  </div>
                  <input
                    id="broadcast-title"
                    name="title"
                    type="text"
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Closed 3/3 Daily Focus Rings"
                    required
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)]"
                  />

                  {/* Suggestion Chips */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)]">Presets:</span>
                    {currentCategory.chipSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setTitle(suggestion)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          title === suggestion
                            ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] font-semibold'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]/40'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Detail Note */}
                <div>
                  <label htmlFor="broadcast-detail" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    3. Optional Reflection Note
                  </label>
                  <textarea
                    id="broadcast-detail"
                    name="detail"
                    rows={3}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Add brief context or reflection..."
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] resize-none"
                  />
                </div>

                {/* Privacy Guarantee Box */}
                <div className="rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-primary)] leading-snug">
                    <span className="font-bold text-[var(--accent-botanical-sage)]">Privacy Protected: </span>
                    Broadcasts high-level milestone badges only. Task names, URLs, and code stay private.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="broadcast-form"
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-warm-ochre)] hover:brightness-110 px-5 py-2 text-xs font-bold text-black shadow-md transition active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Broadcast to Circle</span>
          </button>
        </div>
      </div>
    </div>
  );
};

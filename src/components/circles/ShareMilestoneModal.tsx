import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Flame, Trophy, Zap, Target, Lock, Users, Info, Check } from 'lucide-react';
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
    sublabel: 'Daily Focus Completion',
    icon: Trophy,
    placeholderTitle: 'e.g., Closed 3/3 Daily Focus Rings or Finished deep work goals',
    placeholderDetail: 'e.g., Completed morning flow block, hit 100% daily focus target...',
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
    placeholderTitle: 'e.g., Reached 14-Day Consistency Streak',
    placeholderDetail: 'e.g., Showing up every day in silent accountability...',
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
    placeholderTitle: 'e.g., Completed 120-Min Deep Work Sprint',
    placeholderDetail: 'e.g., Zero distraction flow session on core deliverables...',
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
    placeholderTitle: 'e.g., Mastered 5 Daily Routines',
    placeholderDetail: 'e.g., Completed morning planning and intentional reflection...',
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
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [audience, setAudience] = useState<'circle' | 'masked'>('circle');

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find((c) => c.id === type) || CATEGORIES[0];
  const isPrivate = audience === 'masked';

  const handleSelectCategory = (selectedType: CircleFeedPost['type']) => {
    setType(selectedType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onShare(type, title.trim(), detail.trim(), isPrivate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl shadow-xs transition-colors shrink-0 ${isPrivate
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]'
              }`}>
              {isPrivate ? <Lock className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-sm sm:text-lg text-[var(--text-primary)] truncate">
                  {isPrivate ? 'Log Masked Milestone' : 'Broadcast Milestone'}
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 ${isPrivate
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500'
                    : 'bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 text-[var(--accent-botanical-sage)]'
                  }`}>
                  {isPrivate ? <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                  {isPrivate ? 'Masked / Self Only' : 'Private to Circle'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate sm:whitespace-normal">
                {isPrivate
                  ? 'Record a private achievement locked to your personal timeline.'
                  : 'Broadcast an achievement badge to your accountability circle.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Modal Content - Two-column horizontal layout on Tablet & Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="broadcast-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            {/* Left Column: Sharing Audience & Category Selection */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              {/* 1. Target Audience / Visibility Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    1. Sharing Audience & Privacy
                  </label>

                  {/* Privacy Info Hover Tooltip */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent-botanical-sage)] transition cursor-help px-1.5 py-0.5 rounded-lg hover:bg-[var(--card-hover)]"
                      aria-label="Privacy guarantee information"
                    >
                      <Info className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
                      <span>Privacy Info</span>
                    </button>

                    <div className="pointer-events-none absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 z-50 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--card-surface)] p-3 shadow-xl backdrop-blur-md text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-botanical-sage)] mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>Privacy Guaranteed</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        Broadcasts high-level milestone badges to active circle partners. Task names, URLs, and confidential notes stay masked.
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
                        <strong className="text-amber-500">Masked mode</strong> keeps posts completely private to your own timeline.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option A: Broadcast to Circle */}
                  <button
                    type="button"
                    onClick={() => setAudience('circle')}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${audience === 'circle'
                        ? 'border-[var(--accent-warm-ochre)]/60 bg-[var(--accent-warm-ochre)]/15 ring-2 ring-[var(--accent-warm-ochre)]/40 shadow-xs scale-[1.01]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)]">
                        <Users className="h-4 w-4" />
                      </div>
                      {audience === 'circle' && (
                        <Check className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
                      )}
                    </div>
                    <span className="font-heading font-bold text-xs text-[var(--text-primary)] leading-snug">
                      Broadcast to Circle
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      Visible to your circle roster partners.
                    </span>
                  </button>

                  {/* Option B: Masked / Own Post */}
                  <button
                    type="button"
                    onClick={() => setAudience('masked')}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${audience === 'masked'
                        ? 'border-amber-500/60 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-xs scale-[1.01]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      {audience === 'masked' && (
                        <Check className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <span className="font-heading font-bold text-xs text-[var(--text-primary)] leading-snug">
                      Masked
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      Padlocked. Visible only to you in your feed.
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Choose Milestone Type (2x2 Grid) */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  2. Choose Milestone Type
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
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${isSelected
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
            </div>

            {/* Right Column: Title & Reflection Inputs */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* 3. Title Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="broadcast-title" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      3. Achievement Title
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
                    placeholder={currentCategory.placeholderTitle}
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
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${title === suggestion
                            ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] font-semibold shadow-2xs'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]/40'
                          }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Optional Reflection Note */}
                <div>
                  <label htmlFor="broadcast-detail" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    4. Optional Reflection Note
                  </label>
                  <textarea
                    id="broadcast-detail"
                    name="detail"
                    rows={4}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={currentCategory.placeholderDetail}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] resize-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="broadcast-form"
            className={`flex items-center gap-1.5 rounded-xl px-4 sm:px-5 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer ${isPrivate
                ? 'bg-amber-500 hover:brightness-110 text-black'
                : 'bg-[var(--accent-warm-ochre)] hover:brightness-110 text-black'
              }`}
          >
            {isPrivate ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            <span>{isPrivate ? 'Save Masked Milestone' : 'Broadcast to Circle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

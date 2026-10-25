import React, { useState, useMemo } from 'react';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  Flame,
  Lock,
  Trophy,
  Zap,
  Target,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { CircleFeedPost, CircleMember } from '../../types';
import { ShareMilestoneModal } from './ShareMilestoneModal';
import { CircleManagerModal } from './CircleManagerModal';

interface CircleFeedProps {
  feedPosts: CircleFeedPost[];
  members?: CircleMember[];
  userStreak?: number;
  currentUserId?: string;
  currentUserName?: string;
  onToggleLike: (postId: string, reaction?: string) => void;
  onBroadcastAchievement?: (type: CircleFeedPost['type'], title: string, detail: string, isPrivate?: boolean) => void;
  onDeletePost?: (postId: string) => void;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onAddMemberByName?: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const CircleFeed: React.FC<CircleFeedProps> = ({
  feedPosts,
  members = [],
  userStreak = 0,
  currentUserId,
  currentUserName,
  onToggleLike,
  onBroadcastAchievement,
  onDeletePost,
  onTogglePartner,
  onToggleMute,
  onAddMemberByName,
  onRemoveMember,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ring_closed' | 'streak_milestone' | 'focus_marathon' | 'habit_mastered'>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'mine' | 'partners'>('all');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleToggleCheer = (postId: string, emoji: string) => {
    if (onToggleLike) {
      onToggleLike(postId, emoji);
    }
  };

  const partnerMembers = useMemo(() => members.filter((m) => m.isCirclePartner !== false), [members]);

  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      const isOwnPost = Boolean(currentUserId && post.userId && post.userId === currentUserId) || post.userId === 'user';
      if (audienceFilter === 'mine' && !isOwnPost) return false;
      if (audienceFilter === 'partners' && isOwnPost) return false;

      if (activeFilter === 'all') return true;
      return post.type === activeFilter;
    });
  }, [feedPosts, audienceFilter, activeFilter, currentUserId]);

  // Total cheers given across circle
  const totalCircleCheers = useMemo(() => {
    return feedPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  }, [feedPosts]);

  const getPostBadge = (type: CircleFeedPost['type']) => {
    switch (type) {
      case 'ring_closed':
        return {
          icon: Trophy,
          label: 'Ring Closed',
          accentColor: 'var(--accent-warm-ochre)',
          badgeClass: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border-[var(--accent-warm-ochre)]/25',
          borderAccent: 'border-l-[var(--accent-warm-ochre)]',
        };
      case 'streak_milestone':
        return {
          icon: Flame,
          label: 'Streak Milestone',
          accentColor: 'var(--accent-terracotta)',
          badgeClass: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/25',
          borderAccent: 'border-l-[var(--accent-terracotta)]',
        };
      case 'focus_marathon':
        return {
          icon: Zap,
          label: 'Deep Focus Sprint',
          accentColor: 'var(--accent-botanical-sage)',
          badgeClass: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border-[var(--accent-botanical-sage)]/25',
          borderAccent: 'border-l-[var(--accent-botanical-sage)]',
        };
      case 'habit_mastered':
        return {
          icon: Target,
          label: 'Habit Mastered',
          accentColor: 'var(--accent-dusty-mauve)',
          badgeClass: 'bg-[var(--accent-dusty-mauve)]/15 text-[var(--accent-dusty-mauve)] border-[var(--accent-dusty-mauve)]/25',
          borderAccent: 'border-l-[var(--accent-dusty-mauve)]',
        };
      default:
        return {
          icon: Sparkles,
          label: 'Milestone',
          accentColor: 'var(--accent-dusty-rose)',
          badgeClass: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border-[var(--accent-dusty-rose)]/25',
          borderAccent: 'border-l-[var(--accent-dusty-rose)]',
        };
    }
  };

  const filterTabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'ring_closed' as const, label: 'Rings', icon: Trophy },
    { id: 'streak_milestone' as const, label: 'Streaks', icon: Flame },
    { id: 'focus_marathon' as const, label: 'Sprints', icon: Zap },
    { id: 'habit_mastered' as const, label: 'Habits', icon: Target },
  ];

  const reactionEmojis = [
    { id: 'fire', icon: Flame, label: 'Fire', activeColor: 'text-amber-500 fill-amber-500' },
    { id: 'zap', icon: Zap, label: 'Sprint', activeColor: 'text-yellow-500 fill-yellow-500' },
    { id: 'sparkles', icon: Sparkles, label: 'Sparkle', activeColor: 'text-teal-500 fill-teal-500' },
    { id: 'heart', icon: Heart, label: 'Love', activeColor: 'text-rose-500 fill-rose-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-tour="tour-feed-tab">
      {/* 1. Clean, Unified Header */}
      {/* Page Header Card - Warm Ochre & Gold Milestones Theme */}
      <header className="rounded-2xl border border-[var(--accent-warm-ochre)]/35 bg-gradient-to-r from-[var(--card-surface)] to-[var(--accent-warm-ochre)]/5 p-3.5 sm:p-5 shadow-xs shadow-[var(--accent-warm-ochre)]/5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30 font-bold shrink-0 shadow-2xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">
                  Milestones Feed
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-warm-ochre)]">
                  <ShieldCheck className="h-3 w-3" /> Private & Masked
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Celebrate focus milestones, unbroken streaks, and cheering circle momentum.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition active:scale-95 cursor-pointer shadow-2xs h-8.5"
              title="Manage Circle & Privacy"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>Circle</span>
            </button>

            {onBroadcastAchievement && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-warm-ochre)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer h-8.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Share Milestone</span>
              </button>
            )}
          </div>
        </div>

        {/* Quiet At-a-glance Metric Bar */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 px-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] mx-auto sm:mx-0 shrink-0">
              <Trophy className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-heading font-bold text-sm text-[var(--text-primary)] leading-tight">
                {feedPosts.length}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">Milestones</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 px-2 border-x border-[var(--border-subtle)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] mx-auto sm:mx-0 shrink-0">
              <Flame className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-heading font-bold text-sm text-[var(--text-primary)] leading-tight">
                {userStreak} {userStreak === 1 ? 'Day' : 'Days'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">Your Streak</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 px-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500 mx-auto sm:mx-0 shrink-0">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </span>
            <div>
              <p className="font-heading font-bold text-sm text-[var(--text-primary)] leading-tight">
                {totalCircleCheers}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">Circle Cheers</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Streamlined Controls Bar: Audience Tabs + Type Filter Dropdown/Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {/* Audience Segmented Control */}
        <div className="inline-flex items-center rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] self-start">
          {[
            { id: 'all' as const, label: 'All Feed' },
            { id: 'mine' as const, label: 'My Milestones' },
            { id: 'partners' as const, label: `Partners (${partnerMembers.length})` },
          ].map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setAudienceFilter(scope.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                audienceFilter === scope.id
                  ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills (Minimal & clean) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[var(--text-primary)] text-[var(--bg-main)] font-semibold shadow-xs'
                    : 'bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Milestone Cards Stream (Clean, uncluttered, breathable layout) */}
      <div className="space-y-3.5">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const badge = getPostBadge(post.type);
            const BadgeIcon = badge.icon;
            const selectedCheer = post.userReaction || (post.userLiked ? 'fire' : null);
            const totalCheers = post.likes;
            const isOwnPost = Boolean(currentUserId && post.userId && post.userId === currentUserId) || post.userId === 'user';
            const displayAuthorName = isOwnPost && currentUserName ? currentUserName : post.userName;

            return (
              <article
                key={post.id}
                className={`group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 transition duration-150 hover:border-[var(--accent-warm-ochre)]/40 hover:shadow-xs border-l-4 ${badge.borderAccent}`}
              >
                {/* Top Row: Author Info + Date + Mask Status */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={post.userAvatar}
                      alt={displayAuthorName}
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover ring-1 ring-[var(--border-subtle)] shrink-0"
                    />
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                        {displayAuthorName}
                      </span>
                      {isOwnPost && (
                        <span className="rounded-md bg-[var(--surface-sunken)] px-1.5 py-0.2 text-[10px] font-medium text-[var(--text-secondary)]">
                          You
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--text-muted)]">
                        • {post.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${badge.badgeClass}`}
                    >
                      <BadgeIcon className="h-3 w-3" />
                      <span>{badge.label}</span>
                    </span>

                    {post.isPrivate && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 rounded-md px-1.5 py-0.5"
                        title="Only you can see full breakdown"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Masked</span>
                      </span>
                    )}

                    {isOwnPost && onDeletePost && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this milestone from your feed?')) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="opacity-60 hover:opacity-100 p-1 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
                        title="Delete Milestone"
                        aria-label="Delete milestone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Milestone Content: Title & Detail */}
                <div className="pl-0 sm:pl-11 pr-2 space-y-1">
                  <h2 className="font-heading font-semibold text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                    {post.title}
                  </h2>
                  {post.detail && (
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {post.detail}
                    </p>
                  )}
                </div>

                {/* Bottom Footer: Minimal, friendly cheer interaction */}
                <div className="mt-3.5 pt-3 sm:pl-11 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  {/* Cheer counts */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Heart
                      className={`h-3.5 w-3.5 transition-colors ${
                        selectedCheer ? 'fill-rose-500 text-rose-500' : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <span className="font-medium text-xs text-[var(--text-primary)]">
                      {totalCheers} <span className="font-normal text-[var(--text-muted)]">{totalCheers === 1 ? 'cheer' : 'cheers'}</span>
                    </span>
                  </div>

                  {/* Reaction Pickers */}
                  <div className="flex items-center gap-1">
                    {reactionEmojis.map((emoji) => {
                      const Icon = emoji.icon;
                      const isSelected = selectedCheer === emoji.id;
                      return (
                        <button
                          key={emoji.id}
                          type="button"
                          onClick={() => handleToggleCheer(post.id, emoji.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] shadow-2xs scale-105 ' + emoji.activeColor
                              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                          }`}
                          title={`Cheer with ${emoji.label}`}
                          aria-label={`Cheer with ${emoji.label}`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${isSelected ? 'fill-current' : ''}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          /* Clean, friendly Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)]/60 py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-sunken)] text-[var(--accent-warm-ochre)] mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">
              No milestones found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs leading-relaxed">
              {activeFilter !== 'all' || audienceFilter !== 'all'
                ? 'Try adjusting your filters to see more circle milestones.'
                : 'Complete a focus session or finish your daily habit ring to share your first milestone!'}
            </p>
            {onBroadcastAchievement && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Broadcast Milestone</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Milestone Modal */}
      {onBroadcastAchievement && (
        <ShareMilestoneModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          onShare={onBroadcastAchievement}
        />
      )}

      {/* Circle Roster Manager Modal */}
      <CircleManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        members={members}
        onTogglePartner={onTogglePartner || (() => {})}
        onToggleMute={onToggleMute || (() => {})}
        onAddMemberByName={onAddMemberByName || (() => {})}
        onRemoveMember={onRemoveMember || (() => {})}
      />
    </div>
  );
};

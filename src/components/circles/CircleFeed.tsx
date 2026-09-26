import React, { useState } from 'react';
import { Heart, Sparkles, ShieldCheck, Flame, Lock, Trophy, Zap, Target, Filter, Plus, Settings } from 'lucide-react';
import { CircleFeedPost, CircleMember } from '../../types';
import { ShareMilestoneModal } from './ShareMilestoneModal';
import { CircleManagerModal } from './CircleManagerModal';

interface CircleFeedProps {
  feedPosts: CircleFeedPost[];
  members?: CircleMember[];
  onToggleLike: (postId: string, reaction?: string) => void;
  onBroadcastAchievement?: (type: CircleFeedPost['type'], title: string, detail: string) => void;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onAddMemberByName?: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const CircleFeed: React.FC<CircleFeedProps> = ({
  feedPosts,
  members = [],
  onToggleLike,
  onBroadcastAchievement,
  onTogglePartner,
  onToggleMute,
  onAddMemberByName,
  onRemoveMember,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ring_closed' | 'streak_milestone' | 'focus_marathon' | 'habit_mastered'>('all');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleToggleCheer = (postId: string, emoji: string) => {
    if (onToggleLike) {
      onToggleLike(postId, emoji);
    }
  };

  const filteredPosts = feedPosts.filter((post) => {
    if (activeFilter === 'all') return true;
    return post.type === activeFilter;
  });

  const getPostBadge = (type: CircleFeedPost['type']) => {
    switch (type) {
      case 'ring_closed':
        return {
          icon: Trophy,
          label: 'Ring Closed',
          bg: 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30',
          tag: '#FocusRings',
        };
      case 'streak_milestone':
        return {
          icon: Flame,
          label: 'Streak Milestone',
          bg: 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30',
          tag: '#Consistency',
        };
      case 'focus_marathon':
        return {
          icon: Zap,
          label: 'Focus Sprint',
          bg: 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/30',
          tag: '#DeepWork',
        };
      case 'habit_mastered':
        return {
          icon: Target,
          label: 'Habit Mastered',
          bg: 'bg-[var(--accent-dusty-mauve)]/15 text-[var(--accent-dusty-mauve)] border border-[var(--accent-dusty-mauve)]/30',
          tag: '#Routine',
        };
      default:
        return {
          icon: Sparkles,
          label: 'Milestone',
          bg: 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30',
          tag: '#Achievement',
        };
    }
  };

  return (
    <div className="space-y-6" data-tour="tour-feed-tab">
      {/* Feed Controls Header */}
      <div className="space-y-4">
        {/* Header & Quick Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)]">
                Milestone Feed & Social Activity
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                <ShieldCheck className="h-3 w-3" /> Privacy Mask Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Celebrate ring closures and focus streaks without leaking private task titles.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition active:scale-95 shadow-2xs"
              title="Manage Circle Members & Mute Controls"
            >
              <Settings className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span>Manage Circle</span>
            </button>

            {onBroadcastAchievement && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Broadcast</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[var(--text-muted)] mr-1 flex items-center gap-1 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </span>

          {[
            { id: 'all' as const, label: 'All Activity', icon: Sparkles, count: feedPosts.length },
            { id: 'ring_closed' as const, label: 'Rings', icon: Trophy, count: feedPosts.filter((p) => p.type === 'ring_closed').length },
            { id: 'streak_milestone' as const, label: 'Streaks', icon: Flame, count: feedPosts.filter((p) => p.type === 'streak_milestone').length },
            { id: 'focus_marathon' as const, label: 'Sprints', icon: Zap, count: feedPosts.filter((p) => p.type === 'focus_marathon').length },
            { id: 'habit_mastered' as const, label: 'Habits', icon: Target, count: feedPosts.filter((p) => p.type === 'habit_mastered').length },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0 whitespace-nowrap min-h-[36px] ${
                  isSelected
                    ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
                    : 'bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-[var(--card-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Stream Cards */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const badge = getPostBadge(post.type);
            const BadgeIcon = badge.icon;
            const selectedCheer = post.userReaction || (post.userLiked ? 'fire' : null);
            const totalCheers = post.likes;

            return (
              <div
                key={post.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 transition-all hover:border-[var(--accent-dusty-rose)]/40 shadow-xs space-y-4"
              >
                {/* Post Header: User, Time, Category Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="h-10 w-10 rounded-xl object-cover ring-2 ring-[var(--border-subtle)] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{post.userName}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">• {post.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${badge.bg}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[9px] font-mono font-medium text-[var(--text-muted)]">
                          {badge.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Badge */}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-muted)] shrink-0">
                    <Lock className="h-2.5 w-2.5 text-[var(--accent-botanical-sage)]" />
                    <span className="hidden sm:inline">Masked</span>
                  </span>
                </div>

                {/* Post Body */}
                <div className="space-y-1.5 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-subtle)] p-3.5">
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {post.detail}
                  </p>
                </div>

                {/* Post Footer: Cheer Count on Left, Single-Select Reaction Buttons on Right */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  {/* Total Cheers Counter */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Heart className={`h-3.5 w-3.5 transition-colors ${selectedCheer ? 'fill-rose-500 text-rose-500' : 'text-[var(--text-muted)]'}`} />
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      {totalCheers} <span className="font-normal text-[var(--text-secondary)]">{totalCheers === 1 ? 'Cheer' : 'Cheers'}</span>
                    </span>
                  </div>

                  {/* Reaction Icons (Single Selection Only) - Aligned to Right */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[
                      {
                        id: 'fire',
                        icon: Flame,
                        label: 'Fire',
                        activeClass: 'border-[var(--accent-terracotta)]/60 bg-[var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] shadow-xs scale-105',
                      },
                      {
                        id: 'zap',
                        icon: Zap,
                        label: 'Sprint',
                        activeClass: 'border-[var(--accent-warm-ochre)]/60 bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)] shadow-xs scale-105',
                      },
                      {
                        id: 'sparkles',
                        icon: Sparkles,
                        label: 'Sparkle',
                        activeClass: 'border-amber-400/60 bg-amber-400/20 text-amber-500 shadow-xs scale-105',
                      },
                      {
                        id: 'heart',
                        icon: Heart,
                        label: 'Love',
                        activeClass: 'border-rose-500/60 bg-rose-500/20 text-rose-500 shadow-xs scale-105',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedCheer === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleCheer(post.id, item.id)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition active:scale-90 cursor-pointer ${
                            isSelected
                              ? item.activeClass
                              : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                          }`}
                          title={`Cheer with ${item.label}`}
                          aria-label={`Cheer with ${item.label}`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${isSelected && item.id === 'heart' ? 'fill-current' : ''}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)] p-10 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                No Activity in this Category Yet
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                Complete your daily focus sprint or close a habit ring to broadcast your first milestone!
              </p>
            </div>
            {onBroadcastAchievement && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
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

      {/* Circle Roster Control Manager Modal */}
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

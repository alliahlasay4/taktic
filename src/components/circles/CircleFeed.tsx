import React, { useState } from 'react';
import { Heart, Sparkles, ShieldCheck, Flame, Lock, Trophy, Zap, Target, Filter, Plus, Settings } from 'lucide-react';
import { CircleFeedPost, CircleMember } from '../../types';
import { ShareMilestoneModal } from './ShareMilestoneModal';
import { CircleManagerModal } from './CircleManagerModal';

interface CircleFeedProps {
  feedPosts: CircleFeedPost[];
  members?: CircleMember[];
  onToggleLike: (postId: string) => void;
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
  const [cheersState, setCheersState] = useState<Record<string, string[]>>({});

  const handleToggleCheer = (postId: string, emoji: string) => {
    setCheersState((prev) => {
      const current = prev[postId] || [];
      const hasEmoji = current.includes(emoji);
      const updated = hasEmoji ? current.filter((e) => e !== emoji) : [...current, emoji];
      return { ...prev, [postId]: updated };
    });
    onToggleLike(postId);
  };

  const filteredPosts = feedPosts.filter((post) => {
    if (activeFilter === 'all') return true;
    return post.type === activeFilter;
  });

  const getPostBadge = (type: CircleFeedPost['type']) => {
    switch (type) {
      case 'ring_closed':
        return { icon: Trophy, label: 'Ring Closed', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', tag: '#FocusRings' };
      case 'streak_milestone':
        return { icon: Flame, label: 'Streak Milestone', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30', tag: '#Consistency' };
      case 'focus_marathon':
        return { icon: Zap, label: 'Focus Sprint', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', tag: '#DeepWork' };
      case 'habit_mastered':
        return { icon: Target, label: 'Habit Mastered', bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30', tag: '#Routine' };
      default:
        return { icon: Sparkles, label: 'Milestone', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', tag: '#Achievement' };
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-xs">
      {/* Header & Privacy Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading font-bold text-lg text-[var(--text-primary)]">
              Privacy-First Social Circle Feed
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> End-to-End Privacy Active
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Share progress ring milestones and streaks without revealing confidential client names or task details.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsManagerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500/40 hover:text-emerald-400 transition active:scale-95"
            title="Manage Circle Members & Mute Feed Updates"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Manage My Circle</span>
          </button>

          {onBroadcastAchievement && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Broadcast Milestone</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
        <span className="text-xs font-semibold text-[var(--text-muted)] mr-1 flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'ring_closed', label: '🏆 Rings' },
          { id: 'streak_milestone', label: '🔥 Streaks' },
          { id: 'focus_marathon', label: '⚡ Sprints' },
          { id: 'habit_mastered', label: '🎯 Habits' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === tab.id
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold shadow-xs'
                : 'border border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream Feed */}
      <div className="relative pl-4 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-teal-500/20 before:to-transparent">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const badge = getPostBadge(post.type);
            const BadgeIcon = badge.icon;
            const activeCheers = cheersState[post.id] || [];

            return (
              <div key={post.id} className="relative group">
                {/* Timeline Icon Node */}
                <div className={`absolute -left-[23px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-gray-800 bg-[var(--bg-main)] ${badge.bg} shadow-md`}>
                  <BadgeIcon className="h-3.5 w-3.5" />
                </div>

                {/* Timeline Stream Card */}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/80 p-4.5 transition-all hover:border-emerald-500/40 hover:bg-[var(--bg-main)] shadow-xs">
                  {/* Card Header: User & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userAvatar}
                        alt={post.userName}
                        className="h-10 w-10 rounded-xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[var(--text-primary)]">{post.userName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">• {post.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="rounded-full bg-[var(--card-hover)] px-2 py-0.5 text-[9px] font-mono text-[var(--text-muted)]">
                            {badge.tag}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                            <Lock className="h-2.5 w-2.5" /> Masked Task Title
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="ml-13 mb-3">
                    <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] group-hover:text-emerald-400 transition">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {post.detail}
                    </p>
                  </div>

                  {/* Multi-Emoji Interactive Cheer Bar */}
                  <div className="ml-13 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      {['🔥', '👏', '💪', '🎉', '❤️'].map((emoji) => {
                        const isSelected = activeCheers.includes(emoji);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleToggleCheer(post.id, emoji)}
                            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
                              isSelected
                                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400 scale-105 shadow-xs'
                                : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-gray-400 hover:border-gray-700 hover:scale-110'
                            }`}
                            title={`Cheer with ${emoji}`}
                          >
                            <span>{emoji}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Standard Like Counter */}
                    <button
                      onClick={() => onToggleLike(post.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        post.userLiked
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-500 shadow-xs'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-rose-500/30 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${post.userLiked ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
                      <span>{post.likes + activeCheers.length} Cheers</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
            <Sparkles className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-xs font-bold text-[var(--text-primary)]">No activity in this category yet</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Be the first to broadcast a milestone to your social circle!
            </p>
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


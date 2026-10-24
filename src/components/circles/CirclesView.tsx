import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  Users,
} from 'lucide-react';
import { CircleMember, CircleFeedPost } from '../../types';
import { CircleFeed } from './CircleFeed';
import { ShareMilestoneModal } from './ShareMilestoneModal';

interface CirclesViewProps {
  members: CircleMember[];
  feedPosts: CircleFeedPost[];
  userStreak: number;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  onToggleLike: (postId: string, reaction?: string) => void;
  onBroadcastAchievement?: (type: CircleFeedPost['type'], title: string, detail: string, isPrivate?: boolean) => void;
  onDeletePost?: (postId: string) => void;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onAddMemberByName?: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const CirclesView: React.FC<CirclesViewProps> = ({
  members,
  feedPosts,
  userStreak,
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const partnerMembers = members.filter((m) => m.isCirclePartner !== false);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs transition-colors duration-300">
      {/* Streamlined Milestones Header */}
      <div className="p-4 sm:p-6 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--accent-warm-ochre)] text-white font-bold shrink-0 shadow-md">
              <Sparkles className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-xl text-[var(--text-primary)]">
                  Milestones & Community Feed
                </h1>
                <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-warm-ochre)]">
                  {feedPosts.length} Milestones
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Celebrate habit ring closures, share deep work breakthroughs, and cheer on your circle.
              </p>
            </div>
          </div>

          {onBroadcastAchievement && (
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-warm-ochre)] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 h-9 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="h-4 w-4" />
              <span>Broadcast Milestone</span>
            </button>
          )}
        </div>

        {/* Lightweight Summary Strip */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{feedPosts.length} Shared</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Achievements</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{userStreak} Days</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Current Streak</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{partnerMembers.length} Partners</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">In Your Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="p-4 sm:p-6">
        <CircleFeed
          feedPosts={feedPosts}
          members={members}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onToggleLike={onToggleLike}
          onBroadcastAchievement={onBroadcastAchievement}
          onDeletePost={onDeletePost}
          onTogglePartner={onTogglePartner}
          onToggleMute={onToggleMute}
          onAddMemberByName={onAddMemberByName}
          onRemoveMember={onRemoveMember}
        />
      </div>

      {/* Milestone Modal */}
      {onBroadcastAchievement && (
        <ShareMilestoneModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={onBroadcastAchievement}
        />
      )}
    </div>
  );
};

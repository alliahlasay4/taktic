import React from 'react';
import { CircleMember, CircleFeedPost } from '../../types';
import { CircleFeed } from './CircleFeed';

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
  return (
    <div className="w-full">
      <CircleFeed
        feedPosts={feedPosts}
        members={members}
        userStreak={userStreak}
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
  );
};


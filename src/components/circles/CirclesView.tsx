import React from 'react';
import { CircleMember, CircleFeedPost } from '../../types';
import { LiveFocusRoom } from './LiveFocusRoom';
import { CircleFeed } from './CircleFeed';
import { useFocusRooms } from '../../hooks/useFocusRooms';

interface CirclesViewProps {
  members: CircleMember[];
  feedPosts: CircleFeedPost[];
  userStreak: number;
  onToggleLike: (postId: string) => void;
  onBroadcastAchievement?: (type: CircleFeedPost['type'], title: string, detail: string) => void;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onAddMemberByName?: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const CirclesView: React.FC<CirclesViewProps> = ({
  members,
  feedPosts,
  userStreak,
  onToggleLike,
  onBroadcastAchievement,
  onTogglePartner,
  onToggleMute,
  onAddMemberByName,
  onRemoveMember,
}) => {
  const {
    activeRoomCode,
    roomName,
    isHost,
    floatingEmojis,
    messages,
    soloInvisibleMode,
    focusPods,
    toggleSoloInvisibleMode,
    createFocusPod,
    renewPodLease,
    deleteFocusPod,
    createRoom,
    joinRoomByCode,
    updateRoomDetails,
    leaveRoom,
    sendEmojiReaction,
    sendBreakMessage,
  } = useFocusRooms();

  const handleCreateRoomWrapper = (roomData: { name: string; durationMinutes: number; code: string }) => {
    createRoom(roomData.name, roomData.durationMinutes, roomData.code);
  };

  return (
    <div className="space-y-6">
      <LiveFocusRoom
        members={members}
        userStreak={userStreak}
        activeRoomCode={activeRoomCode}
        roomName={roomName}
        isHost={isHost}
        floatingEmojis={floatingEmojis}
        messages={messages}
        soloInvisibleMode={soloInvisibleMode}
        focusPods={focusPods}
        onToggleSoloInvisibleMode={toggleSoloInvisibleMode}
        onCreatePod={createFocusPod}
        onRenewPodLease={renewPodLease}
        onDeletePod={deleteFocusPod}
        onCreateRoom={handleCreateRoomWrapper}
        onJoinRoom={joinRoomByCode}
        onUpdateRoomDetails={updateRoomDetails}
        onLeaveRoom={leaveRoom}
        onSendEmoji={sendEmojiReaction}
        onSendMessage={sendBreakMessage}
        onTogglePartner={onTogglePartner}
      />
      <CircleFeed
        feedPosts={feedPosts}
        members={members}
        onToggleLike={onToggleLike}
        onBroadcastAchievement={onBroadcastAchievement}
        onTogglePartner={onTogglePartner}
        onToggleMute={onToggleMute}
        onAddMemberByName={onAddMemberByName}
        onRemoveMember={onRemoveMember}
      />
    </div>
  );
};


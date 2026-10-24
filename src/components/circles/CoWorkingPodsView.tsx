import React, { useState, useMemo } from 'react';
import {
  Radio,
  Plus,
  KeyRound,
  Boxes,
  Users,
  Flame,
} from 'lucide-react';
import { CircleMember } from '../../types';
import { LiveFocusRoom } from './LiveFocusRoom';
import { useFocusRooms } from '../../hooks/useFocusRooms';
import { CreatePodModal } from './CreatePodModal';
import { JoinRoomModal } from './JoinRoomModal';

interface CoWorkingPodsViewProps {
  members: CircleMember[];
  userStreak: number;
  onTogglePartner?: (memberId: string) => void;
}

export const CoWorkingPodsView: React.FC<CoWorkingPodsViewProps> = ({
  members,
  userStreak,
  onTogglePartner,
}) => {
  const [isCreatePodOpen, setIsCreatePodOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);

  const {
    activeRoomCode,
    roomName,
    isHost,
    floatingEmojis,
    messages,
    focusPods,
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

  const activeFocusingCount = useMemo(
    () => members.filter((m) => m.status === 'focusing' && !m.isIncognito && m.statusText !== 'Offline').length,
    [members]
  );

  const activePodsCount = useMemo(
    () => focusPods.filter((p) => (p.activeMembersCount || 0) > 0).length,
    [focusPods]
  );

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs transition-colors duration-300">
      {/* Focused Co-Working Header */}
      <div className="p-4 sm:p-6 pb-4 sm:pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)] text-white font-bold shrink-0 shadow-md">
              <Radio className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-xl text-[var(--text-primary)]">
                  Focus Pods & Co-Working
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
                  {activeFocusingCount} Focusing Now
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Silent co-working pods, shared accountability timers, and live emoji support.
              </p>
            </div>
          </div>

          {/* Direct Co-Working Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsJoinRoomOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer shadow-2xs h-9"
            >
              <KeyRound className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
              <span>Join with Code</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatePodOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Standing Pod</span>
            </button>
          </div>
        </div>

        {/* Lightweight Stats Chips */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{activeFocusingCount} Active</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Co-workers</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shrink-0">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{focusPods.length} Pods</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">{activePodsCount} with Active Members</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{userStreak} Days</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Current Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Co-Working Area */}
      <div className="p-4 sm:p-6">
        <LiveFocusRoom
          members={members}
          userStreak={userStreak}
          activeRoomCode={activeRoomCode}
          roomName={roomName}
          isHost={isHost}
          floatingEmojis={floatingEmojis}
          messages={messages}
          focusPods={focusPods}
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
      </div>

      {/* Direct Modals for Pods View */}
      <CreatePodModal
        isOpen={isCreatePodOpen}
        onClose={() => setIsCreatePodOpen(false)}
        members={members}
        onCreatePod={createFocusPod}
      />

      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
        onJoinRoom={joinRoomByCode}
        sampleCode="TK-8492"
      />
    </div>
  );
};

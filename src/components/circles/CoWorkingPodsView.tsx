import React, { useState, useMemo } from 'react';
import {
  Radio,
  Plus,
  KeyRound,
  Boxes,
  Users,
  Flame,
  Zap,
} from 'lucide-react';
import { CircleMember } from '../../types';
import { LiveFocusRoom } from './LiveFocusRoom';
import { useFocusRooms } from '../../hooks/useFocusRooms';
import { CreatePodModal } from './CreatePodModal';
import { JoinRoomModal } from './JoinRoomModal';
import { CreateRoomModal } from './CreateRoomModal';

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
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

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
      {/* Streamlined Focus Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)] text-white font-bold shrink-0 shadow-xs">
              <Radio className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Focus Pods
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
                  {activeFocusingCount} Focusing Now
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Silent accountability spaces and shared focus sprints.
              </p>
            </div>
          </div>

          {/* Unified Actions Bar: Have a Code? + Quick Sprint + New Pod */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsJoinRoomOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer h-8.5"
              title="Join an active room or pod with code"
            >
              <KeyRound className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
              <span>Have a code?</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer shadow-2xs h-8.5"
              title="Start an instant ad-hoc sprint room"
            >
              <Zap className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
              <span>Quick Sprint</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatePodOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer h-8.5"
              title="Create a 30-day standing focus pod"
            >
              <Plus className="h-3.5 w-3.5" />
              <span> New Pod</span>
            </button>
          </div>
        </div>

        {/* Ambient Subtle Metrics Strip (cleaner & uncluttered) */}
        <div className="mt-3.5 pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-3 sm:gap-6 text-xs text-[var(--text-secondary)] flex-wrap">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
            <span className="font-semibold text-[var(--text-primary)]">{activeFocusingCount}</span>
            <span>active co-workers</span>
          </div>

          <div className="h-3 w-px bg-[var(--border-subtle)] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-[var(--accent-dusty-rose)]" />
            <span className="font-semibold text-[var(--text-primary)]">{focusPods.length}</span>
            <span>standing pods</span>
            {activePodsCount > 0 && (
              <span className="text-[10px] text-[var(--accent-botanical-sage)] font-semibold">
                ({activePodsCount} live)
              </span>
            )}
          </div>

          <div className="h-3 w-px bg-[var(--border-subtle)] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
            <span className="font-semibold text-[var(--text-primary)]">{userStreak}d</span>
            <span>streak</span>
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
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoomWrapper}
      />

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

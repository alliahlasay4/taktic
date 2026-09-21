import React, { useState, useEffect, useRef } from 'react';
import { Users, Flame, Plus, KeyRound, Copy, Check, MessageSquare, Edit3, LogOut, Lock, Coffee, Zap, Shield, Bell, X, EyeOff, Eye, ChevronDown, ChevronUp, Sparkles, Calendar } from 'lucide-react';
import { CircleMember, FocusPod } from '../../types';
import { formatTime } from '../../lib/utils';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinRoomModal } from './JoinRoomModal';
import { CreatePodModal } from './CreatePodModal';
import { FocusPodCard } from './FocusPodCard';
import { AsyncPodBoardDrawer } from './AsyncPodBoardDrawer';
import { BreakChatDrawer, RoomMessage } from './BreakChatDrawer';
import { FloatingEmoji } from '../../hooks/useFocusRooms';
import { soundEngine } from '../../lib/audio';

interface LiveFocusRoomProps {
  members: CircleMember[];
  userStreak: number;
  activeRoomCode: string | null;
  roomName: string;
  isHost: boolean;
  floatingEmojis: FloatingEmoji[];
  messages: RoomMessage[];
  soloInvisibleMode?: boolean;
  focusPods?: FocusPod[];
  onToggleSoloInvisibleMode?: () => void;
  onCreatePod?: (name: string, selectedMemberIds: string[], selectedMemberNames: string[], durationMinutes: number) => void;
  onRenewPodLease?: (podId: string) => void;
  onDeletePod?: (podId: string) => void;
  onCreateRoom: (roomData: { name: string; durationMinutes: number; code: string }) => void;
  onJoinRoom: (code: string) => void;
  onUpdateRoomDetails: (newName: string) => void;
  onLeaveRoom: () => void;
  onSendEmoji: (emoji: string) => void;
  onSendMessage: (text: string) => void;
  onTogglePartner?: (memberId: string) => void;
}

export const LiveFocusRoom: React.FC<LiveFocusRoomProps> = ({
  members,
  userStreak,
  activeRoomCode,
  roomName,
  isHost,
  floatingEmojis,
  messages,
  soloInvisibleMode = false,
  focusPods = [],
  onToggleSoloInvisibleMode,
  onCreatePod,
  onRenewPodLease,
  onDeletePod,
  onCreateRoom,
  onJoinRoom,
  onUpdateRoomDetails,
  onLeaveRoom,
  onSendEmoji,
  onSendMessage,
  onTogglePartner,
}) => {
  const [roomSeconds, setRoomSeconds] = useState(15 * 60);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreatePodOpen, setIsCreatePodOpen] = useState(false);
  const [selectedAsyncPod, setSelectedAsyncPod] = useState<FocusPod | null>(null);
  const [showInactivePods, setShowInactivePods] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(roomName);
  const [codeCopied, setCodeCopied] = useState(false);
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [autoCloseAlert, setAutoCloseAlert] = useState<string | null>(null);
  const [userMicroGoal, setUserMicroGoal] = useState<string>('Drafting API schema & documentation');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [isLockdownMode, setIsLockdownMode] = useState<boolean>(false);

  useEffect(() => {
    setEditedName(roomName);
  }, [roomName]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRoomSeconds((prev) => (prev <= 1 ? 25 * 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isBreakActive = roomSeconds <= 5 * 60;
  const prevBreakActiveRef = useRef(isBreakActive);

  // Auto-close chat drawer & trigger notification when break countdown hits 0s
  useEffect(() => {
    if (prevBreakActiveRef.current && !isBreakActive) {
      if (isChatOpen) {
        setIsChatOpen(false);
      }
      setAutoCloseAlert(
        '⚡ Break Time Ended (0s)! Synchronous Focus Sprint started — Break Lounge Chat closed automatically.'
      );
      soundEngine.playTimerCompleteSound();

      const alertTimer = setTimeout(() => {
        setAutoCloseAlert(null);
      }, 7500);
      return () => clearTimeout(alertTimer);
    }
    prevBreakActiveRef.current = isBreakActive;
  }, [isBreakActive, isChatOpen]);

  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveNameEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateRoomDetails(editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleOpenChatClick = () => {
    if (!isBreakActive) {
      setLockWarning('Focus sprint in progress ⚡ Break Lounge opens during 5-minute break.');
      setTimeout(() => setLockWarning(null), 3000);
      return;
    }
    setIsChatOpen(true);
  };

  // Active vs Inactive Pods filtering (Safeguard 3)
  const activePods = focusPods.filter((p) => (p.activeMembersCount || 0) > 0);
  const inactivePods = focusPods.filter((p) => (p.activeMembersCount || 0) === 0);

  // If user is not currently in an active room -> Render Co-Working Lobby
  if (!activeRoomCode) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-xs space-y-6">
        {/* Lobby Header & Solo Invisible Mode Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                Silent Co-Working & Permanent Focus Pods
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Co-work silently in standing team pods or temporary private rooms with invite codes.
              </p>
            </div>
          </div>

          {/* Solo Invisible Mode Toggle (Safeguard 1) */}
          {onToggleSoloInvisibleMode && (
            <button
              onClick={onToggleSoloInvisibleMode}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition active:scale-95 shrink-0 ${
                soloInvisibleMode
                  ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300 shadow-md shadow-indigo-500/10'
                  : 'border-[var(--border-subtle)] bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-white'
              }`}
              title="Work solo without broadcasting live presence or appearing active in standing pods"
            >
              {soloInvisibleMode ? (
                <>
                  <EyeOff className="h-4 w-4 text-indigo-400" />
                  <span>Solo Invisible Mode (ON)</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>Ghost Mode (OFF)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Section 1: Permanent Focus Pods (Standing Rooms) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                🏠 Permanent Focus Pods
              </h3>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                {activePods.length} Active Now
              </span>
            </div>

            {onCreatePod && (
              <button
                onClick={() => setIsCreatePodOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-black shadow-xs hover:from-emerald-400 hover:to-teal-400 transition active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Focus Pod</span>
              </button>
            )}
          </div>

          {/* Active Pods Grid */}
          {activePods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePods.map((pod) => (
                <FocusPodCard
                  key={pod.id}
                  pod={pod}
                  onJoinPod={(p) => onJoinRoom(`POD-${p.id.slice(-4)}`)}
                  onRenewLease={onRenewPodLease || (() => {})}
                  onDeletePod={onDeletePod}
                  onOpenAsyncBoard={(p) => setSelectedAsyncPod(p)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-5 text-center text-xs text-[var(--text-secondary)]">
              <Sparkles className="h-5 w-5 text-gray-500 mx-auto mb-1" />
              <span>No standing pod sprints currently active. Start a pod or join a quick room below!</span>
            </div>
          )}

          {/* Inactive Pods Accordion (Safeguard 3: Avoid Ghost Town Clutter) */}
          {inactivePods.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowInactivePods(!showInactivePods)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-emerald-400 transition"
              >
                {showInactivePods ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{showInactivePods ? 'Hide' : 'Show'} Idle Pods ({inactivePods.length})</span>
              </button>

              {showInactivePods && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {inactivePods.map((pod) => (
                    <FocusPodCard
                      key={pod.id}
                      pod={pod}
                      onJoinPod={(p) => onJoinRoom(`POD-${p.id.slice(-4)}`)}
                      onRenewLease={onRenewPodLease || (() => {})}
                      onDeletePod={onDeletePod}
                      onOpenAsyncBoard={(p) => setSelectedAsyncPod(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Quick Single-Session Rooms */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              ⚡ Quick Single-Session Rooms
            </h3>
            <span className="text-[11px] text-[var(--text-secondary)]">Temporary 6-digit code entry</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-black shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create Quick Room</span>
            </button>

            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500/40 transition active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-emerald-400" />
              <span>Join Room with Code</span>
            </button>
          </div>
        </div>

        {/* Modals & Drawers */}
        <CreateRoomModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreateRoom={onCreateRoom}
        />

        <JoinRoomModal
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          onJoinRoom={onJoinRoom}
          sampleCode="TK-8492"
        />

        {onCreatePod && (
          <CreatePodModal
            isOpen={isCreatePodOpen}
            onClose={() => setIsCreatePodOpen(false)}
            members={members}
            onCreatePod={onCreatePod}
          />
        )}

        <AsyncPodBoardDrawer
          isOpen={!!selectedAsyncPod}
          onClose={() => setSelectedAsyncPod(null)}
          pod={selectedAsyncPod}
        />
      </div>
    );
  }

  // Active Room State
  return (
    <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-5">
      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute top-12 right-12 z-20 pointer-events-none flex flex-col gap-2">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="animate-bounce flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1 text-sm font-bold text-white shadow-xl"
          >
            <span>{item.emoji}</span>
            <span className="text-[10px] text-emerald-400">{item.userName}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <form onSubmit={handleSaveNameEdit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="rounded-lg border border-emerald-500 bg-[var(--bg-main)] px-2 py-1 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-black">
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                    {roomName}
                  </h2>
                  {isHost && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-400 hover:text-emerald-400 transition"
                      title="Edit Room Name (Host Admin Control)"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {members.length + 1} Online
              </span>

              {/* Synchronous Lockdown Mode Badge / Control */}
              {isHost ? (
                <button
                  onClick={() => setIsLockdownMode(!isLockdownMode)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition active:scale-95 ${
                    isLockdownMode
                      ? 'border-red-500/50 bg-red-500/20 text-red-300'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                  title="Toggle Lockdown Sprint (Silences all chat & alerts)"
                >
                  <Lock className="h-3 w-3" />
                  <span>{isLockdownMode ? 'Lockdown ON' : 'Enable Lockdown'}</span>
                </button>
              ) : (
                isLockdownMode && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-300">
                    <Lock className="h-3 w-3" /> Lockdown Active
                  </span>
                )
              )}
            </div>

            {/* Room Code & Leave Room */}
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-0.5 text-xs">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Room Code:</span>
                <span className="font-mono font-bold text-emerald-400">{activeRoomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="ml-1 text-gray-400 hover:text-white transition"
                  title="Copy Invite Code"
                >
                  {codeCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              {/* Leave Room Action */}
              <button
                onClick={onLeaveRoom}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400 hover:bg-red-500/20 transition"
              >
                <LogOut className="h-3 w-3" />
                <span>Leave Room</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons & Timer */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Synchronous Sprint Timer */}
          <div className="text-right mr-1">
            <div className="flex items-center gap-1.5 justify-end">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {isBreakActive ? '☕ Break Interval' : '⚡ Synchronous Sprint'}
              </p>
              {!isBreakActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setRoomSeconds(5);
                  }}
                  className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 hover:bg-amber-500/30 transition"
                  title="Test Mode: Fast-forward to Break in 5s"
                >
                  ⏩ Skip to Break (5s)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsChatOpen(true);
                    setRoomSeconds(4);
                  }}
                  className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 hover:bg-red-500/30 transition"
                  title="Test Mode: Fast-forward break to 0s (trigger auto-close)"
                >
                  ⏩ End Break (4s)
                </button>
              )}
            </div>
            <p className={`font-heading font-bold text-lg ${isBreakActive ? 'text-amber-400' : 'text-[#B08B9E]'}`}>
              {formatTime(roomSeconds)}
            </p>
          </div>

          {/* Break Chat Drawer Trigger (Locked during active sprint or lockdown) */}
          <button
            onClick={handleOpenChatClick}
            disabled={isLockdownMode && !isBreakActive}
            className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              isBreakActive
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-amber-500/20 animate-pulse cursor-pointer'
                : 'border border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-main)] hover:border-gray-700'
            }`}
          >
            {isBreakActive ? (
              <Coffee className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="hidden md:inline">Break Lounge</span>
            {isBreakActive && messages.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Text-Only Break Wellness Guidance Bar (Strictly Zero Emojis) */}
      {isBreakActive && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-center text-xs font-semibold text-emerald-300 tracking-wide shadow-xs">
          Break interval active. Stand up, stretch your shoulders, take deep breaths, and hydrate before the next sprint.
        </div>
      )}

      {/* Auto-Close Reason Alert Banner */}
      {autoCloseAlert && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-amber-950/90 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Bell className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <p className="font-heading font-bold text-xs text-amber-300 uppercase tracking-wider">
                Chat Closed — Sprint Started
              </p>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                {autoCloseAlert}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoCloseAlert(null)}
            className="ml-3 rounded-lg p-1 text-amber-400 hover:bg-amber-500/20 transition"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Chat Lock Warning Alert */}
      {lockWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-2.5 text-center text-xs font-medium text-amber-400">
          ⚠️ {lockWarning}
        </div>
      )}

      {/* Floating Emoji Reaction Bar */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 px-3 py-2">
        <span className="text-xs font-semibold text-gray-400 mr-1 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> Silent Emoji Cheers:
        </span>
        {['🔥', '👏', '💪', '☕', '🙌', '✨'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmoji(emoji)}
            disabled={isLockdownMode}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900/60 text-sm hover:scale-125 hover:border-emerald-500/50 transition active:scale-95 disabled:opacity-50"
            title={isLockdownMode ? 'Reactions disabled during Lockdown Sprint' : `Send ${emoji} cheer`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Circle Members Live Grid with Micro-Goal Pinning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Current User Card with Micro-Goal Pin */}
        <div className="flex flex-col justify-between rounded-xl border-2 border-emerald-500/50 bg-emerald-950/20 p-3.5 shadow-xs space-y-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-xs font-bold text-white shadow-xs">
                  You
                </div>
                <div>
                  <p className="font-semibold text-xs text-[var(--text-primary)]">You {isHost ? '(Host)' : ''}</p>
                  <p className="text-[10px] font-medium text-emerald-400">Focusing in Room</p>
                </div>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            {/* Pinned Micro-Goal Intention */}
            <div className="mt-2 rounded-lg bg-[var(--card-surface)] border border-emerald-500/30 p-2 text-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 mb-1">
                <span>🎯 Pinned Micro-Goal:</span>
                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>

              {isEditingGoal ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={userMicroGoal}
                    onChange={(e) => setUserMicroGoal(e.target.value)}
                    className="w-full rounded bg-[var(--surface-sunken)] border border-emerald-500/50 px-2 py-1 text-[11px] text-white focus:outline-none"
                    placeholder="Set micro-goal..."
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingGoal(false)}
                    className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-black"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-primary)] font-medium truncate">
                  {userMicroGoal}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 font-semibold text-[#C06C4C]">
              <Flame className="h-3 w-3 fill-[#C06C4C]" />
              {userStreak}d Streak
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Connected
            </span>
          </div>
        </div>

        {/* Other Co-workers Cards */}
        {members.map((member, idx) => {
          const isPartner = member.isCirclePartner !== false;
          const sampleGoals = [
            'Refactoring TypeScript components',
            'Writing database migration scripts',
            'Designing landing page mockups',
            'Reviewing pull requests',
          ];
          const memberGoal = member.microGoal || sampleGoals[idx % sampleGoals.length];

          return (
            <div
              key={member.id}
              className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-3.5 transition-all hover:border-emerald-500/40 space-y-2"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-9 w-9 rounded-xl object-cover ring-1 ring-[var(--border-subtle)]"
                    />
                    <div>
                      <p className="font-semibold text-xs text-[var(--text-primary)]">{member.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate max-w-[110px]">
                        {member.statusText}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      member.status === 'focusing'
                        ? 'bg-emerald-500'
                        : member.status === 'completed_day'
                        ? 'bg-[#CFA052]'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                {/* Member Pinned Micro-Goal */}
                <div className="mt-2 rounded-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] p-2 text-xs">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5">🎯 Pinned Task:</span>
                  <p className="text-[11px] text-[var(--text-primary)] font-medium truncate">
                    {memberGoal}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] gap-1">
                <span className="flex items-center gap-1 font-semibold text-[#C06C4C]">
                  <Flame className="h-3 w-3 fill-[#C06C4C]" />
                  {member.streak}d Streak
                </span>

                {onTogglePartner ? (
                  <button
                    type="button"
                    onClick={() => onTogglePartner(member.id)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      isPartner
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25'
                    }`}
                    title={isPartner ? 'In your Social Circle (Click to remove)' : 'Click to add co-worker to your Social Circle'}
                  >
                    {isPartner ? '✓ In Circle' : '➕ Add to Circle'}
                  </button>
                ) : (
                  <span className="rounded-full bg-[#6B8E6E]/15 px-2 py-0.5 text-[10px] font-bold text-[#6B8E6E]">
                    {member.closedRingsCount}/3 Rings
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Focus Duration Leaderboard Card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#CFA052]" />
            <h3 className="font-heading font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
              Room Focus Duration Leaderboard
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            Live Room Sprints
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-[var(--card-surface)] border border-[#CFA052]/40 p-2.5">
            <span className="font-bold text-[#CFA052]">🥇 1st: You</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">125 mins</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[var(--card-surface)] border border-gray-700 p-2.5">
            <span className="font-bold text-gray-300">🥈 2nd: Alex Chen</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">90 mins</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[var(--card-surface)] border border-gray-700 p-2.5">
            <span className="font-bold text-gray-400">🥉 3rd: Sarah Lin</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">75 mins</span>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={onCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={onJoinRoom}
        sampleCode={activeRoomCode || 'TK-8492'}
      />

      <BreakChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={onSendMessage}
        isBreakActive={isBreakActive}
        roomSeconds={roomSeconds}
      />
    </div>
  );
};


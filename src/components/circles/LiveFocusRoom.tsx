import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Flame,
  Plus,
  Copy,
  Check,
  Edit3,
  LogOut,
  Lock,
  Coffee,
  Zap,
  Bell,
  X,
  Sparkles,
  Trophy,
  AlertCircle,
  FastForward,
  Heart,
  Medal,
  UserPlus,
  Target,
  Smile,
} from 'lucide-react';
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
  focusPods?: FocusPod[];
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
  focusPods = [],
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
  const [podFilter, setPodFilter] = useState<'all' | 'active' | 'idle'>('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(roomName);
  const [codeCopied, setCodeCopied] = useState(false);
  const [lockWarning, setLockWarning] = useState<string | null>(null);
  const [autoCloseAlert, setAutoCloseAlert] = useState<string | null>(null);
  const [userMicroGoal, setUserMicroGoal] = useState<string>('Drafting API schema & documentation');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [isLockdownMode, setIsLockdownMode] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [isCheerPickerOpen, setIsCheerPickerOpen] = useState<boolean>(false);
  const [selectedMemberPopover, setSelectedMemberPopover] = useState<CircleMember | null>(null);

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
      setAutoCloseAlert('Break over. Focus session resumed — lounge closed.');
      soundEngine.playTimerCompleteSound();

      const alertTimer = setTimeout(() => {
        setAutoCloseAlert(null);
      }, 4000);
      return () => clearTimeout(alertTimer);
    }
    prevBreakActiveRef.current = isBreakActive;
  }, [isBreakActive, isChatOpen]);

  // Ensure chat drawer cannot stay open when not in break
  useEffect(() => {
    if (!isBreakActive && isChatOpen) {
      setIsChatOpen(false);
    }
  }, [isBreakActive, isChatOpen]);

  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveNameEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    onUpdateRoomDetails(editedName.trim());
    setIsEditingName(false);
  };

  const handleOpenChatClick = () => {
    if (!isBreakActive) {
      setLockWarning('The lounge is available only during scheduled breaks.');
      setTimeout(() => setLockWarning(null), 3000);
      return;
    }
    setIsChatOpen(true);
  };


  const activePods = focusPods.filter((p) => (p.activeMembersCount || 0) > 0);
  const inactivePods = focusPods.filter((p) => (p.activeMembersCount || 0) === 0);

  const displayedPods =
    podFilter === 'active'
      ? activePods
      : podFilter === 'idle'
      ? inactivePods
      : focusPods;

  const renderReactionIcon = (reactionKey: string) => {
    const key = (reactionKey || '').toLowerCase();
    switch (key) {
      case 'flame':
      case 'streak':
        return <Flame className="h-4 w-4 text-[var(--accent-terracotta)] fill-[var(--accent-terracotta)] shrink-0" />;
      case 'zap':
      case 'sprint':
        return <Zap className="h-4 w-4 text-[var(--accent-warm-ochre)] fill-[var(--accent-warm-ochre)] shrink-0" />;
      case 'sparkles':
      case 'focus':
        return <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />;
      case 'heart':
      case 'cheer':
        return <Heart className="h-4 w-4 text-[var(--accent-dusty-rose)] fill-[var(--accent-dusty-rose)] shrink-0" />;
      case 'coffee':
      case 'break':
        return <Coffee className="h-4 w-4 text-amber-600 shrink-0" />;
      case 'trophy':
      case 'achieve':
        return <Trophy className="h-4 w-4 text-[var(--accent-warm-ochre)] fill-[var(--accent-warm-ochre)] shrink-0" />;
      default:
        return <Sparkles className="h-4 w-4 text-[var(--accent-warm-ochre)] shrink-0" />;
    }
  };

  // ==========================================
  // STATE 1: LOBBY STATE (NOT IN ACTIVE ROOM)
  // ==========================================
  if (!activeRoomCode) {
    return (
      <div className="space-y-6">


        {/* Standing Focus Pods Section */}
        <div className="space-y-4" data-tour="tour-standing-pods">
          {/* Section Header with Segmented Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shrink-0">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Standing Team Pods
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Recurring co-working spaces reserved for your circle squads
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] self-start sm:self-auto">
              {[
                { id: 'all' as const, label: `All (${focusPods.length})` },
                { id: 'active' as const, label: `Active (${activePods.length})` },
                { id: 'idle' as const, label: `Idle (${inactivePods.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPodFilter(tab.id)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition ${
                    podFilter === tab.id
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pods Grid */}
          {displayedPods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedPods.map((pod) => (
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
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center space-y-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] mx-auto">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="max-w-sm mx-auto">
                <p className="font-heading font-bold text-xs text-[var(--text-primary)]">
                  {podFilter === 'active'
                    ? 'No Active Pods Right Now'
                    : podFilter === 'idle'
                    ? 'No Idle Pods'
                    : 'No Standing Pods Created'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {podFilter === 'active'
                    ? 'None of your standing pods have active members focusing. Launch a pod session or join a quick room!'
                    : 'Create a standing pod to give your team or circle partners a permanent co-working link with a 30-day lease.'}
                </p>
              </div>
              {onCreatePod && podFilter !== 'idle' && (
                <button
                  type="button"
                  onClick={() => setIsCreatePodOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Focus Pod</span>
                </button>
              )}
            </div>
          )}
        </div>

        {(() => {
          const liveFocusingMembers = members.filter(
            (m) => m.status === 'focusing' && !m.isIncognito && m.statusText !== 'Offline'
          );

          if (liveFocusingMembers.length === 0) {
            return (
              <div className="pt-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] opacity-50" />
                  No circle partners focusing right now. Start a sprint to lead the way!
                </span>
              </div>
            );
          }

          return (
            <div className="pt-3.5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {/* Ambient overlapping avatars */}
                <div className="flex -space-x-2 overflow-hidden shrink-0">
                  {liveFocusingMembers.slice(0, 5).map((member) => (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                      title={`${member.name} • ${member.statusText || 'Focusing'}`}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-[var(--card-surface)] object-cover"
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {liveFocusingMembers.length} circle {liveFocusingMembers.length === 1 ? 'partner is' : 'partners are'} focusing
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    ({liveFocusingMembers.slice(0, 2).map((m) => m.name).join(', ')}
                    {liveFocusingMembers.length > 2 ? ` +${liveFocusingMembers.length - 2} more` : ''})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
                  Live Momentum
                </span>
              </div>
            </div>
          );
        })()}

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

  // ==========================================
  // STATE 2: INSIDE AN ACTIVE CO-WORKING ROOM
  // ==========================================
  return (
    <div className="relative space-y-5">
      {/* Floating Reaction Overlay */}
      <div className="absolute top-8 right-8 z-20 pointer-events-none flex flex-col gap-2">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="animate-bounce flex items-center gap-2 rounded-full bg-[var(--card-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] px-3.5 py-1.5 shadow-xl transition-all"
          >
            {renderReactionIcon(item.emoji)}
            <span className="text-xs font-bold text-[var(--text-primary)]">{item.userName}</span>
          </div>
        ))}
      </div>

      {/* Zen Room Minimal Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)] flex-wrap">
        {/* Left: Back / Leave button + Room Name & Code */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Leave Room"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave</span>
          </button>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <form onSubmit={handleSaveNameEdit} className="flex items-center gap-1.5">
                <input
                  id="edit-room-name-input"
                  name="editedRoomName"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  aria-label="Room name"
                  className="rounded-lg border border-[var(--accent-terracotta)] bg-[var(--bg-main)] px-2 py-1 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent-terracotta)] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="font-heading font-bold text-sm text-[var(--text-primary)] truncate max-w-[200px]">
                  {roomName}
                </h2>
                {isHost && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] transition p-0.5 cursor-pointer"
                    title="Edit Room Name"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-terracotta)] transition cursor-pointer"
              title="Click to copy room code"
            >
              <span>{activeRoomCode}</span>
              {codeCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-[var(--text-muted)]" />}
            </button>
          </div>
        </div>

        {/* Right Controls: Online pill, Lockdown toggle, Podium toggle, Fast-forward */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
            {members.length + 1} live
          </span>

          {isHost ? (
            <button
              type="button"
              onClick={() => setIsLockdownMode(!isLockdownMode)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                isLockdownMode
                  ? 'border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-300'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Toggle Lockdown Sprint (Silences chat until break interval)"
            >
              <Lock className="h-3 w-3" />
              <span className="hidden sm:inline">{isLockdownMode ? 'Lockdown ON' : 'Lockdown'}</span>
            </button>
          ) : (
            isLockdownMode && (
              <span className="flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[11px] font-bold text-red-600">
                <Lock className="h-3 w-3" />
              </span>
            )
          )}

          <button
            type="button"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
              showLeaderboard
                ? 'border-[var(--accent-warm-ochre)]/50 bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] font-bold'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
            }`}
            title="Toggle Session Podium Leaderboard"
          >
            <Trophy className="h-3 w-3 text-[var(--accent-warm-ochre)]" />
            <span className="hidden sm:inline">Podium</span>
          </button>

          <button
            type="button"
            onClick={() => setRoomSeconds(isBreakActive ? 4 : 5)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            title={isBreakActive ? 'Skip break (test)' : 'Skip sprint (test)'}
          >
            <FastForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Break Guidance Alert */}
      {isBreakActive && (
        <div className="rounded-xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 px-3.5 py-2.5 text-center text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center gap-2 shadow-2xs">
          <Coffee className="h-4 w-4 text-[var(--accent-warm-ochre)] shrink-0" />
          <span>Break in progress — stretch, hydrate, or chat in the lounge before the next sprint.</span>
        </div>
      )}

      {/* Auto-Close Alert */}
      {autoCloseAlert && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0" />
            <span className="truncate">{autoCloseAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutoCloseAlert(null)}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shrink-0 ml-2"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Lock Warning */}
      {lockWarning && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-2xs">
          <AlertCircle className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
          <span>{lockWarning}</span>
        </div>
      )}

      {/* Hero Centerpiece: Focused Monospace Countdown Timer & Avatars */}
      <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center space-y-4">
        {/* Phase Pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
          {isBreakActive ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse">
              <Coffee className="h-3.5 w-3.5" />
              Break Interval
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 px-3 py-1 rounded-full">
              <Zap className="h-3.5 w-3.5" />
              Focus Sprint
            </span>
          )}
        </div>

        {/* Large Timer Display */}
        <div className="space-y-1">
          <div
            className={`font-heading font-extrabold text-5xl sm:text-6xl tracking-tight leading-none ${
              isBreakActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-primary)]'
            }`}
          >
            {formatTime(roomSeconds)}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            {isBreakActive
              ? 'Unwind and recharge before the next sprint'
              : `Silent flow • ${members.length + 1} co-workers focusing together`}
          </p>
        </div>

        {/* Ambient Focused Co-Workers Row */}
        <div className="pt-2 flex items-center justify-center gap-4 sm:gap-6 flex-wrap max-w-xl">
          {/* Current User */}
          <div className="flex flex-col items-center text-center space-y-1 group relative">
            <div className="relative">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-[var(--accent-terracotta)] text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-[var(--accent-terracotta)] ring-offset-2 ring-offset-[var(--card-surface)]">
                You
              </div>
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-[var(--accent-botanical-sage)] border-2 border-[var(--card-surface)]" />
            </div>
            <div className="min-w-0 max-w-[80px]">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">You</p>
              <p className="text-[10px] text-[var(--accent-terracotta)] font-semibold truncate flex items-center justify-center gap-0.5">
                <Flame className="h-2.5 w-2.5 fill-[var(--accent-terracotta)]" />
                {userStreak}d
              </p>
            </div>
          </div>

          {/* Peer Co-Workers */}
          {members.map((member, idx) => {
            const sampleGoals = [
              'Refactoring components',
              'Writing database migrations',
              'Designing interface mockups',
              'Reviewing pull requests',
            ];
            const memberGoal = member.microGoal || sampleGoals[idx % sampleGoals.length];
            const isOffline = Boolean(member.isIncognito || member.statusText === 'Offline');

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMemberPopover(selectedMemberPopover?.id === member.id ? null : member)}
                className="flex flex-col items-center text-center space-y-1 group relative cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl object-cover ring-2 ring-offset-2 ring-offset-[var(--card-surface)] transition group-hover:scale-105 ${
                      isOffline
                        ? 'ring-slate-400 opacity-60'
                        : 'ring-[var(--accent-botanical-sage)] shadow-xs'
                    }`}
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[var(--card-surface)] ${
                      isOffline ? 'bg-slate-400' : 'bg-[var(--accent-botanical-sage)] animate-ping'
                    }`}
                  />
                </div>
                <div className="min-w-0 max-w-[80px]">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{member.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate" title={memberGoal}>
                    {memberGoal}
                  </p>
                </div>

                {/* Member Quick Popover on Click */}
                {selectedMemberPopover?.id === member.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-16 z-30 w-48 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 text-left shadow-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] truncate">{member.name}</span>
                      <button
                        onClick={() => setSelectedMemberPopover(null)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] italic">
                      "{memberGoal}"
                    </p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] text-[10px]">
                      <span className="flex items-center gap-1 text-[var(--accent-terracotta)] font-semibold">
                        <Flame className="h-3 w-3 fill-[var(--accent-terracotta)]" />
                        {member.streak}d streak
                      </span>
                      {onTogglePartner && (
                        <button
                          type="button"
                          onClick={() => onTogglePartner(member.id)}
                          className="flex items-center gap-1 text-[var(--accent-botanical-sage)] hover:underline font-bold cursor-pointer"
                        >
                          {member.isCirclePartner !== false ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>In Circle</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Docked Minimal Action Bar */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Micro-Goal Pill (Inline editable) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
            <Target className="h-3.5 w-3.5" />
          </div>
          {isEditingGoal ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsEditingGoal(false);
              }}
              className="flex items-center gap-1.5 min-w-0 flex-1"
            >
              <input
                id="edit-micro-goal-input"
                name="userMicroGoal"
                type="text"
                value={userMicroGoal}
                onChange={(e) => setUserMicroGoal(e.target.value)}
                className="w-full rounded-lg bg-[var(--card-surface)] border border-[var(--accent-terracotta)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                placeholder="What are you working on right now?"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent-terracotta)] px-2.5 py-1 text-xs font-bold text-white shrink-0 cursor-pointer"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-[var(--text-secondary)] font-medium truncate">
                <span className="text-[var(--text-muted)] mr-1">Goal:</span>
                {userMicroGoal || 'No goal set'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingGoal(true)}
                className="text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] transition p-0.5 shrink-0 cursor-pointer"
                title="Edit Micro-Goal"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Controls: Silent Cheer (Flyout Popover) + Break Lounge Chat Trigger */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Silent Cheer Flyout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCheerPickerOpen(!isCheerPickerOpen)}
              disabled={isLockdownMode}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95 disabled:opacity-40 cursor-pointer h-9 shadow-2xs"
              title={isLockdownMode ? 'Reactions disabled during Lockdown' : 'Send silent cheer'}
            >
              <Smile className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
              <span>Cheer</span>
            </button>

            {isCheerPickerOpen && (
              <div className="absolute right-0 bottom-11 z-30 flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl">
                {[
                  { id: 'flame', icon: Flame, label: 'Streak' },
                  { id: 'zap', icon: Zap, label: 'Sprint' },
                  { id: 'sparkles', icon: Sparkles, label: 'Focus' },
                  { id: 'heart', icon: Heart, label: 'Cheer' },
                  { id: 'coffee', icon: Coffee, label: 'Break' },
                  { id: 'trophy', icon: Trophy, label: 'Achieve' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSendEmoji(item.id);
                        setIsCheerPickerOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--accent-terracotta)] transition active:scale-95 cursor-pointer"
                      title={`Send ${item.label}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Break Lounge Button - only functional and openable during breaks */}
          <button
            type="button"
            onClick={handleOpenChatClick}
            disabled={!isBreakActive}
            title={isBreakActive ? 'Open Break Lounge' : 'Lounge opens during break'}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition h-9 shadow-2xs ${
              isBreakActive
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-500/20 animate-pulse cursor-pointer active:scale-95'
                : 'border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60 text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {isBreakActive ? (
              <Coffee className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            )}
            <span>Lounge</span>
            {!isBreakActive ? (
              <span className="text-[10px] text-[var(--text-muted)] font-normal hidden sm:inline">(Break only)</span>
            ) : messages.length > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 text-[9px] font-bold text-white">
                {messages.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Collapsible Session Focus Leaderboard */}
      {showLeaderboard && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 sm:p-4 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
              <span className="font-heading font-bold text-[var(--text-primary)]">Session Focus Leaderboard</span>
            </div>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--accent-warm-ochre)]/40 p-2.5 shadow-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--accent-warm-ochre)]">
                <Trophy className="h-3.5 w-3.5" /> 1st: You
              </span>
              <span className="font-mono font-bold text-[var(--text-primary)]">125 mins</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-2.5 shadow-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)]">
                <Medal className="h-3.5 w-3.5 text-[var(--text-muted)]" /> 2nd: Alex Chen
              </span>
              <span className="font-mono font-bold text-[var(--text-primary)]">90 mins</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-2.5 shadow-xs">
              <span className="flex items-center gap-1.5 font-bold text-[var(--accent-terracotta)]">
                <Medal className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" /> 3rd: Sarah Lin
              </span>
              <span className="font-mono font-bold text-[var(--text-primary)]">75 mins</span>
            </div>
          </div>
        </div>
      )}

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

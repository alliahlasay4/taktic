import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Flame,
  Plus,
  KeyRound,
  Copy,
  Check,
  Edit3,
  LogOut,
  Lock,
  Coffee,
  Zap,
  Shield,
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
  ArrowRight,
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
  const [quickCodeInput, setQuickCodeInput] = useState('');
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
        'Break Time Ended (0s)! Synchronous Focus Sprint started — Break Lounge Chat closed automatically.'
      );
      soundEngine.playTimerCompleteSound();

      const alertTimer = setTimeout(() => {
        setAutoCloseAlert(null);
      }, 6000);
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
    if (!editedName.trim()) return;
    onUpdateRoomDetails(editedName.trim());
    setIsEditingName(false);
  };

  const handleOpenChatClick = () => {
    if (isLockdownMode && !isBreakActive) {
      setLockWarning('Lockdown sprint active! Chat is silenced until the next break interval.');
      setTimeout(() => setLockWarning(null), 4000);
      return;
    }
    setIsChatOpen(true);
  };

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim()) return;
    onJoinRoom(quickCodeInput.trim().toUpperCase());
    setQuickCodeInput('');
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
        {/* Quick Launch & Instant Join Action Card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-4" data-tour="tour-quick-rooms">
          {/* Card Top Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Quick Co-Working & Instant Rooms
                </h3>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
                  Enter an invite code to join a session, or launch a new focus room for your circle.
                </p>
              </div>
            </div>
          </div>

          {/* 2 Balanced Columns: Direct Join on Left, Create Space on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left Block: Join Code Input Form */}
            <div className="lg:col-span-7">
              <label htmlFor="quick-join-room-code" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Join with Room or Pod Code
              </label>
              <form onSubmit={handleQuickJoinSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="quick-join-room-code"
                    name="quickRoomCode"
                    type="text"
                    placeholder="e.g. TK-8492 or POD-102"
                    value={quickCodeInput}
                    onChange={(e) => setQuickCodeInput(e.target.value)}
                    aria-label="Enter 6-digit room code"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] uppercase placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[42px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!quickCodeInput.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-40 shrink-0 shadow-xs min-h-[42px] active:scale-95 cursor-pointer"
                >
                  <span>Join Room</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Middle Divider (Desktop only) */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                OR
              </span>
            </div>

            {/* Right Block: Create Pod & Quick Room */}
            <div className="lg:col-span-4 flex flex-col justify-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Host a New Space
              </span>
              <div className="grid grid-cols-2 gap-2">
                {onCreatePod && (
                  <button
                    type="button"
                    onClick={() => setIsCreatePodOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)] hover:text-white px-3 py-2.5 text-xs font-bold transition active:scale-95 min-h-[42px] cursor-pointer shadow-2xs"
                    title="Create a 30-day recurring pod"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Create Pod</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:bg-[var(--card-hover)] hover:border-[var(--accent-warm-ochre)]/60 px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] transition active:scale-95 min-h-[42px] cursor-pointer shadow-2xs"
                  title="Start an instant sprint room"
                >
                  <Zap className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                  <span className="truncate">Quick Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Standing Focus Pods Section */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-5" data-tour="tour-standing-pods">
          {/* Section Header with Segmented Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shrink-0">
                <Users className="h-4 w-4" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  {podFilter === 'active'
                    ? 'No Active Pods Right Now'
                    : podFilter === 'idle'
                    ? 'No Idle Pods'
                    : 'No Standing Pods Created'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {podFilter === 'active'
                    ? 'None of your standing pods have active members focusing. Launch a pod session or join a quick room!'
                    : 'Create a standing pod to give your team or circle partners a permanent co-working link with a 30-day lease.'}
                </p>
              </div>
              {onCreatePod && podFilter !== 'idle' && (
                <button
                  type="button"
                  onClick={() => setIsCreatePodOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Focus Pod</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Active Co-Workers Overview */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--accent-botanical-sage)]" />
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Live Co-Worker Presence
              </h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
              {members.filter((m) => m.status === 'focusing').length} Focusing Live
            </span>
          </div>

          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)]"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-[var(--border-subtle)] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate">{member.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{member.statusText || 'Focusing'}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-[var(--accent-terracotta)]">
                      <Flame className="h-3 w-3 fill-[var(--accent-terracotta)]" />
                      <span>{member.streak}d Streak</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-center">
              <p className="text-xs text-[var(--text-secondary)]">
                No circle partners added yet. Invite friends from the Roster tab to track live co-worker presence!
              </p>
            </div>
          )}
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

  // ==========================================
  // STATE 2: INSIDE AN ACTIVE CO-WORKING ROOM
  // ==========================================
  return (
    <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-5">
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

      {/* Modern Room Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        {/* Room Details & Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
              <Shield className="h-4.5 w-4.5" />
            </div>

            {/* Editable Room Name */}
            {isEditingName ? (
              <form onSubmit={handleSaveNameEdit} className="flex items-center gap-1.5">
                <input
                  id="edit-room-name-input"
                  name="editedRoomName"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  aria-label="Room name"
                  className="rounded-lg border border-[var(--accent-terracotta)] bg-[var(--bg-main)] px-2.5 py-1 text-sm font-bold text-[var(--text-primary)] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent-terracotta)] px-3 py-1 text-xs font-bold text-white shadow-xs"
                >
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                  {roomName}
                </h2>
                {isHost && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] transition p-1"
                    title="Edit Room Name (Host Control)"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Online Badge */}
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
              {members.length + 1} Co-Working
            </span>

            {/* Lockdown Indicator / Host Toggle */}
            {isHost ? (
              <button
                type="button"
                onClick={() => setIsLockdownMode(!isLockdownMode)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition active:scale-95 ${
                  isLockdownMode
                    ? 'border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Toggle Lockdown Sprint (Silences chat until break interval)"
              >
                <Lock className="h-3 w-3" />
                <span>{isLockdownMode ? 'Lockdown ON' : 'Lockdown'}</span>
              </button>
            ) : (
              isLockdownMode && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-300">
                  <Lock className="h-3 w-3" /> Lockdown Active
                </span>
              )
            )}
          </div>

          {/* Room Code & Leave Room Row */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-2.5 py-1">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Code:</span>
              <span className="font-mono font-bold text-[var(--accent-terracotta)]">{activeRoomCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                title="Copy Room Invite Code"
              >
                {codeCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition active:scale-95"
            >
              <LogOut className="h-3 w-3" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Synchronous Sprint Countdown & Lounge Chat Trigger */}
        <div className="flex items-center gap-3">
          {/* Sprint Timer Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-4 py-2">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {isBreakActive ? (
                  <>
                    <Coffee className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">Break Interval</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 text-[var(--accent-terracotta)]" />
                    <span>Focus Sprint</span>
                  </>
                )}
              </div>
              <p
                className={`font-heading font-bold text-xl leading-none mt-0.5 ${
                  isBreakActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--accent-terracotta)]'
                }`}
              >
                {formatTime(roomSeconds)}
              </p>
            </div>

            {/* Test Skip / Fast-Forward */}
            <button
              type="button"
              onClick={() => setRoomSeconds(isBreakActive ? 4 : 5)}
              className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              title={isBreakActive ? 'Fast-forward break to 0s' : 'Fast-forward sprint to break'}
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Break Lounge / Chat Button */}
          <button
            type="button"
            onClick={handleOpenChatClick}
            disabled={isLockdownMode && !isBreakActive}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition active:scale-95 min-h-[44px] ${
              isBreakActive
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 animate-pulse font-bold'
                : 'border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
            }`}
          >
            {isBreakActive ? (
              <Coffee className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4 text-amber-500" />
            )}
            <span>Break Lounge</span>
            {isBreakActive && messages.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-terracotta)] text-[9px] font-bold text-white">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Break Wellness Guidance Alert */}
      {isBreakActive && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-200/90 dark:border-amber-500/50 dark:bg-amber-500/20 p-3.5 text-center text-xs font-bold text-stone-900 dark:text-amber-100 shadow-sm shadow-amber-400/20 flex items-center justify-center gap-2.5">
          <Coffee className="h-4.5 w-4.5 text-amber-900 dark:text-amber-300 shrink-0" />
          <span className="text-stone-900 dark:text-amber-100">Break interval active. Stand up, stretch your shoulders, take deep breaths, and hydrate before the next sprint.</span>
        </div>
      )}

      {/* Auto-Close Alert */}
      {autoCloseAlert && (
        <div className="flex items-center justify-between rounded-2xl border-2 border-amber-400 bg-amber-200/90 dark:border-amber-500/50 dark:bg-amber-500/20 p-3.5 shadow-md shadow-amber-400/20 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs text-stone-900 dark:text-amber-100">
                Sprint Started — Lounge Chat Closed
              </p>
              <p className="text-xs text-stone-800 dark:text-amber-200 font-semibold mt-0.5">{autoCloseAlert}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoCloseAlert(null)}
            className="p-1 rounded-lg text-stone-800 dark:text-amber-200 hover:bg-amber-400/50 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lock Warning */}
      {lockWarning && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-200/90 p-2.5 text-xs font-bold text-stone-900 dark:text-amber-100 shadow-xs">
          <AlertCircle className="h-4 w-4 text-amber-900 dark:text-amber-300 shrink-0" />
          <span>{lockWarning}</span>
        </div>
      )}

      {/* Silent Cheer Reactions Ribbon */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 flex-wrap">
        <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
          <span>Silent Cheers:</span>
        </span>

        <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => onSendEmoji(item.id)}
                disabled={isLockdownMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--accent-terracotta)] hover:border-[var(--accent-terracotta)]/40 transition active:scale-95 disabled:opacity-40 min-h-[36px]"
                title={isLockdownMode ? 'Reactions disabled during Lockdown' : `Send ${item.label} cheer`}
                aria-label={`Send ${item.label} cheer`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Co-Workers Presence & Micro-Goal Intentions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Current User Card */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-[var(--accent-terracotta)]/40 bg-[var(--accent-terracotta)]/5 p-4 shadow-xs space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)] text-xs font-bold text-white shadow-xs">
                  You
                </div>
                <div>
                  <p className="font-bold text-xs text-[var(--text-primary)]">You {isHost ? '(Host)' : ''}</p>
                  <p className="text-[10px] font-semibold text-[var(--accent-terracotta)]">Active in Sprint</p>
                </div>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
            </div>

            {/* Pinned Micro-Goal */}
            <div className="rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--accent-terracotta)] mb-1">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> Pinned Micro-Goal:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  aria-label="Edit Micro-Goal"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>

              {isEditingGoal ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    id="edit-micro-goal-input"
                    name="userMicroGoal"
                    type="text"
                    value={userMicroGoal}
                    onChange={(e) => setUserMicroGoal(e.target.value)}
                    aria-label="Set micro-goal"
                    className="w-full rounded-lg bg-[var(--surface-sunken)] border border-[var(--accent-terracotta)] px-2 py-1 text-[11px] text-[var(--text-primary)] focus:outline-none"
                    placeholder="Set micro-goal..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="rounded-lg bg-[var(--accent-terracotta)] px-2.5 py-1 text-[10px] font-bold text-white"
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

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-[var(--accent-terracotta)]">
              <Flame className="h-3.5 w-3.5 fill-[var(--accent-terracotta)]" />
              {userStreak}d Streak
            </span>
            <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
              Connected
            </span>
          </div>
        </div>

        {/* Peer Co-Worker Cards */}
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
              className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 p-4 transition-all hover:border-[var(--accent-dusty-rose)]/40 space-y-3 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-9 w-9 rounded-xl object-cover ring-1 ring-[var(--border-subtle)]"
                    />
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{member.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate max-w-[110px]">
                        {member.statusText || 'Focusing'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      member.status === 'focusing'
                        ? 'bg-[var(--accent-botanical-sage)] animate-ping'
                        : member.status === 'completed_day'
                        ? 'bg-[var(--accent-warm-ochre)]'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                {/* Member Pinned Micro-Goal */}
                <div className="rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-2.5 text-xs">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] mb-0.5">
                    <Target className="h-3 w-3" /> Pinned Task:
                  </span>
                  <p className="text-[11px] text-[var(--text-primary)] font-medium truncate">
                    {memberGoal}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] gap-1">
                <span className="flex items-center gap-1 font-semibold text-[var(--accent-terracotta)]">
                  <Flame className="h-3.5 w-3.5 fill-[var(--accent-terracotta)]" />
                  {member.streak}d Streak
                </span>

                {onTogglePartner && (
                  <button
                    type="button"
                    onClick={() => onTogglePartner(member.id)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      isPartner
                        ? 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30 hover:bg-[var(--accent-dusty-rose)]/25'
                        : 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30 hover:bg-[var(--accent-terracotta)]/25'
                    }`}
                    title={isPartner ? 'In Circle (Click to remove)' : 'Add to Circle'}
                  >
                    {isPartner ? (
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
          );
        })}
      </div>

      {/* Room Focus Duration Podium Leaderboard */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
            <h3 className="font-heading font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
              Session Focus Leaderboard
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[var(--accent-warm-ochre)] bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2.5 py-0.5 rounded-full">
            Live Sprint Momentum
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--accent-warm-ochre)]/40 p-3 shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-[var(--accent-warm-ochre)]">
              <Trophy className="h-4 w-4" /> 1st: You
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">125 mins</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-3 shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)]">
              <Medal className="h-4 w-4 text-[var(--text-muted)]" /> 2nd: Alex Chen
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">90 mins</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-3 shadow-xs">
            <span className="flex items-center gap-1.5 font-bold text-[var(--accent-terracotta)]">
              <Medal className="h-4 w-4 text-[var(--accent-terracotta)]" /> 3rd: Sarah Lin
            </span>
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

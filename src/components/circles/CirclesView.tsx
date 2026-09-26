import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Flame,
  Sparkles,
  ShieldCheck,
  Plus,
  KeyRound,
  EyeOff,
  Eye,
  UserPlus,
  Volume2,
  VolumeX,
  UserX,
  Trophy,
  Lock,
  Boxes,
  Search,
  UserCheck,
  Mail,
  Send,
  Copy,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { CircleMember, CircleFeedPost, CircleInvite } from '../../types';
import { LiveFocusRoom } from './LiveFocusRoom';
import { CircleFeed } from './CircleFeed';
import { useFocusRooms } from '../../hooks/useFocusRooms';
import { CreatePodModal } from './CreatePodModal';
import { JoinRoomModal } from './JoinRoomModal';
import { ShareMilestoneModal } from './ShareMilestoneModal';
import { InvitePartnerModal } from './InvitePartnerModal';
import { CirclesOnboardingGuide } from './CirclesOnboardingGuide';

interface CirclesViewProps {
  members: CircleMember[];
  feedPosts: CircleFeedPost[];
  invites?: CircleInvite[];
  userStreak: number;
  onToggleLike: (postId: string, reaction?: string) => void;
  onBroadcastAchievement?: (type: CircleFeedPost['type'], title: string, detail: string) => void;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onAddMemberByName?: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onSendInvite?: (email: string, name?: string) => Promise<{ success: boolean; inviteLink: string; message: string }>;
  onCancelInvite?: (inviteId: string) => Promise<void>;
  onResendInvite?: (inviteId: string) => Promise<{ success: boolean; inviteLink: string }>;
  onGenerateMagicLink?: () => { token: string; link: string };
}

export const CirclesView: React.FC<CirclesViewProps> = ({
  members,
  feedPosts,
  invites = [],
  userStreak,
  onToggleLike,
  onBroadcastAchievement,
  onTogglePartner,
  onToggleMute,
  onAddMemberByName,
  onRemoveMember,
  onSendInvite,
  onCancelInvite,
  onResendInvite,
  onGenerateMagicLink,
}) => {
  const [activeTab, setActiveTab] = useState<'pods' | 'feed' | 'network'>('pods');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'partners' | 'guests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatePodOpen, setIsCreatePodOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [newPartnerName, setNewPartnerName] = useState('');

  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Close actions dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isActionsMenuOpen]);

  // First-time onboarding guide state
  const [isOnboardingGuideOpen, setIsOnboardingGuideOpen] = useState<boolean>(() => {
    return localStorage.getItem('taktic_circles_onboarding_completed') !== 'true';
  });
  const [showCelebrationToast, setShowCelebrationToast] = useState<boolean>(false);
  const [highlightInviteButton, setHighlightInviteButton] = useState<boolean>(false);

  const handleCompleteTour = () => {
    localStorage.setItem('taktic_circles_onboarding_completed', 'true');
    setIsOnboardingGuideOpen(false);
    setShowCelebrationToast(true);
    setHighlightInviteButton(true);
    setTimeout(() => setShowCelebrationToast(false), 5000);
    setTimeout(() => setHighlightInviteButton(false), 5000);
  };

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

  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;
    if (onAddMemberByName) {
      onAddMemberByName(newPartnerName.trim());
    }
    setNewPartnerName('');
  };

  const activeFocusingCount = members.filter((m) => m.status === 'focusing').length;
  const partnerMembers = members.filter((m) => m.isCirclePartner !== false);
  const activePodsCount = focusPods.filter((p) => (p.activeMembersCount || 0) > 0).length;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs transition-colors duration-300 overflow-hidden">
      {/* Top KPI Header Banner */}
      <div className="p-4 sm:p-6 pb-4 sm:pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          {/* Title & Brief Description */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)] text-white font-bold shrink-0 shadow-md">
              <Users className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-xl text-[var(--text-primary)]">
                  Social Circles
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <ShieldCheck className="h-3 w-3" /> Private Co-Working
                </span>
              </div>
              <p className="mt-0.5 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                Silent focus pods & private accountability.
              </p>
            </div>
          </div>

          {/* Quick Actions & Unified Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto justify-end flex-wrap sm:flex-nowrap">
            {/* Ghost Mode Toggle */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={toggleSoloInvisibleMode}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all h-9 cursor-pointer ${
                  soloInvisibleMode
                    ? 'border-[var(--accent-dusty-rose)]/60 bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                }`}
                aria-label="Toggle Ghost Mode"
              >
                {soloInvisibleMode ? (
                  <EyeOff className="h-4 w-4 text-[var(--accent-dusty-rose)] shrink-0" />
                ) : (
                  <Eye className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                )}
                <span className="text-[11px] sm:text-xs font-medium">
                  {soloInvisibleMode ? 'Ghost' : 'Visible'}
                </span>
                <div
                  className={`relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                    soloInvisibleMode ? 'bg-[var(--accent-dusty-rose)]' : 'bg-[var(--border-subtle)]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      soloInvisibleMode ? 'translate-x-2.5' : 'translate-x-0.5'
                    } mt-[2px]`}
                  />
                </div>
              </button>

              {/* Hover Tooltip Info Popover */}
              <div className="pointer-events-none absolute top-full mt-2 right-0 sm:left-1/2 sm:-translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 text-left shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)] mb-1">
                  {soloInvisibleMode ? (
                    <EyeOff className="h-3.5 w-3.5 text-[var(--accent-dusty-rose)]" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                  )}
                  <span>Ghost Mode {soloInvisibleMode ? '• Active' : '• Off'}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Hides your live timer and status from pods and roster partners.
                </p>
                <div className="absolute bottom-full right-4 sm:left-1/2 sm:-translate-x-1/2 -mb-1 border-4 border-transparent border-b-[var(--card-surface)]" />
              </div>
            </div>

            {/* Quick Actions Dropdown Menu */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition h-9 shrink-0 cursor-pointer ${
                  isActionsMenuOpen
                    ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] shadow-xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                }`}
                title="Quick Actions & Guide"
                aria-expanded={isActionsMenuOpen}
                aria-label="Open Quick Actions Menu"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                <span className="text-[11px] sm:text-xs font-medium">Actions</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionsMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Quick Actions
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatePodOpen(true);
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:text-[var(--accent-terracotta)] transition text-left cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0" />
                    <span>Create Standing Pod</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinRoomOpen(true);
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:text-[var(--accent-botanical-sage)] transition text-left cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)] shrink-0" />
                    <span>Join Room with Code</span>
                  </button>

                  {onBroadcastAchievement && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsShareModalOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:text-[var(--accent-warm-ochre)] transition text-left cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                      <span>Broadcast Milestone</span>
                    </button>
                  )}

                  <div className="pt-1 mt-1 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOnboardingGuideOpen(true);
                        setIsActionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:text-[var(--accent-warm-ochre)] transition text-left cursor-pointer"
                    >
                      <Compass className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)] shrink-0" />
                      <span>Circle Guide & Tour</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: Invite Partner */}
            {onSendInvite && onGenerateMagicLink && (
              <button
                type="button"
                data-tour="tour-invite-partner"
                onClick={() => setIsInviteModalOpen(true)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 h-9 shrink-0 cursor-pointer ${
                  highlightInviteButton ? 'ring-4 ring-[var(--accent-terracotta)] ring-offset-2 animate-pulse' : ''
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span>Invite Partner</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Colored KPI Stats Row */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2 sm:p-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] shrink-0">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{activeFocusingCount} Active</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Co-workers</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2 sm:p-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] shrink-0">
              <Boxes className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{focusPods.length} Pods</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">{activePodsCount} Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2 sm:p-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{userStreak} Days</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Streak</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] p-2 sm:p-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text-primary)] truncate">{partnerMembers.length} Partners</p>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">Circle Roster</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs - Seamlessly Connected */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[var(--bg-main)]/50 border-t border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-2xs overflow-x-auto scrollbar-none">
          {[
            {
              id: 'pods' as const,
              label: 'Focus Pods',
              fullLabel: 'Co-Working & Focus Pods',
              icon: Users,
              badge: activePodsCount > 0 ? `${activePodsCount} Active` : undefined,
            },
            {
              id: 'feed' as const,
              label: 'Milestones',
              fullLabel: 'Milestone Feed & Activity',
              icon: Sparkles,
              badge: feedPosts.length > 0 ? `${feedPosts.length}` : undefined,
            },
            {
              id: 'network' as const,
              label: 'Roster',
              fullLabel: 'Accountability Network',
              icon: ShieldCheck,
              badge: `${partnerMembers.length}`,
            },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs font-semibold transition-all min-h-[38px] sm:min-h-[42px] shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-terracotta)] ${
                  isSelected
                    ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">{tab.fullLabel}</span>
                <span className="sm:hidden">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content - Directly Connected Inside Whole Card */}
      <div className="p-4 sm:p-6">
        {activeTab === 'pods' && (
          <div className="animate-in fade-in duration-200">
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
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="animate-in fade-in duration-200">
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
      )}

      {activeTab === 'network' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Accountability Network Header & Controls */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)]">
                    Accountability Network & Circle Roster
                  </h2>
                  <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-warm-ochre)]">
                    {partnerMembers.length} Partners
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Invite friends to share focus momentum, celebrate ring closures, and build standing pods.
                </p>
              </div>

              {/* Action Buttons: Invite Partner Modal Trigger & Fast Add */}
              <div className="flex items-center gap-2 flex-wrap">
                {onSendInvite && onGenerateMagicLink && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition active:scale-95 min-h-[36px]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Invite Partner</span>
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Shield Banner */}
            <div className="rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-primary)] leading-relaxed">
                <span className="font-bold text-[var(--accent-botanical-sage)]">Controlled Sharing: </span>
                <span className="text-[var(--text-secondary)]">
                  Only approved Circle Partners receive your milestone broadcasts and ring closures. Temporary guests never receive feed alerts.
                </span>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] self-start sm:self-auto overflow-x-auto">
                {[
                  { id: 'all' as const, label: `All (${members.length})` },
                  { id: 'partners' as const, label: `Partners (${partnerMembers.length})` },
                  { id: 'guests' as const, label: `Guests (${members.length - partnerMembers.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setNetworkFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                      networkFilter === tab.id
                        ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  id="search-circle-members-input"
                  name="searchQuery"
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search members"
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[36px]"
                />
              </div>
            </div>
          </div>

          {/* Pending Invitations Section (Visible when there are outgoing pending invites) */}
          {invites && invites.length > 0 && (
            <div className="rounded-2xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/5 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                  <h3 className="font-heading font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">
                    Pending Circle Invitations ({invites.length})
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-[var(--accent-warm-ochre)]">
                  Awaiting Acceptance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 space-y-2.5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {invite.name || invite.email}
                        </span>
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-500">
                          Pending
                        </span>
                      </div>
                      {invite.email && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {invite.email}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                        Sent {new Date(invite.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (invite.inviteLink) {
                            navigator.clipboard.writeText(invite.inviteLink);
                            setCopiedInviteId(invite.id);
                            setTimeout(() => setCopiedInviteId(null), 2000);
                          }
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline"
                        title="Copy invitation link to clipboard"
                      >
                        {copiedInviteId === invite.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {onCancelInvite && (
                        <button
                          type="button"
                          onClick={() => onCancelInvite(invite.id)}
                          className="text-[11px] font-semibold text-red-500 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Directory Grid */}
          {(() => {
            const filteredMembers = members.filter((member) => {
              const isPartner = member.isCirclePartner !== false;
              if (networkFilter === 'partners' && !isPartner) return false;
              if (networkFilter === 'guests' && isPartner) return false;
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                  member.name.toLowerCase().includes(query) ||
                  (member.statusText && member.statusText.toLowerCase().includes(query))
                );
              }
              return true;
            });

            if (filteredMembers.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)] p-10 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                      No Members Found
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {searchQuery
                        ? `No results matching "${searchQuery}". Try a different name.`
                        : 'No members in this category yet. Click "Invite Partner" to get started!'}
                    </p>
                  </div>
                  {onSendInvite && onGenerateMagicLink && (
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Invite Circle Partner</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => {
                  const isPartner = member.isCirclePartner !== false;
                  return (
                    <div
                      key={member.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all shadow-xs ${
                        isPartner
                          ? 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:border-[var(--accent-terracotta)]/40'
                          : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]/70'
                      }`}
                    >
                      <div>
                        {/* Avatar & Name Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-xl object-cover ring-2 ring-[var(--border-subtle)] shrink-0"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-[var(--text-primary)] truncate">{member.name}</h3>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">{member.statusText || 'Focus member'}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {isPartner ? (
                                  <span className="rounded-full bg-[var(--accent-dusty-rose)]/15 border border-[var(--accent-dusty-rose)]/30 px-2 py-0.5 text-[9px] font-bold text-[var(--accent-dusty-rose)]">
                                    Circle Partner
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
                                    Guest Co-worker
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Dot */}
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              member.status === 'focusing'
                                ? 'bg-[var(--accent-botanical-sage)] animate-ping'
                                : member.status === 'completed_day'
                                ? 'bg-[var(--accent-warm-ochre)]'
                                : 'bg-amber-400'
                            }`}
                            title={`Status: ${member.status}`}
                          />
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-terracotta)]">
                            <Flame className="h-3.5 w-3.5 fill-[var(--accent-terracotta)]" />
                            <span>{member.streak}d Streak</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-warm-ochre)]">
                            <Trophy className="h-3.5 w-3.5" />
                            <span>{member.closedRingsCount || 0}/3 Rings</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        {isPartner ? (
                          <>
                            {/* Toggle Mute */}
                            {onToggleMute && (
                              <button
                                type="button"
                                onClick={() => onToggleMute(member.id)}
                                className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition min-h-[36px] ${
                                  member.isMuted
                                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'border-[var(--accent-dusty-rose)]/30 bg-[var(--accent-dusty-rose)]/10 text-[var(--accent-dusty-rose)] hover:bg-[var(--accent-dusty-rose)]/20'
                                }`}
                                title={member.isMuted ? 'Unmute feed updates' : 'Mute feed updates'}
                              >
                                {member.isMuted ? (
                                  <>
                                    <VolumeX className="h-3.5 w-3.5" />
                                    <span>Muted</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3.5 w-3.5" />
                                    <span>Active</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Remove Partner */}
                            <button
                              type="button"
                              onClick={() => (onRemoveMember ? onRemoveMember(member.id) : onTogglePartner ? onTogglePartner(member.id) : null)}
                              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition min-h-[36px]"
                              title="Remove from your Circle Roster"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </>
                        ) : (
                          /* Add to Circle */
                          <button
                            type="button"
                            onClick={() => (onTogglePartner ? onTogglePartner(member.id) : null)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white px-3 py-2 text-xs font-bold hover:brightness-110 transition min-h-[36px] active:scale-95 shadow-xs"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add to Circle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
      </div>

      {/* Global Modals for Quick Header Actions */}
      {createFocusPod && (
        <CreatePodModal
          isOpen={isCreatePodOpen}
          onClose={() => setIsCreatePodOpen(false)}
          members={members}
          onCreatePod={createFocusPod}
        />
      )}

      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
        onJoinRoom={joinRoomByCode}
        sampleCode="TK-8492"
      />

      {onBroadcastAchievement && (
        <ShareMilestoneModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={onBroadcastAchievement}
        />
      )}

      {onSendInvite && onGenerateMagicLink && (
        <InvitePartnerModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSendInvite={onSendInvite}
          onGenerateMagicLink={onGenerateMagicLink}
        />
      )}

      {/* Interactive Onboarding Guide & Feature Tour */}
      <CirclesOnboardingGuide
        isOpen={isOnboardingGuideOpen}
        onClose={() => setIsOnboardingGuideOpen(false)}
        onComplete={handleCompleteTour}
        setActiveTab={setActiveTab}
      />

      {/* Tour Completion Celebratory Toast */}
      {showCelebrationToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-[var(--card-surface)]/95 backdrop-blur-md p-4 shadow-2xl text-[var(--text-primary)] animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="pr-2">
            <h4 className="font-heading font-bold text-xs text-[var(--text-primary)]">
              You're all set to co-work! 🎉
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Invite your first partner or start a quick room to begin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCelebrationToast(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

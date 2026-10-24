import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Check,
  Lock,
  Search,
  Mail,
  Copy,
  Users,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  UserX,
  Clock,
  Inbox,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CircleMember, CircleInvite, IncomingCircleInvite } from '../../types';
import { InvitePartnerModal } from './InvitePartnerModal';
import { RemovePartnerModal } from './RemovePartnerModal';

interface PartnerNetworkViewProps {
  members: CircleMember[];
  invites?: CircleInvite[];
  incomingInvites?: IncomingCircleInvite[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  onTogglePartner?: (memberId: string) => void;
  onToggleMute?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onSendInvite?: (email: string, name?: string) => Promise<{ success: boolean; inviteLink: string; message: string }>;
  onCancelInvite?: (inviteId: string) => Promise<void>;
  onGenerateMagicLink?: () => { token: string; link: string };
  onAcceptInvite?: (token: string) => Promise<void>;
  onDeclineInvite?: (token: string) => Promise<void> | void;
}

export const PartnerNetworkView: React.FC<PartnerNetworkViewProps> = ({
  members,
  invites = [],
  incomingInvites = [],
  currentUserEmail,
  onTogglePartner,
  onToggleMute,
  onRemoveMember,
  onSendInvite,
  onCancelInvite,
  onGenerateMagicLink,
  onAcceptInvite,
  onDeclineInvite,
}) => {
  const [subTab, setSubTab] = useState<'partners' | 'requests' | 'invites'>('partners');
  const [filterRole, setFilterRole] = useState<'all' | 'partners' | 'guests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CircleMember | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);
  const [decliningToken, setDecliningToken] = useState<string | null>(null);
  const [confirmingDeclineToken, setConfirmingDeclineToken] = useState<string | null>(null);

  const partnerMembers = useMemo(
    () => members.filter((m) => m.isCirclePartner !== false),
    [members]
  );

  const pendingOutgoingInvites = useMemo(() => {
    const memberNamesSet = new Set(members.map((m) => m.name.toLowerCase()));
    return (invites || []).filter(
      (invite) =>
        invite.status === 'pending' &&
        (!invite.name || !memberNamesSet.has(invite.name.toLowerCase()))
    );
  }, [invites, members]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const isPartner = member.isCirclePartner !== false;
      if (filterRole === 'partners' && !isPartner) return false;
      if (filterRole === 'guests' && isPartner) return false;
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        Boolean(member.statusText && member.statusText.toLowerCase().includes(query))
      );
    });
  }, [members, filterRole, searchQuery]);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs transition-colors duration-300">
      {/* Top Header */}
      <div className="p-4 sm:p-6 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--accent-botanical-sage)] text-white font-bold shrink-0 shadow-md">
              <ShieldCheck className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-xl text-[var(--text-primary)]">
                  Accountability Network
                </h1>
                <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-warm-ochre)]">
                  {partnerMembers.length} Partners
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Manage your accountability partners, review incoming requests, and invite new co-workers.
              </p>
            </div>
          </div>

          {onSendInvite && onGenerateMagicLink && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 h-9 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Partner</span>
            </button>
          )}
        </div>

        {/* Clean Sub-Navigation Pills */}
        <div className="mt-4 flex items-center gap-1 sm:gap-2 border-t border-[var(--border-subtle)] pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('partners')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'partners'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Circle Roster ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('requests')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'requests'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Requests ({incomingInvites.length})</span>
            {incomingInvites.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('invites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'invites'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Sent Invites ({pendingOutgoingInvites.length})</span>
          </button>
        </div>
      </div>

      {/* Main Subtab Content */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* SUBTAB 1: PARTNERS ROSTER */}
        {subTab === 'partners' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Privacy Shield Notice */}
            <div className="rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-primary)] leading-relaxed">
                <span className="font-bold text-[var(--accent-botanical-sage)]">Controlled Sharing: </span>
                <span className="text-[var(--text-secondary)]">
                  Only approved Circle Partners receive your milestone broadcasts and ring closures. Temporary guests never receive feed alerts.
                </span>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] self-start sm:self-auto overflow-x-auto">
                {[
                  { id: 'all' as const, label: `All (${members.length})` },
                  { id: 'partners' as const, label: `Partners (${partnerMembers.length})` },
                  { id: 'guests' as const, label: `Guests (${members.length - partnerMembers.length})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterRole(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                      filterRole === item.id
                        ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

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

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
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
                      : 'No members in this category yet. Click "Invite Partner" to connect!'}
                  </p>
                </div>
                {onSendInvite && onGenerateMagicLink && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Circle Partner</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => {
                  const isPartner = member.isCirclePartner !== false;
                  const isOffline = Boolean(member.isIncognito || member.statusText === 'Offline');
                  const statusLabel = isOffline ? 'Offline' : (member.statusText || 'Online');

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
                        {/* Avatar & Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-xl object-cover ring-2 ring-[var(--border-subtle)] shrink-0"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-[var(--text-primary)] truncate">{member.name}</h3>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">{statusLabel}</p>
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

                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isOffline ? 'bg-slate-400 dark:bg-slate-500 opacity-60' : 'bg-[var(--accent-botanical-sage)]'
                            }`}
                            title={`Status: ${statusLabel}`}
                          />
                        </div>

                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-terracotta)]">
                            <Flame className="h-3.5 w-3.5 fill-[var(--accent-terracotta)]" />
                            <span>
                              {member.showStreak === false ? '— Streak' : `${member.streak || 0}d Streak`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--accent-warm-ochre)]">
                            <Trophy className="h-3.5 w-3.5" />
                            <span>
                              {member.closedRingsCount !== undefined
                                ? `${member.closedRingsCount}/3 Rings`
                                : '0/3 Rings'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        {isPartner ? (
                          <>
                            {onToggleMute && (
                              <button
                                type="button"
                                onClick={() => onToggleMute(member.id)}
                                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition min-h-[36px] cursor-pointer ${
                                  member.isMuted
                                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'border-[var(--accent-dusty-rose)]/30 bg-[var(--accent-dusty-rose)]/10 text-[var(--accent-dusty-rose)] hover:bg-[var(--accent-dusty-rose)]/20'
                                }`}
                                title={member.isMuted ? 'Unmute feed notifications' : 'Mute feed notifications'}
                              >
                                {member.isMuted ? (
                                  <>
                                    <VolumeX className="h-3.5 w-3.5" />
                                    <span>Muted</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3.5 w-3.5" />
                                    <span>Alerts On</span>
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setMemberToRemove(member)}
                              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition min-h-[36px] cursor-pointer"
                              title="Remove from your Circle Roster"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => (onTogglePartner ? onTogglePartner(member.id) : null)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white px-3 py-2 text-xs font-bold hover:brightness-110 transition min-h-[36px] active:scale-95 shadow-xs cursor-pointer"
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
            )}
          </div>
        )}

        {/* SUBTAB 2: INCOMING REQUESTS */}
        {subTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {incomingInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)] p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-botanical-sage)]/10 text-[var(--accent-botanical-sage)]">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    All Caught Up!
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    You have no pending incoming partner connection requests.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {incomingInvites.map((req) => (
                  <div
                    key={req.token}
                    className="flex flex-col justify-between rounded-xl border border-[var(--accent-terracotta)]/40 bg-[var(--card-surface)] p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-white text-sm font-bold shadow-xs">
                        {req.inviter ? req.inviter.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                            {req.inviter}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                          Invited you to connect as Circle Partners to share focus momentum.
                        </p>
                      </div>
                    </div>

                    {confirmingDeclineToken === req.token ? (
                      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                        <span className="text-rose-500 font-medium text-[11px]">Decline request?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmingDeclineToken(null)}
                            className="px-2 py-1 rounded-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] cursor-pointer"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (onDeclineInvite) {
                                setDecliningToken(req.token);
                                try {
                                  await onDeclineInvite(req.token);
                                } finally {
                                  setDecliningToken(null);
                                  setConfirmingDeclineToken(null);
                                }
                              }
                            }}
                            disabled={decliningToken === req.token}
                            className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition cursor-pointer"
                          >
                            {decliningToken === req.token ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          type="button"
                          onClick={async () => {
                            if (onAcceptInvite) {
                              setAcceptingToken(req.token);
                              try {
                                await onAcceptInvite(req.token);
                                confetti({
                                  particleCount: 75,
                                  spread: 65,
                                  origin: { y: 0.6 },
                                  colors: ['#C06C4C', '#C87D87', '#CFA052', '#6B8E6E'],
                                });
                              } finally {
                                setAcceptingToken(null);
                              }
                            }
                          }}
                          disabled={acceptingToken === req.token}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] hover:brightness-110 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {acceptingToken === req.token ? (
                            <>
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Accept & Connect</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmingDeclineToken(req.token)}
                          className="py-2 px-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 transition cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: SENT INVITES */}
        {subTab === 'invites' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {pendingOutgoingInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-surface)] p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    No Pending Outgoing Invites
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Send an invite link or email to your accountability partner.
                  </p>
                </div>
                {onSendInvite && onGenerateMagicLink && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Partner Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {pendingOutgoingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 space-y-2.5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {invite.name || invite.email || 'Friend'}
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
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Sent {new Date(invite.createdAt).toLocaleDateString()}</span>
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
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline cursor-pointer"
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
                          className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {onSendInvite && onGenerateMagicLink && (
        <InvitePartnerModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSendInvite={onSendInvite}
          onGenerateMagicLink={onGenerateMagicLink}
          currentUserEmail={currentUserEmail}
        />
      )}

      <RemovePartnerModal
        isOpen={Boolean(memberToRemove)}
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) {
            if (onRemoveMember) {
              onRemoveMember(memberToRemove.id);
            } else if (onTogglePartner) {
              onTogglePartner(memberToRemove.id);
            }
            setMemberToRemove(null);
          }
        }}
      />
    </div>
  );
};

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

  const [showPrivacyTip, setShowPrivacyTip] = useState(false);

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
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] font-bold shrink-0">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Partners & Network
                </h1>
                <span className="rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  {partnerMembers.length} active
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Connect with focus partners to exchange momentum, rings, and accountability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowPrivacyTip((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--card-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer h-8.5"
              title="Privacy & sharing info"
            >
              <Lock className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
              <span>Privacy Info</span>
            </button>

            {onSendInvite && onGenerateMagicLink && (
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer h-8.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Invite Partner</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Privacy Tip Toggle */}
        {showPrivacyTip && (
          <div className="mt-3 rounded-xl border border-[var(--accent-botanical-sage)]/25 bg-[var(--accent-botanical-sage)]/5 p-3 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-start gap-2 text-[var(--text-secondary)]">
              <Lock className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-primary)] font-semibold">Circle Partners</strong> can see your milestone broadcasts and daily ring completions. Temporary guests in focus rooms never receive feed updates.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPrivacyTip(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Clean Segment Tabs */}
        <div className="mt-4 flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3 overflow-x-auto">
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
            <span>Roster</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              subTab === 'partners' ? 'bg-white/20 text-white' : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
            }`}>
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('requests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              subTab === 'requests'
                ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Incoming Requests</span>
            {incomingInvites.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {incomingInvites.length}
              </span>
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
            <span>Sent Invites</span>
            {pendingOutgoingInvites.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                subTab === 'invites' ? 'bg-white/20 text-white' : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]'
              }`}>
                {pendingOutgoingInvites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6">
        {/* SUBTAB 1: ROSTER */}
        {subTab === 'partners' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] self-start sm:self-auto">
                {[
                  { id: 'all' as const, label: 'All', count: members.length },
                  { id: 'partners' as const, label: 'Partners', count: partnerMembers.length },
                  { id: 'guests' as const, label: 'Guests', count: members.length - partnerMembers.length },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterRole(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      filterRole === item.id
                        ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-70">({item.count})</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  id="search-circle-members-input"
                  name="searchQuery"
                  type="text"
                  placeholder="Filter by name or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Filter members"
                  autoComplete="off"
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none min-h-[34px] transition"
                />
              </div>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 p-10 text-center space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    No Members Found
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-sm">
                    {searchQuery
                      ? `No results matching "${searchQuery}". Clear your search to see all partners.`
                      : 'No one in this section yet. Invite someone to grow your accountability circle.'}
                  </p>
                </div>
                {onSendInvite && onGenerateMagicLink && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Partner</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredMembers.map((member) => {
                  const isPartner = member.isCirclePartner !== false;
                  const isOffline = Boolean(member.isIncognito || member.statusText === 'Offline');
                  const statusLabel = isOffline ? 'Offline' : (member.statusText || 'Online');

                  return (
                    <div
                      key={member.id}
                      className="group flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:border-[var(--accent-terracotta)]/40 p-3.5 transition-all shadow-2xs hover:shadow-xs"
                    >
                      {/* Top Details */}
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="h-9 w-9 rounded-xl object-cover ring-1 ring-[var(--border-subtle)]"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--card-surface)] ${
                                  isOffline ? 'bg-slate-400 opacity-60' : 'bg-[var(--accent-botanical-sage)]'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-xs text-[var(--text-primary)] truncate">{member.name}</h3>
                                {isPartner ? (
                                  <span className="rounded-full bg-[var(--accent-botanical-sage)]/10 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/20 px-1.5 py-0.2 text-[9px] font-semibold shrink-0">
                                    Partner
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-0.2 text-[9px] font-medium shrink-0">
                                    Guest
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                                {statusLabel}
                              </p>
                            </div>
                          </div>

                          {/* Quick Streak/Rings Pill */}
                          <div className="flex items-center gap-2 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-1 rounded-lg text-[10px] shrink-0 font-medium">
                            <span className="flex items-center gap-1 text-[var(--accent-terracotta)]" title="Daily streak">
                              <Flame className="h-3 w-3 fill-[var(--accent-terracotta)]" />
                              <span>{member.showStreak === false ? '—' : `${member.streak || 0}d`}</span>
                            </span>
                            <span className="text-[var(--border-subtle)]">|</span>
                            <span className="flex items-center gap-1 text-[var(--accent-warm-ochre)]" title="Closed rings">
                              <Trophy className="h-3 w-3" />
                              <span>{member.closedRingsCount !== undefined ? `${member.closedRingsCount}/3` : '0/3'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Calm Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                        {isPartner ? (
                          <>
                            {onToggleMute ? (
                              <button
                                type="button"
                                onClick={() => onToggleMute(member.id)}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                                  member.isMuted
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                                }`}
                                title={member.isMuted ? 'Notifications are muted' : 'Notifications are active'}
                              >
                                {member.isMuted ? (
                                  <>
                                    <VolumeX className="h-3 w-3" />
                                    <span>Muted</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3 w-3" />
                                    <span>Alerts on</span>
                                  </>
                                )}
                              </button>
                            ) : <div />}

                            <button
                              type="button"
                              onClick={() => setMemberToRemove(member)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Remove from roster"
                            >
                              <UserX className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => (onTogglePartner ? onTogglePartner(member.id) : null)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer"
                          >
                            <UserPlus className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                            <span>Upgrade to Circle Partner</span>
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 p-10 text-center space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)]/10 text-[var(--accent-botanical-sage)]">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    All Caught Up
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    No pending partner connection requests waiting for you.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingInvites.map((req) => (
                  <div
                    key={req.token}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] text-sm font-bold">
                        {req.inviter ? req.inviter.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                            {req.inviter}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Invited you to connect as Circle Partners.
                        </p>
                      </div>
                    </div>

                    {confirmingDeclineToken === req.token ? (
                      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 flex items-center justify-between gap-2 text-xs">
                        <span className="text-rose-500 font-medium text-[11px]">Decline this request?</span>
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
                                  particleCount: 50,
                                  spread: 55,
                                  origin: { y: 0.6 },
                                  colors: ['#C06C4C', '#C87D87', '#CFA052', '#6B8E6E'],
                                });
                              } finally {
                                setAcceptingToken(null);
                              }
                            }
                          }}
                          disabled={acceptingToken === req.token}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--accent-terracotta)] hover:brightness-110 text-white font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
                        >
                          {acceptingToken === req.token ? (
                            <>
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Accept</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmingDeclineToken(req.token)}
                          className="py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 transition cursor-pointer"
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]/40 p-10 text-center space-y-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/10 text-[var(--accent-warm-ochre)]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    No Pending Outgoing Invites
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Share an invite link with a collaborator to team up.
                  </p>
                </div>
                {onSendInvite && onGenerateMagicLink && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Invite Partner</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingOutgoingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {invite.name || invite.email || 'Partner'}
                        </span>
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
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
                        title="Copy link"
                      >
                        {copiedInviteId === invite.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy link</span>
                          </>
                        )}
                      </button>

                      {onCancelInvite && (
                        <button
                          type="button"
                          onClick={() => onCancelInvite(invite.id)}
                          className="text-[11px] font-medium text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
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

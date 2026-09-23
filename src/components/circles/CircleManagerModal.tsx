import React, { useState } from 'react';
import { X, Settings, ShieldCheck, UserPlus, Volume2, VolumeX, UserX, Lock, Users, Search, Sparkles } from 'lucide-react';
import { CircleMember } from '../../types';

interface CircleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CircleMember[];
  onTogglePartner: (memberId: string) => void;
  onToggleMute: (memberId: string) => void;
  onAddMemberByName: (name: string) => void;
  onRemoveMember?: (memberId: string) => void;
}

export const CircleManagerModal: React.FC<CircleManagerModalProps> = ({
  isOpen,
  onClose,
  members,
  onTogglePartner,
  onToggleMute,
  onAddMemberByName,
  onRemoveMember,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'partners' | 'guests'>('all');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMemberByName(newMemberName.trim());
    setNewMemberName('');
  };

  const partnerMembers = members.filter((m) => m.isCirclePartner !== false);
  const guestMembers = members.filter((m) => m.isCirclePartner === false);
  const mutedCount = partnerMembers.filter((m) => m.isMuted).length;

  const filteredMembers = members.filter((member) => {
    const isPartner = member.isCirclePartner !== false;
    if (filterType === 'partners' && !isPartner) return false;
    if (filterType === 'guests' && isPartner) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return member.name.toLowerCase().includes(q) || (member.statusText && member.statusText.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Manage Social Circle & Roster
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  <ShieldCheck className="h-3 w-3" /> Privacy Isolation
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage circle partners and feed preferences.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content - Two-column horizontal layout on Tablet & Desktop */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            {/* Left Column (Add Partner Form, Privacy Rule & Summary Metrics) */}
            <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Quick Add Form */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Add Partner by Name
                  </label>
                  <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Elena Rostova..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] min-h-[38px]"
                    />
                    <button
                      type="submit"
                      disabled={!newMemberName.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-2 text-xs font-bold text-white transition disabled:opacity-40 shrink-0 shadow-md min-h-[38px]"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* Controlled Privacy Policy Banner */}
                <div className="rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-primary)] leading-snug">
                    <span className="font-bold text-[var(--accent-botanical-sage)]">Guest Isolation: </span>
                    Room guests are temporary and cannot see or post to your feed unless added to your roster.
                  </p>
                </div>
              </div>

              {/* Summary Stats Card */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 space-y-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Roster Overview
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2.5">
                    <p className="font-bold text-xs text-[var(--accent-terracotta)]">{partnerMembers.length} Partners</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Approved Roster</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2.5">
                    <p className="font-bold text-xs text-amber-500">{mutedCount} Muted</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Feed Silenced</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Member Roster & Controls) */}
            <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search roster members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] min-h-[36px]"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFilterType('all')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                        filterType === 'all'
                          ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType('partners')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                        filterType === 'partners'
                          ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Partners ({partnerMembers.length})
                    </button>
                    {guestMembers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterType('guests')}
                        className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                          filterType === 'guests'
                            ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Guests ({guestMembers.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List Box */}
                <div className="max-h-72 overflow-y-auto space-y-2 border border-[var(--border-subtle)] rounded-2xl p-2.5 bg-[var(--surface-sunken)]">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const isPartner = member.isCirclePartner !== false;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 transition ${
                            isPartner
                              ? 'border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs'
                              : 'border-[var(--border-subtle)] bg-[var(--card-surface)]/60 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-8 w-8 rounded-xl object-cover ring-1 ring-[var(--border-subtle)] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-xs text-[var(--text-primary)] truncate">{member.name}</p>
                                {isPartner ? (
                                  <span className="rounded-full bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 px-1.5 py-0.2 text-[8px] font-bold text-[var(--accent-terracotta)]">
                                    Partner
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-1.5 py-0.2 text-[8px] font-medium text-[var(--text-muted)]">
                                    Guest
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                                {member.statusText || `${member.streak || 0}d streak • Active`}
                              </p>
                            </div>
                          </div>

                          {/* Control Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isPartner ? (
                              <>
                                {/* Toggle Mute Feed */}
                                <button
                                  type="button"
                                  onClick={() => onToggleMute(member.id)}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                                    member.isMuted
                                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                      : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                  }`}
                                  title={member.isMuted ? 'Unmute feed updates' : 'Mute feed updates'}
                                >
                                  {member.isMuted ? (
                                    <>
                                      <VolumeX className="h-3 w-3" />
                                      <span>Muted</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="h-3 w-3 text-[var(--accent-botanical-sage)]" />
                                      <span>Active</span>
                                    </>
                                  )}
                                </button>

                                {/* Remove from Circle */}
                                <button
                                  type="button"
                                  onClick={() => (onRemoveMember ? onRemoveMember(member.id) : onTogglePartner(member.id))}
                                  className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/20 transition"
                                  title="Remove from your Circle Roster"
                                >
                                  <UserX className="h-3 w-3" />
                                  <span>Remove</span>
                                </button>
                              </>
                            ) : (
                              /* Add to Circle */
                              <button
                                type="button"
                                onClick={() => onTogglePartner(member.id)}
                                className="flex items-center gap-1 rounded-lg bg-[var(--accent-terracotta)] text-white px-2.5 py-1 text-[11px] font-bold hover:brightness-110 transition shadow-xs"
                              >
                                <UserPlus className="h-3 w-3" />
                                <span>Add to Roster</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      {searchQuery
                        ? `No members found matching "${searchQuery}"`
                        : 'No members in this category.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-bold text-white transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Users, UserPlus, Volume2, VolumeX, UserX, Search } from 'lucide-react';
import { CircleMember } from '../../types';
import { RemovePartnerModal } from './RemovePartnerModal';

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
  const [memberToRemove, setMemberToRemove] = useState<CircleMember | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                Circle Members
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage your partners and notifications.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: 2-column side-by-side on tablet/desktop (sm: & md:), vertical on mobile */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6">
            {/* Left Column: Add Partner & Summary Overview */}
            <div className="sm:col-span-5 space-y-4">
              {/* Add Partner Form */}
              <div>
                <label htmlFor="quick-add-partner-input" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Add by Name
                </label>
                <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
                  <input
                    id="quick-add-partner-input"
                    name="newPartnerName"
                    type="text"
                    placeholder="Enter partner name..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    autoComplete="off"
                    className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMemberName.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-40 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Informative Note */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 text-xs text-[var(--text-secondary)] leading-relaxed">
                Room guests can focus together in live rooms, but only approved partners share feed updates and milestone notifications.
              </div>

              {/* Summary Stats Card */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2.5">
                  <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {partnerMembers.length}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Partners</p>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2.5">
                  <p className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {mutedCount}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Muted</p>
                </div>
              </div>
            </div>

            {/* Right Column: Search, Filter, Member List */}
            <div className="sm:col-span-7 space-y-3">
              {/* Search & Filter Header */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <input
                    id="search-roster-members-input"
                    name="searchRosterQuery"
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                  />
                </div>

                <div className="inline-flex items-center rounded-xl bg-[var(--surface-sunken)] p-0.5 border border-[var(--border-subtle)] shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All ({members.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('partners')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      filterType === 'partners'
                        ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Partners ({partnerMembers.length})
                  </button>
                  {guestMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterType('guests')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        filterType === 'guests'
                          ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Guests ({guestMembers.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="max-h-72 overflow-y-auto space-y-2 border border-[var(--border-subtle)] rounded-xl p-2 bg-[var(--surface-sunken)]">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                    const isPartner = member.isCirclePartner !== false;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2.5 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-8 w-8 rounded-lg object-cover ring-1 ring-[var(--border-subtle)] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-xs text-[var(--text-primary)] truncate">
                                {member.name}
                              </p>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-medium ${
                                  isPartner
                                    ? 'bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)]'
                                    : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
                                }`}
                              >
                                {isPartner ? 'Partner' : 'Guest'}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {member.isIncognito || member.statusText === 'Offline'
                                ? 'Offline'
                                : (member.statusText || `${member.streak || 0}d streak • Active`)}
                            </p>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPartner ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onToggleMute(member.id)}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                                  member.isMuted
                                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                                    <span>Alerts On</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setMemberToRemove(member)}
                                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/15 transition cursor-pointer"
                                title="Remove partner"
                              >
                                <UserX className="h-3 w-3" />
                                <span>Remove</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onTogglePartner(member.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-terracotta)] text-white px-2.5 py-1 text-[11px] font-semibold hover:brightness-110 transition cursor-pointer"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>Add</span>
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

        {/* Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-semibold text-white transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Removing Partner */}
      <RemovePartnerModal
        isOpen={Boolean(memberToRemove)}
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) {
            if (onRemoveMember) {
              onRemoveMember(memberToRemove.id);
            } else {
              onTogglePartner(memberToRemove.id);
            }
            setMemberToRemove(null);
          }
        }}
      />
    </div>
  );
};

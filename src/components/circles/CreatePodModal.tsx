import React, { useState } from 'react';
import { X, Users, Check, Calendar, Clock, Search, CheckSquare, Square, Plus } from 'lucide-react';
import { CircleMember } from '../../types';

interface CreatePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CircleMember[];
  onCreatePod: (name: string, selectedMemberIds: string[], selectedMemberNames: string[], durationMinutes: number) => void;
}

const DURATION_OPTIONS = [
  { mins: 15, label: '15 Mins', sublabel: 'Quick check-in' },
  { mins: 25, label: '25 Mins', sublabel: 'Standard flow' },
  { mins: 50, label: '50 Mins', sublabel: 'Deep session' },
  { mins: 90, label: '90 Mins', sublabel: 'Extended block' },
];

export const CreatePodModal: React.FC<CreatePodModalProps> = ({
  isOpen,
  onClose,
  members,
  onCreatePod,
}) => {
  const [podName, setPodName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter approved roster partners
  const partnerMembers = members.filter((m) => m.isCirclePartner !== false);

  const filteredMembers = partnerMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.statusText && m.statusText.toLowerCase().includes(q));
  });

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map((m) => m.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podName.trim()) return;

    const selectedNames = partnerMembers
      .filter((m) => selectedIds.includes(m.id))
      .map((m) => m.name);

    onCreatePod(podName.trim(), selectedIds, selectedNames, durationMinutes);
    setPodName('');
    setSelectedIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg md:max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-2xs">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] truncate">
                Create Focus Pod
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Set up a recurring co-working space for your circle.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body: 2 columns on Tablet and Desktop, 1 column on Mobile */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form id="create-pod-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Pod Name & Duration */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Pod Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="create-pod-name" className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Pod Name
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">{podName.length}/50</span>
                  </div>
                  <input
                    id="create-pod-name"
                    name="podName"
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Design Sync, Deep Work Squad"
                    value={podName}
                    onChange={(e) => setPodName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] transition"
                  />
                </div>

                {/* Duration Options */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Sprint Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((opt) => {
                      const isSelected = durationMinutes === opt.mins;
                      return (
                        <button
                          key={opt.mins}
                          type="button"
                          onClick={() => setDurationMinutes(opt.mins)}
                          className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--text-primary)] ring-1 ring-[var(--accent-terracotta)]'
                              : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'}`} />
                            <span className="text-xs font-bold">{opt.label}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.sublabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lease Policy Notice */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60 p-3 flex items-start gap-2.5 text-[11px] text-[var(--text-secondary)]">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--accent-warm-ochre)] mt-0.5" />
                <p className="leading-snug">
                  Pods stay active for 30 days and renew automatically whenever a session is held.
                </p>
              </div>
            </div>

            {/* Right Column: Invite Partners */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Invite Partners {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
                  </label>
                  {partnerMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedIds.length === filteredMembers.length ? (
                        <>
                          <CheckSquare className="h-3 w-3" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-3 w-3" /> Select All
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Member Search Bar */}
                {partnerMembers.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <input
                      id="search-pod-partners-input"
                      name="searchPartners"
                      type="text"
                      placeholder="Search circle partners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search circle partners"
                      autoComplete="off"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                    />
                  </div>
                )}

                {/* Member Roster List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-[var(--border-subtle)] rounded-xl p-2 bg-[var(--surface-sunken)]">
                  {partnerMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const isSelected = selectedIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleSelectMember(member.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer select-none ${
                            isSelected
                              ? 'border-[var(--accent-terracotta)]/40 bg-[var(--card-surface)] shadow-2xs'
                              : 'border-transparent bg-[var(--card-surface)] hover:bg-[var(--card-hover)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-7 w-7 rounded-lg object-cover ring-1 ring-[var(--border-subtle)] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">{member.statusText || 'Partner'}</p>
                            </div>
                          </div>

                          <div
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded border transition shrink-0 ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] text-white'
                                : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-transparent'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-1">
                      <p>No circle partners available.</p>
                      <p className="text-[10px] text-[var(--accent-terracotta)] font-medium">Add partners to your circle first.</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                {selectedIds.length === 0
                  ? 'All circle partners will be able to join this pod.'
                  : `Only the ${selectedIds.length} selected partner${selectedIds.length === 1 ? '' : 's'} can access this pod.`}
              </p>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-pod-form"
            disabled={!podName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Pod</span>
          </button>
        </div>
      </div>
    </div>
  );
};


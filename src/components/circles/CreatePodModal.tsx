import React, { useState } from 'react';
import { X, Users, ShieldCheck, Check, Sparkles, Calendar, Clock, Search, Layers, CheckSquare, Square } from 'lucide-react';
import { CircleMember } from '../../types';

interface CreatePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CircleMember[];
  onCreatePod: (name: string, selectedMemberIds: string[], selectedMemberNames: string[], durationMinutes: number) => void;
}

const PRESET_POD_NAMES = [
  'Deep Work Sprint',
  'Morning Solopreneurs',
  'Design & UX Guild',
  'Code & Build Squad',
  'Reading & Research',
];

const DURATION_OPTIONS = [
  { mins: 15, label: '15 Mins', sublabel: 'Quick Sprint' },
  { mins: 25, label: '25 Mins', sublabel: 'Classic Pomodoro' },
  { mins: 50, label: '50 Mins', sublabel: 'Deep Flow' },
  { mins: 90, label: '90 Mins', sublabel: 'Extended Marathon' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)] text-white font-bold shrink-0 shadow-md">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Create Standing Focus Pod
                </h2>
                <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-2 py-0.5 text-[9px] font-bold text-[var(--accent-warm-ochre)]">
                  Standing Pod
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Private co-working room for selected Circle Partners.
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
          <form id="create-pod-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            {/* Left Column (Pod Configuration & Lease Policy) */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Pod Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="create-pod-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      1. Pod Name
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">{podName.length}/50</span>
                  </div>
                  <input
                    id="create-pod-name"
                    name="podName"
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Design Guild, Morning Solopreneurs"
                    value={podName}
                    onChange={(e) => setPodName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)]"
                  />

                  {/* Preset Suggestions */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)]">Presets:</span>
                    {PRESET_POD_NAMES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPodName(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          podName === preset
                            ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] font-semibold'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]/40'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sprint Duration Selector */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    2. Standard Sprint Length
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => setDurationMinutes(opt.mins)}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                          durationMinutes === opt.mins
                            ? 'border-[var(--accent-warm-ochre)] bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] ring-1 ring-[var(--accent-warm-ochre)] font-bold'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.sublabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lease & Privacy Notice */}
              <div className="rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--accent-botanical-sage)] mt-0.5" />
                <p className="text-[11px] text-[var(--text-primary)] leading-snug">
                  <span className="font-bold text-[var(--accent-botanical-sage)]">30-Day Lease: </span>
                  Auto-renews when active. Inactive rooms expire after 30 days.
                </p>
              </div>
            </div>

            {/* Right Column (Member Selection & Live Pod Preview) */}
            <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    3. Invite Circle Partners ({selectedIds.length} chosen)
                  </label>
                  {partnerMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-semibold text-[var(--accent-terracotta)] hover:underline flex items-center gap-1"
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
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search circle partners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)]"
                    />
                  </div>
                )}

                {/* Member List Container */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 border border-[var(--border-subtle)] rounded-2xl p-2 bg-[var(--surface-sunken)]">
                  {partnerMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const isSelected = selectedIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => toggleSelectMember(member.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? 'border-[var(--accent-terracotta)]/50 bg-[var(--accent-terracotta)]/10 shadow-xs'
                              : 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)]'
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
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">{member.statusText || 'Circle Partner'}</p>
                            </div>
                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-lg border transition shrink-0 ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] text-white'
                                : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-transparent'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--text-muted)] space-y-1">
                      <p>No circle partners available.</p>
                      <p className="text-[10px] text-[var(--accent-terracotta)] font-medium">Add members via "Invite Partner" first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pod Live Preview Snippet */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[var(--accent-terracotta)]" /> Room Badge Preview
                  </span>
                  <span className="text-[var(--accent-warm-ochre)] font-bold">{durationMinutes}m sprint</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {podName || 'Your Pod Name'}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      {selectedIds.length === 0
                        ? 'Open to all approved circle partners'
                        : `${selectedIds.length} designated partners`}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] px-2 py-0.5 text-[9px] font-bold shrink-0">
                    Ready to Start
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-pod-form"
            disabled={!podName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Focus Pod</span>
          </button>
        </div>
      </div>
    </div>
  );
};

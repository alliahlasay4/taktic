import React, { useState } from 'react';
import { X, Users, ShieldCheck, Check, Sparkles, Calendar } from 'lucide-react';
import { CircleMember } from '../../types';

interface CreatePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: CircleMember[];
  onCreatePod: (name: string, selectedMemberIds: string[], selectedMemberNames: string[], durationMinutes: number) => void;
}

export const CreatePodModal: React.FC<CreatePodModalProps> = ({
  isOpen,
  onClose,
  members,
  onCreatePod,
}) => {
  const [podName, setPodName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Filter approved roster partners
  const partnerMembers = members.filter((m) => m.isCirclePartner !== false);

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)] text-white font-bold shrink-0 shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <span>Create Permanent Focus Pod</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                Standing Room
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Dedicated co-working space with selected Circle Roster partners.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pod Name Input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Focus Pod Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design Guild, Morning Solopreneurs, Deep Work Squad"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-botanical-sage)] focus:outline-none"
            />
          </div>

          {/* Sprint Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Standard Sprint Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 25, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    durationMinutes === mins
                      ? 'border-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] font-bold'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          {/* Member Selection from Approved Circle Roster */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Select Pod Members ({selectedIds.length} chosen)
              </label>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" /> Approved Circle Roster Only
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-[var(--border-subtle)] rounded-xl p-2 bg-[var(--surface-sunken)]">
              {partnerMembers.length > 0 ? (
                partnerMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleSelectMember(member.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent-botanical-sage)]/50 bg-[var(--accent-botanical-sage)]/10'
                          : 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-[var(--border-subtle)]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{member.name}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">{member.statusText || 'Circle Member'}</p>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)] text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                  No circle partners found. Add members to your Circle Roster first!
                </div>
              )}
            </div>
          </div>

          {/* Lease Info Footer Notice */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-200">
            <Calendar className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>Includes <strong>30-Day Auto-Renew Lease</strong> to prevent inactive room clutter.</span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!podName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-botanical-sage)] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Focus Pod</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

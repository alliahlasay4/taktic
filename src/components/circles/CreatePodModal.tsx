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
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface,#121824)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-black font-bold shrink-0 shadow-md">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <span>Create Permanent Focus Pod</span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                Standing Room
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Dedicated co-working space with selected Circle Roster partners.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pod Name Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Focus Pod Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design Guild, Morning Solopreneurs, Deep Work Squad"
              value={podName}
              onChange={(e) => setPodName(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sprint Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                      : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:text-white'
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
              <label className="text-xs font-semibold text-gray-300">
                Select Pod Members ({selectedIds.length} chosen)
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" /> Approved Circle Roster Only
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-800/80 rounded-xl p-2 bg-gray-950/40">
              {partnerMembers.length > 0 ? (
                partnerMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleSelectMember(member.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-950/30'
                          : 'border-gray-800/60 bg-gray-900/30 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-8 w-8 rounded-lg object-cover ring-1 ring-gray-700"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{member.name}</p>
                          <p className="text-[10px] text-gray-400">{member.statusText || 'Circle Member'}</p>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-black'
                            : 'border-gray-700 bg-gray-800 text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-gray-500">
                  No circle partners found. Add members to your Circle Roster first!
                </div>
              )}
            </div>
          </div>

          {/* Lease Info Footer Notice */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 flex items-center gap-2 text-[11px] text-emerald-300">
            <Calendar className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Includes <strong>30-Day Auto-Renew Lease</strong> to prevent inactive room clutter.</span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!podName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-black shadow-md hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-40"
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

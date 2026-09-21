import React, { useState } from 'react';
import { X, Settings, ShieldCheck, UserPlus, Volume2, VolumeX, UserX, Check, Lock, Users } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMemberByName(newMemberName.trim());
    setNewMemberName('');
  };

  const partnerMembers = members.filter((m) => m.isCirclePartner);
  const mutedCount = partnerMembers.filter((m) => m.isMuted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface,#121824)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <span>Manage Social Circle Roster</span>
            </h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Explicit feed authority & member mute controls
            </p>
          </div>
        </div>

        {/* Temporary Room Policy Notice */}
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-200/90 leading-relaxed">
            <strong>Controlled Privacy Policy:</strong> Co-working room guests are temporary. People who join your rooms will <strong>never</strong> clutter your feed unless explicitly added to your Circle Roster below.
          </p>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddSubmit} className="mb-5 flex items-center gap-2">
          <input
            type="text"
            placeholder="Add partner by name (e.g. Elena Rostova)..."
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMemberName.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-40 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Partner</span>
          </button>
        </form>

        {/* Summary Bar */}
        <div className="mb-3 flex items-center justify-between text-xs text-gray-400 px-1 font-medium">
          <span>{partnerMembers.length} Circle Partners</span>
          <span>{mutedCount} Feed Muted</span>
        </div>

        {/* Members Roster List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                  member.isCirclePartner
                    ? 'border-gray-800 bg-gray-900/50'
                    : 'border-gray-800/60 bg-gray-950/40 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-9 w-9 rounded-xl object-cover ring-1 ring-gray-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-xs text-white truncate">{member.name}</p>
                      {member.isCirclePartner ? (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          Circle Partner
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[9px] font-medium text-gray-400">
                          Temporary Guest
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{member.statusText || 'Focus member'}</p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {member.isCirclePartner ? (
                    <>
                      {/* Toggle Mute Feed */}
                      <button
                        onClick={() => onToggleMute(member.id)}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                          member.isMuted
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                            : 'border-gray-800 bg-gray-900 text-gray-300 hover:text-white'
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
                            <Volume2 className="h-3 w-3 text-emerald-400" />
                            <span>Feed Active</span>
                          </>
                        )}
                      </button>

                      {/* Remove from Circle */}
                      <button
                        onClick={() => (onRemoveMember ? onRemoveMember(member.id) : onTogglePartner(member.id))}
                        className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20 transition"
                        title="Remove from your Circle Roster"
                      >
                        <UserX className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </>
                  ) : (
                    /* Add to Circle */
                    <button
                      onClick={() => onTogglePartner(member.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Add to Circle</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">
              No circle partners added yet.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

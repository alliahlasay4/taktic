import React, { useState } from 'react';
import { X, Clock, Copy, Check, Radio, ShieldCheck } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: { name: string; durationMinutes: number; code: string }) => void;
}

const DURATION_OPTIONS = [
  { mins: 15, label: '15 min', sublabel: 'Short' },
  { mins: 25, label: '25 min', sublabel: 'Standard' },
  { mins: 50, label: '50 min', sublabel: 'Deep' },
  { mins: 90, label: '90 min', sublabel: 'Extended' },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreateRoom }) => {
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [generatedCode] = useState(() => `TK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateRoom({
      name: name.trim(),
      durationMinutes,
      code: generatedCode,
    });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-2xs">
              <Radio className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] truncate">
                Create Focus Room
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Set up a shared session with an invite code.
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

        {/* Modal Body: 2 columns on Tablet & Desktop, 1 column on Mobile */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form id="create-room-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Left Column: Room Details */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="create-room-name" className="text-xs font-semibold text-[var(--text-secondary)]">
                    Room Name
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">{name.length}/50</span>
                </div>
                <input
                  id="create-room-name"
                  name="roomName"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Afternoon Sprint"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)]"
                />
              </div>

              {/* Sprint Duration */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  Session Duration
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
                            ? 'border-[var(--accent-warm-ochre)] bg-[var(--accent-warm-ochre)]/15 text-[var(--text-primary)] ring-1 ring-[var(--accent-warm-ochre)] font-bold'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[var(--accent-warm-ochre)]' : 'text-[var(--text-muted)]'}`} />
                          <span className="text-xs font-semibold">{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Invite Code & Privacy Notice */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Invite Code Box */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Invite Code
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-[var(--text-primary)]">
                    {generatedCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition cursor-pointer active:scale-95 shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" /> : <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Share this code with circle partners to let them join this room.
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60 p-3 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Participants only see active timers and presence. Personal task titles and notes stay private.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-room-form"
            disabled={!name.trim()}
            className="rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

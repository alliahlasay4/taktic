import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string) => void;
  sampleCode?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  sampleCode = 'TK-8492',
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError('Please enter a room code.');
      return;
    }

    onJoinRoom(cleaned);
    onClose();
  };

  const handleUseSampleCode = () => {
    setCode(sampleCode);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-2xs">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Join a Room
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Enter a room or pod code to start co-working.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form id="join-room-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label htmlFor="join-room-code" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Room Code
            </label>
            <input
              id="join-room-code"
              name="roomCode"
              type="text"
              required
              autoFocus
              placeholder="e.g. TK-8492"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              className="w-full text-center font-mono text-base font-bold tracking-wider uppercase rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-2.5 px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] transition"
            />

            {sampleCode && (
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Format: TK-XXXX</span>
                <button
                  type="button"
                  onClick={handleUseSampleCode}
                  className="text-[var(--accent-terracotta)] hover:underline font-semibold cursor-pointer"
                >
                  Use sample ({sampleCode})
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)] shrink-0" />
            <span>Only your presence and focus timer will be shared with participants.</span>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="join-room-form"
            disabled={!code.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <span>Join Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

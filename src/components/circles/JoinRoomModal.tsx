import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

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
      setError('Please enter a valid room code.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Join Private Focus Room
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  Guest Access
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Enter an invite code to join a co-working session.
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
          <form id="join-room-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Demo Helper & Privacy Info */}
            <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Fast Pass Demo Helper */}
                {sampleCode && (
                  <div className="rounded-2xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)]">
                      <Sparkles className="h-3.5 w-3.5" /> Demo Room Code
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{sampleCode}</span>
                      <button
                        type="button"
                        onClick={handleUseSampleCode}
                        className="rounded-lg bg-[var(--accent-warm-ochre)]/20 hover:bg-[var(--accent-warm-ochre)]/30 px-2.5 py-1 text-xs font-bold text-[var(--accent-warm-ochre)] transition active:scale-95"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Callout */}
                <div className="rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-primary)] leading-snug">
                    <span className="font-bold text-[var(--accent-botanical-sage)]">Privacy Protected: </span>
                    Joining shares your presence and live timer only. Task names remain confidential.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Code Input & Error Feedback */}
            <div className="md:col-span-7 space-y-3 flex flex-col justify-center">
              <div>
                <label htmlFor="join-room-code" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Enter Room Code
                </label>
                <input
                  id="join-room-code"
                  name="roomCode"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. TK-8492"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-center font-mono text-xl tracking-widest uppercase rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)] transition"
                />
                <p className="mt-1.5 text-[10px] text-[var(--text-muted)] text-center">
                  Format: TK-XXXX (Case-insensitive)
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
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
            form="join-room-form"
            disabled={!code.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40"
          >
            <span>Join Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

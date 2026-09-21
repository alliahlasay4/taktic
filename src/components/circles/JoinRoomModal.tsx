import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

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
      setError('Please enter a valid 6-character room code.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">Join Private Focus Room</h3>
              <p className="text-xs text-[var(--text-secondary)]">Enter a 6-character invite code</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fast Pass Helper for Testing */}
        {sampleCode && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs text-[var(--text-secondary)]">Quick Demo Code: <strong className="text-[var(--text-primary)]">{sampleCode}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleUseSampleCode}
              className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition"
            >
              Use Code
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Enter Room Code</label>
            <input
              type="text"
              required
              placeholder="e.g. TK-8492"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center font-mono text-xl tracking-widest uppercase rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-botanical-sage)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-botanical-sage)] transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-botanical-sage)] px-4 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110 transition"
            >
              <span>Join Room</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

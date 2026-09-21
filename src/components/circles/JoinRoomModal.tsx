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
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-[var(--card-surface,#121824)] p-6 shadow-2xl text-[var(--text-primary,#f3f4f6)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Join Private Focus Room</h3>
              <p className="text-xs text-gray-400">Enter a 6-character invite code</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fast Pass Helper for Testing */}
        {sampleCode && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-300">Quick Demo Code: <strong>{sampleCode}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleUseSampleCode}
              className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition"
            >
              Use Code
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Enter Room Code</label>
            <input
              type="text"
              required
              placeholder="e.g. TK-8492"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center font-mono text-xl tracking-widest uppercase rounded-xl border border-gray-800 bg-gray-900/60 py-3 px-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-800 px-4 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400"
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

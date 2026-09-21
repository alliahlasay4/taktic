import React, { useState } from 'react';
import { X, Sparkles, Shield, Clock, Copy, Check } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: { name: string; durationMinutes: number; code: string }) => void;
}

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-[var(--card-surface,#121824)] p-6 shadow-2xl text-[var(--text-primary,#f3f4f6)]">
        {/* Top Glow */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Create Private Focus Room</h3>
              <p className="text-xs text-gray-400">Invite friends using a secure 6-digit code</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 6-Digit Code Preview Banner */}
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Generated Private Room Code
          </label>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xl font-bold tracking-widest text-white">{generatedCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Room Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Late Night Thesis Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2.5 px-3.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Sprint Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 25, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                    durationMinutes === mins
                      ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'border border-gray-800 bg-gray-900/40 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{mins} mins</span>
                </button>
              ))}
            </div>
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
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Private Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

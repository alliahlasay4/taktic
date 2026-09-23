import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Clock, Copy, Check } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: { name: string; durationMinutes: number; code: string }) => void;
}

const PRESET_ROOM_NAMES = [
  'Deep Work Sprint',
  'Morning Flow',
  'Afternoon Focus',
  'Late Night Build',
];

const DURATION_OPTIONS = [
  { mins: 15, label: '15 Mins', sublabel: 'Quick Sprint' },
  { mins: 25, label: '25 Mins', sublabel: 'Standard Flow' },
  { mins: 50, label: '50 Mins', sublabel: 'Deep Block' },
  { mins: 90, label: '90 Mins', sublabel: 'Extended Flow' },
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-main)]/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  Create Private Focus Room
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                  Instant Code
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Launch a silent co-working room accessible via secure room code.
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
          <form id="create-room-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
            {/* Left Column: Room Code Card & Privacy Banner */}
            <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Room Code Card */}
                <div className="rounded-2xl border border-[var(--accent-warm-ochre)]/30 bg-[var(--accent-warm-ochre)]/10 p-4 space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)]">
                    Shareable Room Code
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold tracking-widest text-[var(--text-primary)]">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-warm-ochre)]/20 hover:bg-[var(--accent-warm-ochre)]/30 px-3 py-1.5 text-xs font-bold text-[var(--accent-warm-ochre)] transition active:scale-95"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Callout */}
                <div className="rounded-2xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[var(--text-primary)] leading-snug">
                    <span className="font-bold text-[var(--accent-botanical-sage)]">Privacy Protected: </span>
                    Participants see live timers and presence only. Task names and notes remain private.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Name Input & Duration Grid */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Room Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="create-room-name" className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Room Name
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)]">{name.length}/50</span>
                  </div>
                  <input
                    id="create-room-name"
                    name="roomName"
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Deep Work Sprint"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-terracotta)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-terracotta)]"
                  />

                  {/* Preset Pills */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--text-muted)]">Presets:</span>
                    {PRESET_ROOM_NAMES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setName(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          name === preset
                            ? 'bg-[var(--accent-terracotta)] text-white border-[var(--accent-terracotta)] font-semibold'
                            : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]/40'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Grid */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Sprint Duration
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
            form="create-room-form"
            disabled={!name.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] hover:brightness-110 px-5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

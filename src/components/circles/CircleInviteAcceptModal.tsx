import React, { useState } from 'react';
import { Sparkles, Users, Check, X, ShieldCheck, Flame, CircleDot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CircleInviteAcceptModalProps {
  isOpen: boolean;
  inviterName: string;
  inviteToken: string;
  onAccept: (token: string) => Promise<void>;
  onDecline: () => void;
}

export const CircleInviteAcceptModal: React.FC<CircleInviteAcceptModalProps> = ({
  isOpen,
  inviterName,
  inviteToken,
  onAccept,
  onDecline,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await onAccept(inviteToken);
      // Trigger joyful celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C06C4C', '#C87D87', '#CFA052', '#6B8E6E'],
      });
    } catch (err: any) {
      console.error('Error accepting circle invite:', err);
      setError(err?.message || 'Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        {/* Close / Decline Button */}
        <button
          type="button"
          onClick={onDecline}
          disabled={loading}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1 cursor-pointer"
          aria-label="Decline invitation"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header Icon */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/25 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-terracotta)]">
              Circle Partner Request
            </span>
            <h3 className="font-heading font-extrabold text-xl text-[var(--text-primary)] leading-tight">
              Connect with {inviterName}?
            </h3>
          </div>
        </div>

        {/* Body Description */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
          <strong className="text-[var(--text-primary)]">{inviterName}</strong> has invited you to connect as accountability Circle Partners on Taktic to share focus momentum and hit daily goals together.
        </p>

        {/* Benefits Preview List */}
        <div className="space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 mb-4">
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
            <Flame className="h-4 w-4 text-[var(--accent-terracotta)] shrink-0" />
            <span>Celebrate streak milestones & focus sprints together</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
            <CircleDot className="h-4 w-4 text-[#C87D87] shrink-0" />
            <span>Mutual progress ring closures in your Circle Roster</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
            <Users className="h-4 w-4 text-[#CFA052] shrink-0" />
            <span>One-click co-working in live synchronous focus rooms</span>
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="flex items-start gap-2 rounded-xl bg-[var(--accent-botanical-sage)]/10 border border-[var(--accent-botanical-sage)]/25 p-2.5 mb-5 text-[11px] text-[var(--text-primary)]">
          <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[var(--accent-botanical-sage)]">Privacy Sovereign: </strong>
            Task names and private notes remain completely private to you.
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500 text-center font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onDecline}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer text-center"
          >
            Maybe Later
          </button>

          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] hover:brightness-110 text-white font-bold text-xs shadow-md shadow-[#C06C4C]/25 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Accept & Join Circle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

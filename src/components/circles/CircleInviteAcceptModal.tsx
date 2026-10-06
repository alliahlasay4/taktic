import React, { useState } from 'react';
import { Sparkles, Users, Check, X, ShieldCheck, Flame, CircleDot } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CircleInviteAcceptModalProps {
  isOpen: boolean;
  inviterName: string;
  inviteToken: string;
  onAccept: (token: string) => Promise<void>;
  onMaybeLater: () => void;
  onDecline: (token: string) => Promise<void> | void;
}

export const CircleInviteAcceptModal: React.FC<CircleInviteAcceptModalProps> = ({
  isOpen,
  inviterName,
  inviteToken,
  onAccept,
  onMaybeLater,
  onDecline,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

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

  const handleDeclineConfirmed = async () => {
    setLoading(true);
    setError(null);
    try {
      await onDecline(inviteToken);
    } catch (err: any) {
      console.error('Error declining circle invite:', err);
      setError(err?.message || 'Failed to decline. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3.5 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        {/* Close Button (triggers Maybe Later snooze) */}
        <button
          type="button"
          onClick={onMaybeLater}
          disabled={loading}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1 cursor-pointer"
          aria-label="Close and decide later"
          title="Decide later"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header Icon */}
        <div className="flex items-center gap-3 sm:gap-3.5 mb-4 sm:mb-5">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/25 shrink-0">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-terracotta)]">
              Circle Partner Request
            </span>
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[var(--text-primary)] leading-tight">
              Connect with {inviterName}?
            </h3>
          </div>
        </div>

        {/* Body Description */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          <strong className="text-[var(--text-primary)]">{inviterName}</strong> has invited you to connect as accountability Circle Partners on Taktic to share daily streak and focus momentum.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500 text-center font-medium">
            {error}
          </div>
        )}

        {/* Confirming Decline Sub-View */}
        {confirmingDecline ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center space-y-2.5 animate-in fade-in">
            <p className="text-xs font-semibold text-rose-500">
              Decline partner request from {inviterName}?
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              This will remove the invitation from your queue.
            </p>
            <div className="flex items-center gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => setConfirmingDecline(false)}
                disabled={loading}
                className="py-1.5 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleDeclineConfirmed}
                disabled={loading}
                className="py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
              >
                {loading ? 'Declining...' : 'Yes, Decline'}
              </button>
            </div>
          </div>
        ) : (
          /* Main Action Buttons */
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onMaybeLater}
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

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setConfirmingDecline(true)}
                disabled={loading}
                className="text-[11px] text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer underline underline-offset-2"
              >
                Decline invitation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

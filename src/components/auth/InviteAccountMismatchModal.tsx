import React, { useState } from 'react';
import { UserX, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';

interface InviteAccountMismatchModalProps {
  currentUserEmail: string;
  invitedEmail: string;
  inviterName: string;
  onSwitchAccount: () => Promise<void> | void;
  onContinueCurrentAccount: () => void;
}

export const InviteAccountMismatchModal: React.FC<InviteAccountMismatchModalProps> = ({
  currentUserEmail,
  invitedEmail,
  inviterName,
  onSwitchAccount,
  onContinueCurrentAccount,
}) => {
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await onSwitchAccount();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mismatch-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3.5 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 text-left"
    >
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/25 shrink-0">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-terracotta)]">
              Account Mismatch
            </span>
            <h3
              id="mismatch-title"
              className="font-heading font-extrabold text-lg sm:text-xl text-[var(--text-primary)] leading-tight"
            >
              Different Account Signed In
            </h3>
          </div>
        </div>

        {/* Informative Explanation */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          <strong className="text-[var(--text-primary)]">{inviterName}</strong> sent this Circle
          Partner invitation specifically to:
        </p>

        {/* Comparison Boxes */}
        <div className="space-y-2 mb-5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Invited Email
              </div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 break-all">
                {invitedEmail}
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 p-3 text-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Currently Signed In As
              </div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5 break-all">
                {currentUserEmail}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-secondary)] leading-normal mb-5">
          To accept this invitation and connect your circle, switch to the invited account. You can
          also stay signed in as <span className="font-semibold">{currentUserEmail}</span>.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSwitch}
            disabled={switching}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#C06C4C]/25 transition cursor-pointer disabled:opacity-50"
          >
            {switching ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Switching Accounts...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sign Out & Switch to {invitedEmail}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-75" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onContinueCurrentAccount}
            disabled={switching}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer text-center"
          >
            Stay Signed In as {currentUserEmail}
          </button>
        </div>
      </div>
    </div>
  );
};

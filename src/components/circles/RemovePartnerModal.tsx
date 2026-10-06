import React from 'react';
import { UserX, X, AlertTriangle } from 'lucide-react';
import { CircleMember } from '../../types';

interface RemovePartnerModalProps {
  isOpen: boolean;
  member: CircleMember | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const RemovePartnerModal: React.FC<RemovePartnerModalProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3.5 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1 cursor-pointer"
          aria-label="Cancel removal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              Remove Partner
            </span>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
              Remove {member.name}?
            </h3>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5">
          Are you sure you want to remove <strong className="text-[var(--text-primary)]">{member.name}</strong> from your Circle Roster? You will no longer share live milestone broadcasts or ring closures with each other.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition cursor-pointer disabled:opacity-50 text-center"
          >
            {isLoading ? 'Removing...' : 'Remove Partner'}
          </button>
        </div>
      </div>
    </div>
  );
};

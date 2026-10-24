import React, { useState, useRef, useEffect } from 'react';
import { Play, MoreHorizontal, History, Calendar, Trash2, Clock } from 'lucide-react';
import { FocusPod } from '../../types';

interface FocusPodCardProps {
  pod: FocusPod;
  onJoinPod: (pod: FocusPod) => void;
  onRenewLease: (podId: string) => void;
  onDeletePod?: (podId: string) => void;
  onOpenAsyncBoard: (pod: FocusPod) => void;
}

export const FocusPodCard: React.FC<FocusPodCardProps> = ({
  pod,
  onJoinPod,
  onRenewLease,
  onDeletePod,
  onOpenAsyncBoard,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isExpired = new Date(pod.expiresAt).getTime() < Date.now();
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(pod.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const activeCount = pod.activeMembersCount || 0;
  const isPodActive = activeCount > 0;

  // Close dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const memberSummary =
    pod.allowedMemberNames && pod.allowedMemberNames.length > 0
      ? pod.allowedMemberNames.join(', ')
      : `${pod.allowedMemberIds.length} members`;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 shadow-xs ${
        isPodActive
          ? 'border-[var(--accent-botanical-sage)]/40 bg-[var(--card-surface)] ring-1 ring-[var(--accent-botanical-sage)]/20'
          : 'border-[var(--border-subtle)] bg-[var(--card-surface)] hover:border-[var(--border-strong,var(--text-muted))]'
      }`}
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] truncate">
                {pod.name}
              </h4>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                <Clock className="h-2.5 w-2.5" />
                {pod.durationMinutes}m
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate" title={memberSummary}>
              {memberSummary}
            </p>
          </div>

          {/* Right Status + Menu Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isPodActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-ping" />
                {activeCount} live
              </span>
            ) : (
              <span className="text-[10px] font-medium text-[var(--text-muted)] px-1">
                Idle
              </span>
            )}

            {/* Context Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                title="Pod options"
                aria-label="Pod options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {/* Overflow Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-30 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-lg space-y-1 text-xs">
                  {/* Async Board Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAsyncBoard(pod);
                    }}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5 text-indigo-400" />
                    <span>View Async Board</span>
                  </button>

                  {/* Lease Info & Renew */}
                  <div className="px-2.5 py-1.5 border-t border-[var(--border-subtle)] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[var(--accent-warm-ochre)]" />
                        {isExpired ? 'Lease expired' : `${daysRemaining}d lease left`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onRenewLease(pod.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-[11px] font-bold text-[var(--accent-terracotta)] hover:underline cursor-pointer"
                    >
                      Renew Lease (+30 days)
                    </button>
                  </div>

                  {/* Delete / Disband Pod */}
                  {onDeletePod && (
                    <div className="border-t border-[var(--border-subtle)] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (window.confirm(`Disband standing pod "${pod.name}"?`)) {
                            onDeletePod(pod.id);
                          }
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Disband Pod</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Clean Action Button */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => onJoinPod(pod)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition active:scale-[0.98] cursor-pointer shadow-2xs h-9 ${
            isPodActive
              ? 'bg-[var(--accent-botanical-sage)] hover:brightness-110 text-white'
              : 'bg-[var(--accent-terracotta)] hover:brightness-110 text-white'
          }`}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isPodActive ? 'Jump In (Active Sprint)' : 'Start Pod Sprint'}</span>
        </button>
      </div>
    </div>
  );
};

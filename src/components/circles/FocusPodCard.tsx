import React from 'react';
import { Users, Play, Calendar, History, Sparkles, Shield, Clock, Trash2 } from 'lucide-react';
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
  const isExpired = new Date(pod.expiresAt).getTime() < Date.now();
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(pod.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const activeCount = pod.activeMembersCount || 0;
  const isPodActive = activeCount > 0;

  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all shadow-xs ${
      isPodActive
        ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 via-[var(--bg-main)] to-[var(--bg-main)] shadow-emerald-500/5'
        : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-gray-700'
    }`}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                {pod.name}
              </h4>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                Permanent Pod
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Standard {pod.durationMinutes}m sprint • {pod.allowedMemberNames?.join(', ') || `${pod.allowedMemberIds.length} members`}
            </p>
          </div>

          {/* Active Status Badge */}
          {isPodActive ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {activeCount} Focusing Now
            </span>
          ) : (
            <span className="rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] font-medium text-gray-400">
              ⚪ Idle
            </span>
          )}
        </div>
      </div>

      {/* 30-Day Lease Bar & Controls */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-3">
        {/* Lease Indicator (Safeguard 2) & Disband/Delete Action */}
        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-emerald-400" />
            Lease: {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRenewLease(pod.id)}
              className="text-[10px] font-bold text-emerald-400 hover:underline"
              title="Renew 30-day lease to prevent auto-cleanup"
            >
              Renew (+30d)
            </button>

            {onDeletePod && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to disband "${pod.name}"?`)) {
                    onDeletePod(pod.id);
                  }
                }}
                className="text-gray-400 hover:text-red-400 transition"
                title="Disband & delete this focus pod"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onJoinPod(pod)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-bold text-black shadow-xs hover:from-emerald-400 hover:to-teal-400 transition active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            <span>Join Pod Sprint</span>
          </button>

          <button
            onClick={() => onOpenAsyncBoard(pod)}
            className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] px-2.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-emerald-500/30 hover:text-white transition"
            title="View offline async logs across timezones"
          >
            <History className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Async Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};


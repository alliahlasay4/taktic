import React from 'react';
import { X, History, Sparkles, Clock, CheckCircle, Zap } from 'lucide-react';
import { FocusPod } from '../../types';

interface AsyncPodBoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pod: FocusPod | null;
}

export const AsyncPodBoardDrawer: React.FC<AsyncPodBoardDrawerProps> = ({
  isOpen,
  onClose,
  pod,
}) => {
  if (!isOpen || !pod) return null;

  const logs = pod.recentLogs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[var(--card-surface)] border-l border-[var(--border-subtle)] p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {pod.name} — Async Activity Board
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Recent offline focus logs from pod members across timezones.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subheader Notice */}
            <div className="mb-5 rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-start gap-2 text-[11px] text-[var(--text-primary)]">
              <Zap className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0 mt-0.5" />
              <span>
                <strong>Asynchronous Rhythm:</strong> Stay connected with your pod partners even when focusing at different hours of the day.
              </span>
            </div>

            {/* Log Stream */}
            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3.5 transition hover:border-[var(--accent-terracotta)]/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[var(--accent-botanical-sage)]" />
                        {log.userName}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.completedAt}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--accent-botanical-sage)] font-medium">
                      Finished {log.durationMinutes}m Focus Sprint
                    </p>
                    {log.taskTitle && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 italic truncate">
                        "{log.taskTitle}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center">
                  <Sparkles className="h-6 w-6 text-[var(--text-muted)] mb-2" />
                  <span>No offline logs logged in the last 24h.</span>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--card-hover)] py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-terracotta)]/40 hover:text-[var(--accent-terracotta)] transition"
            >
              Close Activity Board
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

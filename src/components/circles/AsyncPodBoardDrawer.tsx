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
        <div className="w-screen max-w-md bg-[var(--card-surface,#121824)] border-l border-[var(--border-subtle)] p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-white">
                    {pod.name} — Async Activity Board
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Recent offline focus logs from pod members across timezones.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subheader Notice */}
            <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 flex items-start gap-2 text-[11px] text-indigo-200">
              <Zap className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
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
                    className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 transition hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        {log.userName}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.completedAt}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-300 font-medium">
                      Finished {log.durationMinutes}m Focus Sprint
                    </p>
                    {log.taskTitle && (
                      <p className="text-[11px] text-gray-400 mt-1 italic truncate">
                        "{log.taskTitle}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center">
                  <Sparkles className="h-6 w-6 text-gray-600 mb-2" />
                  <span>No offline logs logged in the last 24h.</span>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gray-800 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition"
            >
              Close Activity Board
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

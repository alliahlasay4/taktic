import React, { useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineBannerProps {
  pendingSyncCount?: number;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  pendingSyncCount = 0,
  isSyncing = false,
}) => {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();

  // Automatically dismiss the "back online" green banner after 4 seconds
  useEffect(() => {
    if (isOnline && wasOffline && !isSyncing && pendingSyncCount === 0) {
      const timer = setTimeout(() => {
        clearWasOffline();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, isSyncing, pendingSyncCount, clearWasOffline]);

  if (isOnline && !wasOffline && !isSyncing && pendingSyncCount === 0) {
    return null;
  }

  // Currently Offline
  if (!isOnline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors duration-200"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Working offline.</strong> Your changes are saved locally and will automatically sync when you reconnect.
          </span>
          {pendingSyncCount > 0 && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300">
              {pendingSyncCount} pending {pendingSyncCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>
      </aside>
    );
  }

  // Reconnected & syncing or freshly synced
  return (
    <aside
      role="status"
      aria-live="polite"
      className="w-full bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-900 dark:text-emerald-200 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors duration-200"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-spin" />
            <span>
              <strong>Back online!</strong> Syncing pending changes with the cloud...
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Back online!</strong> All changes are up to date.
            </span>
            <button
              onClick={clearWasOffline}
              className="ml-auto text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { syncQueue } from '../lib/syncQueue';
import { syncProcessor } from '../lib/syncProcessor';

export function useOfflineSync() {
  const { user, isDemo } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(() => {
    return syncQueue.count(user?.id, isDemo);
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Update pending count whenever user changes
  useEffect(() => {
    setPendingCount(syncQueue.count(user?.id, isDemo));
  }, [user?.id, isDemo]);

  const triggerSync = useCallback(async () => {
    if (!user || isDemo || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    const currentCount = syncQueue.count(user.id, isDemo);
    if (currentCount === 0) return;

    setIsSyncing(true);
    try {
      await syncProcessor.flush(user.id, isDemo, (remaining) => {
        setPendingCount(remaining);
      });
    } finally {
      setIsSyncing(false);
      setPendingCount(syncQueue.count(user.id, isDemo));
    }
  }, [user, isDemo]);

  // Listen to browser coming online and trigger sync automatically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      // Small debounce delay to ensure stable connectivity before replaying requests
      setTimeout(() => {
        triggerSync();
      }, 1000);
    };

    window.addEventListener('online', handleOnline);

    // Initial check on mount if online
    if (navigator.onLine && syncQueue.count(user?.id, isDemo) > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [triggerSync, user?.id, isDemo]);

  return {
    pendingCount,
    isSyncing,
    triggerSync,
  };
}

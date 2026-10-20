/**
 * Typed Scoped Storage Utility
 * Provides unified, safe, user-scoped localStorage and demo-scoped sessionStorage persistence.
 */

export interface ScopedStorage<T> {
  key: string;
  isDemo: boolean;
  get: (fallback?: T) => T | null;
  set: (value: T) => void;
  remove: () => void;
}

/**
 * Synchronously retrieves the logged-in Supabase user ID from localStorage
 * before asynchronous supabase.auth.getSession() completes.
 * Returns null if no authenticated session or if demo mode is active.
 */
export function getSynchronousAuthUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (localStorage.getItem('taktic_demo_mode') === 'true') {
      return null;
    }
    // Search localStorage for Supabase auth token
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const item = localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          const userId = parsed?.user?.id;
          if (userId && typeof userId === 'string') {
            return userId;
          }
        }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function createScopedStorage<T>(
  namespace: string,
  userId?: string | null,
  isDemo?: boolean
): ScopedStorage<T> {
  const effectiveUserId = userId || (!isDemo ? getSynchronousAuthUserId() : null);
  const isDemoMode = Boolean(isDemo || !effectiveUserId || effectiveUserId === 'demo' || effectiveUserId === 'demo-user-123');
  const userKey = effectiveUserId || (isDemo ? 'demo' : 'guest');
  const key = isDemoMode ? `taktic_demo_${namespace}` : `taktic_${namespace}_${userKey}`;

  const getStorage = (): Storage | null => {
    try {
      if (typeof window === 'undefined') return null;
      return isDemoMode ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  };

  return {
    key,
    isDemo: isDemoMode,
    get: (fallback?: T): T | null => {
      try {
        const storage = getStorage();
        if (!storage) return fallback ?? null;
        const item = storage.getItem(key);
        if (item === null) return fallback ?? null;
        return JSON.parse(item) as T;
      } catch (err) {
        console.error(`Error reading from storage for key "${key}":`, err);
        return fallback ?? null;
      }
    },
    set: (value: T): void => {
      try {
        const storage = getStorage();
        if (!storage) return;
        storage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error(`Error writing to storage for key "${key}":`, err);
      }
    },
    remove: (): void => {
      try {
        const storage = getStorage();
        if (!storage) return;
        storage.removeItem(key);
      } catch (err) {
        console.error(`Error removing from storage for key "${key}":`, err);
      }
    },
  };
}

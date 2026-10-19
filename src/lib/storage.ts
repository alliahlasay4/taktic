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

export function createScopedStorage<T>(
  namespace: string,
  userId?: string | null,
  isDemo?: boolean
): ScopedStorage<T> {
  const isDemoMode = Boolean(isDemo || !userId || userId === 'demo' || userId === 'demo-user-123');
  const userKey = userId || (isDemo ? 'demo' : 'guest');
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

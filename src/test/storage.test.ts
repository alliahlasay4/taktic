import { describe, it, expect, beforeEach } from 'vitest';
import { createScopedStorage } from '../lib/storage';

describe('createScopedStorage (Multi-tenant & Demo Storage Isolation)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('routes demo/unauthenticated mode to sessionStorage with demo prefix', () => {
    const demoStorage = createScopedStorage<{ count: number }>('tasks', null, true);
    expect(demoStorage.isDemo).toBe(true);
    expect(demoStorage.key).toBe('taktic_demo_tasks');

    demoStorage.set({ count: 5 });

    // Should exist in sessionStorage and NOT leak to localStorage
    expect(window.sessionStorage.getItem('taktic_demo_tasks')).toBe(JSON.stringify({ count: 5 }));
    expect(window.localStorage.getItem('taktic_demo_tasks')).toBeNull();

    expect(demoStorage.get()).toEqual({ count: 5 });
  });

  it('routes authenticated user storage to localStorage with user-specific key', () => {
    const userStorage = createScopedStorage<{ theme: string }>('settings', 'user-abc-456', false);
    expect(userStorage.isDemo).toBe(false);
    expect(userStorage.key).toBe('taktic_settings_user-abc-456');

    userStorage.set({ theme: 'warm' });

    // Should exist in localStorage and NOT sessionStorage
    expect(window.localStorage.getItem('taktic_settings_user-abc-456')).toBe(JSON.stringify({ theme: 'warm' }));
    expect(window.sessionStorage.getItem('taktic_settings_user-abc-456')).toBeNull();

    expect(userStorage.get()).toEqual({ theme: 'warm' });
  });

  it('returns fallback value if key does not exist or storage is empty', () => {
    const storage = createScopedStorage<string[]>('tags', 'user-123');
    expect(storage.get(['Default'])).toEqual(['Default']);
    expect(storage.get()).toBeNull();
  });

  it('removes data cleanly upon calling remove()', () => {
    const storage = createScopedStorage<number>('streak', 'user-789');
    storage.set(42);
    expect(storage.get()).toBe(42);

    storage.remove();
    expect(storage.get()).toBeNull();
    expect(window.localStorage.getItem(storage.key)).toBeNull();
  });

  it('isolates different users sharing the same namespace', () => {
    const userA = createScopedStorage<{ note: string }>('notes', 'user-A');
    const userB = createScopedStorage<{ note: string }>('notes', 'user-B');

    userA.set({ note: 'User A confidential note' });
    userB.set({ note: 'User B confidential note' });

    expect(userA.get()).toEqual({ note: 'User A confidential note' });
    expect(userB.get()).toEqual({ note: 'User B confidential note' });
  });
});

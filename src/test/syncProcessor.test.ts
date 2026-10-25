import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncProcessor } from '../lib/syncProcessor';
import { syncQueue } from '../lib/syncQueue';
import { supabase } from '../lib/supabase';

// Mock supabase client
vi.mock('../lib/supabase', () => {
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const deleteMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  });
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
  const insertMock = vi.fn().mockResolvedValue({ error: null });

  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'habit_logs') {
          return { upsert: upsertMock, delete: deleteMock };
        }
        if (table === 'habits' || table === 'tasks') {
          return { update: updateMock };
        }
        if (table === 'focus_sessions') {
          return { insert: insertMock };
        }
        return {};
      }),
    },
  };
});

describe('SyncProcessor', () => {
  const testUserId = 'user-sync-test-456';

  beforeEach(() => {
    syncQueue.clear(testUserId);
    vi.clearAllMocks();
  });

  it('flushes enqueued mutations and clears the queue', async () => {
    // 1. Enqueue habit toggle
    syncQueue.enqueue(
      {
        type: 'habit_toggle',
        table: 'habit_logs',
        payload: { habitId: 'h1', date: '2026-10-26', isDone: true, streak: 3 },
      },
      testUserId
    );

    // 2. Enqueue focus session
    syncQueue.enqueue(
      {
        type: 'focus_session_add',
        table: 'focus_sessions',
        payload: { duration_minutes: 25, mode: 'pomodoro' },
      },
      testUserId
    );

    expect(syncQueue.count(testUserId)).toBe(2);

    // Process flush
    const result = await syncProcessor.flush(testUserId, false);

    expect(result.processed).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);

    // Queue should now be empty
    expect(syncQueue.count(testUserId)).toBe(0);
    expect(supabase.from).toHaveBeenCalledWith('habit_logs');
    expect(supabase.from).toHaveBeenCalledWith('focus_sessions');
  });

  it('safely skips processing in demo mode', async () => {
    syncQueue.enqueue(
      {
        type: 'task_upsert',
        table: 'tasks',
        payload: { id: 't1', completed: true },
      },
      testUserId,
      true // isDemo
    );

    const result = await syncProcessor.flush(testUserId, true);
    expect(result.processed).toBe(0);
  });
});

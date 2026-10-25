import { describe, it, expect, beforeEach } from 'vitest';
import { syncQueue } from '../lib/syncQueue';

describe('SyncQueueEngine', () => {
  const testUserId = 'test-user-sync-123';

  beforeEach(() => {
    syncQueue.clear(testUserId);
  });

  it('enqueues a mutation item and increases queue count', () => {
    expect(syncQueue.count(testUserId)).toBe(0);

    const item = syncQueue.enqueue(
      {
        type: 'habit_toggle',
        table: 'habit_logs',
        payload: { habitId: 'h1', date: '2026-10-26', isCompleted: true },
      },
      testUserId
    );

    expect(syncQueue.count(testUserId)).toBe(1);
    expect(item.id).toMatch(/^sync_\d+_/);
    expect(item.attempts).toBe(0);
    expect(item.type).toBe('habit_toggle');

    const first = syncQueue.peek(testUserId);
    expect(first?.id).toBe(item.id);
  });

  it('dequeues an item by id', () => {
    const item1 = syncQueue.enqueue(
      { type: 'habit_toggle', table: 'habit_logs', payload: { habitId: 'h1' } },
      testUserId
    );
    const item2 = syncQueue.enqueue(
      { type: 'focus_session_add', table: 'focus_sessions', payload: { durationMinutes: 25 } },
      testUserId
    );

    expect(syncQueue.count(testUserId)).toBe(2);

    syncQueue.dequeue(item1.id, testUserId);
    expect(syncQueue.count(testUserId)).toBe(1);

    const remaining = syncQueue.peek(testUserId);
    expect(remaining?.id).toBe(item2.id);
  });

  it('deduplicates task_upsert mutations for the same task id', () => {
    syncQueue.enqueue(
      {
        type: 'task_upsert',
        table: 'tasks',
        payload: { id: 'task-abc', title: 'Draft v1' },
      },
      testUserId
    );

    expect(syncQueue.count(testUserId)).toBe(1);

    // Enqueue update to same task
    syncQueue.enqueue(
      {
        type: 'task_upsert',
        table: 'tasks',
        payload: { id: 'task-abc', title: 'Draft v2 Final' },
      },
      testUserId
    );

    // Count should still be 1, but payload is updated
    expect(syncQueue.count(testUserId)).toBe(1);
    const peeked = syncQueue.peek(testUserId);
    expect(peeked?.payload.title).toBe('Draft v2 Final');
  });

  it('marks failed attempts and increments attempt count', () => {
    const item = syncQueue.enqueue(
      { type: 'focus_session_add', table: 'focus_sessions', payload: { duration: 25 } },
      testUserId
    );

    syncQueue.markFailed(item.id, 'Network timeout', testUserId);

    const updated = syncQueue.peek(testUserId);
    expect(updated?.attempts).toBe(1);
    expect(updated?.error).toBe('Network timeout');
    expect(updated?.lastAttemptAt).toBeDefined();
  });
});

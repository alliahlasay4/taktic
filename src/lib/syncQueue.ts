/**
 * Offline Mutation Sync Queue
 * Resilient, local-first queued mutations for offline work.
 * When offline, operations are safely persisted per-user and replayed once reconnected.
 */

import { createScopedStorage } from './storage';

export type SyncOperationType =
  | 'habit_toggle'
  | 'habit_create'
  | 'habit_delete'
  | 'task_upsert'
  | 'task_delete'
  | 'focus_session_add'
  | 'quick_note_upsert'
  | 'quick_note_delete';

export interface SyncQueueItem {
  id: string; // unique mutation identifier (e.g., sync_17298371928_xyz)
  type: SyncOperationType;
  table: string;
  payload: any;
  createdAt: string; // ISO string
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
}

export class SyncQueueEngine {
  private namespace = 'sync_mutations_queue';

  /**
   * Get the scoped queue storage instance for the current user
   */
  private getStorage(userId?: string | null, isDemo?: boolean) {
    return createScopedStorage<SyncQueueItem[]>(this.namespace, userId, isDemo);
  }

  /**
   * Retrieve all queued items for a given user
   */
  public getQueue(userId?: string | null, isDemo?: boolean): SyncQueueItem[] {
    const storage = this.getStorage(userId, isDemo);
    return storage.get([]) || [];
  }

  /**
   * Enqueue a new mutation
   */
  public enqueue(
    item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>,
    userId?: string | null,
    isDemo?: boolean
  ): SyncQueueItem {
    const storage = this.getStorage(userId, isDemo);
    const currentQueue = storage.get([]) || [];

    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    // Optimization: Deduplicate idempotent updates for the same entity if pending
    let updatedQueue: SyncQueueItem[];
    if (item.type === 'task_upsert' && item.payload?.id) {
      // Replace existing pending task_upsert for the same task ID
      const filtered = currentQueue.filter(
        (q) => !(q.type === 'task_upsert' && q.payload?.id === item.payload.id)
      );
      updatedQueue = [...filtered, newItem];
    } else if (item.type === 'quick_note_upsert' && item.payload?.id) {
      const filtered = currentQueue.filter(
        (q) => !(q.type === 'quick_note_upsert' && q.payload?.id === item.payload.id)
      );
      updatedQueue = [...filtered, newItem];
    } else {
      updatedQueue = [...currentQueue, newItem];
    }

    storage.set(updatedQueue);
    return newItem;
  }

  /**
   * Peek at the first queued item
   */
  public peek(userId?: string | null, isDemo?: boolean): SyncQueueItem | null {
    const queue = this.getQueue(userId, isDemo);
    return queue.length > 0 ? queue[0] : null;
  }

  /**
   * Remove an item from the queue by its mutation id
   */
  public dequeue(id: string, userId?: string | null, isDemo?: boolean): void {
    const storage = this.getStorage(userId, isDemo);
    const queue = storage.get([]) || [];
    const filtered = queue.filter((item) => item.id !== id);
    storage.set(filtered);
  }

  /**
   * Mark an item as failed with error details and increment attempt counter
   */
  public markFailed(
    id: string,
    error: string,
    userId?: string | null,
    isDemo?: boolean
  ): void {
    const storage = this.getStorage(userId, isDemo);
    const queue = storage.get([]) || [];
    const updated = queue.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          attempts: item.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
          error,
        };
      }
      return item;
    });
    storage.set(updated);
  }

  /**
   * Clear the entire mutation queue for a user
   */
  public clear(userId?: string | null, isDemo?: boolean): void {
    const storage = this.getStorage(userId, isDemo);
    storage.remove();
  }

  /**
   * Count total pending mutations
   */
  public count(userId?: string | null, isDemo?: boolean): number {
    return this.getQueue(userId, isDemo).length;
  }
}

export const syncQueue = new SyncQueueEngine();

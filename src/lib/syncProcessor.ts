/**
 * Sync Processor
 * Iterates through pending offline mutations in FIFO order and flushes them to Supabase.
 * Handles deduplication, retries, and errors gracefully.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { syncQueue, SyncQueueItem } from './syncQueue';

export interface SyncProcessorResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export class SyncProcessor {
  private isProcessing = false;

  /**
   * Check if a sync is currently running
   */
  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Process a single queued mutation item against Supabase
   */
  private async processItem(item: SyncQueueItem, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;

    switch (item.type) {
      case 'habit_toggle': {
        const { habitId, date, isDone, streak } = item.payload;
        if (isDone) {
          const { error } = await supabase
            .from('habit_logs')
            .upsert({ habit_id: habitId, user_id: userId, completed_date: date });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', habitId)
            .eq('completed_date', date)
            .eq('user_id', userId);
          if (error) throw error;
        }

        if (typeof streak === 'number') {
          await supabase
            .from('habits')
            .update({ streak })
            .eq('id', habitId)
            .eq('user_id', userId);
        }
        return true;
      }

      case 'task_upsert': {
        const { id, completed, completed_at, ...otherFields } = item.payload;
        const updatePayload: Record<string, any> = { ...otherFields };
        if (completed !== undefined) updatePayload.completed = completed;
        if (completed_at !== undefined) updatePayload.completed_at = completed_at;

        const { error } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return true;
      }

      case 'focus_session_add': {
        const { error } = await supabase
          .from('focus_sessions')
          .insert({
            user_id: userId,
            duration_minutes: item.payload.duration_minutes,
            task_title: item.payload.task_title || null,
            mode: item.payload.mode || 'pomodoro',
            soundscape: item.payload.soundscape || null,
            focus_quality: item.payload.focus_quality || null,
            completed_at: item.payload.completed_at || new Date().toISOString(),
          });

        if (error) throw error;
        return true;
      }

      default:
        console.warn(`Unknown sync operation type: ${item.type}`);
        return true;
    }
  }

  /**
   * Flush all pending mutations for the given user
   */
  public async flush(
    userId?: string | null,
    isDemo?: boolean,
    onProgress?: (remaining: number) => void
  ): Promise<SyncProcessorResult> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (!userId || isDemo || !isSupabaseConfigured) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const items = syncQueue.getQueue(userId, isDemo);

      for (const item of items) {
        processed++;
        try {
          const success = await this.processItem(item, userId);
          if (success) {
            syncQueue.dequeue(item.id, userId, isDemo);
            succeeded++;
          } else {
            failed++;
          }
        } catch (err: any) {
          console.error(`Failed to sync item ${item.id}:`, err);
          syncQueue.markFailed(item.id, err.message || 'Sync error', userId, isDemo);
          failed++;
          // If we encounter a hard network failure during sync, stop and wait for next online cycle
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            break;
          }
        }

        if (onProgress) {
          onProgress(syncQueue.count(userId, isDemo));
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed };
  }
}

export const syncProcessor = new SyncProcessor();

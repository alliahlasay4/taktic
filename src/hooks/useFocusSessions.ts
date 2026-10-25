import { useState, useEffect, useCallback, useMemo } from 'react';
import { FocusSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_FOCUS_SESSIONS } from '../lib/mockData';
import { getLocalDateString } from '../lib/streak';
import { createScopedStorage } from '../lib/storage';
import { syncQueue } from '../lib/syncQueue';

export function useFocusSessions() {
  const { user, isDemo } = useAuth();

  const storage = useMemo(() => createScopedStorage<FocusSession[]>('focus_sessions', user?.id, isDemo), [user?.id, isDemo]);

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const fallback = isDemo ? INITIAL_FOCUS_SESSIONS : [];
    return storage.get(fallback) || fallback;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch focus sessions from Supabase or LocalStorage
  const fetchFocusSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo mode -> Scoped storage
    if (storage.isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      setFocusSessions(storage.get(INITIAL_FOCUS_SESSIONS) || INITIAL_FOCUS_SESSIONS);
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (dbError) throw dbError;

      const mapped: FocusSession[] = (data || []).map((s) => ({
        id: s.id,
        durationMinutes: s.duration_minutes,
        taskTitle: s.task_title || undefined,
        mode: (s.mode as FocusSession['mode']) || 'pomodoro',
        completedAt: s.completed_at,
        soundscape: s.soundscape || undefined,
        focusQuality: s.focus_quality || undefined,
      }));

      setFocusSessions(mapped);
      storage.set(mapped);
    } catch (err: any) {
      console.error('Error fetching focus sessions from Supabase:', err);
      setError(err.message || 'Failed to load focus sessions.');
      const saved = storage.get();
      if (saved && Array.isArray(saved)) {
        setFocusSessions(saved);
      }
    } finally {
      setLoading(false);
    }
  }, [user, storage]);

  // Instantly load cached focus sessions when storage key resolves to eliminate latency
  useEffect(() => {
    const saved = storage.get();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setFocusSessions(saved);
    }
  }, [storage.key]);

  useEffect(() => {
    fetchFocusSessions();
  }, [fetchFocusSessions]);

  // Persist write-through cache with strict user isolation
  useEffect(() => {
    if (focusSessions.length > 0 || !loading) {
      storage.set(focusSessions);
    }
  }, [focusSessions, storage, loading]);

  // Log a new completed Focus Session (Optimistic UI)
  const addFocusSession = async (
    durationMinutes: number,
    taskTitle?: string,
    mode: FocusSession['mode'] = 'pomodoro',
    soundscape?: string,
    focusQuality?: 'high_flow' | 'moderate' | 'distracted'
  ) => {
    const tempId = `f-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newSession: FocusSession = {
      id: tempId,
      durationMinutes,
      taskTitle,
      mode,
      completedAt: nowIso,
      soundscape,
      focusQuality,
    };

    // Optimistic state update
    setFocusSessions((prev) => [newSession, ...prev]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isOffline) {
        syncQueue.enqueue(
          {
            type: 'focus_session_add',
            table: 'focus_sessions',
            payload: {
              duration_minutes: durationMinutes,
              task_title: taskTitle || null,
              mode,
              soundscape: soundscape || null,
              focus_quality: focusQuality || null,
              completed_at: nowIso,
            },
          },
          user.id,
          isDemo
        );
        return newSession;
      }

      try {
        const { data, error } = await supabase
          .from('focus_sessions')
          .insert({
            user_id: user.id,
            duration_minutes: durationMinutes,
            task_title: taskTitle || null,
            mode,
            soundscape: soundscape || null,
            focus_quality: focusQuality || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setFocusSessions((prev) =>
            prev.map((s) => (s.id === tempId ? { ...s, id: data.id } : s))
          );
        }
      } catch (err: any) {
        console.warn('Network error logging focus session, enqueuing for sync:', err);
        syncQueue.enqueue(
          {
            type: 'focus_session_add',
            table: 'focus_sessions',
            payload: {
              duration_minutes: durationMinutes,
              task_title: taskTitle || null,
              mode,
              soundscape: soundscape || null,
              focus_quality: focusQuality || null,
              completed_at: nowIso,
            },
          },
          user.id,
          isDemo
        );
      }
    }

    return newSession;
  };

  // Delete a focus session (e.g. accidentally logged or inaccurate)
  const deleteFocusSession = async (id: string) => {
    // Optimistic UI update
    setFocusSessions((prev) => prev.filter((s) => s.id !== id));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error: dbError } = await supabase
          .from('focus_sessions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (dbError) throw dbError;
      } catch (err: any) {
        console.error('Error deleting focus session from Supabase:', err);
        setError(err.message || 'Failed to remove focus session.');
      }
    }
  };

  // Calculate today's total focus minutes
  const todayStr = getLocalDateString();
  const totalFocusMinutesToday = focusSessions
    .filter((s) => s.completedAt && s.completedAt.startsWith(todayStr))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    focusSessions,
    loading,
    error,
    addFocusSession,
    deleteFocusSession,
    totalFocusMinutesToday,
    refreshFocusSessions: fetchFocusSessions,
  };
}

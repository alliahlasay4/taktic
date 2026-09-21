import { useState, useEffect, useCallback } from 'react';
import { FocusSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_FOCUS_SESSIONS } from '../lib/mockData';

export function useFocusSessions() {
  const { user, isDemo } = useAuth();
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch focus sessions from Supabase or LocalStorage
  const fetchFocusSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo mode or unconfigured -> LocalStorage
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const saved = localStorage.getItem('taktic_focus_sessions');
      setFocusSessions(saved ? JSON.parse(saved) : INITIAL_FOCUS_SESSIONS);
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
    } catch (err: any) {
      console.error('Error fetching focus sessions from Supabase:', err);
      setError(err.message || 'Failed to load focus sessions.');
      const saved = localStorage.getItem('taktic_focus_sessions');
      setFocusSessions(saved ? JSON.parse(saved) : INITIAL_FOCUS_SESSIONS);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchFocusSessions();
  }, [fetchFocusSessions]);

  // Persist to LocalStorage in Demo Mode
  useEffect(() => {
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      localStorage.setItem('taktic_focus_sessions', JSON.stringify(focusSessions));
    }
  }, [focusSessions, isDemo, user]);

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
        console.error('Error logging focus session to Supabase:', err);
        setError(err.message || 'Failed to save focus session to cloud.');
      }
    }

    return newSession;
  };

  // Calculate today's total focus minutes
  const todayStr = new Date().toISOString().split('T')[0];
  const totalFocusMinutesToday = focusSessions
    .filter((s) => s.completedAt && s.completedAt.startsWith(todayStr))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    focusSessions,
    loading,
    error,
    addFocusSession,
    totalFocusMinutesToday,
    refreshFocusSessions: fetchFocusSessions,
  };
}

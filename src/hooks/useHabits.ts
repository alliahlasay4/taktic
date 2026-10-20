import { useState, useEffect, useCallback, useMemo } from 'react';
import { Habit } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_HABITS } from '../lib/mockData';
import { calculateConsecutiveStreak, getLocalDateString } from '../lib/streak';
import { createScopedStorage } from '../lib/storage';

export function useHabits() {
  const { user, isDemo } = useAuth();

  const storage = useMemo(() => createScopedStorage<Habit[]>('habits', user?.id, isDemo), [user?.id, isDemo]);

  const [habits, setHabits] = useState<Habit[]>(() => {
    const fallback = isDemo ? INITIAL_HABITS : [];
    const raw = storage.get(fallback) || fallback;
    return raw.map((h) => ({
      ...h,
      streak: calculateConsecutiveStreak(h.completedDates, h.freezeShieldsRemaining),
    }));
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch habits from Supabase or LocalStorage
  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo Mode -> Scoped storage
    if (storage.isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const loaded = storage.get(INITIAL_HABITS) || INITIAL_HABITS;
      setHabits(
        loaded.map((h) => ({
          ...h,
          streak: calculateConsecutiveStreak(h.completedDates, h.freezeShieldsRemaining),
        }))
      );
      setLoading(false);
      return;
    }

    try {
      // 1 & 2. Fetch habits and habit logs concurrently in parallel
      const [
        { data: dbHabits, error: habitError },
        { data: dbLogs, error: logError },
      ] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_logs')
          .select('habit_id, completed_date')
          .eq('user_id', user.id),
      ]);

      if (habitError) throw habitError;
      if (logError) throw logError;

      // Category Icon Map Fallback
      const CATEGORY_ICONS: Record<string, string> = {
        health: '💧',
        mindset: '📚',
        fitness: '🌅',
        creative: '✍️',
        growth: '🌱',
      };

      // Map to frontend Habit type with dynamically computed streak
      const mapped: Habit[] = (dbHabits || []).map((h) => {
        const logsForHabit = (dbLogs || [])
          .filter((l) => l.habit_id === h.id)
          .map((l) => l.completed_date);

        const categoryKey = (h.category || 'wellness') as Habit['category'];
        const freezeShields = h.freeze_shields !== undefined && h.freeze_shields !== null ? h.freeze_shields : 3;
        const computedStreak = calculateConsecutiveStreak(logsForHabit, freezeShields);

        return {
          id: h.id,
          title: h.title,
          category: CATEGORY_ICONS[categoryKey] ? categoryKey : 'health',
          icon: CATEGORY_ICONS[categoryKey] || '✨',
          streak: computedStreak,
          completedDates: logsForHabit,
          frequency: (h.target_days_per_week && h.target_days_per_week < 7) ? 'weekly' : 'daily',
          targetDaysPerWeek: h.target_days_per_week || 7,
          timeOfDay: (h.time_of_day as Habit['timeOfDay']) || 'morning',
          freezeShieldsRemaining: freezeShields,
          createdAt: h.created_at ? h.created_at.split('T')[0] : getLocalDateString(),
        };
      });

      setHabits(mapped);
      storage.set(mapped);
    } catch (err: any) {
      console.error('Error fetching habits from Supabase:', err);
      setError(err.message || 'Failed to fetch habits from database.');
      const saved = storage.get();
      if (saved && Array.isArray(saved)) {
        setHabits(
          saved.map((h) => ({
            ...h,
            streak: calculateConsecutiveStreak(h.completedDates, h.freezeShieldsRemaining),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user, storage]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Save to Scoped Storage with user isolation
  useEffect(() => {
    storage.set(habits);
  }, [habits, storage]);

  // Toggle Habit Completion (Optimistic UI with Dynamic Streak Evaluation)
  const toggleHabit = async (id: string) => {
    const today = getLocalDateString();
    const habitToToggle = habits.find((h) => h.id === id);
    if (!habitToToggle) return;

    const isDone = habitToToggle.completedDates.includes(today);
    const newDates = isDone
      ? habitToToggle.completedDates.filter((d) => d !== today)
      : [...habitToToggle.completedDates, today];
    const newStreak = calculateConsecutiveStreak(newDates, habitToToggle.freezeShieldsRemaining ?? 3);

    // 1. Optimistic Update
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completedDates: newDates, streak: newStreak } : h))
    );

    // 2. Supabase DB Persistence
    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        if (isDone) {
          // Remove completion log
          await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', id)
            .eq('completed_date', today)
            .eq('user_id', user.id);
        } else {
          // Add completion log
          await supabase
            .from('habit_logs')
            .insert({ habit_id: id, user_id: user.id, completed_date: today });
        }

        // Update streak in habits table
        await supabase
          .from('habits')
          .update({ streak: newStreak })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error persisting habit toggle:', err);
        // Revert on error
        setHabits((prev) =>
          prev.map((h) =>
            h.id === id
              ? { ...h, completedDates: habitToToggle.completedDates, streak: habitToToggle.streak }
              : h
          )
        );
      }
    }
  };

  // Add Habit
  const addHabit = async (
    newHabitData: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>
  ) => {
    const tempId = `habit-${Date.now()}`;
    const today = getLocalDateString();

    const tempHabit: Habit = {
      ...newHabitData,
      id: tempId,
      streak: 0,
      completedDates: [],
      freezeShieldsRemaining: 3,
      createdAt: today,
    };

    // Optimistic Update
    setHabits((prev) => [tempHabit, ...prev]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { data, error } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            title: newHabitData.title,
            category: newHabitData.category || 'wellness',
            time_of_day: newHabitData.timeOfDay || 'morning',
            target_days_per_week: newHabitData.targetDaysPerWeek || 7,
            freeze_shields: 3,
            streak: 0,
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temp ID with real DB ID
        if (data) {
          setHabits((prev) =>
            prev.map((h) => (h.id === tempId ? { ...h, id: data.id } : h))
          );
        }
      } catch (err: any) {
        console.error('Error creating habit in Supabase:', err);
        setError(err.message || 'Failed to save habit to database.');
        // Remove temp habit on error
        setHabits((prev) => prev.filter((h) => h.id !== tempId));
      }
    }
  };

  // Delete Habit
  const deleteHabit = async (id: string) => {
    const previousHabits = [...habits];

    // Optimistic Delete
    setHabits((prev) => prev.filter((h) => h.id !== id));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error deleting habit in Supabase:', err);
        setError(err.message || 'Failed to delete habit from database.');
        // Revert on error
        setHabits(previousHabits);
      }
    }
  };

  // Calculate overall maximum active streak across user habits
  const overallStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);


  return {
    habits,
    overallStreak,
    loading,
    error,
    addHabit,
    toggleHabit,
    deleteHabit,
    refreshHabits: fetchHabits,
  };
}

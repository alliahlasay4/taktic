import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { Habit } from '../types';

import { getLocalDateString, getDateWithOffset } from '../lib/streak';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Habit Archiving & Vault Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('taktic_demo_mode', 'true');
  });

  it('correctly archives a habit and excludes it from overall streak calculation', async () => {
    const today = getLocalDateString();
    const yesterday = getDateWithOffset(today, -1);
    const twoDaysAgo = getDateWithOffset(today, -2);

    const seededHabits: Habit[] = [
      {
        id: 'habit-1',
        title: 'Morning Yoga',
        category: 'fitness',
        icon: 'activity',
        streak: 3,
        completedDates: [today, yesterday, twoDaysAgo],
        frequency: 'daily',
        targetDaysPerWeek: 7,
        createdAt: '2026-10-01',
      },
      {
        id: 'habit-2',
        title: 'Daily Meditation',
        category: 'mindset',
        icon: 'heart',
        streak: 1,
        completedDates: [today],
        frequency: 'daily',
        targetDaysPerWeek: 7,
        createdAt: '2026-10-15',
      },
    ];

    window.sessionStorage.setItem('taktic_demo_habits', JSON.stringify(seededHabits));

    const { result } = renderHook(() => useHabits(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.overallStreak).toBe(3);

    // Archive habit-1 (which has streak 3)
    await act(async () => {
      await result.current.archiveHabit('habit-1');
    });

    const habit1 = result.current.habits.find((h) => h.id === 'habit-1');
    expect(habit1?.archived).toBe(true);
    expect(habit1?.archivedAt).toBeDefined();

    // Overall streak should now be driven by habit-2 (streak 1), ignoring archived habit-1
    expect(result.current.overallStreak).toBe(1);

    // Unarchive habit-1
    await act(async () => {
      await result.current.unarchiveHabit('habit-1');
    });

    const unarchivedHabit1 = result.current.habits.find((h) => h.id === 'habit-1');
    expect(unarchivedHabit1?.archived).toBe(false);
    expect(unarchivedHabit1?.archivedAt).toBeUndefined();
    expect(result.current.overallStreak).toBe(3);
  });

  it('supports batch unarchiving and batch deletion of habits', async () => {
    const seededHabits: Habit[] = [
      {
        id: 'h-1',
        title: 'Deep Work',
        category: 'growth',
        icon: 'target',
        streak: 8,
        completedDates: [],
        frequency: 'daily',
        targetDaysPerWeek: 5,
        createdAt: '2026-09-01',
        archived: true,
        archivedAt: '2026-10-01',
      },
      {
        id: 'h-2',
        title: 'Cold Shower',
        category: 'health',
        icon: 'droplet',
        streak: 3,
        completedDates: [],
        frequency: 'daily',
        targetDaysPerWeek: 7,
        createdAt: '2026-09-10',
        archived: true,
        archivedAt: '2026-10-05',
      },
    ];

    window.sessionStorage.setItem('taktic_demo_habits', JSON.stringify(seededHabits));

    const { result } = renderHook(() => useHabits(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.habits.filter((h) => h.archived).length).toBe(2);

    // Batch unarchive both
    await act(async () => {
      await result.current.batchUnarchiveHabits(['h-1', 'h-2']);
    });

    expect(result.current.habits.filter((h) => h.archived).length).toBe(0);

    // Batch delete h-1
    await act(async () => {
      await result.current.batchDeleteHabits(['h-1']);
    });

    expect(result.current.habits.find((h) => h.id === 'h-1')).toBeUndefined();
    expect(result.current.habits.find((h) => h.id === 'h-2')).toBeDefined();
  });
});

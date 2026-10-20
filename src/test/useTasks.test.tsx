import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types';
import { getLocalDateString, getDateWithOffset } from '../lib/streak';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useTasks Hook & Core Journey Business Logic', () => {
  const todayStr = getLocalDateString();

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    // Enable demo mode
    window.localStorage.setItem('taktic_demo_mode', 'true');
  });

  it('initializes tasks in demo mode from scoped storage', async () => {
    // Seed initial clean tasks list in demo storage
    const seededTasks: Task[] = [
      {
        id: 'task-seed-1',
        title: 'Initial Seed Task',
        priority: 'medium',
        tags: [],
        dueDate: '2026-10-08',
        completed: false,
        isTodayFocus: false,
        timeBlock: null,
      },
    ];
    window.sessionStorage.setItem('taktic_demo_tasks', JSON.stringify(seededTasks));

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.tasks[0].title).toBe('Initial Seed Task');
  });

  it('enforces the 5-task active Today Focus capacity limit', async () => {
    // Start with empty tasks in demo storage
    window.sessionStorage.setItem('taktic_demo_tasks', JSON.stringify([]));

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 1. Add 5 tasks with isTodayFocus = true
    for (let i = 1; i <= 5; i++) {
      await act(async () => {
        await result.current.addTask({
          title: `Focus Task ${i}`,
          priority: 'high',
          tags: ['focus'],
          isTodayFocus: true,
          timeBlock: 'morning',
        });
      });
    }

    const activeFocusTasks = result.current.tasks.filter((t) => t.isTodayFocus && !t.completed);
    expect(activeFocusTasks.length).toBe(5);

    // 2. Add a 6th unfocused task
    await act(async () => {
      await result.current.addTask({
        title: 'Overflow Unfocused Task',
        priority: 'low',
        tags: ['backlog'],
        isTodayFocus: false,
      });
    });

    const overflowTask = result.current.tasks.find((t) => t.title === 'Overflow Unfocused Task')!;
    expect(overflowTask).toBeDefined();

    // 3. Attempting to toggle focus on the 6th active task should be rejected with 'limit_reached'
    let toggleResult: { success: boolean; reason?: 'limit_reached' } = { success: false };
    await act(async () => {
      toggleResult = await result.current.toggleTodayFocus(overflowTask.id);
    });

    expect(toggleResult).toEqual({ success: false, reason: 'limit_reached' });

    // The task should remain NOT focused
    const updatedOverflowTask = result.current.tasks.find((t) => t.id === overflowTask.id)!;
    expect(updatedOverflowTask.isTodayFocus).toBe(false);

    // 4. Completing one of the 5 focus tasks frees up capacity
    const firstFocusTask = activeFocusTasks[0];
    await act(async () => {
      await result.current.toggleCompleteTask(firstFocusTask.id);
    });

    // Now promoting the 6th task should succeed
    await act(async () => {
      toggleResult = await result.current.toggleTodayFocus(overflowTask.id);
    });

    expect(toggleResult).toEqual({ success: true });
    const newlyFocused = result.current.tasks.find((t) => t.id === overflowTask.id)!;
    expect(newlyFocused.isTodayFocus).toBe(true);
  });

  it('clears isSomeday and sets dueDate to today when task is promoted to Today Focus', async () => {
    const somedayTask: Task = {
      id: 'someday-task-1',
      title: 'Someday Idea',
      priority: 'low',
      tags: [],
      completed: false,
      isTodayFocus: false,
      isSomeday: true,
    };
    window.sessionStorage.setItem('taktic_demo_tasks', JSON.stringify([somedayTask]));

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks[0].isSomeday).toBe(true);

    // Promote to focus
    await act(async () => {
      const res = await result.current.toggleTodayFocus('someday-task-1');
      expect(res.success).toBe(true);
    });

    const promoted = result.current.tasks.find((t) => t.id === 'someday-task-1')!;
    expect(promoted.isTodayFocus).toBe(true);
    expect(promoted.isSomeday).toBe(false);
    expect(promoted.dueDate).toBe(todayStr);
  });

  it('rolls over uncompleted overdue tasks to today', async () => {
    const overdueDate = getDateWithOffset(todayStr, -2);
    const futureDate = getDateWithOffset(todayStr, 7);

    const overdueTasks: Task[] = [
      {
        id: 'overdue-1',
        title: 'Task from 2 days ago',
        priority: 'high',
        tags: [],
        dueDate: overdueDate,
        completed: false,
        isTodayFocus: false,
      },
      {
        id: 'already-done-overdue',
        title: 'Completed old task',
        priority: 'low',
        tags: [],
        dueDate: overdueDate,
        completed: true,
        isTodayFocus: false,
      },
      {
        id: 'future-task',
        title: 'Future task',
        priority: 'medium',
        tags: [],
        dueDate: futureDate,
        completed: false,
        isTodayFocus: false,
      },
    ];
    window.sessionStorage.setItem('taktic_demo_tasks', JSON.stringify(overdueTasks));

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Execute rollover
    await act(async () => {
      await result.current.rolloverOverdueTasksToToday();
    });

    const updatedOverdue1 = result.current.tasks.find((t) => t.id === 'overdue-1')!;
    expect(updatedOverdue1.dueDate).toBe(todayStr);

    // Completed task dueDate should not be modified
    const completedTask = result.current.tasks.find((t) => t.id === 'already-done-overdue')!;
    expect(completedTask.dueDate).toBe(overdueDate);

    // Future task should not be touched
    const futureTask = result.current.tasks.find((t) => t.id === 'future-task')!;
    expect(futureTask.dueDate).toBe(futureDate);
  });
});

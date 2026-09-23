import { useState, useEffect, useCallback } from 'react';
import { Task, TimeBlockSlot, PriorityLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_TASKS } from '../lib/mockData';

export function useTasks() {
  const { user, isDemo } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from Supabase or LocalStorage
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo mode or unconfigured -> LocalStorage
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const saved = localStorage.getItem('taktic_tasks');
      setTasks(saved ? JSON.parse(saved) : INITIAL_TASKS);
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      const mapped: Task[] = (data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        priority: (t.priority as PriorityLevel) || 'medium',
        tags: t.tags || [],
        dueDate: t.due_date || undefined,
        completed: t.completed || false,
        isTodayFocus: t.is_today_focus || false,
        timeBlock: (t.time_block as TimeBlockSlot) || null,
        estimatedMinutes: t.estimated_minutes || undefined,
        completedAt: t.completed_at || undefined,
        isSomeday: t.is_someday || false,
        recurring: t.recurring || null,
        archived: t.archived || false,
        archivedAt: t.archived_at || undefined,
      }));

      setTasks(mapped);
    } catch (err: any) {
      console.error('Error fetching tasks from Supabase:', err);
      setError(err.message || 'Failed to fetch tasks.');
      const saved = localStorage.getItem('taktic_tasks');
      setTasks(saved ? JSON.parse(saved) : INITIAL_TASKS);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Always write-through cache to LocalStorage for offline support
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('taktic_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Helper to ensure clean date formatting for Postgres
  const formatDueDateForDb = (dateStr?: string) => {
    if (!dateStr) return null;
    const lower = dateStr.trim().toLowerCase();
    if (lower === 'today') return new Date().toISOString().split('T')[0];
    if (lower === 'tomorrow') return new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return dateStr;
  };

  // Add Task
  const addTask = async (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const tempId = `task-${Date.now()}`;
    const created: Task = {
      ...newTaskData,
      id: tempId,
      completed: false,
    };

    // Optimistic Update
    setTasks((prev) => [created, ...prev]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: newTaskData.title,
            description: newTaskData.description || null,
            priority: newTaskData.priority || 'medium',
            tags: newTaskData.tags || [],
            due_date: formatDueDateForDb(newTaskData.dueDate),
            completed: false,
            is_today_focus: newTaskData.isTodayFocus || false,
            time_block: newTaskData.timeBlock || null,
            estimated_minutes: newTaskData.estimatedMinutes || null,
            is_someday: newTaskData.isSomeday || false,
            recurring: newTaskData.recurring || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setTasks((prev) =>
            prev.map((t) => (t.id === tempId ? { ...t, id: data.id } : t))
          );
        }
      } catch (err: any) {
        console.error('Error creating task in Supabase:', err);
        setError(err.message || 'Failed to save task.');
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
      }
    }
  };

  // Toggle Task Completion
  const toggleCompleteTask = async (id: string) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    if (!taskToToggle) return;

    const nextCompleted = !taskToToggle.completed;
    const completedAtIso = nextCompleted ? new Date().toISOString() : undefined;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted, completedAt: completedAtIso } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            completed: nextCompleted,
            completed_at: completedAtIso || null,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error updating task completion in Supabase:', err);
        // Revert on error
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: taskToToggle.completed, completedAt: taskToToggle.completedAt } : t
          )
        );
      }
    }
  };

  // Toggle Today's Focus
  const toggleTodayFocus = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const nextFocus = !targetTask.isTodayFocus;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isTodayFocus: nextFocus } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ is_today_focus: nextFocus })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error updating task focus in Supabase:', err);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isTodayFocus: targetTask.isTodayFocus } : t))
        );
      }
    }
  };

  // Update Time Block Slot
  const updateTimeBlock = async (id: string, slot: TimeBlockSlot) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, timeBlock: slot } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ time_block: slot })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error updating task timeblock in Supabase:', err);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, timeBlock: targetTask.timeBlock } : t))
        );
      }
    }
  };

  // Update Task (Full Field Editing)
  const updateTask = async (id: string, updatedFields: Partial<Task>) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const updated: Task = { ...targetTask, ...updatedFields };

    // Optimistic Update
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const dbPayload: Record<string, any> = {};
        if (updatedFields.title !== undefined) dbPayload.title = updatedFields.title;
        if (updatedFields.description !== undefined) dbPayload.description = updatedFields.description;
        if (updatedFields.priority !== undefined) dbPayload.priority = updatedFields.priority;
        if (updatedFields.tags !== undefined) dbPayload.tags = updatedFields.tags;
        if (updatedFields.timeBlock !== undefined) dbPayload.time_block = updatedFields.timeBlock;
        if (updatedFields.estimatedMinutes !== undefined) dbPayload.estimated_minutes = updatedFields.estimatedMinutes;
        if (updatedFields.isTodayFocus !== undefined) dbPayload.is_today_focus = updatedFields.isTodayFocus;
        if (updatedFields.dueDate !== undefined) dbPayload.due_date = formatDueDateForDb(updatedFields.dueDate);
        if (updatedFields.completed !== undefined) dbPayload.completed = updatedFields.completed;
        if (updatedFields.isSomeday !== undefined) dbPayload.is_someday = updatedFields.isSomeday;
        if (updatedFields.recurring !== undefined) dbPayload.recurring = updatedFields.recurring;
        if (updatedFields.archived !== undefined) dbPayload.archived = updatedFields.archived;
        if (updatedFields.archivedAt !== undefined) dbPayload.archived_at = updatedFields.archivedAt;

        const { error } = await supabase
          .from('tasks')
          .update(dbPayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error updating task in Supabase:', err);
        setError(err.message || 'Failed to update task.');
        // Revert on error
        setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
      }
    }
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    const previousTasks = [...tasks];

    // Optimistic Delete
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error deleting task in Supabase:', err);
        setError(err.message || 'Failed to delete task.');
        setTasks(previousTasks);
      }
    }
  };

  // Archive a single task
  const archiveTask = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: true, archivedAt: nowIso } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .update({ archived: true, archived_at: nowIso })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error archiving task in Supabase:', err);
        setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
      }
    }
  };

  // Unarchive / Restore a task
  const unarchiveTask = async (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: false, archivedAt: undefined } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .update({ archived: false, archived_at: null })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error unarchiving task in Supabase:', err);
        setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
      }
    }
  };

  // Sweep all completed unarchived tasks to Archive
  const sweepCompletedTasks = async () => {
    const completedUnarchived = tasks.filter((t) => t.completed && !t.archived);
    if (completedUnarchived.length === 0) return;

    const ids = completedUnarchived.map((t) => t.id);
    const nowIso = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, archived: true, archivedAt: nowIso } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .update({ archived: true, archived_at: nowIso })
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error sweeping completed tasks in Supabase:', err);
        fetchTasks();
      }
    }
  };

  // Batch Archive Multiple Tasks
  const batchArchiveTasks = async (ids: string[]) => {
    if (ids.length === 0) return;
    const nowIso = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, archived: true, archivedAt: nowIso } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .update({ archived: true, archived_at: nowIso })
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error batch archiving tasks in Supabase:', err);
        fetchTasks();
      }
    }
  };

  // Batch Unarchive Multiple Tasks
  const batchUnarchiveTasks = async (ids: string[]) => {
    if (ids.length === 0) return;

    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, archived: false, archivedAt: undefined } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .update({ archived: false, archived_at: null })
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error batch unarchiving tasks in Supabase:', err);
        fetchTasks();
      }
    }
  };

  // Batch Delete Multiple Tasks
  const batchDeleteTasks = async (ids: string[]) => {
    if (ids.length === 0) return;
    const previousTasks = [...tasks];

    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('tasks')
          .delete()
          .in('id', ids)
          .eq('user_id', user.id);
      } catch (err: any) {
        console.error('Error batch deleting tasks in Supabase:', err);
        setTasks(previousTasks);
      }
    }
  };

  // Rollover Overdue Tasks to Today
  const rolloverOverdueTasksToToday = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find uncompleted overdue tasks
    const overdueTasks = tasks.filter((t) => {
      if (t.completed || t.archived || !t.dueDate) return false;
      const lower = t.dueDate.trim().toLowerCase();
      if (lower === 'today') return false;
      if (lower === 'tomorrow') return false;
      return t.dueDate < todayStr;
    });

    if (overdueTasks.length === 0) return;

    const overdueIds = overdueTasks.map((t) => t.id);

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (overdueIds.includes(t.id) ? { ...t, dueDate: todayStr } : t))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ due_date: todayStr })
          .in('id', overdueIds)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Error rolling over overdue tasks in Supabase:', err);
        setError(err.message || 'Failed to rollover overdue tasks.');
        fetchTasks(); // Reload on error
      }
    }
  };

  return {
    tasks,
    activeTasks: tasks.filter((t) => !t.archived),
    archivedTasks: tasks.filter((t) => t.archived),
    loading,
    error,
    addTask,
    toggleCompleteTask,
    toggleTodayFocus,
    updateTimeBlock,
    updateTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    sweepCompletedTasks,
    batchArchiveTasks,
    batchUnarchiveTasks,
    batchDeleteTasks,
    rolloverOverdueTasksToToday,
    refreshTasks: fetchTasks,
  };
}



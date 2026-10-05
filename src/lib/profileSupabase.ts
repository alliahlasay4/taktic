import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, HeatmapDay, Badge } from '../types';

export const fetchUserProfileFromSupabase = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !userId || userId === 'demo-user-123') return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    const rawPrivacy = data.privacy_settings;
    const dbPrivacy = typeof rawPrivacy === 'string'
      ? (() => { try { return JSON.parse(rawPrivacy); } catch { return {}; } })()
      : (rawPrivacy || {});

    return {
      id: data.id,
      fullName: data.full_name || 'Taktic Member',
      username: data.username || `@${(data.full_name || 'member').toLowerCase().replace(/\s+/g, '')}`,
      avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: data.bio || '',
      microGoal: data.micro_goal || '',
      statusMessage: data.status_message || '',
      timezone: data.timezone || 'GMT+8 (Asia/Manila)',
      workHoursStart: data.work_hours_start || '09:00',
      workHoursEnd: data.work_hours_end || '17:00',
      favoriteSoundscape: data.favorite_soundscape || 'Gentle Rain',
      privacySettings: {
        showFocusHours: dbPrivacy.showFocusHours !== false,
        showMicroGoal: dbPrivacy.showMicroGoal !== false,
        showActivityFeed: dbPrivacy.showActivityFeed !== false,
        showStreak: dbPrivacy.showStreak !== false,
        isIncognito: Boolean(dbPrivacy.isIncognito),
      },
    };
  } catch (err) {
    console.error('Error fetching user profile from Supabase:', err);
    return null;
  }
};

export const saveUserProfileToSupabase = async (
  profile: UserProfile,
  fallbackUserId?: string
): Promise<{ error: Error | null }> => {
  const targetId = (profile.id && profile.id !== 'demo-user-123') ? profile.id : fallbackUserId;
  if (!isSupabaseConfigured || !targetId || targetId === 'demo-user-123') {
    return { error: null };
  }

  try {
    const rawPrivacy = profile.privacySettings || {};
    const normalizedPrivacy = {
      showFocusHours: rawPrivacy.showFocusHours !== false,
      showMicroGoal: rawPrivacy.showMicroGoal !== false,
      showActivityFeed: rawPrivacy.showActivityFeed !== false,
      showStreak: rawPrivacy.showStreak !== false,
      isIncognito: Boolean(rawPrivacy.isIncognito),
    };

    const payload: Record<string, any> = {
      id: targetId,
      full_name: profile.fullName,
      username: profile.username,
      avatar_url: profile.avatarUrl,
      bio: profile.bio || '',
      micro_goal: profile.microGoal || '',
      status_message: profile.statusMessage || '',
      timezone: profile.timezone || 'GMT+8 (Asia/Manila)',
      work_hours_start: profile.workHoursStart || '09:00',
      work_hours_end: profile.workHoursEnd || '17:00',
      favorite_soundscape: profile.favoriteSoundscape || 'Gentle Rain',
      privacy_settings: normalizedPrivacy,
    };

    // 1. Try direct UPDATE on profiles table
    const { data: updateData, error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: profile.fullName,
        username: profile.username,
        avatar_url: profile.avatarUrl,
        bio: profile.bio || '',
        micro_goal: profile.microGoal || '',
        status_message: profile.statusMessage || '',
        timezone: profile.timezone || 'GMT+8 (Asia/Manila)',
        work_hours_start: profile.workHoursStart || '09:00',
        work_hours_end: profile.workHoursEnd || '17:00',
        favorite_soundscape: profile.favoriteSoundscape || 'Gentle Rain',
        privacy_settings: normalizedPrivacy,
      })
      .eq('id', targetId)
      .select();

    if (!updateErr && updateData && updateData.length > 0) {
      return { error: null };
    }

    // 2. If update didn't match a row or errored, try UPSERT with email included
    const authUser = (await supabase.auth.getUser())?.data?.user;
    if (authUser?.email) {
      payload.email = authUser.email;
    }

    const { error: upsertErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (upsertErr) {
      console.error('Supabase profile save error:', upsertErr);
      return { error: new Error(upsertErr.message) };
    }
    return { error: null };
  } catch (err: any) {
    console.error('Error saving user profile to Supabase:', err);
    return { error: err };
  }
};

import { calculateGlobalActivityStreak } from './streak';

export interface RealProfileStats {
  totalFocusHours: number;
  totalFocusSessions: number;
  completedHabitsCount: number;
  currentStreak: number;
  ringsRatePercent: number;
}

export const fetchProfileStatsFromSupabase = async (userId: string): Promise<RealProfileStats> => {
  if (!isSupabaseConfigured || !userId || userId === 'demo-user-123') {
    return {
      totalFocusHours: 34.5,
      totalFocusSessions: 14,
      completedHabitsCount: 68,
      currentStreak: 7,
      ringsRatePercent: 88,
    };
  }

  try {
    // 1. Fetch total focus sessions & sum duration
    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', userId);

    const totalMinutes = focusSessions
      ? focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      : 0;
    const totalFocusHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalFocusSessions = focusSessions ? focusSessions.length : 0;

    // 2. Fetch completed habits logs
    const { data: habitLogs, count: habitLogsCount } = await supabase
      .from('habit_logs')
      .select('completed_date', { count: 'exact' })
      .eq('user_id', userId);

    // 3. Fetch completed tasks
    const { data: completedTasks, count: completedTasksCount } = await supabase
      .from('tasks')
      .select('completed_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('completed', true);

    // 4. Calculate authentic streak across all 3 core productivity pillars
    const focusDates = (focusSessions || [])
      .map((s) => (s.completed_at ? s.completed_at.split('T')[0] : ''))
      .filter(Boolean);
    const habitDates = (habitLogs || [])
      .map((l) => l.completed_date)
      .filter(Boolean);
    const taskDates = (completedTasks || [])
      .map((t) => (t.completed_at ? t.completed_at.split('T')[0] : ''))
      .filter(Boolean);

    const currentStreak = calculateGlobalActivityStreak(habitDates, focusDates, taskDates);

    // 5. Calculate consistency / ring completion rate over active days in the last 30 days
    const activeDatesLast30 = new Set<string>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    [...focusDates, ...habitDates, ...taskDates].forEach((d) => {
      if (d >= thirtyDaysAgoStr) {
        activeDatesLast30.add(d);
      }
    });

    const totalEvents = totalFocusSessions + (habitLogsCount || 0) + (completedTasksCount || 0);
    const ringsRatePercent = totalEvents === 0 ? 0 : Math.min(100, Math.round((activeDatesLast30.size / 30) * 100));

    // Persist computed streak to profiles table in background
    supabase
      .from('profiles')
      .update({ current_streak: currentStreak })
      .eq('id', userId)
      .then();

    return {
      totalFocusHours,
      totalFocusSessions,
      completedHabitsCount: habitLogsCount || 0,
      currentStreak,
      ringsRatePercent,
    };
  } catch (err) {
    console.error('Error fetching profile stats from Supabase:', err);
    return {
      totalFocusHours: 0,
      totalFocusSessions: 0,
      completedHabitsCount: 0,
      currentStreak: 0,
      ringsRatePercent: 0,
    };
  }
};

export const fetchProfileHeatmapFromSupabase = async (userId: string): Promise<HeatmapDay[]> => {
  const days: HeatmapDay[] = [];
  const today = new Date();
  const dateCounts: Record<string, number> = {};

  // Build last 28 days empty template
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dateCounts[dateStr] = 0;
  }

  if (!isSupabaseConfigured || !userId || userId === 'demo-user-123') {
    // Return sample heatmap
    Object.keys(dateCounts).forEach((dateStr, i) => {
      const level = (Math.floor(Math.sin(i * 0.7) * 2 + 2) % 5) as 0 | 1 | 2 | 3 | 4;
      days.push({
        date: dateStr,
        count: level * 2,
        level,
      });
    });
    return days;
  }

  try {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 28);
    const startDateStr = startDate.toISOString();

    // Query focus sessions in 28 days
    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', startDateStr);

    if (focusSessions) {
      focusSessions.forEach((session) => {
        const dateStr = session.completed_at.split('T')[0];
        if (dateCounts[dateStr] !== undefined) {
          dateCounts[dateStr] += 1;
        }
      });
    }

    // Query habit logs in 28 days
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('completed_date')
      .eq('user_id', userId)
      .gte('completed_date', startDate.toISOString().split('T')[0]);

    if (habitLogs) {
      habitLogs.forEach((log) => {
        const dateStr = log.completed_date;
        if (dateCounts[dateStr] !== undefined) {
          dateCounts[dateStr] += 1;
        }
      });
    }

    Object.entries(dateCounts).forEach(([dateStr, count]) => {
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 5) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      days.push({
        date: dateStr,
        count,
        level,
      });
    });

    return days;
  } catch (err) {
    console.error('Error fetching heatmap from Supabase:', err);
    return days;
  }
};

export const fetchBadgesWithRealProgress = async (
  userId: string,
  stats: RealProfileStats
): Promise<Badge[]> => {
  const todayStr = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'streak-3',
      title: 'Ignition Flame',
      description: 'Maintain a 3-day streak across tasks & habits.',
      icon: 'flame',
      category: 'streak',
      tier: 'bronze',
      currentProgress: Math.min(3, stats.currentStreak),
      targetProgress: 3,
      isUnlocked: stats.currentStreak >= 3,
      unlockedAt: stats.currentStreak >= 3 ? todayStr : undefined,
    },
    {
      id: 'streak-7',
      title: 'Unstoppable Momentum',
      description: 'Reach a 7-day streak of completing all daily focus rings.',
      icon: 'flame',
      category: 'streak',
      tier: 'silver',
      currentProgress: Math.min(7, stats.currentStreak),
      targetProgress: 7,
      isUnlocked: stats.currentStreak >= 7,
      unlockedAt: stats.currentStreak >= 7 ? todayStr : undefined,
    },
    {
      id: 'streak-30',
      title: 'Habit Centurion',
      description: 'Achieve a 30-day continuous productivity streak.',
      icon: 'flame',
      category: 'streak',
      tier: 'gold',
      currentProgress: Math.min(30, stats.currentStreak),
      targetProgress: 30,
      isUnlocked: stats.currentStreak >= 30,
      unlockedAt: stats.currentStreak >= 30 ? todayStr : undefined,
    },
    {
      id: 'focus-10',
      title: 'Deep Work Pioneer',
      description: 'Log 10 total hours of distraction-free focus sessions.',
      icon: 'clock',
      category: 'focus',
      tier: 'bronze',
      currentProgress: Math.min(10, Math.floor(stats.totalFocusHours)),
      targetProgress: 10,
      isUnlocked: stats.totalFocusHours >= 10,
      unlockedAt: stats.totalFocusHours >= 10 ? todayStr : undefined,
    },
    {
      id: 'focus-50',
      title: 'Flow State Master',
      description: 'Log 50 total hours of deep focus time.',
      icon: 'clock',
      category: 'focus',
      tier: 'gold',
      currentProgress: Math.min(50, Math.floor(stats.totalFocusHours)),
      targetProgress: 50,
      isUnlocked: stats.totalFocusHours >= 50,
      unlockedAt: stats.totalFocusHours >= 50 ? todayStr : undefined,
    },
    {
      id: 'habit-100',
      title: 'Habit Mastery',
      description: 'Complete 100 total habit check-ins.',
      icon: 'check',
      category: 'habit',
      tier: 'silver',
      currentProgress: Math.min(100, stats.completedHabitsCount),
      targetProgress: 100,
      isUnlocked: stats.completedHabitsCount >= 100,
      unlockedAt: stats.completedHabitsCount >= 100 ? todayStr : undefined,
    },
  ];
};

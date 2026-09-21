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
      privacySettings: data.privacy_settings || {
        showFocusHours: true,
        showMicroGoal: true,
        showActivityFeed: true,
        showStreak: true,
      },
    };
  } catch (err) {
    console.error('Error fetching user profile from Supabase:', err);
    return null;
  }
};

export const saveUserProfileToSupabase = async (profile: UserProfile): Promise<{ error: Error | null }> => {
  if (!isSupabaseConfigured || !profile.id || profile.id === 'demo-user-123') {
    return { error: null };
  }

  try {
    const payload = {
      id: profile.id,
      full_name: profile.fullName,
      username: profile.username,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      micro_goal: profile.microGoal,
      status_message: profile.statusMessage,
      timezone: profile.timezone,
      work_hours_start: profile.workHoursStart,
      work_hours_end: profile.workHoursEnd,
      favorite_soundscape: profile.favoriteSoundscape,
      privacy_settings: profile.privacySettings,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    return { error: error ? new Error(error.message) : null };
  } catch (err: any) {
    console.error('Error saving user profile to Supabase:', err);
    return { error: err };
  }
};

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
      .select('duration_minutes')
      .eq('user_id', userId);

    const totalMinutes = focusSessions
      ? focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      : 0;
    const totalFocusHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalFocusSessions = focusSessions ? focusSessions.length : 0;

    // 2. Fetch completed habits log count
    const { count: habitLogsCount } = await supabase
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 3. Fetch user streak from profile table
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('current_streak')
      .eq('id', userId)
      .maybeSingle();

    const currentStreak = profileRow?.current_streak || (totalFocusSessions > 0 ? 1 : 0);

    // 4. Calculate ring rate approximation based on completed tasks/focus
    const { count: completedTasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    const ringsRatePercent = Math.min(100, Math.max(50, Math.round(75 + (completedTasksCount || 0) * 2)));

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

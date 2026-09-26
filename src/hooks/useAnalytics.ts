import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type TimeHorizon = 'week' | 'month' | 'all';

export interface DailyFocusStat {
  day: string;
  minutes: number;
}

export interface CategoryDistributionStat {
  name: string;
  value: number;
  color: string;
}

export interface TimeOfDayStat {
  slot: string;
  minutes: number;
  color: string;
}

export interface FocusQualityStat {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export interface FocusSessionLog {
  id: string;
  durationMinutes: number;
  mode: string;
  quality: string;
  completedAt: string;
  taskTitle?: string;
}

export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  category: 'timing' | 'duration' | 'quality' | 'streak';
  metric: string;
}

const DEMO_WEEKLY_FOCUS: DailyFocusStat[] = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 90 },
  { day: 'Wed', minutes: 60 },
  { day: 'Thu', minutes: 120 },
  { day: 'Fri', minutes: 75 },
  { day: 'Sat', minutes: 30 },
  { day: 'Sun', minutes: 50 },
];

const DEMO_TIME_OF_DAY: TimeOfDayStat[] = [
  { slot: 'Morning', minutes: 210, color: 'var(--accent-warm-ochre)' },
  { slot: 'Afternoon', minutes: 160, color: 'var(--accent-terracotta)' },
  { slot: 'Evening', minutes: 100, color: 'var(--accent-botanical-sage)' },
];

const DEMO_QUALITY: FocusQualityStat[] = [
  { label: 'High Flow', count: 12, pct: 60, color: 'var(--accent-botanical-sage)' },
  { label: 'Steady Flow', count: 6, pct: 30, color: 'var(--accent-warm-ochre)' },
  { label: 'Distracted', count: 2, pct: 10, color: 'var(--accent-dusty-rose)' },
];

const DEMO_CATEGORY: CategoryDistributionStat[] = [
  { name: 'Deep Work', value: 50, color: 'var(--accent-terracotta)' },
  { name: 'Habits & Routines', value: 30, color: 'var(--accent-dusty-mauve)' },
  { name: 'Rest & Recovery', value: 20, color: 'var(--accent-warm-ochre)' },
];

const DEMO_SESSIONS: FocusSessionLog[] = [
  { id: '1', durationMinutes: 25, mode: 'pomodoro', quality: 'high_flow', completedAt: 'Today, 2:30 PM', taskTitle: 'Product Architecture Review' },
  { id: '2', durationMinutes: 50, mode: 'deepWork', quality: 'high_flow', completedAt: 'Today, 11:15 AM', taskTitle: 'Core Engine Refactor' },
  { id: '3', durationMinutes: 25, mode: 'pomodoro', quality: 'steady', completedAt: 'Yesterday, 4:00 PM', taskTitle: 'Database Schema Migration' },
  { id: '4', durationMinutes: 25, mode: 'pomodoro', quality: 'high_flow', completedAt: 'Yesterday, 10:00 AM', taskTitle: 'UX Flow Optimization' },
];

const EMPTY_DAYS: DailyFocusStat[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
  day,
  minutes: 0,
}));

const EMPTY_TIME_OF_DAY: TimeOfDayStat[] = [
  { slot: 'Morning', minutes: 0, color: 'var(--accent-warm-ochre)' },
  { slot: 'Afternoon', minutes: 0, color: 'var(--accent-terracotta)' },
  { slot: 'Evening', minutes: 0, color: 'var(--accent-botanical-sage)' },
];

const EMPTY_QUALITY: FocusQualityStat[] = [
  { label: 'High Flow', count: 0, pct: 0, color: 'var(--accent-botanical-sage)' },
  { label: 'Steady Flow', count: 0, pct: 0, color: 'var(--accent-warm-ochre)' },
  { label: 'Distracted', count: 0, pct: 0, color: 'var(--accent-dusty-rose)' },
];

const EMPTY_CATEGORY: CategoryDistributionStat[] = [
  { name: 'Deep Work', value: 0, color: 'var(--accent-terracotta)' },
  { name: 'Habits & Routines', value: 0, color: 'var(--accent-dusty-mauve)' },
  { name: 'Rest & Recovery', value: 0, color: 'var(--accent-warm-ochre)' },
];

export function useAnalytics() {
  const { user, isDemo } = useAuth();
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('week');
  const isRealUser = !isDemo && isSupabaseConfigured && Boolean(user) && user?.id !== 'demo-user-123';

  // Try to load cached user analytics to prevent any flash of false data
  const getCachedState = useCallback(() => {
    if (!isRealUser || !user?.id) return null;
    try {
      const cached = localStorage.getItem(`taktic_analytics_${user.id}_${timeHorizon}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }, [isRealUser, user?.id, timeHorizon]);

  const initialCache = useMemo(() => getCachedState(), [getCachedState]);

  const [weeklyFocusData, setWeeklyFocusData] = useState<DailyFocusStat[]>(() => {
    if (!isRealUser) return DEMO_WEEKLY_FOCUS;
    return initialCache?.weeklyFocusData || EMPTY_DAYS;
  });

  const [timeOfDayData, setTimeOfDayData] = useState<TimeOfDayStat[]>(() => {
    if (!isRealUser) return DEMO_TIME_OF_DAY;
    return initialCache?.timeOfDayData || EMPTY_TIME_OF_DAY;
  });

  const [qualityBreakdown, setQualityBreakdown] = useState<FocusQualityStat[]>(() => {
    if (!isRealUser) return DEMO_QUALITY;
    return initialCache?.qualityBreakdown || EMPTY_QUALITY;
  });

  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionStat[]>(() => {
    if (!isRealUser) return DEMO_CATEGORY;
    return initialCache?.categoryDistribution || EMPTY_CATEGORY;
  });

  const [recentSessions, setRecentSessions] = useState<FocusSessionLog[]>(() => {
    if (!isRealUser) return DEMO_SESSIONS;
    return initialCache?.recentSessions || [];
  });

  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState<number>(() => {
    if (!isRealUser) return 470;
    return initialCache?.totalWeeklyMinutes || 0;
  });

  const [avgSessionDuration, setAvgSessionDuration] = useState<number>(() => {
    if (!isRealUser) return 25;
    return initialCache?.avgSessionDuration || 0;
  });

  const [peakDay, setPeakDay] = useState<string>(() => {
    if (!isRealUser) return 'Thursday';
    return initialCache?.peakDay || 'None';
  });

  const [rhythmScore, setRhythmScore] = useState<number>(() => {
    if (!isRealUser) return 88;
    return initialCache?.rhythmScore || 0;
  });

  const [rhythmRankTitle, setRhythmRankTitle] = useState<string>(() => {
    if (!isRealUser) return 'Flow Architect';
    return initialCache?.rhythmRankTitle || 'Momentum Initiate';
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return isRealUser && !initialCache;
  });

  const fetchAnalytics = useCallback(async () => {
    if (!isRealUser || !user) {
      setWeeklyFocusData(DEMO_WEEKLY_FOCUS);
      setTimeOfDayData(DEMO_TIME_OF_DAY);
      setQualityBreakdown(DEMO_QUALITY);
      setCategoryDistribution(DEMO_CATEGORY);
      setRecentSessions(DEMO_SESSIONS);
      setTotalWeeklyMinutes(470);
      setAvgSessionDuration(25);
      setPeakDay('Thursday');
      setRhythmScore(88);
      setRhythmRankTitle('Flow Architect');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const cutoffDate = new Date();
      if (timeHorizon === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 6);
      } else if (timeHorizon === 'month') {
        cutoffDate.setDate(cutoffDate.getDate() - 29);
      } else {
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      }
      cutoffDate.setHours(0, 0, 0, 0);

      // 1. Fetch focus sessions from Supabase
      const { data: sessions, error: sessionsErr } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', cutoffDate.toISOString())
        .order('completed_at', { ascending: false });

      if (sessionsErr) throw sessionsErr;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const fullDayNames: Record<string, string> = {
        Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
      };
      const dayTotals: Record<string, number> = {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
      };

      let grandTotal = 0;
      let deepWorkMins = 0;
      let restMins = 0;
      let totalSessionsCount = 0;
      let totalDurationSum = 0;

      let morningMins = 0;
      let afternoonMins = 0;
      let eveningMins = 0;

      let highFlowCount = 0;
      let moderateCount = 0;
      let distractedCount = 0;

      const recentList: FocusSessionLog[] = [];

      (sessions || []).forEach((session, idx) => {
        const d = new Date(session.completed_at);
        const dayName = dayNames[d.getDay()];
        const mins = Number(session.duration_minutes) || 0;
        const hour = d.getHours();

        totalSessionsCount++;
        totalDurationSum += mins;

        if (dayTotals[dayName] !== undefined) {
          dayTotals[dayName] += mins;
        }
        grandTotal += mins;

        if (session.mode === 'shortBreak' || session.mode === 'longBreak') {
          restMins += mins;
        } else {
          deepWorkMins += mins;
        }

        // Time of Day
        if (hour >= 6 && hour < 12) {
          morningMins += mins;
        } else if (hour >= 12 && hour < 18) {
          afternoonMins += mins;
        } else {
          eveningMins += mins;
        }

        // Quality
        if (session.focus_quality === 'high_flow') {
          highFlowCount++;
        } else if (session.focus_quality === 'distracted') {
          distractedCount++;
        } else {
          moderateCount++;
        }

        // Recent logs (take first 6)
        if (idx < 6) {
          recentList.push({
            id: session.id || String(idx),
            durationMinutes: mins,
            mode: session.mode || 'pomodoro',
            quality: session.focus_quality || 'high_flow',
            completedAt: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
            taskTitle: session.task_title || undefined,
          });
        }
      });

      setRecentSessions(recentList);

      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedWeekly = orderedDays.map((day) => ({
        day,
        minutes: dayTotals[day] || 0,
      }));

      let maxDayMins = 0;
      let maxDayName = '';
      orderedDays.forEach((day) => {
        if ((dayTotals[day] || 0) > maxDayMins) {
          maxDayMins = dayTotals[day] || 0;
          maxDayName = day;
        }
      });

      setWeeklyFocusData(formattedWeekly);
      setTotalWeeklyMinutes(grandTotal);
      const calculatedAvg = totalSessionsCount > 0 ? Math.round(totalDurationSum / totalSessionsCount) : 0;
      setAvgSessionDuration(calculatedAvg);
      const calculatedPeakDay = maxDayName ? (fullDayNames[maxDayName] || 'None') : 'None';
      setPeakDay(calculatedPeakDay);

      const newTimeOfDay: TimeOfDayStat[] = [
        { slot: 'Morning', minutes: morningMins, color: 'var(--accent-warm-ochre)' },
        { slot: 'Afternoon', minutes: afternoonMins, color: 'var(--accent-terracotta)' },
        { slot: 'Evening', minutes: eveningMins, color: 'var(--accent-botanical-sage)' },
      ];
      setTimeOfDayData(newTimeOfDay);

      const totalQualityLogged = highFlowCount + moderateCount + distractedCount;
      const newQuality: FocusQualityStat[] = [
        {
          label: 'High Flow',
          count: highFlowCount,
          pct: totalQualityLogged > 0 ? Math.round((highFlowCount / totalQualityLogged) * 100) : 0,
          color: 'var(--accent-botanical-sage)',
        },
        {
          label: 'Steady Flow',
          count: moderateCount,
          pct: totalQualityLogged > 0 ? Math.round((moderateCount / totalQualityLogged) * 100) : 0,
          color: 'var(--accent-warm-ochre)',
        },
        {
          label: 'Distracted',
          count: distractedCount,
          pct: totalQualityLogged > 0 ? Math.round((distractedCount / totalQualityLogged) * 100) : 0,
          color: 'var(--accent-dusty-rose)',
        },
      ];
      setQualityBreakdown(newQuality);

      // 2. Fetch habit logs from Supabase
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', cutoffDate.toISOString().split('T')[0]);

      const habitCount = (habitLogs || []).length;
      const estimatedHabitMins = habitCount * 10;
      const overallTotal = deepWorkMins + restMins + estimatedHabitMins;
      const deepWorkPct = overallTotal > 0 ? Math.round((deepWorkMins / overallTotal) * 100) : 0;
      const habitPct = overallTotal > 0 ? Math.round((estimatedHabitMins / overallTotal) * 100) : 0;
      const restPct = overallTotal > 0 ? Math.max(0, 100 - deepWorkPct - habitPct) : 0;

      const newCategory: CategoryDistributionStat[] = [
        { name: 'Deep Work', value: deepWorkPct, color: 'var(--accent-terracotta)' },
        { name: 'Habits & Routines', value: habitPct, color: 'var(--accent-dusty-mauve)' },
        { name: 'Rest & Recovery', value: restPct, color: 'var(--accent-warm-ochre)' },
      ];
      setCategoryDistribution(newCategory);

      // 3. Rhythm Score calculation
      let calculatedScore = 0;
      let calculatedRank = 'Momentum Initiate';

      if (grandTotal > 0 || habitCount > 0) {
        const focusScore = Math.min(40, Math.round((grandTotal / 300) * 40));
        const habitScore = Math.min(30, Math.round((habitCount / 10) * 30));
        const flowRatio = totalQualityLogged > 0 ? highFlowCount / totalQualityLogged : 0.5;
        const qualityScore = Math.round(flowRatio * 30);

        calculatedScore = Math.min(100, Math.max(20, focusScore + habitScore + qualityScore));
        if (calculatedScore >= 90) calculatedRank = 'Flow Master';
        else if (calculatedScore >= 75) calculatedRank = 'Flow Architect';
        else if (calculatedScore >= 50) calculatedRank = 'Focus Builder';
      }

      setRhythmScore(calculatedScore);
      setRhythmRankTitle(calculatedRank);

      // Cache real user analytics
      try {
        localStorage.setItem(
          `taktic_analytics_${user.id}_${timeHorizon}`,
          JSON.stringify({
            weeklyFocusData: formattedWeekly,
            timeOfDayData: newTimeOfDay,
            qualityBreakdown: newQuality,
            categoryDistribution: newCategory,
            recentSessions: recentList,
            totalWeeklyMinutes: grandTotal,
            avgSessionDuration: calculatedAvg,
            peakDay: calculatedPeakDay,
            rhythmScore: calculatedScore,
            rhythmRankTitle: calculatedRank,
          })
        );
      } catch {}
    } catch (err: any) {
      console.error('Error fetching Supabase analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isRealUser, timeHorizon]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived smart insights
  const smartInsights: SmartInsight[] = useMemo(() => {
    const highestTimeSlot = [...timeOfDayData].sort((a, b) => b.minutes - a.minutes)[0];
    const highFlowPct = qualityBreakdown.find((q) => q.label === 'High Flow')?.pct || 0;

    if (totalWeeklyMinutes === 0 && recentSessions.length === 0) {
      return [
        {
          id: 'peak-window',
          title: 'Optimal Focus Window',
          description: 'Log your first deep work session to discover your peak productivity hours.',
          category: 'timing',
          metric: 'Pending Data',
        },
        {
          id: 'flow-consistency',
          title: 'Deep Flow Rate',
          description: 'Rate your focus flow at the end of sessions to uncover flow consistency.',
          category: 'quality',
          metric: '0% Flow',
        },
        {
          id: 'session-duration',
          title: 'Session Duration Cadence',
          description: 'Structured Pomodoro intervals help build sustainable focus stamina.',
          category: 'duration',
          metric: '25m blocks',
        },
      ];
    }

    return [
      {
        id: 'peak-window',
        title: 'Optimal Focus Window',
        description: highestTimeSlot && highestTimeSlot.minutes > 0
          ? `Your highest output occurs in the ${highestTimeSlot.slot.toLowerCase()} with ${highestTimeSlot.minutes} logged minutes.`
          : 'Log more sessions across the day to determine your peak energy window.',
        category: 'timing',
        metric: highestTimeSlot && highestTimeSlot.minutes > 0 ? highestTimeSlot.slot : 'Flexible',
      },
      {
        id: 'flow-consistency',
        title: 'Deep Flow Rate',
        description: `${highFlowPct}% of your completed sessions were rated as uninterrupted high flow state.`,
        category: 'quality',
        metric: `${highFlowPct}% Flow`,
      },
      {
        id: 'session-duration',
        title: 'Session Duration Cadence',
        description: `Your average focus duration is ${avgSessionDuration || 25} minutes with structured recovery intervals.`,
        category: 'duration',
        metric: `${avgSessionDuration || 25}m blocks`,
      },
    ];
  }, [timeOfDayData, qualityBreakdown, avgSessionDuration, totalWeeklyMinutes, recentSessions.length]);

  return {
    timeHorizon,
    setTimeHorizon,
    weeklyFocusData,
    timeOfDayData,
    qualityBreakdown,
    categoryDistribution,
    recentSessions,
    smartInsights,
    totalWeeklyMinutes,
    avgSessionDuration,
    peakDay,
    rhythmScore,
    rhythmRankTitle,
    loading,
    refreshAnalytics: fetchAnalytics,
  };
}

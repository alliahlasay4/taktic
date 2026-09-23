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

export function useAnalytics() {
  const { user, isDemo } = useAuth();
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('week');
  
  const [weeklyFocusData, setWeeklyFocusData] = useState<DailyFocusStat[]>([
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 90 },
    { day: 'Wed', minutes: 60 },
    { day: 'Thu', minutes: 120 },
    { day: 'Fri', minutes: 75 },
    { day: 'Sat', minutes: 30 },
    { day: 'Sun', minutes: 50 },
  ]);

  const [timeOfDayData, setTimeOfDayData] = useState<TimeOfDayStat[]>([
    { slot: 'Morning', minutes: 210, color: 'var(--accent-warm-ochre)' },
    { slot: 'Afternoon', minutes: 160, color: 'var(--accent-terracotta)' },
    { slot: 'Evening', minutes: 100, color: 'var(--accent-botanical-sage)' },
  ]);

  const [qualityBreakdown, setQualityBreakdown] = useState<FocusQualityStat[]>([
    { label: 'High Flow', count: 12, pct: 60, color: 'var(--accent-botanical-sage)' },
    { label: 'Steady Flow', count: 6, pct: 30, color: 'var(--accent-warm-ochre)' },
    { label: 'Distracted', count: 2, pct: 10, color: 'var(--accent-dusty-rose)' },
  ]);

  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionStat[]>([
    { name: 'Deep Work', value: 50, color: 'var(--accent-terracotta)' },
    { name: 'Habits & Routines', value: 30, color: 'var(--accent-dusty-mauve)' },
    { name: 'Rest & Recovery', value: 20, color: 'var(--accent-warm-ochre)' },
  ]);

  const [recentSessions, setRecentSessions] = useState<FocusSessionLog[]>([
    { id: '1', durationMinutes: 25, mode: 'pomodoro', quality: 'high_flow', completedAt: 'Today, 2:30 PM', taskTitle: 'Product Architecture Review' },
    { id: '2', durationMinutes: 50, mode: 'deepWork', quality: 'high_flow', completedAt: 'Today, 11:15 AM', taskTitle: 'Core Engine Refactor' },
    { id: '3', durationMinutes: 25, mode: 'pomodoro', quality: 'steady', completedAt: 'Yesterday, 4:00 PM', taskTitle: 'Database Schema Migration' },
    { id: '4', durationMinutes: 25, mode: 'pomodoro', quality: 'high_flow', completedAt: 'Yesterday, 10:00 AM', taskTitle: 'UX Flow Optimization' },
  ]);

  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState<number>(470);
  const [avgSessionDuration, setAvgSessionDuration] = useState<number>(25);
  const [peakDay, setPeakDay] = useState<string>('Thursday');
  const [rhythmScore, setRhythmScore] = useState<number>(88);
  const [rhythmRankTitle, setRhythmRankTitle] = useState<string>('Flow Architect');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      setLoading(false);
      return;
    }

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

      if (recentList.length > 0) {
        setRecentSessions(recentList);
      }

      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedWeekly = orderedDays.map((day) => ({
        day,
        minutes: dayTotals[day] || 0,
      }));

      let maxDayMins = -1;
      let maxDayName = 'Thu';
      orderedDays.forEach((day) => {
        if ((dayTotals[day] || 0) > maxDayMins) {
          maxDayMins = dayTotals[day] || 0;
          maxDayName = day;
        }
      });

      setWeeklyFocusData(formattedWeekly);
      setTotalWeeklyMinutes(grandTotal);
      setAvgSessionDuration(totalSessionsCount > 0 ? Math.round(totalDurationSum / totalSessionsCount) : 25);
      setPeakDay(fullDayNames[maxDayName] || 'Thursday');

      setTimeOfDayData([
        { slot: 'Morning', minutes: morningMins || 210, color: 'var(--accent-warm-ochre)' },
        { slot: 'Afternoon', minutes: afternoonMins || 160, color: 'var(--accent-terracotta)' },
        { slot: 'Evening', minutes: eveningMins || 100, color: 'var(--accent-botanical-sage)' },
      ]);

      const totalQualityLogged = Math.max(1, highFlowCount + moderateCount + distractedCount);
      setQualityBreakdown([
        { label: 'High Flow', count: highFlowCount || 12, pct: Math.round(((highFlowCount || 12) / Math.max(1, totalQualityLogged)) * 100), color: 'var(--accent-botanical-sage)' },
        { label: 'Steady Flow', count: moderateCount || 6, pct: Math.round(((moderateCount || 6) / Math.max(1, totalQualityLogged)) * 100), color: 'var(--accent-warm-ochre)' },
        { label: 'Distracted', count: distractedCount || 2, pct: Math.round(((distractedCount || 2) / Math.max(1, totalQualityLogged)) * 100), color: 'var(--accent-dusty-rose)' },
      ]);

      // Category distribution
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('completed_date', cutoffDate.toISOString().split('T')[0]);

      const habitCount = (habitLogs || []).length;
      const estimatedHabitMins = habitCount * 10;
      const overallTotal = Math.max(1, deepWorkMins + restMins + estimatedHabitMins);
      const deepWorkPct = Math.round((deepWorkMins / overallTotal) * 100) || 50;
      const habitPct = Math.round((estimatedHabitMins / overallTotal) * 100) || 30;
      const restPct = Math.max(0, 100 - deepWorkPct - habitPct);

      setCategoryDistribution([
        { name: 'Deep Work', value: deepWorkPct, color: 'var(--accent-terracotta)' },
        { name: 'Habits & Routines', value: habitPct, color: 'var(--accent-dusty-mauve)' },
        { name: 'Rest & Recovery', value: restPct, color: 'var(--accent-warm-ochre)' },
      ]);

      // Rhythm Score calculation
      const focusScore = Math.min(40, Math.round((grandTotal / 300) * 40));
      const habitScore = Math.min(30, Math.round((habitCount / 10) * 30));
      const flowRatio = (highFlowCount || 12) / Math.max(1, totalQualityLogged);
      const qualityScore = Math.round(flowRatio * 30) || 20;

      const score = Math.min(100, Math.max(60, focusScore + habitScore + qualityScore));
      setRhythmScore(score);

      if (score >= 90) setRhythmRankTitle('Flow Master');
      else if (score >= 75) setRhythmRankTitle('Flow Architect');
      else if (score >= 50) setRhythmRankTitle('Focus Builder');
      else setRhythmRankTitle('Momentum Initiate');

    } catch (err: any) {
      console.error('Error fetching Supabase analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, timeHorizon]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived smart insights
  const smartInsights: SmartInsight[] = useMemo(() => {
    const highestTimeSlot = [...timeOfDayData].sort((a, b) => b.minutes - a.minutes)[0];
    const highFlowPct = qualityBreakdown.find((q) => q.label === 'High Flow')?.pct || 60;

    return [
      {
        id: 'peak-window',
        title: 'Optimal Focus Window',
        description: `Your highest output occurs in the ${highestTimeSlot.slot.toLowerCase()} with ${highestTimeSlot.minutes} logged minutes.`,
        category: 'timing',
        metric: highestTimeSlot.slot,
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
        description: `Your optimal focus duration is ${avgSessionDuration} minutes with structured 5-minute recovery intervals.`,
        category: 'duration',
        metric: `${avgSessionDuration}m blocks`,
      },
    ];
  }, [timeOfDayData, qualityBreakdown, avgSessionDuration]);

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

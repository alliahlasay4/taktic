import { useState, useEffect, useCallback } from 'react';
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
    { slot: 'Morning 🌅', minutes: 210, color: '#CFA052' },
    { slot: 'Afternoon ☀️', minutes: 160, color: '#C06C4C' },
    { slot: 'Evening 🌙', minutes: 100, color: '#6B8E6E' },
  ]);

  const [qualityBreakdown, setQualityBreakdown] = useState<FocusQualityStat[]>([
    { label: 'High Flow ⚡', count: 12, pct: 60, color: '#6B8E6E' },
    { label: 'Moderate 😐', count: 6, pct: 30, color: '#CFA052' },
    { label: 'Distracted 🥱', count: 2, pct: 10, color: '#C06C4C' },
  ]);

  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionStat[]>([
    { name: 'Deep Work (Pomodoro)', value: 50, color: '#C06C4C' },
    { name: 'Habit Routines', value: 30, color: '#C87D87' },
    { name: 'Short / Long Rest', value: 20, color: '#CFA052' },
  ]);

  const [totalWeeklyMinutes, setTotalWeeklyMinutes] = useState<number>(470);
  const [avgSessionDuration, setAvgSessionDuration] = useState<number>(25);
  const [peakDay, setPeakDay] = useState<string>('Thu');
  const [rhythmScore, setRhythmScore] = useState<number>(88);
  const [rhythmRankTitle, setRhythmRankTitle] = useState<string>('Flow Architect');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);

    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      setLoading(false);
      return;
    }

    try {
      // Determine date cutoff based on time horizon
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
        .order('completed_at', { ascending: true });

      if (sessionsErr) throw sessionsErr;

      // 2. Map sessions to Day-of-Week & Time-of-Day buckets
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

      (sessions || []).forEach((session) => {
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

        // Time of Day bucketing
        if (hour >= 6 && hour < 12) {
          morningMins += mins;
        } else if (hour >= 12 && hour < 18) {
          afternoonMins += mins;
        } else {
          eveningMins += mins;
        }

        // Energy Quality bucketing
        if (session.focus_quality === 'high_flow') {
          highFlowCount++;
        } else if (session.focus_quality === 'distracted') {
          distractedCount++;
        } else {
          moderateCount++;
        }
      });

      // Format weekly / daily focus array
      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedWeekly = orderedDays.map((day) => ({
        day,
        minutes: dayTotals[day] || 0,
      }));

      // Find peak focus day
      let maxDayMins = -1;
      let maxDayName = 'Mon';
      orderedDays.forEach(day => {
        if ((dayTotals[day] || 0) > maxDayMins) {
          maxDayMins = dayTotals[day] || 0;
          maxDayName = day;
        }
      });

      setWeeklyFocusData(formattedWeekly);
      setTotalWeeklyMinutes(grandTotal);
      setAvgSessionDuration(totalSessionsCount > 0 ? Math.round(totalDurationSum / totalSessionsCount) : 25);
      setPeakDay(maxDayName);

      // Set Time of Day stats
      setTimeOfDayData([
        { slot: 'Morning 🌅', minutes: morningMins, color: '#CFA052' },
        { slot: 'Afternoon ☀️', minutes: afternoonMins, color: '#C06C4C' },
        { slot: 'Evening 🌙', minutes: eveningMins, color: '#6B8E6E' },
      ]);

      // Quality breakdown stats
      const totalQualityLogged = Math.max(1, highFlowCount + moderateCount + distractedCount);
      setQualityBreakdown([
        { label: 'High Flow ⚡', count: highFlowCount, pct: Math.round((highFlowCount / totalQualityLogged) * 100), color: '#6B8E6E' },
        { label: 'Moderate 😐', count: moderateCount, pct: Math.round((moderateCount / totalQualityLogged) * 100), color: '#CFA052' },
        { label: 'Distracted 🥱', count: distractedCount, pct: Math.round((distractedCount / totalQualityLogged) * 100), color: '#C06C4C' },
      ]);

      // 3. Compute Category Distribution percentages
      const { data: habitLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('completed_date', cutoffDate.toISOString().split('T')[0]);

      const habitCount = (habitLogs || []).length;
      const estimatedHabitMins = habitCount * 10; // Assume ~10 mins per habit

      const overallTotal = Math.max(1, deepWorkMins + restMins + estimatedHabitMins);
      const deepWorkPct = Math.round((deepWorkMins / overallTotal) * 100) || 50;
      const habitPct = Math.round((estimatedHabitMins / overallTotal) * 100) || 30;
      const restPct = Math.max(0, 100 - deepWorkPct - habitPct);

      setCategoryDistribution([
        { name: 'Deep Work (Pomodoro)', value: deepWorkPct, color: '#C06C4C' },
        { name: 'Habit Routines', value: habitPct, color: '#C87D87' },
        { name: 'Short / Long Rest', value: restPct, color: '#CFA052' },
      ]);

      // 4. Compute composite Rhythm Score out of 100
      // Focus target contribution (max 40 pts): 300+ mins = 40 pts
      const focusScore = Math.min(40, Math.round((grandTotal / 300) * 40));
      // Habit log contribution (max 30 pts): 10+ habits = 30 pts
      const habitScore = Math.min(30, Math.round((habitCount / 10) * 30));
      // Quality bonus (max 30 pts): high_flow ratio
      const flowRatio = highFlowCount / totalQualityLogged;
      const qualityScore = Math.round(flowRatio * 30) || 20;

      const score = Math.min(100, focusScore + habitScore + qualityScore);
      setRhythmScore(score > 0 ? score : 85);

      if (score >= 90) setRhythmRankTitle('Flow Master ⚡');
      else if (score >= 75) setRhythmRankTitle('Flow Architect 🎯');
      else if (score >= 50) setRhythmRankTitle('Focus Builder 🔨');
      else setRhythmRankTitle('Momentum Initiate 🚀');

    } catch (err: any) {
      console.error('Error fetching Supabase analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, timeHorizon]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    timeHorizon,
    setTimeHorizon,
    weeklyFocusData,
    timeOfDayData,
    qualityBreakdown,
    categoryDistribution,
    totalWeeklyMinutes,
    avgSessionDuration,
    peakDay,
    rhythmScore,
    rhythmRankTitle,
    loading,
    refreshAnalytics: fetchAnalytics,
  };
}


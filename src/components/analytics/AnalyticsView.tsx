import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle2, Flame, Database, RefreshCw, Zap, Award, Calendar, BarChart3, Activity } from 'lucide-react';
import { useAnalytics, TimeHorizon } from '../../hooks/useAnalytics';

interface AnalyticsViewProps {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  userStreak: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasksCompleted,
  totalTasks,
  focusMinutes,
  userStreak,
}) => {
  const {
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
    refreshAnalytics,
  } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Module Header with Supabase DB Status & Time Horizon Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="font-heading font-bold text-lg text-[var(--text-primary)]">
            Rhythm Analytics & Productivity Metrics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time focus telemetry, habit consistency, and task completion analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon Selector Tabs */}
          <div className="flex items-center rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setTimeHorizon('week')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                timeHorizon === 'week'
                  ? 'bg-[#CFA052] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeHorizon('month')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                timeHorizon === 'month'
                  ? 'bg-[#CFA052] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeHorizon('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                timeHorizon === 'all'
                  ? 'bg-[#CFA052] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
            <Database className="h-3.5 w-3.5" />
            <span>Supabase DB</span>
          </span>
          <button
            onClick={refreshAnalytics}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-2 text-[var(--text-secondary)] hover:text-white transition"
            title="Refresh DB Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Composite Rhythm Score & Rank Title Banner */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--card-surface)] via-[var(--card-surface)] to-[var(--surface-sunken)] p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#CFA052]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Overall Productivity Rhythm
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="font-heading font-black text-4xl text-[var(--text-primary)]">
                {rhythmScore} <span className="text-xl text-[var(--text-muted)] font-normal">/ 100</span>
              </h3>
              <span className="rounded-full bg-[#CFA052]/15 border border-[#CFA052]/30 px-3 py-1 text-xs font-bold text-[#CFA052]">
                Rank: {rhythmRankTitle}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Calculated live from focus duration target, habit completion consistency, and session flow ratings.
            </p>
          </div>

          {/* Rhythm Score Progress Bar */}
          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Momentum Progress</span>
              <span className="font-bold text-[var(--text-primary)]">{rhythmScore}%</span>
            </div>
            <div className="h-3 w-full bg-[var(--surface-sunken)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className="h-full bg-gradient-to-r from-[#CFA052] to-[#6B8E6E] rounded-full transition-all duration-500"
                style={{ width: `${rhythmScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#CFA052] mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Clock className="h-4.5 w-4.5" />
              <span>Total Focus Time</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#CFA052]/15 px-2 py-0.5 rounded-full">
              {timeHorizon === 'week' ? '7 Days' : timeHorizon === 'month' ? '30 Days' : 'All-Time'}
            </span>
          </div>
          <p className="font-heading font-bold text-3xl text-[var(--text-primary)]">
            {totalWeeklyMinutes > 0 ? totalWeeklyMinutes : focusMinutes} mins
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            Logged across {weeklyFocusData.filter((d) => d.minutes > 0).length} active focus days
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#6B8E6E] mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>Tasks Completion Rate</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#6B8E6E]/15 px-2 py-0.5 rounded-full">
              Real-Time
            </span>
          </div>
          <p className="font-heading font-bold text-3xl text-[var(--text-primary)]">
            {totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 100}%
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            {tasksCompleted} finished out of {totalTasks} total tasks
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#C06C4C] mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Flame className="h-4.5 w-4.5" />
              <span>Rhythm Consistency</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C06C4C]/15 px-2 py-0.5 rounded-full">
              Habit Logs
            </span>
          </div>
          <p className="font-heading font-bold text-3xl text-[var(--text-primary)]">
            {userStreak} Days
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            Active streak multiplier: {userStreak > 7 ? '2.0x' : '1.5x'}
          </p>
        </div>
      </div>

      {/* Dynamic Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Focus Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Daily Focus Duration ({timeHorizon === 'week' ? 'Past 7 Days' : timeHorizon === 'month' ? 'Past 30 Days' : 'All-Time'})
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Calculated live from Supabase focus_sessions table</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFocusData}>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val: number) => [`${val} mins`, 'Focus Duration']}
                />
                <Bar dataKey="minutes" fill="#CFA052" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Time-of-Day Focus Distribution Bar Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Peak Focus Window (Time of Day)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Focus minutes by Morning, Afternoon & Evening</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeOfDayData}>
                <XAxis dataKey="slot" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val: number) => [`${val} mins`, 'Focus Minutes']}
                />
                <Bar dataKey="minutes" fill="#6B8E6E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
            {timeOfDayData.map((item) => (
              <div key={item.slot} className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-secondary)]">{item.slot}</span>
                <span className="font-bold text-[var(--text-primary)]">{item.minutes} mins</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Focus Energy & Quality Breakdown */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Focus Energy & Quality Ratings
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Post-Pomodoro session ratings breakdown</p>
            </div>
            <Zap className="h-4 w-4 text-[#6B8E6E]" />
          </div>

          <div className="space-y-3 pt-2">
            {qualityBreakdown.map((q) => (
              <div key={q.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[var(--text-primary)]">{q.label}</span>
                  <span className="font-bold text-[var(--text-secondary)]">
                    {q.count} sessions ({q.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--surface-sunken)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${q.pct}%`, backgroundColor: q.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Velocity & Focus Efficiency Insights */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Task Velocity & Focus Efficiency
              </h3>
              <Activity className="h-4 w-4 text-[#CFA052]" />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Focus pacing & session statistics</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-2">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Avg Session Length</p>
              <p className="font-heading font-bold text-xl text-[var(--text-primary)] mt-1">
                {avgSessionDuration} mins
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Peak Focus Day</p>
              <p className="font-heading font-bold text-xl text-[#CFA052] mt-1">
                {peakDay}s
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Category Distribution</span>
            <div className="flex items-center gap-3 font-semibold text-[var(--text-primary)]">
              {categoryDistribution.map((cat) => (
                <span key={cat.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.value}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  Sunrise,
  Sun,
  Moon,
  Layers,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import { useAnalytics, TimeHorizon } from '../../hooks/useAnalytics';
import { exportAnalyticsPdf } from '../../lib/exportAnalyticsReport';
import { downloadCsvFile } from '../../lib/csvSecurity';

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
  const [journalViewMode, setJournalViewMode] = useState<'chart' | 'table'>('chart');
  const [copiedRecap, setCopiedRecap] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const {
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
  } = useAnalytics();

  const completionPct = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 100;
  const activeFocusMinutes = totalWeeklyMinutes > 0 ? totalWeeklyMinutes : focusMinutes;
  const activeDaysCount = weeklyFocusData.filter((d) => d.minutes > 0).length;

  const horizonLabel = timeHorizon === 'week' ? 'Past 7 Days' : timeHorizon === 'month' ? 'Past 30 Days' : 'All-Time';

  // Format recent sessions data for visual bar chart
  const sessionChartData = recentSessions.map((s, idx) => ({
    name: s.taskTitle ? (s.taskTitle.length > 14 ? s.taskTitle.slice(0, 12) + '...' : s.taskTitle) : `Session ${idx + 1}`,
    fullTitle: s.taskTitle || 'Deep Focus Sprint',
    duration: s.durationMinutes,
    quality: s.quality === 'high_flow' ? 'High Flow' : s.quality === 'distracted' ? 'Distracted' : 'Steady Flow',
    color: s.quality === 'high_flow' ? 'var(--accent-botanical-sage)' : s.quality === 'distracted' ? 'var(--accent-dusty-rose)' : 'var(--accent-warm-ochre)',
    completedAt: s.completedAt,
    mode: s.mode,
  }));

  // 1. Copy Plain Text Summary
  const handleCopyRecapSummary = () => {
    const totalTimeOfDayMinutes = timeOfDayData.reduce((acc, curr) => acc + curr.minutes, 0);

    const recapText = `TAKTIC ACTIVITY SUMMARY (${horizonLabel.toUpperCase()})
─────────────────────────────────────────

OVERVIEW
• Consistency Score: ${rhythmScore}/100 (${rhythmRankTitle})
• Focus Time: ${(activeFocusMinutes / 60).toFixed(1)} hrs (${activeFocusMinutes} mins) across ${activeDaysCount} active days
• Tasks Completed: ${tasksCompleted} of ${totalTasks} (${completionPct}%)
• Current Streak: ${userStreak} ${userStreak === 1 ? 'day' : 'days'}

DAILY FOCUS
• Most Active Day: ${peakDay}
• Average Session: ${avgSessionDuration} mins
${weeklyFocusData.map((d) => `• ${d.day}: ${d.minutes} mins (${(d.minutes / 60).toFixed(1)} hrs)`).join('\n')}

TIME OF DAY BREAKDOWN
${timeOfDayData
  .map(
    (t) =>
      `• ${t.slot}: ${t.minutes} mins (${totalTimeOfDayMinutes > 0 ? Math.round((t.minutes / totalTimeOfDayMinutes) * 100) : 0}%)`
  )
  .join('\n')}

${
  smartInsights.length > 0
    ? `OBSERVATIONS\n${smartInsights.map((i) => `• ${i.title}: ${i.description}`).join('\n')}\n\n`
    : ''
}RECENT SESSIONS (${recentSessions.length} total)
${
  recentSessions.length > 0
    ? recentSessions
        .map(
          (s) =>
            `• ${s.completedAt} — ${s.taskTitle || 'Focus Session'} (${s.durationMinutes}m, ${
              s.quality === 'high_flow' ? 'High Flow' : s.quality === 'distracted' ? 'Distracted' : 'Steady Flow'
            })`
        )
        .join('\n')
    : '• No sessions recorded in this timeframe'
}`;

    navigator.clipboard.writeText(recapText);
    setCopiedRecap(true);
    setIsExportMenuOpen(false);
    setTimeout(() => setCopiedRecap(false), 2500);
  };

  // 2. Export CSV Spreadsheet
  const handleExportCSV = () => {
    const totalTimeOfDayMinutes = timeOfDayData.reduce((acc, curr) => acc + curr.minutes, 0);

    const rows: (string | number)[][] = [
      ['TAKTIC ACTIVITY REPORT'],
      ['Time Range', horizonLabel],
      ['Generated On', new Date().toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })],
      [],
      ['OVERVIEW'],
      ['Metric', 'Value', 'Details'],
      ['Consistency Score', `${rhythmScore}/100`, rhythmRankTitle],
      ['Total Focus Time', `${activeFocusMinutes} mins`, `${(activeFocusMinutes / 60).toFixed(1)} hours`],
      ['Active Days', activeDaysCount, `days active in ${horizonLabel}`],
      ['Tasks Completed', `${tasksCompleted} of ${totalTasks}`, `${completionPct}% completed`],
      ['Current Streak', `${userStreak} days`, 'consecutive days active'],
      [],
      ['DAILY FOCUS'],
      ['Day', 'Minutes', 'Hours', 'Share of Total'],
      ...weeklyFocusData.map((d) => [
        d.day,
        d.minutes,
        `${(d.minutes / 60).toFixed(1)} hrs`,
        activeFocusMinutes > 0 ? `${Math.round((d.minutes / activeFocusMinutes) * 100)}%` : '0%',
      ]),
      [],
      ['WHEN YOU WORK (TIME OF DAY)'],
      ['Time Slot', 'Minutes', 'Share'],
      ...timeOfDayData.map((t) => [
        t.slot,
        t.minutes,
        totalTimeOfDayMinutes > 0 ? `${Math.round((t.minutes / totalTimeOfDayMinutes) * 100)}%` : '0%',
      ]),
      [],
      ['FOCUS SESSIONS LOG'],
      ['Date & Time', 'Task / Session', 'Duration (Mins)', 'Mode', 'Quality'],
      ...(recentSessions.length > 0
        ? recentSessions.map((s) => [
            s.completedAt,
            s.taskTitle || 'Focus Session',
            s.durationMinutes,
            s.mode,
            s.quality === 'high_flow' ? 'High Flow' : s.quality === 'distracted' ? 'Distracted' : 'Steady Flow',
          ])
        : [['No sessions logged in this timeframe', '-', '-', '-', '-']]),
    ];

    downloadCsvFile(`taktic-activity-${timeHorizon}-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setIsExportMenuOpen(false);
  };

  // 3. Export Styled Printable PDF Report (All Data + Trends + Habits & Energy Included)
  const handleExportPDF = () => {
    exportAnalyticsPdf({
      horizonLabel,
      rhythmScore,
      rhythmRankTitle,
      userStreak,
      avgSessionDuration,
      peakDay,
      activeFocusMinutes,
      activeDaysCount,
      completionPct,
      tasksCompleted,
      totalTasks,
      weeklyFocusData,
      timeOfDayData,
      qualityBreakdown,
      categoryDistribution,
      smartInsights,
      recentSessions,
    });
    setIsExportMenuOpen(false);
  };

  const isOptimalScore = rhythmScore >= 80;

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Page Header & Completion Bar Card - Warm Ochre / Dusty Mauve Rhythm Theme */}
      <div className={`rounded-2xl border ${isOptimalScore ? 'border-[#CFA052]/40 bg-gradient-to-r from-[var(--card-surface)] to-[#CFA052]/5 shadow-[#CFA052]/10' : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'} p-3.5 sm:p-5 shadow-xs transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 ${
              isOptimalScore
                ? 'bg-[#CFA052]/15 text-[#CFA052] dark:text-[#E0AF5E] border border-[#CFA052]/30'
                : 'bg-[#CFA052]/10 text-[#CFA052] dark:text-[#E0AF5E] border border-[#CFA052]/20'
            }`}>
              {isOptimalScore ? (
                <Award className="h-5 w-5 animate-in zoom-in-75 duration-300" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">
                  Activity & Trends
                </h1>
                {isOptimalScore ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CFA052]/15 border border-[#CFA052]/30 px-2 py-0.5 text-[10px] font-bold text-[#B88636] dark:text-[#E0AF5E] animate-pulse">
                    <Check className="h-3 w-3" />
                    High Rhythm! ⚡
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                    {rhythmRankTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Rhythm Score: <strong className="text-[#CFA052] dark:text-[#E0AF5E] font-bold">{rhythmScore}/100</strong> • {rhythmRankTitle} ({horizonLabel})
              </p>
            </div>
          </div>

          {/* Time Horizon Switcher & Export */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Time Horizon Pills */}
            <div className="flex items-center rounded-xl bg-[var(--bg-main)] p-1 border border-[var(--border-subtle)] text-xs">
              {(['week', 'month', 'all'] as TimeHorizon[]).map((horizon) => (
                <button
                  key={horizon}
                  type="button"
                  onClick={() => setTimeHorizon(horizon)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    timeHorizon === horizon
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {horizon === 'week' ? '7 Days' : horizon === 'month' ? '30 Days' : 'All-Time'}
                </button>
              ))}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition active:scale-95 cursor-pointer"
              >
                {copiedRecap ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                    <span>Export</span>
                  </>
                )}
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 z-50 w-52 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                    >
                      <Layers className="h-4 w-4 text-[var(--accent-terracotta)]" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 text-[var(--accent-botanical-sage)]" />
                      <span>Download CSV (.csv)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyRecapSummary}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                    >
                      <Copy className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                      <span>Copy Text Summary</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rhythm Consistency Progress Bar - Warm Ochre */}
        <div
          className="h-2 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden"
          role="progressbar"
          aria-label="Rhythm consistency score"
          aria-valuenow={rhythmScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`Rhythm Score: ${rhythmScore} out of 100 (${rhythmRankTitle})`}
        >
          <div
            className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-[#B88636] to-[#E6B870]"
            style={{ width: `${Math.min(100, Math.max(0, rhythmScore))}%` }}
          />
        </div>
      </div>

      {/* 2. Primary Metrics Row: 4 Clean, Direct Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Focus Time */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Total Focus Time</span>
            <Clock className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
          </div>
          <div>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {activeFocusMinutes >= 60 ? `${(activeFocusMinutes / 60).toFixed(1)}` : activeFocusMinutes}
              <span className="text-xs sm:text-sm font-normal text-[var(--text-muted)] ml-1">
                {activeFocusMinutes >= 60 ? 'hrs' : 'mins'}
              </span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {activeDaysCount} active {activeDaysCount === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Task Completion */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Tasks Completed</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--accent-botanical-sage)]" />
          </div>
          <div>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {completionPct}%
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {tasksCompleted} of {totalTasks} finished
            </p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Daily Streak</span>
            <Flame className="h-4 w-4 text-[var(--accent-terracotta)]" />
          </div>
          <div>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {userStreak}
              <span className="text-xs sm:text-sm font-normal text-[var(--text-muted)] ml-1">
                {userStreak === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Consistent activity
            </p>
          </div>
        </div>

        {/* Rhythm Score & Status Badge */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Rhythm Score</span>
            <Award className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
                {rhythmScore}
                <span className="text-xs sm:text-sm font-normal text-[var(--text-muted)] ml-1">/ 100</span>
              </p>
            </div>
            <div className="mt-1">
              <span className="inline-block rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                {rhythmRankTitle}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daily Focus Chart & Time-of-Day Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Clean Bar Chart of Daily Focus Time */}
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Focus Time by Day
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Minutes focused each day in {horizonLabel.toLowerCase()}
              </p>
            </div>
            {peakDay && peakDay !== 'None' && (
              <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-sunken)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                Most active: <strong className="text-[var(--text-primary)]">{peakDay}</strong>
              </span>
            )}
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFocusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-surface)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val: number) => [`${val} mins`, 'Focus Time']}
                />
                <Bar dataKey="minutes" fill="var(--accent-warm-ochre)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: When You Focus (Morning, Afternoon, Evening) */}
        <div className="lg:col-span-4 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              When You Work
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Focus time across the day
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {timeOfDayData.map((item) => {
              const Icon = item.slot === 'Morning' ? Sunrise : item.slot === 'Afternoon' ? Sun : Moon;
              const totalMins = timeOfDayData.reduce((acc, curr) => acc + curr.minutes, 0) || 1;
              const pct = Math.round((item.minutes / totalMins) * 100);

              return (
                <div key={item.slot} className="space-y-1.5 p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                      <Icon className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                      <span>{item.slot}</span>
                    </div>
                    <span className="font-medium text-[var(--text-secondary)]">
                      {item.minutes}m ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--card-surface)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className="h-full bg-[var(--accent-terracotta)] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Average session:</span>
            <strong className="text-[var(--text-primary)] font-semibold">{avgSessionDuration} mins</strong>
          </div>
        </div>
      </div>

      {/* 4. Practical Takeaways & Highlights */}
      {smartInsights.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
            <span>Productivity Observations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {smartInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {insight.title}
                  </span>
                  <span className="rounded-md bg-[var(--card-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-warm-ochre)] border border-[var(--border-subtle)]">
                    {insight.metric}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Sessions Log (Straightforward List with Optional Duration Chart) */}
      <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Recent Focus Sessions
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Your latest focus sprints and logged times
            </p>
          </div>

          <div className="flex items-center rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setJournalViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                journalViewMode === 'table'
                  ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setJournalViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                journalViewMode === 'chart'
                  ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>
          </div>
        </div>

        {recentSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-medium text-[var(--text-secondary)]">No focus sessions recorded yet</p>
            <p>Start a timer from the Focus Mode tab to see your activity logged here.</p>
          </div>
        ) : journalViewMode === 'table' ? (
          <div className="space-y-2">
            {recentSessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] shrink-0 font-bold">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[var(--text-primary)] truncate">
                      {session.taskTitle || 'Focus Session'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">{session.completedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-bold text-xs font-mono text-[var(--text-primary)]">
                    {session.durationMinutes} mins
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    session.quality === 'high_flow'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : session.quality === 'distracted'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {session.quality === 'high_flow' ? 'High Flow' : session.quality === 'distracted' ? 'Distracted' : 'Steady'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(val: number, _name: string, props: any) => [
                      `${val} mins (${props.payload.quality})`,
                      props.payload.fullTitle,
                    ]}
                  />
                  <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
                    {sessionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-botanical-sage)]" /> High Flow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-warm-ochre)]" /> Steady
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-dusty-rose)]" /> Distracted
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

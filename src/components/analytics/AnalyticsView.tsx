import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  Flame,
  Award,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  Sunrise,
  Sun,
  Moon,
  Target,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
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
  const [activeSubTab, setActiveSubTab] = useState<'recap' | 'trends' | 'consistency'>('recap');
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

  // 1. Copy Markdown Summary
  const handleCopyRecapSummary = () => {
    const recapText = `📊 Taktic Productivity Recap (${horizonLabel})
━━━━━━━━━━━━━━━━━━━━
🎯 Productivity Rhythm: ${rhythmScore}/100 (${rhythmRankTitle})
⏱️ Focus Time Logged: ${activeFocusMinutes} mins across ${activeDaysCount} active days
✅ Tasks Completed: ${tasksCompleted}/${totalTasks} (${completionPct}%)
🔥 Streak Maintained: ${userStreak} Days
⚡ Peak Focus Day: ${peakDay}

Optimal Focus Window: ${timeOfDayData[0]?.slot || 'Morning'} (${timeOfDayData[0]?.minutes || 0} mins)
Flow Quality Rate: ${qualityBreakdown[0]?.pct || 60}% High Flow`;

    navigator.clipboard.writeText(recapText);
    setCopiedRecap(true);
    setIsExportMenuOpen(false);
    setTimeout(() => setCopiedRecap(false), 2500);
  };

  // 2. Export CSV / Excel Spreadsheet
  const handleExportCSV = () => {
    const rows = [
      ['Taktic Productivity Export', horizonLabel, `Exported on ${new Date().toLocaleDateString()}`],
      [],
      ['Metric', 'Value', 'Unit / Details'],
      ['Productivity Rhythm Score', rhythmScore, `/100 (${rhythmRankTitle})`],
      ['Total Focus Time', activeFocusMinutes, 'minutes'],
      ['Tasks Completed', tasksCompleted, `of ${totalTasks} (${completionPct}%)`],
      ['Active Streak', userStreak, 'days'],
      ['Avg Session Length', avgSessionDuration, 'minutes'],
      ['Peak Focus Day', peakDay, ''],
      [],
      ['Recent Focus Sessions Journal'],
      ['Date / Time', 'Task Title', 'Duration (Mins)', 'Session Mode', 'Flow Quality'],
      ...recentSessions.map((s) => [
        `"${s.completedAt}"`,
        `"${s.taskTitle || 'Deep Work Sprint'}"`,
        s.durationMinutes,
        s.mode,
        s.quality,
      ]),
      [],
      ['Day of Week Breakdown'],
      ['Day', 'Focus Minutes'],
      ...weeklyFocusData.map((d) => [d.day, d.minutes]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taktic-productivity-recap-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // 3. Export Styled Printable PDF Report
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Taktic Productivity Recap - ${horizonLabel}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E1E1E; padding: 40px; background: #FFF; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #EFEAE6; padding-bottom: 20px; margin-bottom: 25px; }
            .logo { font-size: 24px; font-weight: 800; color: #C06C4C; }
            .badge { background: #EFEAE6; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #555; }
            .score-card { background: #FAF7F5; border: 1px solid #E5DCD6; border-radius: 16px; padding: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .score-val { font-size: 38px; font-weight: 900; color: #C06C4C; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { background: #FAF7F5; border: 1px solid #E5DCD6; border-radius: 12px; padding: 15px; }
            .card-title { font-size: 11px; text-transform: uppercase; color: #777; font-weight: 700; margin-bottom: 6px; }
            .card-val { font-size: 22px; font-weight: 800; color: #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; font-size: 12px; }
            th { text-align: left; padding: 10px; background: #FAF7F5; border-bottom: 2px solid #E5DCD6; font-weight: 700; }
            td { padding: 10px; border-bottom: 1px solid #EFEAE6; }
            .section-title { font-size: 15px; font-weight: 700; color: #333; margin-top: 20px; }
            .footer { margin-top: 30px; border-top: 1px solid #EFEAE6; padding-top: 15px; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Taktic</div>
              <p style="font-size: 12px; color: #666; margin-top: 3px;">Executive Productivity & Rhythm Recap</p>
            </div>
            <div class="badge">${horizonLabel} • Generated ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="score-card">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #CFA052;">Overall Productivity Rhythm</div>
              <div class="score-val">${rhythmScore} <span style="font-size: 18px; font-weight: 400; color: #888;">/ 100</span></div>
              <p style="font-size: 12px; color: #555;">Rank: <strong>${rhythmRankTitle}</strong> • Unbroken Streak: <strong>${userStreak} Days</strong></p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; font-weight: 700; color: #6B8E6E;">High Flow Ratio: ${qualityBreakdown[0]?.pct || 60}%</div>
              <div style="font-size: 12px; color: #777;">Avg Session: ${avgSessionDuration} mins</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Focus Time</div>
              <div class="card-val">${activeFocusMinutes} mins</div>
              <p style="font-size: 11px; color: #666; margin-top: 4px;">Across ${activeDaysCount} active days</p>
            </div>
            <div class="card">
              <div class="card-title">Task Completion</div>
              <div class="card-val">${completionPct}%</div>
              <p style="font-size: 11px; color: #666; margin-top: 4px;">${tasksCompleted} of ${totalTasks} tasks</p>
            </div>
            <div class="card">
              <div class="card-title">Peak Energy Day</div>
              <div class="card-val">${peakDay}</div>
              <p style="font-size: 11px; color: #666; margin-top: 4px;">Optimal focus performance</p>
            </div>
          </div>

          <div class="section-title">Recent Focus Sessions Journal</div>
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Task Title</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              ${recentSessions
                .map(
                  (s) => `
                <tr>
                  <td>${s.completedAt}</td>
                  <td><strong>${s.taskTitle || 'Deep Work Sprint'}</strong></td>
                  <td>${s.durationMinutes} mins</td>
                  <td>${s.mode}</td>
                  <td><span style="background: #EBF3ED; color: #35623B; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${s.quality === 'high_flow' ? 'High Flow' : s.quality}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <span>Taktic Productivity Platform</span>
            <span>Zero Data Leakage • Privacy Protected</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Module Header with Time Horizon & Quick Export Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-lg sm:text-xl text-[var(--text-primary)]">
              Insights & Productivity Recap
            </h1>
            <span className="rounded-full bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-terracotta)]">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Focus telemetry, session velocity, and daily productivity reflections.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Horizon Selector */}
          <div className="flex items-center rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] text-xs">
            {(['week', 'month', 'all'] as TimeHorizon[]).map((horizon) => (
              <button
                key={horizon}
                type="button"
                onClick={() => setTimeHorizon(horizon)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  timeHorizon === horizon
                    ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {horizon === 'week' ? '7 Days' : horizon === 'month' ? '30 Days' : 'All-Time'}
              </button>
            ))}
          </div>

          {/* Export Recap Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition active:scale-95 cursor-pointer"
            >
              {copiedRecap ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" />
                  <span>Export Recap</span>
                </>
              )}
            </button>

            {/* Dropdown Popover */}
            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-56 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                    Export Format
                  </div>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]">
                      <Layers className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">PDF Report</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Printable executive summary</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)]">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">CSV / Spreadsheet</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Excel & Google Sheets (.csv)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyRecapSummary}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition text-left cursor-pointer"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]">
                      <Copy className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">Copy Text Summary</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Markdown format for notes</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Composite Rhythm Score Hero Banner with Visual Circular Radial Ring Gauge */}
      <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)]">
              <Award className="h-4 w-4" />
              <span>Productivity Rhythm Score</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-[var(--text-primary)]">
                {rhythmScore} <span className="text-lg sm:text-xl text-[var(--text-muted)] font-normal">/ 100</span>
              </h2>
              <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 border border-[var(--accent-warm-ochre)]/30 px-3 py-1 text-xs font-bold text-[var(--accent-warm-ochre)]">
                Rank: {rhythmRankTitle}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-xl">
              Derived from deep focus session telemetry, uninterrupted flow quality ratings, and routine streak adherence.
            </p>
          </div>

          {/* Visual Circular Gauge + Rhythm Rings */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] shrink-0">
            <div className="relative flex items-center justify-center w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-[var(--border-subtle)]/40"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-[var(--accent-warm-ochre)] transition-all duration-1000"
                  strokeWidth="3.5"
                  strokeDasharray={`${rhythmScore}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-heading font-black text-sm text-[var(--text-primary)]">{rhythmScore}%</span>
                <span className="text-[8px] font-bold uppercase text-[var(--accent-botanical-sage)]">FLOW</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-warm-ochre)]" />
                  Momentum
                </span>
                <span className="font-bold font-mono text-[var(--text-primary)]">{rhythmScore}/100</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-botanical-sage)]" />
                  Flow Quality
                </span>
                <span className="font-bold font-mono text-[var(--accent-botanical-sage)]">{qualityBreakdown[0]?.pct || 60}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-terracotta)]" />
                  Streak Tier
                </span>
                <span className="font-bold font-mono text-[var(--accent-terracotta)]">{userStreak}d</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Visual KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
        {/* Total Focus Time Card with Mini Visual Meter */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--accent-warm-ochre)]">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" />
              <span>Total Focus Time</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-warm-ochre)]/15 px-2 py-0.5 rounded-full">
              {timeHorizon === 'week' ? '7 Days' : timeHorizon === 'month' ? '30 Days' : 'All-Time'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {activeFocusMinutes} <span className="text-sm font-normal text-[var(--text-muted)]">mins</span>
            </p>
            <span className="text-xs font-mono font-bold text-[var(--accent-warm-ochre)]">{activeDaysCount}/7 Days Active</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-subtle)]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-warm-ochre)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((activeFocusMinutes / 400) * 100))}%` }}
            />
          </div>
        </div>

        {/* Task Completion Card with Mini Visual Meter */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--accent-botanical-sage)]">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Task Velocity</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-botanical-sage)]/15 px-2 py-0.5 rounded-full">
              Daily Pace
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {completionPct}%
            </p>
            <span className="text-xs font-mono font-bold text-[var(--accent-botanical-sage)]">{tasksCompleted}/{totalTasks} Finished</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-subtle)]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-botanical-sage)] rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Streak Consistency Card with Mini Visual Meter */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--accent-terracotta)]">
            <div className="flex items-center gap-2 font-semibold">
              <Flame className="h-4 w-4" />
              <span>Streak Momentum</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-terracotta)]/15 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-heading font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">
              {userStreak} <span className="text-sm font-normal text-[var(--text-muted)]">Days</span>
            </p>
            <span className="text-xs font-mono font-bold text-[var(--accent-terracotta)]">Unbroken</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-subtle)]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-terracotta)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (userStreak / 14) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segmented Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-xs overflow-x-auto">
        {[
          { id: 'recap' as const, label: 'Daily & Weekly Recap', icon: Sparkles },
          { id: 'trends' as const, label: 'Focus Trends & Velocity', icon: TrendingUp },
          { id: 'consistency' as const, label: 'Habit & Energy Quality', icon: Activity },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-semibold transition whitespace-nowrap min-h-[40px] cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <TabIcon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Daily & Weekly Recap */}
      {activeSubTab === 'recap' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Smart Productivity Insights Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                <span>Smart Productivity Insights</span>
              </h3>
              <span className="text-[11px] text-[var(--text-muted)]">Telemetry analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {smartInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 space-y-2 shadow-xs transition-colors hover:border-[var(--accent-warm-ochre)]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {insight.title}
                    </span>
                    <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] font-bold text-[10px] px-2 py-0.5">
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

          {/* Visual Focus Journal & Session Velocity Chart */}
          <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                    Recent Focus Journal & Velocity
                  </h3>
                  <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] text-[10px] font-bold px-2.5 py-0.5 border border-[var(--accent-botanical-sage)]/30">
                    {recentSessions.length} Logged Sprints
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Visual velocity breakdown of recent focus sprints and real-time flow quality.
                </p>
              </div>

              {/* View Toggle: Visual Chart vs Table List */}
              <div className="flex items-center rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] text-xs self-start sm:self-auto">
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
                  <span>Velocity Chart</span>
                </button>

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
                  <span>Log List</span>
                </button>
              </div>
            </div>

            {journalViewMode === 'chart' ? (
              <div className="space-y-4">
                {/* Visual Bar Chart of Recent Sprint Durations & Quality Colors */}
                <div className="h-56 w-full pt-2">
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
                        labelFormatter={(_label: string, payload: any[]) => payload[0]?.payload.completedAt || ''}
                      />
                      <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
                        {sessionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quality Legend & Interactive Ribbon */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-botanical-sage)]" />
                      High Flow
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-warm-ochre)]" />
                      Steady Flow
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-dusty-rose)]" />
                      Distracted
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">Bar height = Sprint Length (mins)</span>
                </div>

                {/* Visual Sprint Timeline Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--accent-warm-ochre)]/40 transition flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {session.taskTitle || 'Deep Focus Sprint'}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-[var(--accent-terracotta)] shrink-0">
                          {session.durationMinutes}m
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                        <span>{session.completedAt}</span>
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          session.quality === 'high_flow'
                            ? 'bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)]'
                            : session.quality === 'distracted'
                            ? 'bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)]'
                            : 'bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)]'
                        }`}>
                          {session.quality === 'high_flow' ? 'High Flow' : session.quality === 'distracted' ? 'Distracted' : 'Steady'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Detailed Table Log List */
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0 font-bold">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {session.taskTitle || 'Deep Focus Sprint'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">{session.completedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-xs font-mono text-[var(--text-primary)]">
                        {session.durationMinutes} mins
                      </span>
                      <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 text-[var(--accent-botanical-sage)] font-bold text-[9px] px-2 py-0.5">
                        {session.quality === 'high_flow' ? 'High Flow' : session.quality === 'distracted' ? 'Distracted' : 'Steady'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Focus Trends & Velocity */}
      {activeSubTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Daily Focus Duration Area & Bar Chart */}
          <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Daily Focus Duration ({timeHorizon === 'week' ? 'Past 7 Days' : timeHorizon === 'month' ? 'Past 30 Days' : 'All-Time'})
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Total focus minutes invested per day</p>
              </div>
              <span className="rounded-full bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] px-2.5 py-1 text-[10px] font-bold font-mono">
                Peak: {peakDay}
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyFocusData}>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} unit="m" />
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
                  <Bar dataKey="minutes" fill="var(--accent-warm-ochre)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time-of-Day Focus Distribution with Visual Progress */}
          <div className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Peak Focus Window
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Chronobiological focus distribution</p>
            </div>

            <div className="space-y-3 my-2">
              {timeOfDayData.map((item) => {
                const Icon = item.slot === 'Morning' ? Sunrise : item.slot === 'Afternoon' ? Sun : Moon;
                const totalMins = timeOfDayData.reduce((acc, curr) => acc + curr.minutes, 0) || 1;
                const pct = Math.round((item.minutes / totalMins) * 100);

                return (
                  <div key={item.slot} className="space-y-1.5 p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                        <Icon className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                        <span>{item.slot}</span>
                      </div>
                      <span className="font-bold text-[var(--text-secondary)]">
                        {item.minutes} mins ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[var(--card-surface)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full bg-[var(--accent-terracotta)] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Velocity Metrics Snippet */}
            <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)]">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Avg Session</p>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-0.5">{avgSessionDuration} mins</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)]">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Peak Day</p>
                <p className="font-bold text-sm text-[var(--accent-warm-ochre)] mt-0.5">{peakDay}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Habit Consistency & Quality */}
      {activeSubTab === 'consistency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Energy & Quality Ratings with Donut Chart */}
          <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Session Flow & Energy Quality
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Post-focus reflection quality breakdown</p>
              </div>
              <Zap className="h-4 w-4 text-[var(--accent-botanical-sage)]" />
            </div>

            {/* Visual Donut Chart */}
            <div className="h-48 w-full flex items-center justify-center pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {qualityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(val: number, name: string) => [`${val} sessions`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-1">
              {qualityBreakdown.map((q) => (
                <div key={q.label} className="space-y-1 p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: q.color }} />
                      {q.label}
                    </span>
                    <span className="font-bold text-[var(--text-secondary)] font-mono">
                      {q.count} sessions ({q.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Allocation Category Distribution with Donut Chart */}
          <div className="lg:col-span-6 rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  Time Allocation Distribution
                </h3>
                <Layers className="h-4 w-4 text-[var(--accent-terracotta)]" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Deep sprints, routine habits, and recovery balance</p>
            </div>

            {/* Visual Donut Chart */}
            <div className="h-48 w-full flex items-center justify-center pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(val: number) => [`${val}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="font-bold font-mono text-[var(--text-secondary)]">{cat.value}%</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--accent-botanical-sage)]/30 bg-[var(--accent-botanical-sage)]/10 p-3 flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0" />
              <span>Healthy focus-to-recovery ratio maintained.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

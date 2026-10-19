import {
  DailyFocusStat,
  TimeOfDayStat,
  FocusQualityStat,
  CategoryDistributionStat,
  FocusSessionLog,
  SmartInsight,
} from '../hooks/useAnalytics';

export interface AnalyticsReportParams {
  horizonLabel: string;
  rhythmScore: number;
  rhythmRankTitle: string;
  userStreak: number;
  avgSessionDuration: number;
  peakDay: string;
  activeFocusMinutes: number;
  activeDaysCount: number;
  completionPct: number;
  tasksCompleted: number;
  totalTasks: number;
  weeklyFocusData: DailyFocusStat[];
  timeOfDayData: TimeOfDayStat[];
  qualityBreakdown: FocusQualityStat[];
  categoryDistribution: CategoryDistributionStat[];
  smartInsights: SmartInsight[];
  recentSessions: FocusSessionLog[];
}

export function generateAnalyticsReportHtml(params: AnalyticsReportParams): string {
  const {
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
  } = params;

  const totalTimeOfDayMinutes = timeOfDayData.reduce((acc, curr) => acc + curr.minutes, 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Taktic Executive Productivity Recap - ${horizonLabel}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #242220;
            padding: 36px 40px;
            background: #FFF;
            line-height: 1.5;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px 24px; }
            .no-break { page-break-inside: avoid; }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #EFE8E2;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .logo-wrap { display: flex; align-items: center; gap: 10px; }
          .logo-icon {
            background: #C06C4C;
            color: white;
            font-weight: 800;
            font-size: 16px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }
          .logo-title { font-size: 20px; font-weight: 800; color: #1E1E1E; letter-spacing: -0.5px; }
          .badge {
            background: #F4EFEB;
            border: 1px solid #E5DBD3;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            color: #6E5D53;
          }
          
          /* Section Title Bar */
          .section-bar {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #C06C4C;
            background: #FAF6F3;
            border: 1px solid #EFE8E2;
            padding: 8px 12px;
            border-radius: 8px;
            margin: 20px 0 12px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* Score Hero Banner */
          .score-hero {
            background: linear-gradient(135deg, #FAF6F3 0%, #F4EFEB 100%);
            border: 1px solid #E5DBD3;
            border-radius: 14px;
            padding: 18px 22px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .score-val { font-size: 36px; font-weight: 900; color: #C06C4C; line-height: 1; margin: 4px 0; }
          .hero-tag { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #CFA052; letter-spacing: 0.5px; }

          /* Grid Cards */
          .grid-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .kpi-card { background: #FAF7F5; border: 1px solid #EFE8E2; border-radius: 10px; padding: 12px 14px; }
          .kpi-title { font-size: 10px; text-transform: uppercase; color: #8A7B73; font-weight: 700; margin-bottom: 4px; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #1E1E1E; }
          .kpi-sub { font-size: 10px; color: #8A7B73; margin-top: 2px; }

          /* 2-Column Split Section */
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .panel { background: #FFF; border: 1px solid #EFE8E2; border-radius: 12px; padding: 14px 16px; }
          .panel-heading { font-size: 12px; font-weight: 700; color: #1E1E1E; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F4EFEB; padding-bottom: 6px; }

          /* Mini Progress Bars */
          .bar-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 8px; }
          .bar-bg { width: 100%; height: 6px; background: #EFE8E2; border-radius: 4px; overflow: hidden; margin-top: 3px; }
          .bar-fill { height: 100%; border-radius: 4px; }

          /* Health Banner */
          .health-banner {
            background: #F0F7F2;
            border: 1px solid #CDE5D3;
            border-radius: 8px;
            padding: 8px 12px;
            color: #2E5A35;
            font-size: 11px;
            font-weight: 600;
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          /* Smart Insights Box */
          .insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
          .insight-box { background: #FAF7F5; border: 1px solid #EFE8E2; border-radius: 10px; padding: 10px 12px; }
          .insight-title { font-size: 11px; font-weight: 700; color: #C06C4C; margin-bottom: 2px; }
          .insight-metric { font-size: 10px; font-weight: 700; color: #6E5D53; margin-bottom: 4px; }
          .insight-desc { font-size: 10.5px; color: #555; line-height: 1.4; }

          /* Data Tables */
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th { text-align: left; padding: 8px 10px; background: #F8F4F0; border-bottom: 2px solid #E5DBD3; font-weight: 700; color: #6E5D53; }
          td { padding: 8px 10px; border-bottom: 1px solid #F4EFEB; color: #333; }
          tr:last-child td { border-bottom: none; }
          .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
          .pill-sage { background: #EAF2EC; color: #2E5A35; }
          .pill-rose { background: #FCECEE; color: #9E3A4B; }
          .pill-ochre { background: #FCF5E9; color: #8A641E; }

          .footer {
            margin-top: 24px;
            border-top: 1px solid #EFE8E2;
            padding-top: 12px;
            font-size: 10.5px;
            color: #8A7B73;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <!-- Top Header -->
        <div class="header">
          <div class="logo-wrap">
            <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png" style="width: 32px; height: 32px; border-radius: 8px; object-fit: contain;" alt="Taktic Logo" />
            <div>
              <div class="logo-title">Taktic</div>
              <p style="font-size: 11px; color: #8A7B73;">Productivity, Trends & Energy Telemetry Recap</p>
            </div>
          </div>
          <div class="badge">${horizonLabel} • ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
        </div>

        <!-- Hero Score Card -->
        <div class="score-hero no-break">
          <div>
            <div class="hero-tag">Productivity Rhythm Score</div>
            <div class="score-val">${rhythmScore} <span style="font-size: 16px; font-weight: 400; color: #8A7B73;">/ 100</span></div>
            <p style="font-size: 11.5px; color: #5A4E47;">
              Rank: <strong>${rhythmRankTitle}</strong> • Active Streak: <strong>${userStreak} Days Unbroken</strong>
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: #2E5A35; margin-bottom: 2px;">
              High Flow Ratio: ${qualityBreakdown[0]?.pct || 0}%
            </div>
            <div style="font-size: 11px; color: #6E5D53;">
              Avg Sprint Length: <strong>${avgSessionDuration} mins</strong>
            </div>
            <div style="font-size: 11px; color: #6E5D53; margin-top: 2px;">
              Peak Day: <strong>${peakDay}</strong>
            </div>
          </div>
        </div>

        <!-- KPI Summary Cards Grid -->
        <div class="grid-kpis no-break">
          <div class="kpi-card">
            <div class="kpi-title">Total Focus Time</div>
            <div class="kpi-val">${activeFocusMinutes}m</div>
            <div class="kpi-sub">${(activeFocusMinutes / 60).toFixed(1)} hrs total</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Active Focus Days</div>
            <div class="kpi-val">${activeDaysCount}</div>
            <div class="kpi-sub">in ${horizonLabel}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Task Velocity</div>
            <div class="kpi-val">${completionPct}%</div>
            <div class="kpi-sub">${tasksCompleted} of ${totalTasks} tasks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Streak Momentum</div>
            <div class="kpi-val">${userStreak}d</div>
            <div class="kpi-sub">Unbroken momentum</div>
          </div>
        </div>

        <!-- SECTION: FOCUS TRENDS & VELOCITY -->
        <div class="section-bar no-break">
          <span>📈 Focus Trends & Velocity</span>
          <span style="font-size: 10px; font-weight: 600; text-transform: none; color: #8A7B73;">Daily Duration & Peak Energy Windows</span>
        </div>

        <div class="two-col no-break">
          <!-- Daily Focus Velocity Table -->
          <div class="panel">
            <div class="panel-heading">
              <span>Daily Focus Duration Breakdown</span>
              <span style="font-size: 10px; color: #CFA052; font-weight: 700;">Peak: ${peakDay}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Day of Week</th>
                  <th>Minutes</th>
                  <th>Hours</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                ${weeklyFocusData
                  .map(
                    (d) => `
                  <tr>
                    <td><strong>${d.day}</strong></td>
                    <td>${d.minutes} mins</td>
                    <td>${(d.minutes / 60).toFixed(1)} hrs</td>
                    <td>${activeFocusMinutes > 0 ? Math.round((d.minutes / activeFocusMinutes) * 100) : 0}%</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Peak Focus Window (Chronobiological) -->
          <div class="panel">
            <div class="panel-heading">
              <span>Peak Chronobiological Energy Windows</span>
              <span style="font-size: 10px; color: #8A7B73;">${totalTimeOfDayMinutes}m total</span>
            </div>
            ${timeOfDayData
              .map((t) => {
                const pct = totalTimeOfDayMinutes > 0 ? Math.round((t.minutes / totalTimeOfDayMinutes) * 100) : 0;
                const color = t.slot === 'Morning' ? '#CFA052' : t.slot === 'Afternoon' ? '#C06C4C' : '#6B8E6E';
                return `
                  <div style="margin-bottom: 10px;">
                    <div class="bar-row">
                      <strong>${t.slot}</strong>
                      <span>${t.minutes} mins (${pct}%)</span>
                    </div>
                    <div class="bar-bg">
                      <div class="bar-fill" style="width: ${pct}%; background: ${color};"></div>
                    </div>
                  </div>
                `;
              })
              .join('')}
            <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #F4EFEB; display: flex; justify-content: space-between; font-size: 10.5px; color: #6E5D53;">
              <span>Avg Session: <strong>${avgSessionDuration} mins</strong></span>
              <span>Peak Day: <strong>${peakDay}</strong></span>
            </div>
          </div>
        </div>

        <!-- SECTION: HABIT CONSISTENCY & ENERGY QUALITY -->
        <div class="section-bar no-break">
          <span>⚡ Habit Consistency & Energy Quality</span>
          <span style="font-size: 10px; font-weight: 600; text-transform: none; color: #8A7B73;">Flow Reflections & Category Allocation</span>
        </div>

        <div class="two-col no-break">
          <!-- Flow Quality Breakdown -->
          <div class="panel">
            <div class="panel-heading">
              <span>Session Flow & Energy Quality</span>
              <span style="font-size: 10px; color: #8A7B73;">${qualityBreakdown.reduce((acc, q) => acc + q.count, 0)} sessions</span>
            </div>
            ${qualityBreakdown
              .map((q) => {
                const color = q.label === 'High Flow' ? '#6B8E6E' : q.label === 'Distracted' ? '#C87D87' : '#CFA052';
                return `
                  <div style="margin-bottom: 10px;">
                    <div class="bar-row">
                      <strong>${q.label}</strong>
                      <span>${q.count} sessions (${q.pct}%)</span>
                    </div>
                    <div class="bar-bg">
                      <div class="bar-fill" style="width: ${q.pct}%; background: ${color};"></div>
                    </div>
                  </div>
                `;
              })
              .join('')}
            <div class="health-banner">
              ✓ Healthy focus-to-recovery ratio maintained.
            </div>
          </div>

          <!-- Category / Habit Allocation -->
          <div class="panel">
            <div class="panel-heading">
              <span>Time & Habit Category Allocation</span>
            </div>
            ${categoryDistribution
              .map((c) => {
                const color = c.name === 'Deep Work' ? '#C06C4C' : c.name === 'Habits & Routines' ? '#8F7A99' : '#CFA052';
                return `
                  <div style="margin-bottom: 10px;">
                    <div class="bar-row">
                      <strong>${c.name}</strong>
                      <span>${c.value}% (${Math.round((activeFocusMinutes * c.value) / 100)}m)</span>
                    </div>
                    <div class="bar-bg">
                      <div class="bar-fill" style="width: ${c.value}%; background: ${color};"></div>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- SECTION: SMART PRODUCTIVITY INSIGHTS -->
        <div class="section-bar no-break">
          <span>💡 Smart Behavioral Insights</span>
        </div>
        <div class="insights-grid no-break">
          ${smartInsights
            .map(
              (i) => `
            <div class="insight-box">
              <div class="insight-title">${i.title}</div>
              <div class="insight-metric">${i.metric}</div>
              <div class="insight-desc">${i.description}</div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- SECTION: FOCUS SESSIONS JOURNAL -->
        <div class="section-bar no-break">
          <span>📝 Detailed Focus Sessions Journal</span>
          <span style="font-size: 10px; font-weight: 600; text-transform: none; color: #8A7B73;">${recentSessions.length} Logged Entries</span>
        </div>

        <div class="panel no-break">
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Task Title</th>
                <th>Duration</th>
                <th>Session Mode</th>
                <th>Flow Quality</th>
              </tr>
            </thead>
            <tbody>
              ${
                recentSessions.length > 0
                  ? recentSessions
                      .map(
                        (s) => `
                    <tr>
                      <td>${s.completedAt}</td>
                      <td><strong>${s.taskTitle || 'Deep Focus Sprint'}</strong></td>
                      <td>${s.durationMinutes} mins</td>
                      <td>${s.mode}</td>
                      <td>
                        <span class="pill ${
                          s.quality === 'high_flow'
                            ? 'pill-sage'
                            : s.quality === 'distracted'
                            ? 'pill-rose'
                            : 'pill-ochre'
                        }">
                          ${s.quality === 'high_flow' ? 'High Flow' : s.quality === 'distracted' ? 'Distracted' : 'Steady Flow'}
                        </span>
                      </td>
                    </tr>
                  `
                      )
                      .join('')
                  : `<tr><td colspan="5" style="text-align: center; color: #888; padding: 14px;">No focus sessions logged in this timeframe.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <span>Taktic Productivity Platform • Private & Sovereign Work Telemetry</span>
          <span>Generated from Verified Activity Logs</span>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;
}

export function exportAnalyticsPdf(params: AnalyticsReportParams): void {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank', 'width=900,height=950');
  if (!printWindow) return;
  const htmlContent = generateAnalyticsReportHtml(params);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

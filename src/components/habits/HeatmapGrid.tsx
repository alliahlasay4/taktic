import React from 'react';
import { Habit } from '../../types';

interface HeatmapGridProps {
  daysCount?: number; // default 90 days
  habits?: Habit[];
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ daysCount = 90, habits = [] }) => {
  // Map completion counts for each date
  const dateCounts: Record<string, number> = {};
  habits.forEach((habit) => {
    (habit.completedDates || []).forEach((dateStr) => {
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });
  });

  // Generate date grid for the last `daysCount` days
  const days = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = dateCounts[dateStr] || 0;

    // Intensity level: 0 to 4
    let intensity = 0;
    if (count >= 4) intensity = 4;
    else if (count === 3) intensity = 3;
    else if (count === 2) intensity = 2;
    else if (count === 1) intensity = 1;

    return {
      date: dateStr,
      count,
      intensity,
    };
  });

  const levelClasses = [
    'bg-[var(--border-subtle)]/40',
    'bg-emerald-500/30',
    'bg-emerald-500/60',
    'bg-emerald-500/90',
    'bg-emerald-400 shadow-sm shadow-emerald-500/30',
  ];

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
            Consistency Rhythm Heatmap (Last 90 Days)
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Visual proof of daily tactical habits & focus discipline.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <span>Less</span>
          {levelClasses.map((cls, idx) => (
            <div key={idx} className={`h-2.5 w-2.5 rounded-xs ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`h-3.5 w-3.5 rounded-xs ${levelClasses[day.intensity]} transition-transform hover:scale-125 cursor-pointer`}
            title={`${day.date}: ${day.count} habit${day.count === 1 ? '' : 's'} completed`}
          />
        ))}
      </div>
    </div>
  );
};


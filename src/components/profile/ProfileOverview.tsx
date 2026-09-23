import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, Badge, HeatmapDay } from '../../types';
import { BadgeCard } from './BadgeCard';
import { Calendar, Award, Zap, Flame, Clock, CheckCircle2, Users, Check } from 'lucide-react';
import {
  fetchProfileStatsFromSupabase,
  fetchProfileHeatmapFromSupabase,
  fetchBadgesWithRealProgress,
  RealProfileStats,
} from '../../lib/profileSupabase';

interface ProfileOverviewProps {
  profile: UserProfile;
}

const HEATMAP_COLORS = [
  'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-muted)]',
  'bg-[var(--accent-terracotta)]/20 border-[var(--accent-terracotta)]/40 text-[var(--accent-terracotta)]',
  'bg-[var(--accent-terracotta)]/40 border-[var(--accent-terracotta)]/60 text-[var(--text-primary)]',
  'bg-[var(--accent-terracotta)]/70 border-[var(--accent-terracotta)] text-white',
  'bg-[var(--accent-terracotta)] border-[var(--accent-terracotta)] text-white shadow-xs',
];

type BadgeCategoryFilter = 'all' | 'unlocked' | 'focus' | 'streak' | 'habit' | 'social';

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ profile }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<BadgeCategoryFilter>('all');

  useEffect(() => {
    let isMounted = true;
    const loadOverviewData = async () => {
      setLoading(true);
      try {
        const stats: RealProfileStats = await fetchProfileStatsFromSupabase(profile.id);
        const [heatmap, badgeList] = await Promise.all([
          fetchProfileHeatmapFromSupabase(profile.id),
          fetchBadgesWithRealProgress(profile.id, stats),
        ]);

        if (isMounted) {
          setHeatmapData(heatmap);
          setBadges(badgeList);
        }
      } catch (err) {
        console.error('Error loading profile overview data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOverviewData();
    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  
  // Calculate active days from heatmap
  const activeDaysCount = useMemo(() => {
    return heatmapData.filter(d => d.count > 0).length;
  }, [heatmapData]);

  const filteredBadges = useMemo(() => {
    if (selectedFilter === 'all') return badges;
    if (selectedFilter === 'unlocked') return badges.filter(b => b.isUnlocked);
    return badges.filter(b => b.category === selectedFilter);
  }, [badges, selectedFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Productivity Heatmap */}
      <div className="p-6 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] space-y-4 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Focus Intensity Heatmap</h3>
                <span className="text-[10px] font-mono text-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/30 px-2 py-0.5 rounded-full font-semibold">
                  {activeDaysCount} / {heatmapData.length || 28} Active Days
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Daily logged focus sessions and habits over the past 4 weeks.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] self-end sm:self-auto">
            <span className="text-[11px] text-[var(--text-muted)]">Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded ${c}`} />
            ))}
            <span className="text-[11px] text-[var(--text-muted)]">More</span>
          </div>
        </div>

        {loading ? (
          <div className="h-16 flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading focus heatmap...
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-2">
            {heatmapData.map((day, idx) => (
              <div
                key={idx}
                className={`h-9 rounded-lg border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                  HEATMAP_COLORS[day.level]
                }`}
                title={`${day.date}: ${day.count} sessions completed`}
              >
                <span className="text-[10px] font-mono opacity-80">{day.date.split('-')[2]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Milestone Badges */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]">
              <Award className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">Milestone Showcase</h3>
              <p className="text-xs text-[var(--text-secondary)]">Achieved milestones and active streak progression.</p>
            </div>
          </div>
          
          {/* Quick Filter Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              All ({badges.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('unlocked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                selectedFilter === 'unlocked'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Check className="w-3 h-3" />
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('focus')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                selectedFilter === 'focus'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Clock className="w-3 h-3" />
              Focus
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('streak')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                selectedFilter === 'streak'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Flame className="w-3 h-3" />
              Streaks
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-24 flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading milestone badges...
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            No badges in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useEffect, useState, useMemo } from 'react';
import { UserProfile, Badge, HeatmapDay } from '../../types';
import { BadgeCard } from './BadgeCard';
import { Calendar, Award, Flame, Clock, Check, ChevronRight } from 'lucide-react';
import {
  fetchProfileStatsFromSupabase,
  fetchProfileHeatmapFromSupabase,
  fetchBadgesWithRealProgress,
  RealProfileStats,
} from '../../lib/profileSupabase';

interface ProfileOverviewProps {
  profile: UserProfile;
  stats?: RealProfileStats;
}

const HEATMAP_COLORS = [
  'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-muted)]',
  'bg-[var(--accent-terracotta)]/20 border-[var(--accent-terracotta)]/40 text-[var(--accent-terracotta)]',
  'bg-[var(--accent-terracotta)]/40 border-[var(--accent-terracotta)]/60 text-[var(--text-primary)]',
  'bg-[var(--accent-terracotta)]/70 border-[var(--accent-terracotta)] text-white',
  'bg-[var(--accent-terracotta)] border-[var(--accent-terracotta)] text-white shadow-xs',
];

type BadgeCategoryFilter = 'all' | 'unlocked' | 'focus' | 'streak' | 'habit' | 'social';

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ profile, stats: initialStats }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>(() => {
    if (profile?.id) {
      const cached = localStorage.getItem(`taktic_profile_heatmap_${profile.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    if (profile?.id) {
      const cached = localStorage.getItem(`taktic_profile_badges_${profile.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (profile?.id) {
      const cachedH = localStorage.getItem(`taktic_profile_heatmap_${profile.id}`);
      const cachedB = localStorage.getItem(`taktic_profile_badges_${profile.id}`);
      if (cachedH && cachedB) return false;
    }
    return true;
  });

  const [selectedFilter, setSelectedFilter] = useState<BadgeCategoryFilter>('all');
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id) return;

    // Fast hydrate from local storage
    const cachedH = localStorage.getItem(`taktic_profile_heatmap_${profile.id}`);
    const cachedB = localStorage.getItem(`taktic_profile_badges_${profile.id}`);
    if (cachedH && cachedB) {
      try {
        const parsedH = JSON.parse(cachedH);
        const parsedB = JSON.parse(cachedB);
        if (Array.isArray(parsedH) && Array.isArray(parsedB)) {
          setHeatmapData(parsedH);
          setBadges(parsedB);
          setLoading(false);
        }
      } catch {}
    }

    const loadOverviewData = async () => {
      try {
        const stats: RealProfileStats = initialStats || await fetchProfileStatsFromSupabase(profile.id);
        const [heatmap, badgeList] = await Promise.all([
          fetchProfileHeatmapFromSupabase(profile.id),
          fetchBadgesWithRealProgress(profile.id, stats),
        ]);

        if (isMounted) {
          setHeatmapData(heatmap);
          setBadges(badgeList);
          localStorage.setItem(`taktic_profile_heatmap_${profile.id}`, JSON.stringify(heatmap));
          localStorage.setItem(`taktic_profile_badges_${profile.id}`, JSON.stringify(badgeList));
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
  }, [profile.id, initialStats]);

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

  // Display top 6 badges initially to avoid wall of cards
  const displayedBadges = useMemo(() => {
    if (showAllBadges || filteredBadges.length <= 6) {
      return filteredBadges;
    }
    return filteredBadges.slice(0, 6);
  }, [filteredBadges, showAllBadges]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 28-Day Productivity Rhythm Heatmap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] space-y-3.5 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/25 text-[var(--accent-terracotta)]">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Focus Consistency</h3>
                <span className="text-[10px] font-mono text-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/25 px-2 py-0.5 rounded-full font-semibold">
                  {activeDaysCount} of {heatmapData.length || 28} Days Active
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">28-day habit and focus session intensity log.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] self-end sm:self-auto font-mono">
            <span className="text-[10px]">Low</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px]">High</span>
          </div>
        </div>

        {loading ? (
          <div className="h-14 flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading activity data...
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
            {heatmapData.map((day, idx) => (
              <div
                key={idx}
                className={`h-8 rounded-lg border flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer ${
                  HEATMAP_COLORS[day.level]
                }`}
                title={`${day.date}: ${day.count} sessions completed`}
              >
                <span className="text-[9px] font-mono opacity-75">{day.date.split('-')[2]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestone & Badges Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/25 text-[var(--accent-terracotta)]">
              <Award className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Milestones & Achievements</h3>
                <span className="text-[10px] font-semibold text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 px-2 py-0.5 rounded-full">
                  {unlockedCount} / {badges.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Recognizing your focus sessions, streaks, and circle contributions.</p>
            </div>
          </div>
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setSelectedFilter('all'); setShowAllBadges(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              All ({badges.length})
            </button>
            <button
              type="button"
              onClick={() => { setSelectedFilter('unlocked'); setShowAllBadges(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                selectedFilter === 'unlocked'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Check className="w-3 h-3" />
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => { setSelectedFilter('focus'); setShowAllBadges(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                selectedFilter === 'focus'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Clock className="w-3 h-3" />
              Focus
            </button>
            <button
              type="button"
              onClick={() => { setSelectedFilter('streak'); setShowAllBadges(false); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                selectedFilter === 'streak'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
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
            Loading badges...
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            No milestones found in this category.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>

            {/* Expand / Collapse Button if badges exceed initial preview count */}
            {filteredBadges.length > 6 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--card-surface)] hover:bg-[var(--card-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] shadow-2xs transition-all cursor-pointer"
                >
                  <span>{showAllBadges ? 'Show Less' : `View All ${filteredBadges.length} Badges`}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllBadges ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BadgeCard } from './profile/BadgeCard';
import { ProfileSettings } from './profile/ProfileSettings';
import { 
  fetchProfileStatsFromSupabase, 
  fetchProfileHeatmapFromSupabase,
  fetchBadgesWithRealProgress,
  RealProfileStats 
} from '../lib/profileSupabase';
import { HeatmapDay, Badge } from '../types';
import { 
  Flame, 
  Clock, 
  ShieldCheck, 
  Camera, 
  Copy, 
  Check, 
  EyeOff,
  Activity,
  Award,
  SlidersHorizontal,
  Calendar,
  ChevronRight,
  Edit3,
  Share2
} from 'lucide-react';

const HEATMAP_COLORS = [
  'bg-[var(--card-hover)] border-[var(--border-subtle)] text-[var(--text-muted)]',
  'bg-[var(--accent-terracotta)]/20 border-[var(--accent-terracotta)]/40 text-[var(--accent-terracotta)]',
  'bg-[var(--accent-terracotta)]/40 border-[var(--accent-terracotta)]/60 text-[var(--text-primary)]',
  'bg-[var(--accent-terracotta)]/70 border-[var(--accent-terracotta)] text-white',
  'bg-[var(--accent-terracotta)] border-[var(--accent-terracotta)] text-white shadow-xs',
];

type CommandDeckTab = 'rhythm' | 'badges' | 'settings';
type BadgeFilter = 'all' | 'unlocked' | 'focus' | 'streak';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<CommandDeckTab>('rhythm');
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareProfile = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const [stats, setStats] = useState<RealProfileStats>(() => {
    if (profile?.id) {
      const cached = localStorage.getItem(`taktic_profile_stats_${profile.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return {
      totalFocusHours: 0,
      totalFocusSessions: 0,
      completedHabitsCount: 0,
      currentStreak: 0,
      ringsRatePercent: 0,
    };
  });

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

  const [loading, setLoading] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');
  const [showAllBadges, setShowAllBadges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [realStats, realHeatmap] = await Promise.all([
          fetchProfileStatsFromSupabase(profile.id),
          fetchProfileHeatmapFromSupabase(profile.id),
        ]);
        const realBadges = await fetchBadgesWithRealProgress(profile.id, realStats);

        if (isMounted) {
          setStats(realStats);
          setHeatmapData(realHeatmap);
          setBadges(realBadges);
          localStorage.setItem(`taktic_profile_stats_${profile.id}`, JSON.stringify(realStats));
          localStorage.setItem(`taktic_profile_heatmap_${profile.id}`, JSON.stringify(realHeatmap));
          localStorage.setItem(`taktic_profile_badges_${profile.id}`, JSON.stringify(realBadges));
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateProfile({ avatarUrl: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(profile.username);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  const activeDaysCount = useMemo(() => {
    return heatmapData.filter((d) => d.count > 0).length;
  }, [heatmapData]);

  const unlockedCount = useMemo(() => {
    return badges.filter((b) => b.isUnlocked).length;
  }, [badges]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'all') return badges;
    if (badgeFilter === 'unlocked') return badges.filter((b) => b.isUnlocked);
    return badges.filter((b) => b.category === badgeFilter);
  }, [badges, badgeFilter]);

  const displayedBadges = useMemo(() => {
    if (showAllBadges || filteredBadges.length <= 6) return filteredBadges;
    return filteredBadges.slice(0, 6);
  }, [filteredBadges, showAllBadges]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. Clean Profile Identity Card (No floating metric pills) */}
      <div className="rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] p-5 shadow-xs transition-colors duration-300">
        <div className="flex items-start sm:items-center gap-4">
          {/* Avatar with status */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Click to update picture"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[var(--border-subtle)] shadow-2xs group-hover:brightness-95 transition"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-200">
              <Camera className="w-4 h-4" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            {profile.privacySettings?.isIncognito ? (
              <div 
                className="absolute -bottom-1 -right-1 bg-[var(--card-surface)] text-[var(--accent-warm-ochre)] border border-[var(--border-subtle)] p-1 rounded-full shadow-xs" 
                title="Incognito Active"
              >
                <EyeOff className="w-2.5 h-2.5 text-[var(--accent-warm-ochre)]" />
              </div>
            ) : (
              <div 
                className="absolute -bottom-1 -right-1 bg-[var(--card-surface)] text-[var(--accent-botanical-sage)] border border-[var(--border-subtle)] p-1 rounded-full shadow-xs flex items-center justify-center" 
                title="Active"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--accent-botanical-sage)] block" />
              </div>
            )}
          </div>

          {/* Identity Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold font-heading text-[var(--text-primary)] tracking-tight">
                {profile.fullName || 'Taktic Member'}
              </h1>

              <button
                type="button"
                onClick={copyUsername}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Copy username"
              >
                <span>{profile.username || '@member'}</span>
                {copiedHandle ? (
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-50" />
                )}
              </button>

              {profile.privacySettings?.isIncognito ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Incognito
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Right-Side Quick Actions & Metadata */}
          <div className="flex flex-col sm:items-end justify-center gap-2 shrink-0 self-stretch sm:self-auto sm:border-l sm:border-[var(--border-subtle)]/70 sm:pl-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]/70">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--card-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:border-[var(--accent-terracotta)]/40 active:scale-95"
                title="Edit profile settings"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Share or copy profile link"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Segmented Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] shadow-2xs w-full sm:w-fit" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rhythm'}
          onClick={() => setActiveTab('rhythm')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
            activeTab === 'rhythm'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activity & Rhythm</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'badges'}
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
            activeTab === 'badges'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Milestones ({unlockedCount})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-initial justify-center ${
            activeTab === 'settings'
              ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Account & Preferences</span>
        </button>
      </div>

      {/* 3. Dedicated Modular Content Views */}
      <div className="transition-all duration-200">
        {/* Tab 1: Activity & Rhythm */}
        {activeTab === 'rhythm' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 28-Day Consistency Map (Clean: only active days count & legend, NO duplicate metrics) */}
            <div className="p-5 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/25 text-[var(--accent-terracotta)]">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">28-Day Consistency Map</h3>
                      <span className="text-[10px] font-mono text-[var(--accent-botanical-sage)] bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/25 px-2 py-0.5 rounded-full font-semibold">
                        {activeDaysCount} / {heatmapData.length || 28} Active Days
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Daily log of completed habits and deep focus sessions.</p>
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
                  Loading rhythm data...
                </div>
              ) : (
                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-1">
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

            {/* Performance Cards (Fills the space below naturally with 3 dedicated metric cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Streak Card */}
              <div className="p-4 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Active Streak</span>
                  <div className="p-1.5 rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/25">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.currentStreak} <span className="text-sm font-normal text-[var(--text-muted)]">Days</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Consecutive daily engagement</p>
                </div>
              </div>

              {/* Deep Focus Card */}
              <div className="p-4 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Deep Focus</span>
                  <div className="p-1.5 rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/25">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.totalFocusHours} <span className="text-sm font-normal text-[var(--text-muted)]">hrs</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Across {stats.totalFocusSessions} logged sessions</p>
                </div>
              </div>

              {/* Habit Rings Rate Card */}
              <div className="p-4 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Rings Closed</span>
                  <div className="p-1.5 rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/25">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {stats.ringsRatePercent}<span className="text-sm font-normal text-[var(--text-muted)]">%</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{stats.completedHabitsCount} habits completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Milestones Showcase */}
        {activeTab === 'badges' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--accent-terracotta)]" />
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Achievement Showcase</h3>
                <span className="text-xs font-mono text-[var(--text-muted)]">({unlockedCount} of {badges.length} Unlocked)</span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'unlocked', 'focus', 'streak'] as BadgeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => { setBadgeFilter(filter); setShowAllBadges(false); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      badgeFilter === filter
                        ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                        : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {filter === 'all' ? `All (${badges.length})` : filter === 'unlocked' ? `Unlocked (${unlockedCount})` : filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredBadges.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                No badges found in this category.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>

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
        )}

        {/* Tab 3: Dedicated Account & Preferences */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <ProfileSettings profile={profile} onSave={updateProfile} />
          </div>
        )}
      </div>
    </div>
  );
};

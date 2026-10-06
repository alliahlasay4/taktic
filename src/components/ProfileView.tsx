import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProfileOverview } from './profile/ProfileOverview';
import { ProfileSettings } from './profile/ProfileSettings';
import { fetchProfileStatsFromSupabase, RealProfileStats } from '../lib/profileSupabase';
import { Flame, Clock, ShieldCheck, Volume2, Sparkles, Target, Edit3, User, Settings, Camera, Copy, Check, EyeOff } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'settings'>('overview');
  const [copiedHandle, setCopiedHandle] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!profile?.id) return;

    // Check cached stats for fast hydration
    const cached = localStorage.getItem(`taktic_profile_stats_${profile.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) setStats(parsed);
      } catch {}
    }

    const loadStats = async () => {
      const realStats = await fetchProfileStatsFromSupabase(profile.id);
      if (isMounted) {
        setStats(realStats);
        localStorage.setItem(`taktic_profile_stats_${profile.id}`, JSON.stringify(realStats));
      }
    };
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  const handleHeaderAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (e.g., JPG, PNG, WEBP).');
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

  const copyUsernameToClipboard = () => {
    navigator.clipboard.writeText(profile.username);
    setCopiedHandle(true);
    setTimeout(() => setCopiedHandle(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Cover Banner & Identity Header */}
      <div className="relative rounded-2xl bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden shadow-xs transition-colors duration-300">
        {/* Cover Gradient Mesh Banner */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-[var(--accent-terracotta)]/25 via-[var(--accent-dusty-rose)]/20 to-[var(--accent-warm-ochre)]/20 border-b border-[var(--border-subtle)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-dusty-rose)]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[var(--accent-warm-ochre)]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Identity Details Row (Overlapping Avatar) */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
              <div
                className="-mt-14 sm:-mt-16 relative group cursor-pointer shrink-0 z-10"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload picture"
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[var(--card-surface)] shadow-lg bg-[var(--card-surface)] group-hover:opacity-85 transition ring-1 ring-black/5 dark:ring-white/10"
                />
                <div className="absolute inset-0 rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderAvatarUpload}
                  className="hidden"
                />
                {profile.privacySettings?.isIncognito ? (
                  <div className="absolute -bottom-1 -right-1 bg-[var(--card-surface)]/95 backdrop-blur-sm text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/40 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs pointer-events-none uppercase tracking-wider">
                    <EyeOff className="w-2.5 h-2.5 text-[var(--accent-warm-ochre)]" />
                    <span>Incognito</span>
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 bg-[var(--card-surface)]/95 backdrop-blur-sm text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/40 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs pointer-events-none uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-pulse" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              <div className="pt-2 sm:pt-4 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text-primary)] tracking-tight">{profile.fullName}</h1>

                  {/* Copyable username badge */}
                  <button
                    type="button"
                    onClick={copyUsernameToClipboard}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 hover:bg-[var(--accent-terracotta)]/25 px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer"
                    title="Click to copy handle"
                  >
                    <span>{profile.username}</span>
                    {copiedHandle ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                    )}
                  </button>
                </div>

                {profile.statusMessage && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-terracotta)] mt-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} />
                    <span>{profile.statusMessage.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|⚡/gu, '').trim()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 sm:pt-4 sm:self-end">
              <button
                type="button"
                onClick={() => setActiveSubTab(activeSubTab === 'overview' ? 'settings' : 'overview')}
                className="flex items-center gap-2 px-4 py-2 min-h-[42px] rounded-xl bg-[var(--card-hover)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold transition-all shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                {activeSubTab === 'overview' ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
                    <span>Edit Profile</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
                    <span>View Showcase</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bio & Micro Goal */}
          {profile.bio && <p className="text-sm text-[var(--text-secondary)] max-w-2xl mb-3 leading-relaxed">{profile.bio}</p>}

          {profile.microGoal && profile.privacySettings.showMicroGoal && (
            <div className="inline-flex items-center gap-2 text-xs bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/25 px-3 py-1.5 rounded-xl text-[var(--accent-terracotta)]">
              <Target className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[var(--text-secondary)]">Daily Goal:</span>
              <span className="font-semibold">{profile.microGoal}</span>
            </div>
          )}
        </div>

        {/* Minimal Floating Stats Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/50 divide-x divide-y sm:divide-y-0 divide-[var(--border-subtle)]">
          {profile.privacySettings.showStreak && (
            <div className="p-3.5 flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2 rounded-lg bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30">
                <Flame className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{stats.currentStreak} Days</div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-heading">Active Streak</div>
              </div>
            </div>
          )}

          {profile.privacySettings.showFocusHours && (
            <div className="p-3.5 flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2 rounded-lg bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30">
                <Clock className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{stats.totalFocusHours} hrs</div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-heading">Deep Focus</div>
              </div>
            </div>
          )}

          <div className="p-3.5 flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-lg bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/30">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{stats.ringsRatePercent}%</div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-heading">Rings Rate</div>
            </div>
          </div>

          <div className="p-3.5 flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2 rounded-lg bg-[var(--accent-dusty-rose)]/15 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30">
              <Volume2 className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[120px]">
                {profile.favoriteSoundscape || 'Gentle Rain'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-heading">Soundscape</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Underline Tab Bar */}
      <div className="flex items-center border-b border-[var(--border-subtle)] gap-6 px-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'overview'}
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-all relative min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${activeSubTab === 'overview'
              ? 'text-[var(--accent-terracotta)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          <User className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          <span>Overview & Activity</span>
          {activeSubTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-terracotta)] rounded-full shadow-xs" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'settings'}
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-all relative min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${activeSubTab === 'settings'
              ? 'text-[var(--accent-terracotta)] font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
          <Settings className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          <span>Account & Preferences</span>
          {activeSubTab === 'settings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-terracotta)] rounded-full shadow-xs" />
          )}
        </button>
      </div>

      {/* Sub-Tab Content Rendering */}
      {activeSubTab === 'overview' ? (
        <ProfileOverview profile={profile} />
      ) : (
        <ProfileSettings profile={profile} onSave={updateProfile} />
      )}
    </div>
  );
};

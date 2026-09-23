import React, { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Clock,
  Repeat,
  Users,
  BarChart3,
  User,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Music,
  Plus,
  CloudRain,
  Waves,
  Headphones,
  Coffee,
  Leaf,
  Target,
  Menu,
  X,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { ActiveTab, CircleMember } from '../../types';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../lib/utils';
import { soundEngine } from '../../lib/audio';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayFocusCount: number;
  inboxCount: number;
  totalFocusMinutesToday: number;
  members: CircleMember[];
  onQuickAddTask?: (title: string) => void;
  onFocusComplete?: (durationMinutes: number, taskTitle?: string) => void;
  activeSoundscape?: string | null;
  setActiveSoundscape?: (sound: string | null) => void;
}

const SIDEBAR_SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Rain', icon: CloudRain },
  { id: 'Ocean Waves', label: 'Ocean', icon: Waves },
  { id: 'Lo-Fi Autumn Beats', label: 'Lo-Fi', icon: Headphones },
  { id: 'Coffee Shop Ambience', label: 'Cafe', icon: Coffee },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayFocusCount,
  inboxCount,
  totalFocusMinutesToday,
  members,
  onQuickAddTask,
  activeSoundscape,
  setActiveSoundscape,
}) => {
  // Global Timer Context & User Profile
  const { timeLeft, isRunning, toggleTimer, resetTimer, selectedTask, mode } = useTimer();
  const { profile } = useAuth();

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activePartners = members.filter((m) => m.status === 'focusing');
  const ringProgressPercent = Math.min(100, Math.round((totalFocusMinutesToday / 100) * 100));

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Focus Hub',
      icon: LayoutDashboard,
      badge: todayFocusCount > 0 ? `${todayFocusCount} Focus` : undefined,
      badgeColor: 'bg-[var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/30',
    },
    {
      id: 'inbox' as ActiveTab,
      label: 'Inbox & Planning',
      icon: Inbox,
      badge: inboxCount > 0 ? `${inboxCount}` : undefined,
      badgeColor: 'bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30',
    },
    {
      id: 'focus' as ActiveTab,
      label: 'Deep Focus Mode',
      icon: Clock,
      badge: 'Timer',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'habits' as ActiveTab,
      label: 'Habit Rings',
      icon: Repeat,
      badge: null,
    },
    {
      id: 'circles' as ActiveTab,
      label: 'Social Circles',
      icon: Users,
      badge: activePartners.length > 0 ? `${activePartners.length} Active` : undefined,
      badgeColor: 'bg-[var(--accent-dusty-rose)]/20 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Insights & Recap',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'archive' as ActiveTab,
      label: 'Archive & History',
      icon: Archive,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Trigger Bar (Visible only on < 1024px viewports) */}
      <div className="flex items-center justify-between lg:hidden w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 shadow-xs mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading font-bold text-[var(--text-primary)]">
            Menu Navigation
          </span>
          <span className="rounded-full bg-[var(--accent-terracotta)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-terracotta)]">
            {activeTab === 'profile' ? 'My Profile' : navItems.find((n) => n.id === activeTab)?.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-primary)] hover:bg-[var(--card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Close Navigation Drawer' : 'Open Navigation Drawer'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Sidebar (Desktop persistent, Mobile drawer backdrop) */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-sm overflow-y-auto' : 'hidden'
        } lg:block lg:static lg:z-auto lg:p-0 lg:bg-transparent w-full lg:w-64 shrink-0 space-y-6 transition-all duration-300`}
      >
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 shadow-xs space-y-4 transition-colors duration-300 max-w-sm lg:max-w-none mx-auto">
          {/* Mobile Drawer Close Header */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-heading font-bold text-[var(--text-primary)]">
              Tactical Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 font-heading">
            Navigation
          </div>

          {/* Primary Navigation Items */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full min-h-[44px] flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[var(--text-muted)]'
                      }`}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        isActive
                          ? 'bg-white text-[var(--accent-terracotta)] shadow-xs border border-white/60'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <hr className="border-[var(--border-subtle)]" />

          {/* Quick Task Capture Widget */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-terracotta)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
              <span>Quick Task Capture</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim() && onQuickAddTask) {
                  onQuickAddTask(quickTaskTitle.trim());
                  setQuickTaskTitle('');
                }
              }}
              className="flex items-center gap-1.5"
            >
              <input
                id="quick-capture-task-input"
                name="quickTaskTitle"
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Capture task..."
                aria-label="Quick capture task input"
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-colors min-h-[40px]"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-terracotta)] text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-xs min-h-[40px] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Add Quick Task"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* Mini Ambient Audio Player Widget */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Music className="w-3.5 h-3.5 text-[var(--accent-warm-ochre)]" strokeWidth={1.5} aria-hidden="true" />
                <span>Ambient Audio</span>
              </div>
              {activeSoundscape ? (
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Playing
                </span>
              ) : (
                <span className="text-[10px] text-[var(--text-muted)] font-medium">Off</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {SIDEBAR_SOUNDSCAPES.map((snd) => {
                const isActive = activeSoundscape === snd.id;
                const SndIcon = snd.icon;
                return (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        soundEngine.stopSoundscape();
                        if (setActiveSoundscape) setActiveSoundscape(null);
                      } else {
                        soundEngine.playSoundscape(snd.id);
                        if (setActiveSoundscape) setActiveSoundscape(snd.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-left text-xs transition-all min-h-[40px] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isActive
                        ? 'border-[var(--accent-warm-ochre)] bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] font-semibold shadow-xs ring-1 ring-[var(--accent-warm-ochre)]/30'
                        : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                    }`}
                    title={snd.id}
                  >
                    <SndIcon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-warm-ochre)]" strokeWidth={1.5} aria-hidden="true" />
                    <span className="truncate text-[11px]">{snd.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[var(--border-subtle)]" />

          {/* Mini Focus Timer Widget */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-terracotta)]">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Mini Focus Timer</span>
              </div>
              {isRunning && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Focusing'}
                </span>
              )}
            </div>

            <div className="text-center py-1">
              <div className="text-2xl font-bold font-mono tracking-wider text-[var(--text-primary)]">
                {formatTime(timeLeft)}
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)] font-medium truncate px-1 flex items-center justify-center gap-1">
                {mode === 'shortBreak' ? (
                  <>
                    <Coffee className="h-3 w-3 text-amber-500 inline" strokeWidth={1.5} aria-hidden="true" />
                    <span>Short Break</span>
                  </>
                ) : mode === 'longBreak' ? (
                  <>
                    <Leaf className="h-3 w-3 text-emerald-500 inline" strokeWidth={1.5} aria-hidden="true" />
                    <span>Long Break</span>
                  </>
                ) : selectedTask ? (
                  <>
                    <Target className="h-3 w-3 text-[var(--accent-terracotta)] inline" strokeWidth={1.5} aria-hidden="true" />
                    <span className="truncate">{selectedTask.title}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 text-[var(--accent-warm-ochre)] inline" strokeWidth={1.5} aria-hidden="true" />
                    <span>Deep Focus Session</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTimer}
                className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isRunning
                    ? 'bg-[var(--accent-warm-ochre)]/20 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/40 hover:bg-[var(--accent-warm-ochre)]/30'
                    : 'bg-[var(--accent-terracotta)] text-white hover:opacity-90 shadow-xs'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" /> : <Play className="w-3.5 h-3.5 fill-current" strokeWidth={1.5} aria-hidden="true" />}
                {isRunning ? 'Pause' : 'Start'}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Reset Focus Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Daily Ring Goal Widget */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Daily Focus Goal</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{totalFocusMinutesToday} / 100m</span>
            </div>
            <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--accent-warm-ochre)] via-[var(--accent-terracotta)] to-[var(--accent-dusty-rose)] h-full transition-all duration-500 rounded-full"
                style={{ width: `${ringProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Live Active Partners Snapshot */}
          {activePartners.length > 0 && (
            <div className="p-3 rounded-xl bg-[var(--accent-dusty-rose)]/10 border border-[var(--accent-dusty-rose)]/25 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent-dusty-rose)]">
                <Sparkles className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                <span>Circle Partners Focusing Now</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {activePartners.map((member) => (
                  <img
                    key={member.id}
                    src={member.avatar}
                    alt={member.name}
                    title={`${member.name} is focusing (${member.microGoal || 'Deep Work'})`}
                    className="w-7 h-7 rounded-lg object-cover border border-[var(--accent-dusty-rose)]/40 shadow-xs"
                  />
                ))}
              </div>
            </div>
          )}

          <hr className="border-[var(--border-subtle)]" />

          {/* Pinned User Profile Identity Footer Card (Intuitive Bottom Placement) */}
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'profile'
                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--text-primary)] shadow-xs'
                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="View or Edit Profile"
            aria-label="Go to My Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-8 h-8 rounded-lg object-cover border border-[var(--border-subtle)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--card-surface)] rounded-full" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{profile.fullName}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">{profile.username}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
              activeTab === 'profile' ? 'text-[var(--accent-terracotta)] translate-x-0.5' : 'text-[var(--text-muted)]'
            }`} />
          </button>
        </div>
      </aside>
    </>
  );
};


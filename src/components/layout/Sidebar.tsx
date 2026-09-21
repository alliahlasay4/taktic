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
} from 'lucide-react';
import { ActiveTab, CircleMember } from '../../types';
import { useTimer } from '../../context/TimerContext';
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
  { id: 'Gentle Rain', label: 'Rain', icon: '🌧️' },
  { id: 'Ocean Waves', label: 'Ocean', icon: '🌊' },
  { id: 'Lo-Fi Autumn Beats', label: 'Lo-Fi', icon: '🎧' },
  { id: 'Coffee Shop Ambience', label: 'Cafe', icon: '☕' },
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
  // Global Timer Context
  const { timeLeft, isRunning, toggleTimer, resetTimer, selectedTask, mode } = useTimer();

  const [quickTaskTitle, setQuickTaskTitle] = useState('');

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
      id: 'profile' as ActiveTab,
      label: 'My Profile',
      icon: User,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      {/* Primary Navigation Menu */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 shadow-sm space-y-4 transition-colors duration-300">
        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 font-heading">
          Navigation
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
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
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <hr className="border-[var(--border-subtle)]" />

        {/* 2-Sec Quick Capture Widget */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/70 border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-terracotta)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2-Sec Quick Capture</span>
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
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="Capture task..."
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] transition-colors"
            />
            <button
              type="submit"
              disabled={!quickTaskTitle.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-terracotta)] text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-xs"
              title="Quick Add Task"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Small Ambient Audio Player Widget */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Music className="w-3.5 h-3.5 text-[#CFA052]" />
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
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-xs transition-all ${
                    isActive
                      ? 'border-[#CFA052] bg-[#CFA052]/15 text-[#CFA052] font-semibold shadow-xs ring-1 ring-[#CFA052]/30'
                      : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                  }`}
                  title={snd.id}
                >
                  <span className="text-xs shrink-0">{snd.icon}</span>
                  <span className="truncate text-[11px]">{snd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-[var(--border-subtle)]" />

        {/* Mini Focus Timer Widget */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-terracotta)]">
              <Clock className="w-3.5 h-3.5" />
              <span>Mini Focus Timer</span>
            </div>
            {isRunning && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {mode === 'shortBreak' ? 'Short Break ☕' : mode === 'longBreak' ? 'Long Break 🌿' : 'Focusing'}
              </span>
            )}
          </div>

          <div className="text-center py-1">
            <div className="text-2xl font-bold font-mono tracking-wider text-[var(--text-primary)]">
              {formatTime(timeLeft)}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)] font-medium truncate px-1">
              {selectedTask ? `🎯 ${selectedTask.title}` : mode === 'shortBreak' ? '☕ Short Break' : mode === 'longBreak' ? '🌿 Long Break' : '✨ Deep Focus Session'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isRunning
                  ? 'bg-[#CFA052]/20 text-[#CFA052] border border-[#CFA052]/30 hover:bg-[#CFA052]/30'
                  : 'bg-[var(--accent-terracotta)] text-white hover:opacity-90 shadow-xs'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              onClick={resetTimer}
              className="p-1.5 rounded-lg bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Ring Goal Widget */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-subtle)] space-y-2">
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
              <Sparkles className="w-3 h-3" />
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
      </div>
    </aside>
  );
};

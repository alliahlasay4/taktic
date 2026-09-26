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
  Calendar,
  Sun,
  Sunrise,
  Moon,
  Zap,
} from 'lucide-react';
import { ActiveTab, CircleMember } from '../../types';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../lib/utils';
import { soundEngine } from '../../lib/audio';

export interface QuickTaskPayload {
  title: string;
  dueDate?: string;
  isTodayFocus?: boolean;
  timeBlock?: 'morning' | 'afternoon' | 'evening';
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  tags?: string[];
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayFocusCount: number;
  inboxCount: number;
  totalFocusMinutesToday: number;
  members: CircleMember[];
  onQuickAddTask?: (taskData: QuickTaskPayload) => void;
  onFocusComplete?: (durationMinutes: number, taskTitle?: string) => void;
  activeSoundscape?: string | null;
  setActiveSoundscape?: (sound: string | null) => void;
}

interface SlashCommand {
  id: string;
  token: string;
  label: string;
  category: 'Date' | 'Time Block' | 'Priority' | 'Duration';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  // Schedule / Dates
  {
    id: 'today',
    token: '/today',
    label: 'Due Today',
    category: 'Date',
    description: "Add to today's focus queue",
    icon: Calendar,
    color: 'text-[var(--accent-terracotta)]',
  },
  {
    id: 'tomorrow',
    token: '/tomorrow',
    label: 'Due Tomorrow',
    category: 'Date',
    description: 'Schedule for tomorrow',
    icon: Calendar,
    color: 'text-[var(--accent-warm-ochre)]',
  },
  {
    id: 'next-week',
    token: '/next-week',
    label: 'Next Week',
    category: 'Date',
    description: 'Schedule for next Monday',
    icon: Calendar,
    color: 'text-[var(--accent-botanical-sage)]',
  },
  // Time Blocks
  {
    id: 'morning',
    token: '/morning',
    label: 'Morning Block',
    category: 'Time Block',
    description: '5:00 AM – 12:00 PM',
    icon: Sunrise,
    color: 'text-amber-500',
  },
  {
    id: 'afternoon',
    token: '/afternoon',
    label: 'Afternoon Block',
    category: 'Time Block',
    description: '12:00 PM – 5:00 PM',
    icon: Sun,
    color: 'text-orange-500',
  },
  {
    id: 'evening',
    token: '/evening',
    label: 'Evening Block',
    category: 'Time Block',
    description: '5:00 PM – 10:00 PM',
    icon: Moon,
    color: 'text-indigo-400',
  },
  // Priority
  {
    id: 'urgent',
    token: '/urgent',
    label: 'Urgent / High Priority',
    category: 'Priority',
    description: 'Flag as urgent task',
    icon: Zap,
    color: 'text-red-500',
  },
  {
    id: 'medium',
    token: '/medium',
    label: 'Medium Priority',
    category: 'Priority',
    description: 'Standard priority',
    icon: Target,
    color: 'text-amber-500',
  },
  {
    id: 'low',
    token: '/low',
    label: 'Low Priority',
    category: 'Priority',
    description: 'Backlog / low priority',
    icon: Sparkles,
    color: 'text-slate-400',
  },
  // Sprint Duration
  {
    id: '15m',
    token: '/15m',
    label: '15 Mins Sprint',
    category: 'Duration',
    description: 'Quick micro sprint',
    icon: Clock,
    color: 'text-emerald-500',
  },
  {
    id: '25m',
    token: '/25m',
    label: '25 Mins (Standard)',
    category: 'Duration',
    description: 'Standard Pomodoro sprint',
    icon: Clock,
    color: 'text-[var(--accent-warm-ochre)]',
  },
  {
    id: '50m',
    token: '/50m',
    label: '50 Mins Deep Work',
    category: 'Duration',
    description: 'Extended deep focus sprint',
    icon: Clock,
    color: 'text-[var(--accent-terracotta)]',
  },
];

export const parseQuickTaskInput = (rawInput: string): QuickTaskPayload => {
  const currentHour = new Date().getHours();
  let timeBlock: 'morning' | 'afternoon' | 'evening' =
    currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let dueDate: string = todayStr;
  let isTodayFocus: boolean = true;
  let priority: 'low' | 'medium' | 'high' = 'medium';
  let estimatedMinutes = 25;
  const tags = ['Quick Capture'];

  let text = rawInput;

  // 1. Scheduled Dates Detection
  if (/\/(tomorrow|tmrw)\b/i.test(text) || /\b(tomorrow|tmrw)\b/i.test(text)) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    dueDate = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
    isTodayFocus = false;
    text = text.replace(/\/(tomorrow|tmrw)\b/gi, '').replace(/\b(tomorrow|tmrw)\b/gi, '');
  } else if (/\/(next-week|nextweek)\b/i.test(text) || /\bnext week\b/i.test(text)) {
    const nextWk = new Date();
    const day = nextWk.getDay();
    const diff = day === 0 ? 1 : 8 - day; // next Monday
    nextWk.setDate(nextWk.getDate() + diff);
    dueDate = `${nextWk.getFullYear()}-${String(nextWk.getMonth() + 1).padStart(2, '0')}-${String(nextWk.getDate()).padStart(2, '0')}`;
    isTodayFocus = false;
    text = text.replace(/\/(next-week|nextweek)\b/gi, '').replace(/\bnext week\b/gi, '');
  } else if (/\/(today|tonight)\b/i.test(text) || /\b(today|tonight)\b/i.test(text)) {
    dueDate = todayStr;
    isTodayFocus = true;
    if (/\/(tonight)\b/i.test(text) || /\btonight\b/i.test(text)) {
      timeBlock = 'evening';
    }
    text = text.replace(/\/(today|tonight)\b/gi, '').replace(/\b(today|tonight)\b/gi, '');
  }

  // 2. Time-of-Day Block Detection
  if (/\/morning\b/i.test(text) || /\bmorning\b/i.test(text)) {
    timeBlock = 'morning';
    text = text.replace(/\/morning\b/gi, '').replace(/\bmorning\b/gi, '');
  } else if (/\/afternoon\b/i.test(text) || /\bafternoon\b/i.test(text)) {
    timeBlock = 'afternoon';
    text = text.replace(/\/afternoon\b/gi, '').replace(/\bafternoon\b/gi, '');
  } else if (/\/evening\b/i.test(text) || /\bevening\b/i.test(text)) {
    timeBlock = 'evening';
    text = text.replace(/\/evening\b/gi, '').replace(/\bevening\b/gi, '');
  }

  // 3. Priority Detection
  if (/\/(urgent|high)\b/i.test(text) || /\b(urgent|high priority)\b/i.test(text)) {
    priority = 'high';
    text = text.replace(/\/(urgent|high)\b/gi, '').replace(/\b(urgent|high priority)\b/gi, '');
  } else if (/\/low\b/i.test(text) || /\blow priority\b/i.test(text)) {
    priority = 'low';
    text = text.replace(/\/low\b/gi, '').replace(/\blow priority\b/gi, '');
  } else if (/\/medium\b/i.test(text)) {
    priority = 'medium';
    text = text.replace(/\/medium\b/gi, '');
  }

  // 4. Sprint Duration Detection
  const estMatch = text.match(/\/(\d+)m\b/i) || text.match(/\b(\d+)\s*(?:mins?|minutes)\b/i);
  if (estMatch && estMatch[1]) {
    estimatedMinutes = parseInt(estMatch[1], 10) || 25;
    text = text.replace(/\/(\d+)m\b/gi, '').replace(/\b(\d+)\s*(?:mins?|minutes)\b/gi, '');
  }

  // Clean title
  const cleanTitle = text.replace(/\s+/g, ' ').trim() || rawInput.trim();

  return {
    title: cleanTitle,
    dueDate,
    isTodayFocus,
    timeBlock,
    priority,
    estimatedMinutes,
    tags,
  };
};

const SIDEBAR_SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Rain', icon: CloudRain },
  { id: 'Ocean Waves', label: 'Ocean', icon: Waves },
  { id: 'Warm Chords', label: 'Chords', icon: Headphones },
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
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activePartners = members.filter((m) => m.status === 'focusing');
  const ringProgressPercent = Math.min(100, Math.round((totalFocusMinutesToday / 100) * 100));

  // Slash commands calculation
  const slashIndex = quickTaskTitle.lastIndexOf('/');
  const isSlashActive = isSlashMenuOpen && slashIndex !== -1;
  const slashQuery = slashIndex !== -1 ? quickTaskTitle.slice(slashIndex + 1).toLowerCase() : '';

  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.token.slice(1).toLowerCase().startsWith(slashQuery) ||
      cmd.label.toLowerCase().includes(slashQuery) ||
      cmd.category.toLowerCase().includes(slashQuery)
  );

  const applySlashCommand = (cmd: SlashCommand) => {
    if (slashIndex === -1) return;
    const before = quickTaskTitle.slice(0, slashIndex);
    const nextValue = `${before}${cmd.token} `;
    setQuickTaskTitle(nextValue);
    setIsSlashMenuOpen(false);
    setSelectedSlashIndex(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQuickTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSlashActive && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Tab') {
        if (filteredCommands[selectedSlashIndex]) {
          e.preventDefault();
          applySlashCommand(filteredCommands[selectedSlashIndex]);
          return;
        }
      }
      if (e.key === 'Enter') {
        // If query is actively matching and not exact full token, apply token on Enter
        if (slashQuery.length > 0 && filteredCommands[selectedSlashIndex]) {
          const exactTokenTyped = filteredCommands.some((c) => c.token === `/${slashQuery}`);
          if (!exactTokenTyped) {
            e.preventDefault();
            applySlashCommand(filteredCommands[selectedSlashIndex]);
            return;
          }
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSlashMenuOpen(false);
        return;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickTaskTitle(val);
    const lastSlash = val.lastIndexOf('/');
    if (lastSlash !== -1 && (lastSlash === 0 || val[lastSlash - 1] === ' ')) {
      setIsSlashMenuOpen(true);
      setSelectedSlashIndex(0);
    } else {
      setIsSlashMenuOpen(false);
    }
  };

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
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2 relative">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-terracotta)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-terracotta)]" strokeWidth={1.5} aria-hidden="true" />
              <span>Quick Task Capture</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim() && onQuickAddTask) {
                  const parsed = parseQuickTaskInput(quickTaskTitle.trim());
                  onQuickAddTask(parsed);
                  setQuickTaskTitle('');
                  setIsSlashMenuOpen(false);
                }
              }}
              className="relative"
            >
              {/* Slash Command Dropdown Popover */}
              {isSlashActive && filteredCommands.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSlashMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-52 sm:w-56 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                    <div className="space-y-0.5">
                      {filteredCommands.map((cmd, idx) => {
                        const Icon = cmd.icon;
                        const isSelected = idx === selectedSlashIndex;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            title={cmd.description}
                            onClick={() => applySlashCommand(cmd)}
                            onMouseEnter={() => setSelectedSlashIndex(idx)}
                            className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs text-left transition cursor-pointer group ${
                              isSelected
                                ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-xs'
                                : 'text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface-sunken)] shrink-0 ${cmd.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-mono font-bold text-xs text-[var(--accent-terracotta)] tracking-tight">
                                {cmd.token}
                              </span>
                            </div>

                            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] shrink-0 bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
                              {cmd.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  id="quick-capture-task-input"
                  name="quickTaskTitle"
                  type="text"
                  value={quickTaskTitle}
                  onChange={handleInputChange}
                  onKeyDown={handleQuickTaskKeyDown}
                  onFocus={() => {
                    if (quickTaskTitle.includes('/')) {
                      setIsSlashMenuOpen(true);
                    }
                  }}
                  placeholder="Add task... (type /)"
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
              </div>
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


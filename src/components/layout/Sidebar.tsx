import React, { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Clock,
  Repeat,
  BarChart3,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Archive,
  Calendar,
  Sun,
  Sunrise,
  Moon,
  Zap,
  Radio,
  Users2,
  Target,
} from 'lucide-react';
import { ActiveTab, CircleMember } from '../../types';
import { useAuth } from '../../context/AuthContext';

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

export interface SlashCommand {
  id: string;
  token: string;
  label: string;
  category: 'Date' | 'Time Block' | 'Priority' | 'Duration';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
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
  let isTodayFocus: boolean = false;
  let priority: 'low' | 'medium' | 'high' = 'medium';
  let estimatedMinutes = 25;
  const tags = ['Quick Capture'];

  let text = rawInput;

  // Check for explicit focus / star command
  if (/\/(focus|star|starred)\b/i.test(text) || /\b(focus|star this)\b/i.test(text)) {
    isTodayFocus = true;
    text = text.replace(/\/(focus|star|starred)\b/gi, '').replace(/\b(focus|star this)\b/gi, '');
  }

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

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
  badgeVariant?: 'terracotta' | 'neutral' | 'sage';
}

const SidebarComponent: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayFocusCount,
  inboxCount,
  totalFocusMinutesToday,
  members,
}) => {
  const { profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activePartners = members.filter(
    (m) => m.status === 'focusing' && !m.isIncognito && m.statusText !== 'Offline'
  );
  const ringProgressPercent = Math.min(100, Math.round((totalFocusMinutesToday / 100) * 100));

  // Group 1: Core Daily Focus & Planning
  const coreNavItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Focus Hub',
      icon: LayoutDashboard,
      badge: todayFocusCount > 0 ? `${todayFocusCount}` : undefined,
      badgeVariant: 'terracotta',
    },
    {
      id: 'inbox',
      label: 'Tasks & Planning',
      icon: Inbox,
      badge: inboxCount > 0 ? `${inboxCount}` : undefined,
      badgeVariant: 'neutral',
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: Repeat,
    },
    {
      id: 'focus',
      label: 'Deep Focus Mode',
      icon: Clock,
    },
  ];

  // Group 2: Community & Accountability
  const communityNavItems: NavItemConfig[] = [
    {
      id: 'pods',
      label: 'Focus Pods',
      icon: Radio,
      badge: activePartners.length > 0 ? `${activePartners.length} online` : undefined,
      badgeVariant: 'sage',
    },
    {
      id: 'partners',
      label: 'Partners & Network',
      icon: Users2,
    },
    {
      id: 'circles',
      label: 'Milestones Feed',
      icon: Sparkles,
    },
  ];

  // Group 3: Insights & Archives
  const secondaryNavItems: NavItemConfig[] = [
    {
      id: 'analytics',
      label: 'Insights & Recap',
      icon: BarChart3,
    },
    {
      id: 'archive',
      label: 'Archive & History',
      icon: Archive,
    },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavGroup = (items: NavItemConfig[]) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-terracotta)] ${
              isActive
                ? 'bg-[var(--accent-terracotta)] text-white font-semibold shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-[var(--text-muted)]'
                }`}
                strokeWidth={1.5}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {item.badge && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : item.badgeVariant === 'terracotta'
                    ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                    : item.badgeVariant === 'sage'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger Bar */}
      <div className="flex items-center justify-between lg:hidden w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading font-bold text-[var(--text-primary)]">
            Menu Navigation
          </span>
          <span className="rounded-full bg-[var(--accent-terracotta)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-terracotta)]">
            {activeTab === 'profile'
              ? 'My Profile'
              : [...coreNavItems, ...communityNavItems, ...secondaryNavItems].find((n) => n.id === activeTab)?.label || 'Overview'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-primary)] hover:bg-[var(--card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          aria-label={isMobileMenuOpen ? 'Close Navigation Drawer' : 'Open Navigation Drawer'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block fixed inset-0 z-50 p-4 bg-black/60 backdrop-blur-sm overflow-y-auto' : 'hidden'
        } lg:block lg:static lg:z-auto lg:p-0 lg:bg-transparent w-full lg:w-64 shrink-0 transition-all duration-300`}
      >
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 shadow-xs space-y-4 transition-colors duration-300 max-w-sm lg:max-w-none mx-auto">
          {/* Mobile Drawer Close Header */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-heading font-bold text-[var(--text-primary)]">
              Tactical Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Workspace Identity Card */}
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-terracotta)] group ${
              activeTab === 'profile'
                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--text-primary)] shadow-2xs'
                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] hover:border-[var(--accent-terracotta)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="View or Edit Profile"
            aria-label="Go to My Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={profile.fullName}
                  width={34}
                  height={34}
                  decoding="async"
                  className="w-8 h-8 rounded-lg object-cover border border-[var(--border-subtle)] shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{profile.fullName}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  {profile.privacySettings?.isIncognito ? 'Incognito' : 'Active'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform shrink-0 ${
              activeTab === 'profile' ? 'translate-x-0.5 text-[var(--accent-terracotta)]' : 'group-hover:translate-x-0.5'
            }`} />
          </button>

          {/* Group 1: Workspace Core Navigation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 font-heading">
              Workspace
            </div>
            <nav aria-label="Workspace Navigation">
              {renderNavGroup(coreNavItems)}
            </nav>
          </div>

          <hr className="border-[var(--border-subtle)]" />

          {/* Group 2: Community & Accountability */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 font-heading">
              Community
            </div>
            <nav aria-label="Community Navigation">
              {renderNavGroup(communityNavItems)}
            </nav>
          </div>

          <hr className="border-[var(--border-subtle)]" />

          {/* Group 3: Insights & Archives */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 font-heading">
              Overview
            </div>
            <nav aria-label="Overview Navigation">
              {renderNavGroup(secondaryNavItems)}
            </nav>
          </div>

          <hr className="border-[var(--border-subtle)]" />



          {/* Clean Minimal Focus Progress Goal Bar */}
          <div className="px-1 pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)] font-medium">Today's Focus Goal</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">{totalFocusMinutesToday} / 100m</span>
            </div>
            <div className="w-full bg-[var(--border-subtle)]/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[var(--accent-warm-ochre)] via-[var(--accent-terracotta)] to-[var(--accent-dusty-rose)] h-full transition-all duration-500 rounded-full"
                style={{ width: `${ringProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);

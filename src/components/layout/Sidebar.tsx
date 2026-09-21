import React from 'react';
import { LayoutDashboard, Inbox, Clock, Repeat, Users, BarChart3, Star, CheckCircle2 } from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayFocusCount: number;
  inboxCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayFocusCount,
  inboxCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Focus Hub',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inbox' as ActiveTab,
      label: 'Master Inbox',
      icon: Inbox,
      badge: inboxCount > 0 ? inboxCount : null,
      badgeColor: 'bg-[var(--border-subtle)] text-[var(--text-secondary)]',
    },
    {
      id: 'focus' as ActiveTab,
      label: 'Time-Block & Timer',
      icon: Clock,
      badge: todayFocusCount > 0 ? `${todayFocusCount} Focus` : null,
      badgeColor: 'bg-[#CFA052]/20 text-[#CFA052]',
    },
    {
      id: 'habits' as ActiveTab,
      label: 'Habit Rhythm',
      icon: Repeat,
      badge: null,
    },
    {
      id: 'circles' as ActiveTab,
      label: 'Social Circles',
      icon: Users,
      badge: 'Live',
      badgeColor: 'bg-[#C87D87]/20 text-[#C87D87]',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Rhythm Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible p-2 lg:p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex items-center justify-between whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#C06C4C]/15 to-[#C87D87]/15 text-[#C06C4C] dark:text-[#D47B5A] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#C06C4C] dark:text-[#D47B5A]' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.badgeColor || 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

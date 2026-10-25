import React from 'react';
import { Clock, Repeat, Flame, Users, Sparkles, Bell } from 'lucide-react';
import { InAppNotification } from '../../types';

export interface NotificationTypeConfig {
  label: string;
  badgeLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClass: string;
  iconBgClass: string;
  accentBorder: string;
  accentText: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<InAppNotification['type'], NotificationTypeConfig> = {
  timer: {
    label: 'Focus Timer',
    badgeLabel: 'Focus',
    icon: Clock,
    iconClass: 'text-amber-500 dark:text-[#CFA052]',
    iconBgClass: 'bg-amber-500/10 dark:bg-[#CFA052]/15 border-amber-500/20 dark:border-[#CFA052]/30',
    accentBorder: 'border-l-amber-500 dark:border-l-[#CFA052]',
    accentText: 'text-amber-600 dark:text-[#CFA052]',
  },
  habit: {
    label: 'Habit Tracker',
    badgeLabel: 'Habit',
    icon: Repeat,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    iconBgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30',
    accentBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  streak: {
    label: 'Milestone & Streak',
    badgeLabel: 'Streak',
    icon: Flame,
    iconClass: 'text-orange-500 dark:text-orange-400',
    iconBgClass: 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/20 dark:border-orange-500/30',
    accentBorder: 'border-l-orange-500 dark:border-l-orange-400',
    accentText: 'text-orange-600 dark:text-orange-400',
  },
  circle: {
    label: 'Partners & Circle',
    badgeLabel: 'Circle',
    icon: Users,
    iconClass: 'text-[#C87D87] dark:text-[#E0909A]',
    iconBgClass: 'bg-[#C87D87]/10 dark:bg-[#C87D87]/15 border-[#C87D87]/20 dark:border-[#C87D87]/30',
    accentBorder: 'border-l-[#C87D87] dark:border-l-[#E0909A]',
    accentText: 'text-[#C87D87] dark:text-[#E0909A]',
  },
  system: {
    label: 'System Alert',
    badgeLabel: 'System',
    icon: Sparkles,
    iconClass: 'text-teal-500 dark:text-teal-400',
    iconBgClass: 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/20 dark:border-teal-500/30',
    accentBorder: 'border-l-teal-500 dark:border-l-teal-400',
    accentText: 'text-teal-600 dark:text-teal-400',
  },
};

export const DEFAULT_NOTIFICATION_TYPE_CONFIG: NotificationTypeConfig = {
  label: 'Notification',
  badgeLabel: 'General',
  icon: Bell,
  iconClass: 'text-[var(--text-secondary)]',
  iconBgClass: 'bg-[var(--card-hover)] border-[var(--border-subtle)]',
  accentBorder: 'border-l-[var(--border-subtle)]',
  accentText: 'text-[var(--text-secondary)]',
};

/**
 * Validates whether an invite token has a secure alphanumeric/uuid pattern
 */
export function isValidInviteToken(token?: string | null): boolean {
  if (!token) return false;
  return /^[a-zA-Z0-9_-]{10,64}$/.test(token);
}

/**
 * Formats ISO timestamp to human-friendly relative time string
 */
export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return 'Just now';
  const timestamp = new Date(isoDate).getTime();
  if (isNaN(timestamp)) return 'Just now';

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Just now';

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
}

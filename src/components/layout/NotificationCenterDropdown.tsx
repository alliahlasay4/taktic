import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCheck, Trash2, X, Bell, BellRing, Sparkles } from 'lucide-react';
import { InAppNotification, ActiveTab } from '../../types';
import { NotificationItemCard } from './NotificationItemCard';

interface NotificationCenterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onAcceptCircleInvite?: (token: string) => Promise<void>;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTab,
  onAcceptCircleInvite,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => (filter === 'unread' ? !n.read : true));
  }, [notifications, filter]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      role="region"
      aria-label="Notification Center"
      className="fixed sm:absolute top-14 sm:top-12 left-3 right-3 sm:left-auto sm:right-0 z-50 w-auto sm:w-[26rem] max-w-sm sm:max-w-none mx-auto sm:mx-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/98 backdrop-blur-2xl p-4 shadow-2xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[min(34rem,calc(100vh-5rem))]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {unreadCount > 0 ? (
              <BellRing className="h-3.5 w-3.5 text-emerald-500 animate-bounce" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              title="Mark all as read"
              aria-label="Mark all as read"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-emerald-500 transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Read all</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              title="Clear all notifications"
              aria-label="Clear all notifications"
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close notifications"
            aria-label="Close notifications"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer ml-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="mt-3 flex items-center p-0.5 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-subtle)] shrink-0">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filter === 'all'
                ? 'bg-[var(--bg-main)] text-[var(--text-secondary)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              {unreadCount}
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold text-[var(--text-muted)]">
              0
            </span>
          )}
        </button>
      </div>

      {/* Notifications List with scrollable container */}
      <div className="mt-3 overflow-y-auto space-y-2 pr-1 overscroll-contain flex-1">
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--card-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              {filter === 'unread' ? (
                <Sparkles className="h-5 w-5 text-emerald-500" />
              ) : (
                <Bell className="h-5 w-5 opacity-40" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {filter === 'unread' ? 'All caught up' : 'No notifications'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                {filter === 'unread'
                  ? 'You have addressed all pending alerts and invites.'
                  : 'Activity updates, streaks, and circle alerts will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((item) => (
            <NotificationItemCard
              key={item.id}
              notification={item}
              onMarkAsRead={onMarkAsRead}
              onSelectTab={onSelectTab}
              onAcceptCircleInvite={onAcceptCircleInvite}
              onCloseDropdown={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
};

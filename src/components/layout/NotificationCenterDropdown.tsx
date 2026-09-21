import React, { useState } from 'react';
import { Clock, Repeat, Flame, Users, Sparkles, CheckCheck, Trash2, X, BellOff } from 'lucide-react';
import { InAppNotification, ActiveTab } from '../../types';

interface NotificationCenterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const NotificationCenterDropdown: React.FC<NotificationCenterDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTab,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'timer':
        return <Clock className="h-4 w-4 text-[#CFA052]" />;
      case 'habit':
        return <Repeat className="h-4 w-4 text-emerald-400" />;
      case 'streak':
        return <Flame className="h-4 w-4 text-amber-500" />;
      case 'circle':
        return <Users className="h-4 w-4 text-[#C87D87]" />;
      default:
        return <Sparkles className="h-4 w-4 text-teal-400" />;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-xl p-4 shadow-2xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">Notification Center</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {unreadCount} New
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              title="Mark all as read"
              className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              title="Clear all notifications"
              className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-red-500 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
            filter === 'unread'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
            <BellOff className="h-6 w-6 text-[var(--text-muted)]" />
            <span>No notifications found</span>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onMarkAsRead(item.id);
                if (item.actionTab && onSelectTab) {
                  onSelectTab(item.actionTab);
                  onClose();
                }
              }}
              className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                item.read
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-main)]/50 opacity-75 hover:opacity-100 hover:bg-[var(--card-hover)]'
                  : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--card-surface)] border border-[var(--border-subtle)] mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">{formatTimeAgo(item.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-2">{item.message}</p>
              </div>

              {!item.read && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

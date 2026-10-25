import React, { useState } from 'react';
import { Check, ArrowRight, Loader2, CheckCheck } from 'lucide-react';
import { InAppNotification, ActiveTab } from '../../types';
import {
  NOTIFICATION_TYPE_CONFIG,
  DEFAULT_NOTIFICATION_TYPE_CONFIG,
  isValidInviteToken,
  formatRelativeTime,
} from './notificationUtils';

interface NotificationItemCardProps {
  notification: InAppNotification;
  onMarkAsRead: (id: string) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onAcceptCircleInvite?: (token: string) => Promise<void>;
  onCloseDropdown: () => void;
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  notification,
  onMarkAsRead,
  onSelectTab,
  onAcceptCircleInvite,
  onCloseDropdown,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || DEFAULT_NOTIFICATION_TYPE_CONFIG;
  const Icon = config.icon;
  const hasInviteAction =
    isValidInviteToken(notification.inviteToken) && Boolean(onAcceptCircleInvite);

  const handleCardClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionTab && onSelectTab) {
      onSelectTab(notification.actionTab);
      onCloseDropdown();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.inviteToken || !onAcceptCircleInvite || isAccepting) return;

    try {
      setIsAccepting(true);
      onMarkAsRead(notification.id);
      await onAcceptCircleInvite(notification.inviteToken);
      onCloseDropdown();
    } catch {
      // Error handling is handled upstream in the invite handler
    } finally {
      setIsAccepting(false);
    }
  };

  const handleViewPartners = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
    if (onSelectTab) {
      onSelectTab('partners');
    }
    onCloseDropdown();
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
        notification.read
          ? 'border-[var(--border-subtle)] bg-[var(--card-surface)]/60 text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
          : `border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-xs hover:border-[var(--border-muted)] ${config.accentBorder} border-l-2`
      }`}
    >
      {/* Top Meta Header: Category Badge + Timestamp + Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${
              notification.read
                ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                : `${config.iconBgClass} ${config.accentText}`
            }`}
          >
            <Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{config.badgeLabel}</span>
          </span>

          {!notification.read && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
              title="Unread"
              aria-label="Unread"
            />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-medium text-[var(--text-muted)]">
            {formatRelativeTime(notification.createdAt)}
          </span>

          {/* Quick Mark as Read Hover Action Button */}
          {!notification.read && (
            <button
              type="button"
              onClick={handleToggleRead}
              title="Mark as read"
              aria-label="Mark as read"
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-emerald-500 transition-all ml-1 cursor-pointer"
            >
              <CheckCheck className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="min-w-0">
        <h4
          className={`text-xs font-semibold leading-snug break-words ${
            notification.read
              ? 'text-[var(--text-primary)]/80 group-hover:text-[var(--text-primary)]'
              : 'text-[var(--text-primary)]'
          }`}
        >
          {notification.title}
        </h4>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)] break-words">
          {notification.message}
        </p>
      </div>

      {/* Partner Invite Interactive Actions */}
      {hasInviteAction && (
        <div
          className="mt-1 flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-subtle)]/60"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isAccepting}
            onClick={handleAcceptInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] hover:brightness-110 active:scale-95 disabled:opacity-60 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
          >
            {isAccepting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" strokeWidth={2.5} />
            )}
            <span>{isAccepting ? 'Joining...' : 'Accept & Join'}</span>
          </button>

          <button
            type="button"
            disabled={isAccepting}
            onClick={handleViewPartners}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>View Circle</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Destination indicator cue if notification has an action tab (and not an invite card) */}
      {!hasInviteAction && notification.actionTab && (
        <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors pt-0.5">
          <span className="capitalize">Go to {notification.actionTab}</span>
          <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  );
};

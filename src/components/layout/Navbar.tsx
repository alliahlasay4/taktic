import React, { useState } from 'react';
import { Flame, Sparkles, Volume2, VolumeX, ShieldCheck, Bell, Sun, Moon, StickyNote } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InAppNotification, ActiveTab } from '../../types';
import { NotificationCenterDropdown } from './NotificationCenterDropdown';
import { UserProfileDropdown } from './UserProfileDropdown';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  userStreak: number;
  activeSoundscape: string | null;
  onToggleSoundscape: () => void;
  onOpenSummary: () => void;
  onOpenProfile?: () => void;
  onToggleQuickNotes?: () => void;
  notesCount?: number;
  notifications?: InAppNotification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  userStreak,
  activeSoundscape,
  onToggleSoundscape,
  onOpenSummary,
  onOpenProfile,
  onToggleQuickNotes,
  notesCount = 0,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead = () => { },
  onMarkAllAsRead = () => { },
  onClearAll = () => { },
  onSelectTab,
}) => {
  const { user, profile, isDemo } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const userName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userAvatar = profile?.avatarUrl || user?.user_metadata?.avatar_url;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--card-surface)]/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-[1800px] items-center justify-between px-2.5 sm:px-6 lg:px-8">
        {/* Clean Brand Logo */}
        <button
          type="button"
          onClick={() => onSelectTab?.('dashboard')}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-left cursor-pointer focus-visible:outline-hidden group"
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-md shadow-[#C06C4C]/20 transition-transform group-hover:scale-105">
            <span className="text-lg sm:text-xl font-bold font-heading">T</span>
          </div>
          <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none transition-colors group-hover:text-[#C06C4C]">
            Taktic
          </span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 relative shrink-0">
          {/* Active Soundscape Pill (Visible only when audio is active) */}
          {activeSoundscape && (
            <button
              type="button"
              onClick={onToggleSoundscape}
              className="flex h-8 sm:h-10 items-center gap-1.5 rounded-full bg-[#CFA052]/15 border border-[#CFA052]/30 px-2 sm:px-3 py-1 text-xs font-medium text-[#CFA052] transition-transform hover:scale-105 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              title="Click to Stop Ambient Audio"
              aria-label={`Stop active soundscape: ${activeSoundscape}`}
            >
              <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden md:inline">{activeSoundscape}</span>
            </button>
          )}

          {/* User Streak Badge */}
          <div className="flex h-8 sm:h-10 items-center gap-1 rounded-full bg-[#C06C4C]/15 px-2 sm:px-3 py-1 text-xs font-semibold text-[#C06C4C]">
            <Flame className="h-3.5 w-3.5 fill-[#C06C4C]" strokeWidth={1.5} aria-hidden="true" />
            <span>{userStreak}<span className="hidden sm:inline"> Day Streak</span><span className="sm:hidden">d</span></span>
          </div>

          {/* Quick Notes Scratchpad Trigger (Desktop & Tablet only; mobile uses bottom-right floating trigger) */}
          {onToggleQuickNotes && (
            <button
              type="button"
              onClick={onToggleQuickNotes}
              className="hidden sm:flex relative h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent-warm-ochre)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-2xs"
              title="Quick Notes Scratchpad (Ctrl+J)"
              aria-label="Quick Notes Scratchpad"
            >
              <StickyNote className="h-4 w-4 text-[var(--accent-warm-ochre)]" strokeWidth={1.5} aria-hidden="true" />
              {notesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-warm-ochre)] text-[10px] font-bold text-black ring-2 ring-[var(--card-surface)]">
                  {notesCount}
                </span>
              )}
            </button>
          )}

          {/* 1-Click Dark/Light Mode Theme Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-2xs"
            title={darkMode ? 'Switch to Light Mode (Warm Oat)' : 'Switch to Dark Mode (Dark Espresso)'}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-[var(--accent-warm-ochre)] transition-transform hover:rotate-45 duration-300" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-terracotta)] transition-transform hover:-rotate-12 duration-300" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>

          {/* Notification Center Bell Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileMenuOpen(false);
              }}
              className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              title="Notification Center"
              aria-label="Notification Center"
            >
              <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black ring-2 ring-[var(--card-surface)] animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            <NotificationCenterDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearAll={onClearAll}
              onSelectTab={onSelectTab}
            />
          </div>

          {/* User Profile Avatar Trigger & Dropdown */}
          <div className="relative border-l border-[var(--border-subtle)] pl-1 sm:pl-2.5">
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifOpen(false);
              }}
              className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              title="Account Menu"
              aria-label="User Account Menu"
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName.substring(0, 2).toUpperCase()
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center rounded-full bg-emerald-500 ring-1 sm:ring-2 ring-[var(--card-surface)]">
                <ShieldCheck className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </button>

            {/* User Profile Dropdown Menu */}
            <UserProfileDropdown
              isOpen={isProfileMenuOpen}
              onClose={() => setIsProfileMenuOpen(false)}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onOpenProfile={onOpenProfile}
              onOpenSummary={onOpenSummary}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

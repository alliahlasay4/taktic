import React, { useState } from 'react';
import { Flame, Sparkles, Volume2, VolumeX, ShieldCheck, Bell } from 'lucide-react';
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
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--card-surface)]/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-md shadow-[#C06C4C]/20">
            <span className="text-xl font-bold font-heading">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Taktic
              </span>
              {isDemo ? (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  DEMO PREVIEW
                </span>
              ) : (
                <span className="rounded-full bg-[#C87D87]/15 px-2 py-0.5 text-[10px] font-semibold text-[#C87D87]">
                  PROD v1.0
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              Tactical Focus & Social Rhythm Hub
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Active Soundscape Pill (Visible only when audio is active) */}
          {activeSoundscape && (
            <button
              onClick={onToggleSoundscape}
              className="flex items-center gap-1.5 rounded-full bg-[#CFA052]/15 border border-[#CFA052]/30 px-3 py-1 text-xs font-medium text-[#CFA052] transition-transform hover:scale-105 active:scale-95 shadow-xs"
              title="Click to Stop Ambient Audio"
            >
              <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden md:inline">{activeSoundscape}</span>
            </button>
          )}

          {/* User Streak Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#C06C4C]/15 px-3 py-1 text-xs font-semibold text-[#C06C4C]">
            <Flame className="h-4 w-4 fill-[#C06C4C]" />
            <span>{userStreak} Day Streak</span>
          </div>

          {/* Notification Center Bell Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsProfileMenuOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] transition-all hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]"
              title="Notification Center"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-2 ring-[var(--card-surface)] animate-pulse">
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
          <div className="relative border-l border-[var(--border-subtle)] pl-2 sm:pl-3">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              title="Account Menu"
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName.substring(0, 2).toUpperCase()
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[var(--card-surface)]">
                <ShieldCheck className="h-2 w-2 text-white" />
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

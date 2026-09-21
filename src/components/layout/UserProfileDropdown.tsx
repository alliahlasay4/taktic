import React, { useRef, useEffect } from 'react';
import { User, Sun, Moon, LogOut, ShieldCheck, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenProfile?: () => void;
  onOpenSummary?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
  darkMode,
  setDarkMode,
  onOpenProfile,
  onOpenSummary,
}) => {
  const { user, profile, isDemo, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'demo@taktic.app';
  const userAvatar = profile?.avatarUrl || user?.user_metadata?.avatar_url;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)]/95 backdrop-blur-xl p-3 shadow-2xl text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* User Header Identity Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] mb-2">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-sm font-bold text-white shadow-md">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
          ) : (
            userName.substring(0, 2).toUpperCase()
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[var(--card-surface)]">
            <ShieldCheck className="h-2.5 w-2.5 text-white" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{userName}</h4>
          <p className="text-[11px] text-[var(--text-secondary)] truncate">{userEmail}</p>
          {isDemo && (
            <span className="inline-block mt-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Menu Actions */}
      <div className="space-y-1">
        {/* Profile Link */}
        <button
          onClick={() => {
            if (onOpenProfile) onOpenProfile();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition"
        >
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>My Profile & Preferences</span>
        </button>

        {/* Daily Recap */}
        {onOpenSummary && (
          <button
            onClick={() => {
              onOpenSummary();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition"
          >
            <Sparkles className="h-4 w-4 text-[#C87D87]" />
            <span>Daily Reflection Recap</span>
          </button>
        )}

        {/* Dark / Light Mode Switch */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition">
          <div className="flex items-center gap-2.5">
            {darkMode ? <Moon className="h-4 w-4 text-[#CFA052]" /> : <Sun className="h-4 w-4 text-[#C06C4C]" />}
            <span>{darkMode ? 'Dark Espresso Mode' : 'Light Warm Oat Mode'}</span>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${darkMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
              }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-black transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="my-2 border-t border-[var(--border-subtle)]" />

      {/* Sign Out Button */}
      <button
        onClick={() => {
          signOut();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

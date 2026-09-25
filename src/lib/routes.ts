import { ActiveTab } from '../types';

export const TAB_TO_PATH: Record<ActiveTab, string> = {
  dashboard: '/focushub',
  inbox: '/inbox',
  focus: '/focus',
  habits: '/habits',
  circles: '/circles',
  analytics: '/analytics',
  archive: '/archive',
  profile: '/profile',
};

export const PATH_TO_TAB: Record<string, ActiveTab> = {
  '/': 'dashboard',
  '/focushub': 'dashboard',
  '/dashboard': 'dashboard',
  '/inbox': 'inbox',
  '/tasks': 'inbox',
  '/focus': 'focus',
  '/deepfocus': 'focus',
  '/timer': 'focus',
  '/habits': 'habits',
  '/habit-rings': 'habits',
  '/circles': 'circles',
  '/social': 'circles',
  '/analytics': 'analytics',
  '/insights': 'analytics',
  '/archive': 'archive',
  '/history': 'archive',
  '/profile': 'profile',
  '/settings': 'profile',
};

export function getTabFromPath(path: string): ActiveTab {
  if (!path) return 'dashboard';
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  return PATH_TO_TAB[normalized] || 'dashboard';
}

export function getPathFromTab(tab: ActiveTab): string {
  return TAB_TO_PATH[tab] || '/focushub';
}

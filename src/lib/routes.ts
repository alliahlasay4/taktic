import { ActiveTab } from '../types';

export const LANDING_PATH = '/landing';

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

export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.toLowerCase().replace(/\/+$/, '') || '/';
}

export function isLandingPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized === '/landing' || normalized === '/welcome' || normalized === '/';
}

export function isAuthPath(path: string): boolean {
  const normalized = normalizePath(path);
  return (
    normalized === '/login' ||
    normalized === '/signin' ||
    normalized === '/signup' ||
    normalized === '/register' ||
    normalized === '/auth'
  );
}

export function isProtectedPath(path: string): boolean {
  const normalized = normalizePath(path);
  return Boolean(PATH_TO_TAB[normalized]);
}

export function getTabFromPath(path: string): ActiveTab {
  if (!path) return 'dashboard';
  const normalized = normalizePath(path);
  return PATH_TO_TAB[normalized] || 'dashboard';
}

export function getPathFromTab(tab: ActiveTab): string {
  return TAB_TO_PATH[tab] || '/focushub';
}


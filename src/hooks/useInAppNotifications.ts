import { useState, useEffect, useCallback } from 'react';
import { InAppNotification, ActiveTab } from '../types';

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'n-1',
    title: 'Welcome to Taktic!',
    message: 'Your tactical productivity workspace is ready. Set your daily goals and habits.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
    actionTab: 'dashboard',
  },
  {
    id: 'n-2',
    title: 'Streak Shield Active',
    message: '3 freeze shields are loaded on your habits to protect your streaks.',
    type: 'streak',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionTab: 'habits',
  },
];

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: InAppNotification['type'];
}

export function useInAppNotifications() {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('taktic_in_app_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    localStorage.setItem('taktic_in_app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const notify = useCallback(
    (title: string, message: string, type: InAppNotification['type'] = 'system', actionTab?: ActiveTab) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newNotif: InAppNotification = {
        id,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
        actionTab,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Add to active toast list
      const toastId = `toast-${Date.now()}`;
      const newToast: ToastItem = { id: toastId, title, message, type };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss toast after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    toasts,
    unreadCount,
    notify,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

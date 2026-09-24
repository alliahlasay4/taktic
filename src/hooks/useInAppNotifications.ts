import { useState, useEffect, useCallback, useRef } from 'react';
import { InAppNotification, ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: InAppNotification['type'];
}

export function useInAppNotifications() {
  const { user, isDemo } = useAuth();
  const userKey = user?.id || (isDemo ? 'demo' : 'guest');
  const storageKey = `taktic_in_app_notifications_${userKey}`;

  const createInitialNotifications = useCallback((): InAppNotification[] => {
    return [
      {
        id: `welcome-${userKey}`,
        title: 'Welcome to Taktic!',
        message: 'Your tactical productivity workspace is ready. Set your daily goals and habits.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
        actionTab: 'dashboard',
      },
    ];
  }, [userKey]);

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: `welcome-${userKey}`,
        title: 'Welcome to Taktic!',
        message: 'Your tactical productivity workspace is ready. Set your daily goals and habits.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
        actionTab: 'dashboard',
      },
    ];
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isInitialMount = useRef(true);

  // Switch notifications when authenticated user changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setNotifications(createInitialNotifications());
  }, [storageKey, createInitialNotifications]);

  // Persist notifications for the current user
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, storageKey]);

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

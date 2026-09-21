import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('taktic_notifications_enabled');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('taktic_notifications_enabled', JSON.stringify(enabled));
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        if (res === 'granted') {
          setEnabled(true);
        }
        return res;
      } catch (e) {
        console.error('Notification permission error:', e);
      }
    }
    return 'denied';
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!enabled) return;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          return new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options,
          });
        } catch (e) {
          console.error('Error triggering notification:', e);
        }
      }
    },
    [enabled]
  );

  return {
    permission,
    enabled,
    setEnabled,
    requestPermission,
    sendNotification,
  };
}

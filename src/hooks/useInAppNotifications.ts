import { useState, useEffect, useCallback, useRef } from 'react';
import { InAppNotification, ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: InAppNotification['type'];
}

export function useInAppNotifications() {
  const { user, isDemo } = useAuth();
  const isRealUser = !isDemo && isSupabaseConfigured && Boolean(user) && user?.id !== 'demo-user-123';
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
    if (isDemo || userKey === 'demo') {
      const saved = sessionStorage.getItem('taktic_demo_in_app_notifications');
      return saved ? JSON.parse(saved) : createInitialNotifications();
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return createInitialNotifications();
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isInitialMount = useRef(true);

  // Trigger toast with sound and automatic dismissal
  const showToast = useCallback((title: string, message: string, type: InAppNotification['type'] = 'system') => {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id: toastId, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Play subtle notification chime for social or milestone events
    try {
      if (typeof window !== 'undefined' && (type === 'circle' || type === 'streak')) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const now = ctx.currentTime;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.36);
        }
      }
    } catch (e) {
      // Audio playback non-critical
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  }, []);

  // Fetch notifications from Supabase for real user
  const fetchNotifications = useCallback(async () => {
    if (!isRealUser || !user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && data) {
        const mapped: InAppNotification[] = data.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: (n.type as InAppNotification['type']) || 'system',
          read: Boolean(n.read),
          createdAt: n.created_at,
          actionTab: (n.action_tab as ActiveTab) || 'circles',
        }));

        setNotifications(mapped);
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Could not fetch notifications from Supabase:', e);
    }
  }, [isRealUser, user, storageKey]);

  // Switch notifications when authenticated user changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (isDemo || userKey === 'demo') {
      const saved = sessionStorage.getItem('taktic_demo_in_app_notifications');
      setNotifications(saved ? JSON.parse(saved) : createInitialNotifications());
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setNotifications(createInitialNotifications());
    }

    if (isRealUser && user) {
      fetchNotifications();
    }
  }, [storageKey, isDemo, userKey, createInitialNotifications, isRealUser, user, fetchNotifications]);

  // Realtime subscription for incoming notifications (e.g. cheer from partner)
  useEffect(() => {
    if (!isRealUser || !user) return;

    const notifChannel = supabase
      .channel(`public:notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            const newNotif: InAppNotification = {
              id: newRow.id,
              title: newRow.title,
              message: newRow.message,
              type: (newRow.type as InAppNotification['type']) || 'circle',
              read: Boolean(newRow.read),
              createdAt: newRow.created_at || new Date().toISOString(),
              actionTab: (newRow.action_tab as ActiveTab) || 'circles',
            };

            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            showToast(newNotif.title, newNotif.message, newNotif.type);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedRow.id ? { ...n, read: Boolean(updatedRow.read) } : n))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [isRealUser, user, showToast]);

  // Persist notifications for the current user
  useEffect(() => {
    if (isDemo || userKey === 'demo') {
      sessionStorage.setItem('taktic_demo_in_app_notifications', JSON.stringify(notifications));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }, [notifications, storageKey, isDemo, userKey]);

  // Local or cross-client in-app notify
  const notify = useCallback(
    async (title: string, message: string, type: InAppNotification['type'] = 'system', actionTab?: ActiveTab) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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
      showToast(title, message, type);

      if (isRealUser && user) {
        try {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title,
            message,
            type,
            read: false,
            action_tab: actionTab || 'dashboard',
          });
        } catch (e) {
          console.warn('Could not insert local notification into Supabase:', e);
        }
      }
    },
    [isRealUser, user, showToast]
  );

  // Send a notification to another user (e.g. circle partner who authored a post)
  const sendPartnerNotification = useCallback(
    async (targetUserId: string, title: string, message: string, type: InAppNotification['type'] = 'circle', actionTab: ActiveTab = 'circles') => {
      if (!isRealUser || !user || !targetUserId || targetUserId === user.id) return;
      try {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          title,
          message,
          type,
          read: false,
          action_tab: actionTab,
        });
      } catch (e) {
        console.warn('Could not send notification to partner:', e);
      }
    },
    [isRealUser, user]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      if (isRealUser && user && !id.startsWith('welcome-')) {
        try {
          await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
        } catch (e) {
          console.warn('Could not update notification in Supabase:', e);
        }
      }
    },
    [isRealUser, user]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (isRealUser && user) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      } catch (e) {
        console.warn('Could not mark all notifications as read in Supabase:', e);
      }
    }
  }, [isRealUser, user]);

  const clearAll = useCallback(async () => {
    setNotifications([]);

    if (isRealUser && user) {
      try {
        await supabase.from('notifications').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('Could not clear notifications in Supabase:', e);
      }
    }
  }, [isRealUser, user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    toasts,
    unreadCount,
    notify,
    sendPartnerNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications: fetchNotifications,
  };
}

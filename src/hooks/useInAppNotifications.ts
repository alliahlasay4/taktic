import { useState, useEffect, useCallback, useRef } from 'react';
import { InAppNotification, ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { soundEngine } from '../lib/audio';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: InAppNotification['type'];
}

/**
 * Deduplicate a list of notifications by unique ID and by identical content (title+message)
 * created within a close time threshold (6 seconds).
 */
export function dedupeNotifications(list: InAppNotification[]): InAppNotification[] {
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: InAppNotification[] = [];

  for (const item of list) {
    if (!item || !item.id) continue;
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    // Group close events into 6-second buckets to remove rapid duplicate emissions
    const timeBucket = Math.floor(new Date(item.createdAt || Date.now()).getTime() / 6000);
    const contentKey = `${item.title.trim()}:::${item.message.trim()}:::${timeBucket}`;
    if (seenContent.has(contentKey)) continue;
    seenContent.add(contentKey);

    result.push(item);
  }

  return result;
}

export function useInAppNotifications() {
  const { user, isDemo } = useAuth();
  const isRealUser = !isDemo && isSupabaseConfigured && Boolean(user) && user?.id !== 'demo-user-123';
  const userKey = user?.id || (isDemo ? 'demo' : 'guest');
  const storageKey = `taktic_in_app_notifications_${userKey}`;

  // Keep track of locally dispatched notifications to ignore their Realtime echo
  const locallyDispatchedIds = useRef<Map<string, number>>(new Map());
  const recentlyDispatchedContent = useRef<Map<string, number>>(new Map());
  const recentToastsRef = useRef<Map<string, number>>(new Map());

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
      return saved ? dedupeNotifications(JSON.parse(saved)) : createInitialNotifications();
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return dedupeNotifications(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    return createInitialNotifications();
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isInitialMount = useRef(true);

  // Trigger toast with sound and automatic dismissal (with deduplication)
  const showToast = useCallback((title: string, message: string, type: InAppNotification['type'] = 'system') => {
    const toastKey = `${title.trim()}:::${message.trim()}`;
    const now = Date.now();
    const lastSeen = recentToastsRef.current.get(toastKey);

    // Debounce/deduplicate: don't show identical toast within 2.5s
    if (lastSeen && now - lastSeen < 2500) {
      return;
    }
    recentToastsRef.current.set(toastKey, now);

    const toastId = `toast-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id: toastId, title, message, type };

    setToasts((prev) => {
      // Check if identical toast is already active in the overlay
      if (prev.some((t) => t.title === title && t.message === message)) {
        return prev;
      }
      return [...prev, newToast];
    });

    // Play subtle notification chime for social or milestone events
    if (type === 'circle' || type === 'streak') {
      soundEngine.playNotificationChime();
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

        const deduped = dedupeNotifications(mapped);
        setNotifications(deduped);
        localStorage.setItem(storageKey, JSON.stringify(deduped));
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
      setNotifications(saved ? dedupeNotifications(JSON.parse(saved)) : createInitialNotifications());
      return;
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotifications(dedupeNotifications(JSON.parse(saved)));
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
            const notifId = newRow.id;

            // Check if this notification was just dispatched locally by this client
            const dispatchTime = locallyDispatchedIds.current.get(notifId);
            const contentKey = `${newRow.title?.trim()}:::${newRow.message?.trim()}`;
            const contentTime = recentlyDispatchedContent.current.get(contentKey);
            const isRecentSelfDispatch =
              (dispatchTime && Date.now() - dispatchTime < 15000) ||
              (contentTime && Date.now() - contentTime < 15000);

            if (isRecentSelfDispatch) {
              // Ensure local notification has the exact DB ID without re-toasting or duplicating
              setNotifications((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return dedupeNotifications([
                  {
                    id: notifId,
                    title: newRow.title,
                    message: newRow.message,
                    type: (newRow.type as InAppNotification['type']) || 'circle',
                    read: Boolean(newRow.read),
                    createdAt: newRow.created_at || new Date().toISOString(),
                    actionTab: (newRow.action_tab as ActiveTab) || 'circles',
                  },
                  ...prev,
                ]);
              });
              return;
            }

            const newNotif: InAppNotification = {
              id: newRow.id,
              title: newRow.title,
              message: newRow.message,
              type: (newRow.type as InAppNotification['type']) || 'circle',
              read: Boolean(newRow.read),
              createdAt: newRow.created_at || new Date().toISOString(),
              actionTab: (newRow.action_tab as ActiveTab) || 'circles',
            };

            setNotifications((prev) => dedupeNotifications([newNotif, ...prev]));
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
    const cleanList = dedupeNotifications(notifications);
    if (isDemo || userKey === 'demo') {
      sessionStorage.setItem('taktic_demo_in_app_notifications', JSON.stringify(cleanList));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(cleanList));
    }
  }, [notifications, storageKey, isDemo, userKey]);

  // Local or cross-client in-app notify
  const notify = useCallback(
    async (title: string, message: string, type: InAppNotification['type'] = 'system', actionTab?: ActiveTab) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newNotif: InAppNotification = {
        id,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
        actionTab,
      };

      // Register local dispatch to suppress realtime duplicate echo
      const now = Date.now();
      locallyDispatchedIds.current.set(id, now);
      recentlyDispatchedContent.current.set(`${title.trim()}:::${message.trim()}`, now);

      setNotifications((prev) => dedupeNotifications([newNotif, ...prev]));
      showToast(title, message, type);

      if (isRealUser && user) {
        try {
          await supabase.from('notifications').insert({
            id,
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
    showToast,
    notify,
    sendPartnerNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications: fetchNotifications,
  };
}

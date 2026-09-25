import { useState, useEffect, useCallback } from 'react';
import { CircleMember, FocusPod } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RoomMessage } from '../components/circles/BreakChatDrawer';

export interface FloatingEmoji {
  id: string;
  emoji: string;
  userName: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getLocalPods(userId?: string, isDemo?: boolean): FocusPod[] {
  if (isDemo) {
    const demoData = sessionStorage.getItem('taktic_demo_focus_pods');
    if (demoData) {
      try {
        const parsed = JSON.parse(demoData);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  const keysToTry: string[] = [];
  if (userId && userId !== 'demo-user-123') {
    keysToTry.push(`taktic_focus_pods_${userId}`);
  }
  keysToTry.push('taktic_focus_pods');

  for (const key of keysToTry) {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(
            (p) => p && typeof p === 'object' && typeof p.id === 'string' && !p.name?.includes('Design Guild - Stale')
          );
          if (clean.length > 0) {
            // Deduplicate by ID and name
            const unique: FocusPod[] = [];
            const seenIds = new Set<string>();
            const seenNames = new Set<string>();
            for (const p of clean) {
              const nameKey = p.name?.toLowerCase().trim();
              if (!seenIds.has(p.id) && !seenNames.has(nameKey)) {
                seenIds.add(p.id);
                seenNames.add(nameKey);
                unique.push(p);
              }
            }
            return unique;
          }
        }
      } catch (e) {
        console.error('Error parsing local focus pods:', e);
      }
    }
  }
  return [];
}

export function useFocusRooms() {
  const { user, isDemo } = useAuth();
  const isRealUser = !isDemo && isSupabaseConfigured && Boolean(user) && user?.id !== 'demo-user-123';
  
  // Default to null so user is in Lobby mode by default (NOT auto-joined into a room)
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(() => {
    return localStorage.getItem('taktic_active_room_code') || null;
  });
  
  const [roomName, setRoomName] = useState<string>('Silent Virtual Co-Working Room');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomMembers, setRoomMembers] = useState<CircleMember[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  
  // Safeguard: Solo Invisible Mode
  const [soloInvisibleMode, setSoloInvisibleMode] = useState<boolean>(() => {
    return localStorage.getItem('taktic_solo_invisible_mode') === 'true';
  });

  // Standing Pods
  const [focusPods, setFocusPods] = useState<FocusPod[]>(() => {
    return getLocalPods(user?.id, isDemo);
  });

  const [messages, setMessages] = useState<RoomMessage[]>([]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userAvatar =
    user?.user_metadata?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const saveFocusPods = useCallback((updated: FocusPod[]) => {
    setFocusPods(updated);
    if (isDemo) {
      sessionStorage.setItem('taktic_demo_focus_pods', JSON.stringify(updated));
    } else {
      const userKey = user?.id || 'local';
      localStorage.setItem(`taktic_focus_pods_${userKey}`, JSON.stringify(updated));
      localStorage.setItem('taktic_focus_pods', JSON.stringify(updated));
    }
  }, [user, isDemo]);

  const toggleSoloInvisibleMode = () => {
    setSoloInvisibleMode((prev) => {
      const next = !prev;
      localStorage.setItem('taktic_solo_invisible_mode', String(next));
      return next;
    });
  };

  // Fetch standing pods from Supabase or local cache
  const fetchFocusPods = useCallback(async () => {
    if (isDemo) {
      const demoPods = getLocalPods(undefined, true);
      setFocusPods(demoPods);
      return;
    }

    // Immediately load from cache to prevent empty screen flash on reload
    const localPods = getLocalPods(user?.id, false);
    if (localPods.length > 0) {
      setFocusPods(localPods);
    }

    if (isRealUser && user) {
      try {
        const { data, error } = await supabase
          .from('focus_rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const accessiblePods = data.filter(
            (r) =>
              (r.is_permanent || r.code?.startsWith('POD-') || r.code?.startsWith('P-') || r.code?.startsWith('P')) &&
              (r.creator_id === user.id || (Array.isArray(r.allowed_member_ids) && r.allowed_member_ids.includes(user.id)))
          );

          // Deduplicate rows by ID and normalized name
          const uniqueRows: typeof accessiblePods = [];
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();

          for (const r of accessiblePods) {
            const nameKey = (r.name || '').toLowerCase().trim();
            if (!seenIds.has(r.id) && !seenNames.has(nameKey)) {
              seenIds.add(r.id);
              seenNames.add(nameKey);
              uniqueRows.push(r);
            } else if (seenNames.has(nameKey) && r.creator_id === user.id) {
              // Automatically delete redundant duplicate rows in Supabase
              supabase.from('focus_rooms').delete().eq('id', r.id).then();
            }
          }

          const mappedPods: FocusPod[] = uniqueRows.map((r) => ({
            id: r.id,
            name: r.name,
            creatorId: r.creator_id,
            allowedMemberIds: r.allowed_member_ids || [],
            allowedMemberNames: r.allowed_member_names || [],
            durationMinutes: r.duration_minutes || 25,
            isPermanent: true,
            expiresAt: r.expires_at || new Date(Date.now() + 86400000 * 30).toISOString(),
            activeMembersCount: 0,
            recentLogs: [],
          }));

          setFocusPods(mappedPods);
          const userKey = user.id;
          localStorage.setItem(`taktic_focus_pods_${userKey}`, JSON.stringify(mappedPods));
          localStorage.setItem('taktic_focus_pods', JSON.stringify(mappedPods));
        } else if (error) {
          console.warn('Could not fetch focus rooms from Supabase (retaining local cache):', error);
        }
      } catch (err) {
        console.error('Error fetching standing focus pods:', err);
      }
    }
  }, [user, isDemo, isRealUser]);

  useEffect(() => {
    fetchFocusPods();
  }, [fetchFocusPods]);

  // Handle active room messages & member presence synchronization
  useEffect(() => {
    if (!activeRoomCode) {
      setRoomMembers([]);
      setMessages([]);
      return;
    }

    // If online with Supabase, load messages and subscribe in realtime
    if (isRealUser && user) {
      // 1. Fetch room messages
      supabase
        .from('room_messages')
        .select('*')
        .eq('room_code', activeRoomCode)
        .order('created_at', { ascending: true })
        .limit(50)
        .then(({ data }) => {
          if (data) {
            setMessages(
              data.map((m) => ({
                id: m.id,
                userName: m.user_name,
                userAvatar: m.user_avatar,
                content: m.content,
                timestamp: m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now',
              }))
            );
          }
        });

      // 2. Add current user to room_members
      supabase
        .from('room_members')
        .upsert({
          room_code: activeRoomCode,
          user_id: user.id,
          user_name: userName,
          user_avatar: userAvatar,
          status: 'focusing',
        }, { onConflict: 'room_code,user_id' })
        .then(() => {
          // Fetch all room members
          supabase
            .from('room_members')
            .select('*')
            .eq('room_code', activeRoomCode)
            .then(({ data }) => {
              if (data) {
                setRoomMembers(
                  data.map((rm) => ({
                    id: rm.user_id,
                    name: rm.user_name,
                    avatar: rm.user_avatar || userAvatar,
                    status: (rm.status as CircleMember['status']) || 'focusing',
                    statusText: rm.current_goal || 'Focusing in Room',
                    closedRingsCount: 0,
                    streak: 1,
                    isCirclePartner: true,
                  }))
                );
              }
            });
        });

      // 3. Realtime message listener
      const msgChannel = supabase
        .channel(`room_messages:${activeRoomCode}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_code=eq.${activeRoomCode}` },
          (payload) => {
            const newM = payload.new;
            const formatted: RoomMessage = {
              id: newM.id,
              userName: newM.user_name,
              userAvatar: newM.user_avatar,
              content: newM.content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev.filter((m) => m.id !== formatted.id), formatted]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
        // Leave room presence
        supabase
          .from('room_members')
          .delete()
          .eq('room_code', activeRoomCode)
          .eq('user_id', user.id)
          .then(() => {});
      };
    }
  }, [activeRoomCode, user, isRealUser, userName, userAvatar]);

  const createFocusPod = async (
    name: string,
    selectedMemberIds: string[],
    selectedMemberNames: string[],
    durationMinutes: number
  ) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const podId = generateUUID();
    const podCode = `POD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 86400000 * 30).toISOString();

    const newPod: FocusPod = {
      id: podId,
      name: trimmedName,
      creatorId: user?.id || 'user',
      allowedMemberIds: selectedMemberIds,
      allowedMemberNames: selectedMemberNames,
      durationMinutes,
      isPermanent: true,
      expiresAt,
      activeMembersCount: 0,
      recentLogs: [
        {
          id: generateUUID(),
          userName: 'You',
          taskTitle: 'Created Standing Focus Pod',
          durationMinutes,
          completedAt: 'Just now',
        },
      ],
    };

    // Remove any existing pod with the exact same name or ID
    const updated = [newPod, ...focusPods.filter((p) => p.id !== podId && p.name.toLowerCase().trim() !== trimmedName.toLowerCase())];
    saveFocusPods(updated);

    if (isRealUser && user) {
      try {
        let res = await supabase
          .from('focus_rooms')
          .insert({
            id: podId,
            code: podCode,
            name: trimmedName,
            creator_id: user.id,
            duration_minutes: durationMinutes,
            is_private: true,
            is_permanent: true,
            expires_at: expiresAt,
            allowed_member_ids: selectedMemberIds,
            allowed_member_names: selectedMemberNames,
          });

        if (res.error) {
          // Retry without allowed_member_names if column doesn't exist yet on remote table
          res = await supabase
            .from('focus_rooms')
            .insert({
              id: podId,
              code: podCode,
              name: trimmedName,
              creator_id: user.id,
              duration_minutes: durationMinutes,
              is_private: true,
              is_permanent: true,
              expires_at: expiresAt,
              allowed_member_ids: selectedMemberIds,
            });
        }

        if (res.error) {
          // Fallback to minimal fields
          res = await supabase
            .from('focus_rooms')
            .insert({
              id: podId,
              code: podCode,
              name: trimmedName,
              creator_id: user.id,
              duration_minutes: durationMinutes,
              is_private: true,
              is_permanent: true,
            });
        }
      } catch (err) {
        console.error('Error inserting focus pod in Supabase:', err);
      }
    }
  };

  const renewPodLease = async (podId: string) => {
    const newExpiresAt = new Date(Date.now() + 86400000 * 30).toISOString();
    const updated = focusPods.map((p) =>
      p.id === podId ? { ...p, expiresAt: newExpiresAt } : p
    );
    saveFocusPods(updated);

    if (isRealUser && user) {
      try {
        await supabase
          .from('focus_rooms')
          .update({ expires_at: newExpiresAt })
          .eq('id', podId)
          .eq('creator_id', user.id);
      } catch (err) {
        console.error('Error renewing pod lease in Supabase:', err);
      }
    }
  };

  const deleteFocusPod = async (podId: string) => {
    const targetPod = focusPods.find((p) => p.id === podId);
    const updated = focusPods.filter((p) => p.id !== podId);
    saveFocusPods(updated);

    if (isRealUser && user) {
      try {
        // Delete by exact ID
        await supabase
          .from('focus_rooms')
          .delete()
          .eq('id', podId)
          .eq('creator_id', user.id);

        // Also clean up any lingering duplicates with the same name for this creator
        if (targetPod?.name) {
          await supabase
            .from('focus_rooms')
            .delete()
            .eq('name', targetPod.name)
            .eq('creator_id', user.id);
        }
      } catch (err) {
        console.error('Error deleting focus pod from Supabase:', err);
      }
    }
  };

  // Create a new temporary room
  const createRoom = async (name: string, durationMinutes: number, code: string) => {
    setActiveRoomCode(code);
    setRoomName(name);
    setIsHost(true);
    localStorage.setItem('taktic_active_room_code', code);

    if (isRealUser && user) {
      try {
        await supabase.from('focus_rooms').insert({
          code,
          name,
          creator_id: user.id,
          duration_minutes: durationMinutes,
          is_private: true,
          is_permanent: false,
        });
      } catch (err: any) {
        console.error('Error creating focus room in Supabase:', err);
      }
    }
  };

  // Join room by code
  const joinRoomByCode = async (code: string) => {
    setActiveRoomCode(code);
    setRoomName(`Focus Room (${code})`);
    setIsHost(false);
    localStorage.setItem('taktic_active_room_code', code);
  };

  // Update room name (Host admin control)
  const updateRoomDetails = async (newName: string) => {
    setRoomName(newName);
    if (isRealUser && user && activeRoomCode && isHost) {
      try {
        await supabase
          .from('focus_rooms')
          .update({ name: newName })
          .eq('code', activeRoomCode)
          .eq('creator_id', user.id);
      } catch (err: any) {
        console.error('Error updating room details:', err);
      }
    }
  };

  // Leave active room
  const leaveRoom = () => {
    setActiveRoomCode(null);
    localStorage.removeItem('taktic_active_room_code');
  };

  // Send Floating Emoji Cheer
  const sendEmojiReaction = (emoji: string) => {
    const reactionId = `emoji-${Date.now()}`;
    const newEmoji: FloatingEmoji = {
      id: reactionId,
      emoji,
      userName,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== reactionId));
    }, 3000);
  };

  // Send Break Chat Message
  const sendBreakMessage = async (content: string) => {
    if (!content.trim() || !activeRoomCode) return;
    const msgId = `msg-${Date.now()}`;
    const newMsg: RoomMessage = {
      id: msgId,
      userName,
      userAvatar,
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (isRealUser && user) {
      try {
        await supabase.from('room_messages').insert({
          room_code: activeRoomCode,
          user_id: user.id,
          user_name: userName,
          user_avatar: userAvatar,
          content: content.trim(),
        });
      } catch (err: any) {
        console.error('Error sending room message to Supabase:', err);
      }
    }
  };

  return {
    activeRoomCode,
    roomName,
    isHost,
    roomMembers: soloInvisibleMode ? [] : roomMembers,
    floatingEmojis,
    messages,
    soloInvisibleMode,
    focusPods,
    toggleSoloInvisibleMode,
    createFocusPod,
    renewPodLease,
    deleteFocusPod,
    createRoom,
    joinRoomByCode,
    updateRoomDetails,
    leaveRoom,
    sendEmojiReaction,
    sendBreakMessage,
  };
}



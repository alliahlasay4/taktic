import { useState, useEffect, useCallback } from 'react';
import { CircleMember, FocusPod } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RoomMessage } from '../components/circles/BreakChatDrawer';
import { INITIAL_CIRCLE_MEMBERS } from '../lib/mockData';

export interface FloatingEmoji {
  id: string;
  emoji: string;
  userName: string;
}

const INITIAL_FOCUS_PODS: FocusPod[] = [
  {
    id: 'pod-1',
    name: 'Design Guild Pod 🎨',
    creatorId: 'user-1',
    allowedMemberIds: ['user-1', 'user-4'],
    allowedMemberNames: ['Elena Rostova', 'Amara Okafor'],
    durationMinutes: 25,
    isPermanent: true,
    expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
    activeMembersCount: 2,
    recentLogs: [
      {
        id: 'l-1',
        userName: 'Elena Rostova',
        taskTitle: 'Refactor Design Tokens',
        durationMinutes: 25,
        completedAt: '2 hours ago',
      },
      {
        id: 'l-2',
        userName: 'Amara Okafor',
        taskTitle: 'Audit Mobile Views',
        durationMinutes: 50,
        completedAt: '5 hours ago',
      },
    ],
  },
  {
    id: 'pod-2',
    name: 'Solopreneur Morning Club 🌅',
    creatorId: 'user-2',
    allowedMemberIds: ['user-2', 'user-3'],
    allowedMemberNames: ['Marcus Vance', 'Sora Takahashi'],
    durationMinutes: 50,
    isPermanent: true,
    expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
    activeMembersCount: 0,
    recentLogs: [
      {
        id: 'l-3',
        userName: 'Marcus Vance',
        taskTitle: 'Quarterly Financial Planning',
        durationMinutes: 50,
        completedAt: 'Yesterday',
      },
    ],
  },
];

export function useFocusRooms() {
  const { user, isDemo } = useAuth();
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(() => {
    return localStorage.getItem('taktic_active_room_code') || 'TK-8492';
  });
  const [roomName, setRoomName] = useState<string>('Silent Virtual Co-Working Room');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomMembers, setRoomMembers] = useState<CircleMember[]>(INITIAL_CIRCLE_MEMBERS);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  
  // Safeguard 1: Solo Invisible Mode
  const [soloInvisibleMode, setSoloInvisibleMode] = useState<boolean>(() => {
    return localStorage.getItem('taktic_solo_invisible_mode') === 'true';
  });

  // Safeguard 2 & 3: Permanent Pods & 30-Day Leases
  const [focusPods, setFocusPods] = useState<FocusPod[]>(() => {
    const saved = localStorage.getItem('taktic_focus_pods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_FOCUS_PODS;
  });

  const [messages, setMessages] = useState<RoomMessage[]>([
    {
      id: 'm1',
      userName: 'Marcus Vance',
      content: 'Great 25-min sprint everyone! Finished my API documentation.',
      timestamp: '10:45 AM',
    },
    {
      id: 'm2',
      userName: 'Sarah Jenkins',
      content: 'Grabbing coffee ☕ Ready for round 2 in 5 mins!',
      timestamp: '10:46 AM',
    },
  ]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userAvatar = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const toggleSoloInvisibleMode = () => {
    setSoloInvisibleMode((prev) => {
      const next = !prev;
      localStorage.setItem('taktic_solo_invisible_mode', String(next));
      return next;
    });
  };

  const createFocusPod = (
    name: string,
    selectedMemberIds: string[],
    selectedMemberNames: string[],
    durationMinutes: number
  ) => {
    const newPod: FocusPod = {
      id: `pod-${Date.now()}`,
      name,
      creatorId: user?.id || 'user',
      allowedMemberIds: selectedMemberIds,
      allowedMemberNames: selectedMemberNames,
      durationMinutes,
      isPermanent: true,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      activeMembersCount: 1,
      recentLogs: [
        {
          id: `log-${Date.now()}`,
          userName: 'You',
          taskTitle: 'Created Standing Focus Pod',
          durationMinutes,
          completedAt: 'Just now',
        },
      ],
    };

    setFocusPods((prev) => {
      const updated = [newPod, ...prev];
      localStorage.setItem('taktic_focus_pods', JSON.stringify(updated));
      return updated;
    });
  };

  const renewPodLease = (podId: string) => {
    setFocusPods((prev) => {
      const updated = prev.map((p) =>
        p.id === podId
          ? { ...p, expiresAt: new Date(Date.now() + 86400000 * 30).toISOString() }
          : p
      );
      localStorage.setItem('taktic_focus_pods', JSON.stringify(updated));
      return updated;
    });
  };

  // Create a new room
  const createRoom = async (name: string, durationMinutes: number, code: string) => {
    setActiveRoomCode(code);
    setRoomName(name);
    setIsHost(true);
    localStorage.setItem('taktic_active_room_code', code);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase.from('focus_rooms').insert({
          code,
          name,
          creator_id: user.id,
          duration_minutes: durationMinutes,
          is_private: true,
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
    if (!isDemo && isSupabaseConfigured && user && activeRoomCode && isHost) {
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

    // Automatically clear floating emoji after 3 seconds
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== reactionId));
    }, 3000);
  };

  // Send Break Chat Message
  const sendBreakMessage = async (content: string) => {
    const msgId = `msg-${Date.now()}`;
    const newMsg: RoomMessage = {
      id: msgId,
      userName,
      userAvatar,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (!isDemo && isSupabaseConfigured && user && activeRoomCode) {
      try {
        await supabase.from('room_messages').insert({
          room_id: activeRoomCode,
          user_id: user.id,
          user_name: userName,
          content,
        });
      } catch (err: any) {
        console.error('Error sending room message to Supabase:', err);
      }
    }
  };

  const deleteFocusPod = (podId: string) => {
    setFocusPods((prev) => {
      const updated = prev.filter((p) => p.id !== podId);
      localStorage.setItem('taktic_focus_pods', JSON.stringify(updated));
      return updated;
    });
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

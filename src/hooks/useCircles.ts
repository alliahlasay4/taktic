import { useState, useEffect, useCallback } from 'react';
import { CircleFeedPost, CircleMember, CircleInvite } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CIRCLE_MEMBERS, INITIAL_CIRCLE_FEED } from '../lib/mockData';

export function useCircles() {
  const { user, isDemo, profile } = useAuth();
  const isRealUser = !isDemo && isSupabaseConfigured && Boolean(user) && user?.id !== 'demo-user-123';
  const userKey = user?.id || (isDemo ? 'demo' : 'guest');

  const [feedPosts, setFeedPosts] = useState<CircleFeedPost[]>(() => {
    if (isDemo || userKey === 'demo') {
      const saved = sessionStorage.getItem('taktic_demo_circle_feed');
      return saved ? JSON.parse(saved) : INITIAL_CIRCLE_FEED;
    }
    const saved = localStorage.getItem(`taktic_circle_feed_${userKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [members, setMembers] = useState<CircleMember[]>(() => {
    if (isDemo || userKey === 'demo') {
      const saved = sessionStorage.getItem('taktic_demo_circle_members');
      return saved ? JSON.parse(saved) : INITIAL_CIRCLE_MEMBERS;
    }
    const saved = localStorage.getItem(`taktic_circle_members_${userKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [invites, setInvites] = useState<CircleInvite[]>(() => {
    if (isDemo || userKey === 'demo') {
      const saved = sessionStorage.getItem('taktic_demo_circle_invites');
      return saved ? JSON.parse(saved) : [];
    }
    const saved = localStorage.getItem(`taktic_circle_invites_${userKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userAvatar =
    profile?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Persist members with strict account isolation
  const saveMembers = (updated: CircleMember[]) => {
    setMembers(updated);
    if (isDemo || userKey === 'demo') {
      sessionStorage.setItem('taktic_demo_circle_members', JSON.stringify(updated));
    } else {
      localStorage.setItem(`taktic_circle_members_${userKey}`, JSON.stringify(updated));
    }
  };

  // Persist invites with strict account isolation
  const saveInvites = (updated: CircleInvite[]) => {
    setInvites(updated);
    if (isDemo || userKey === 'demo') {
      sessionStorage.setItem('taktic_demo_circle_invites', JSON.stringify(updated));
    } else {
      localStorage.setItem(`taktic_circle_invites_${userKey}`, JSON.stringify(updated));
    }
  };

  // Persist feed posts with strict account isolation
  const saveFeedPosts = (updated: CircleFeedPost[]) => {
    setFeedPosts(updated);
    if (isDemo || userKey === 'demo') {
      sessionStorage.setItem('taktic_demo_circle_feed', JSON.stringify(updated));
    } else {
      localStorage.setItem(`taktic_circle_feed_${userKey}`, JSON.stringify(updated));
    }
  };

  const generateMagicInviteLink = (email?: string, name?: string) => {
    const token = `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://taktic.app';
    const params = new URLSearchParams();
    params.set('circle_invite', token);
    params.set('inviter', userName);
    if (email) params.set('email', email);
    if (name) params.set('name', name);
    return { token, link: `${baseUrl}/?${params.toString()}` };
  };

  const sendCircleInvite = async (email: string, name?: string) => {
    const { token, link } = generateMagicInviteLink(email, name);
    const tempId = `inv-${Date.now()}`;
    const targetEmail = email.trim().toLowerCase();
    const partnerName = name?.trim() || targetEmail.split('@')[0];

    const newInvite: CircleInvite = {
      id: tempId,
      email: targetEmail,
      name: partnerName,
      status: 'pending',
      inviteToken: token,
      inviteLink: link,
      createdAt: new Date().toISOString(),
      inviterName: userName,
    };

    const updated = [newInvite, ...invites.filter((i) => i.email !== targetEmail)];
    saveInvites(updated);

    if (isSupabaseConfigured) {
      try {
        const payload = {
          email: targetEmail,
          name: partnerName,
          inviterName: userName || 'A colleague',
          inviterId: user?.id || null,
          redirectUrl: link,
        };

        // 1. Invoke Supabase Edge Function to dispatch Auth Invite Email
        let { data: edgeData, error: edgeErr } = await supabase.functions.invoke('invite-partner', {
          body: payload,
        });

        // If the function slug on Supabase is bright-responder, retry with bright-responder
        if (edgeErr) {
          const retryRes = await supabase.functions.invoke('bright-responder', {
            body: payload,
          });
          if (!retryRes.error) {
            edgeData = retryRes.data;
            edgeErr = null;
          }
        }

        if (edgeErr) {
          console.warn('Edge function invite dispatch note:', edgeErr.message);
        } else if (edgeData) {
          console.log('Invite email dispatched successfully via Supabase:', edgeData);
        }

        // 2. Persist record to circle_invites table if logged in
        if (isRealUser && user) {
          const { data, error: dbErr } = await supabase
            .from('circle_invites')
            .insert({
              user_id: user.id,
              email: newInvite.email,
              name: newInvite.name,
              status: 'pending',
              invite_token: token,
              invite_link: link,
            })
            .select()
            .single();

          if (!dbErr && data) {
            const updatedWithDbId = updated.map((inv) =>
              inv.id === tempId ? { ...inv, id: data.id } : inv
            );
            saveInvites(updatedWithDbId);
          }
        }
      } catch (err) {
        console.error('Error in sendCircleInvite:', err);
      }
    }

    return { success: true, inviteLink: link, message: `Invite email dispatched to ${targetEmail}` };
  };

  // Incoming Magic Link Acceptance Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('circle_invite');
    const inviterNameParam = urlParams.get('inviter');

    if (inviteToken && (inviterNameParam || inviteToken === 'accepted')) {
      const inviterTitle = inviterNameParam ? decodeURIComponent(inviterNameParam) : 'Circle Partner';
      
      // Check if already in members
      const alreadyMember = members.some(
        (m) => m.name.toLowerCase() === inviterTitle.toLowerCase()
      );

      if (!alreadyMember) {
        const partnerMember: CircleMember = {
          id: `partner-${Date.now()}`,
          name: inviterTitle,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'focusing',
          statusText: 'Connected via Magic Invite',
          closedRingsCount: 1,
          streak: 3,
          isCirclePartner: true,
          isMuted: false,
        };

        saveMembers([partnerMember, ...members]);
      }

      // Clean URL params gracefully
      urlParams.delete('circle_invite');
      urlParams.delete('inviter');
      urlParams.delete('email');
      urlParams.delete('name');
      const newQuery = urlParams.toString();
      const cleanPath = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState(null, '', cleanPath);
    }
  }, [members]);

  const cancelCircleInvite = async (inviteId: string) => {
    const updated = invites.filter((i) => i.id !== inviteId);
    saveInvites(updated);

    if (isRealUser && user) {
      try {
        await supabase
          .from('circle_invites')
          .delete()
          .eq('id', inviteId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting invite from Supabase:', err);
      }
    }
  };

  const resendCircleInvite = async (inviteId: string) => {
    const target = invites.find((i) => i.id === inviteId);
    if (!target) return { success: false, inviteLink: '' };
    return { success: true, inviteLink: target.inviteLink };
  };

  const togglePartner = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const nextPartnerState = !target.isCirclePartner;

    const updated = members.map((m) =>
      m.id === memberId ? { ...m, isCirclePartner: nextPartnerState } : m
    );
    saveMembers(updated);

    if (isRealUser && user) {
      try {
        await supabase
          .from('circle_members')
          .update({ is_circle_partner: nextPartnerState })
          .eq('id', memberId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating partner in DB:', err);
      }
    }
  };

  const toggleMute = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const nextMuteState = !target.isMuted;

    const updated = members.map((m) =>
      m.id === memberId ? { ...m, isMuted: nextMuteState } : m
    );
    saveMembers(updated);

    if (isRealUser && user) {
      try {
        await supabase
          .from('circle_members')
          .update({ is_muted: nextMuteState })
          .eq('id', memberId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating mute in DB:', err);
      }
    }
  };

  const addMemberByName = async (name: string) => {
    if (!name.trim()) return;
    const tempId = `user-${Date.now()}`;
    const newMember: CircleMember = {
      id: tempId,
      name: name.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'focusing',
      statusText: 'Active Partner',
      closedRingsCount: 0,
      streak: 1,
      isCirclePartner: true,
      isMuted: false,
    };

    const updated = [newMember, ...members];
    saveMembers(updated);

    if (isRealUser && user) {
      try {
        const { data, error: dbErr } = await supabase
          .from('circle_members')
          .insert({
            user_id: user.id,
            member_name: newMember.name,
            member_avatar: newMember.avatar,
            status: newMember.status,
            status_text: newMember.statusText,
            closed_rings_count: newMember.closedRingsCount,
            streak: newMember.streak,
            is_circle_partner: newMember.isCirclePartner,
            is_muted: newMember.isMuted,
          })
          .select()
          .single();

        if (!dbErr && data) {
          const updatedWithDbId = updated.map((m) =>
            m.id === tempId ? { ...m, id: data.id } : m
          );
          saveMembers(updatedWithDbId);
        }
      } catch (err) {
        console.error('Error inserting member to Supabase:', err);
      }
    }
  };

  const removeMember = async (memberId: string) => {
    const updated = members.filter((m) => m.id !== memberId);
    saveMembers(updated);

    if (isRealUser && user) {
      try {
        await supabase
          .from('circle_members')
          .delete()
          .eq('id', memberId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting member from Supabase:', err);
      }
    }
  };

  // Fetch feed posts, members, invites, and likes from Supabase
  const fetchCirclesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If demo mode -> strictly isolated demo data
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const savedFeed = sessionStorage.getItem('taktic_demo_circle_feed');
      const savedMembers = sessionStorage.getItem('taktic_demo_circle_members');
      const savedInvites = sessionStorage.getItem('taktic_demo_circle_invites');

      setFeedPosts(savedFeed ? JSON.parse(savedFeed) : INITIAL_CIRCLE_FEED);
      setMembers(savedMembers ? JSON.parse(savedMembers) : INITIAL_CIRCLE_MEMBERS);
      setInvites(savedInvites ? JSON.parse(savedInvites) : []);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user's circle members from DB
      const { data: membersData, error: membersErr } = await supabase
        .from('circle_members')
        .select('*')
        .eq('user_id', user.id);

      if (!membersErr && membersData) {
        const dbMembers: CircleMember[] = membersData.map((m) => ({
          id: m.id,
          name: m.member_name,
          avatar: m.member_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          status: (m.status as CircleMember['status']) || 'focusing',
          statusText: m.status_text || 'Active in Circle',
          closedRingsCount: m.closed_rings_count || 0,
          streak: m.streak || 1,
          isCirclePartner: m.is_circle_partner ?? true,
          isMuted: m.is_muted ?? false,
        }));
        setMembers(dbMembers);
        localStorage.setItem(`taktic_circle_members_${user.id}`, JSON.stringify(dbMembers));
      }

      // 2. Fetch user's circle invites from DB
      const isInvitesDisabled = localStorage.getItem('taktic_circle_invites_disabled') === 'true';
      if (!isInvitesDisabled) {
        const { data: invitesData, error: invitesErr } = await supabase
          .from('circle_invites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (invitesErr) {
          const isTableMissing =
            invitesErr.code === 'PGRST205' ||
            (invitesErr as any).status === 404 ||
            invitesErr.message?.includes('schema cache') ||
            invitesErr.message?.includes('circle_invites');

          if (isTableMissing) {
            localStorage.setItem('taktic_circle_invites_disabled', 'true');
          }
        } else if (invitesData) {
          const dbInvites: CircleInvite[] = invitesData.map((inv) => ({
            id: inv.id,
            email: inv.email,
            name: inv.name,
            status: (inv.status as CircleInvite['status']) || 'pending',
            inviteToken: inv.invite_token,
            inviteLink: inv.invite_link,
            createdAt: inv.created_at,
            inviterName: userName,
          }));
          setInvites(dbInvites);
          localStorage.setItem(`taktic_circle_invites_${user.id}`, JSON.stringify(dbInvites));
        }
      }

      // 3. Fetch circle posts from DB
      const { data: postsData, error: postsErr } = await supabase
        .from('circle_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      // 4. Fetch post likes
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('*');

      if (!postsErr && postsData) {
        const mappedPosts: CircleFeedPost[] = postsData.map((p) => {
          const likesForPost = (likesData || []).filter((l) => l.post_id === p.id);
          const userLike = likesForPost.find((l) => l.user_id === user.id);
          const userLiked = !!userLike;
          const userReaction = userLike ? (userLike.reaction || 'fire') : null;

          return {
            id: p.id,
            userId: p.user_id,
            userName: p.user_name,
            userAvatar: p.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            type: (p.type as CircleFeedPost['type']) || 'ring_closed',
            title: p.title,
            detail: p.detail || '',
            timestamp: p.created_at
              ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now',
            likes: likesForPost.length,
            userLiked,
            userReaction,
          };
        });

        setFeedPosts(mappedPosts);
        localStorage.setItem(`taktic_circle_feed_${user.id}`, JSON.stringify(mappedPosts));
      } else {
        setFeedPosts([]);
      }
    } catch (err: any) {
      console.error('Error fetching circles data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, userName]);

  useEffect(() => {
    fetchCirclesData();

    // Enable Supabase Realtime subscription for live feed updates
    if (isRealUser && user) {
      const channel = supabase
        .channel('public:circle_posts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'circle_posts' },
          (payload) => {
            const newPost = payload.new;
            const formatted: CircleFeedPost = {
              id: newPost.id,
              userId: newPost.user_id,
              userName: newPost.user_name,
              userAvatar:
                newPost.user_avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              type: (newPost.type as CircleFeedPost['type']) || 'ring_closed',
              title: newPost.title,
              detail: newPost.detail || '',
              timestamp: 'Just now',
              likes: 0,
              userLiked: false,
            };
            setFeedPosts((prev) => [formatted, ...prev.filter((p) => p.id !== formatted.id)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchCirclesData, isRealUser, user]);

  // Filter feed posts based on active, unmuted circle partners + user's own posts
  const activePartnerIds = new Set(
    members
      .filter((m) => m.isCirclePartner !== false && !m.isMuted)
      .map((m) => m.id)
  );

  const filteredFeedPosts = feedPosts.filter((post) => {
    // Current user's own post -> always show
    if (post.userId === (user?.id || 'user')) return true;
    // Post from a partner -> show if partner is active in circle and not muted
    return activePartnerIds.has(post.userId);
  });

  // Toggle Like / Reaction on Post
  const toggleLikePost = async (postId: string, reaction: string = 'fire') => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const currentReaction = post.userReaction || (post.userLiked ? 'fire' : null);
    const isRemoving = currentReaction === reaction;
    const isSwitching = !isRemoving && !!currentReaction && currentReaction !== reaction;

    const nextLiked = !isRemoving;
    const nextReaction = isRemoving ? null : reaction;
    const nextLikesCount = isRemoving
      ? Math.max(0, post.likes - 1)
      : isSwitching
      ? post.likes // Same user switched reaction emoji: total unique cheer count does not increment
      : post.likes + 1; // New cheer from user

    const updated = feedPosts.map((p) =>
      p.id === postId
        ? { ...p, userLiked: nextLiked, userReaction: nextReaction, likes: nextLikesCount }
        : p
    );
    saveFeedPosts(updated);

    if (isRealUser && user) {
      try {
        if (nextLiked) {
          await supabase.from('post_likes').upsert(
            { post_id: postId, user_id: user.id, reaction: nextReaction },
            { onConflict: 'post_id,user_id' }
          );
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        }
      } catch (err: any) {
        console.error('Error toggling like in Supabase:', err);
      }
    }
  };

  // Broadcast achievement to the circle feed
  const broadcastAchievement = async (
    type: CircleFeedPost['type'],
    title: string,
    detail: string
  ) => {
    // Check privacy setting: if disabled, do not broadcast to feed
    if (profile?.privacySettings && profile.privacySettings.showActivityFeed === false) {
      return;
    }

    const tempId = `post-${Date.now()}`;
    const newPost: CircleFeedPost = {
      id: tempId,
      userId: user?.id || 'user',
      userName,
      userAvatar,
      type,
      title,
      detail,
      timestamp: 'Just now',
      likes: 0,
      userLiked: false,
    };

    const updated = [newPost, ...feedPosts];
    saveFeedPosts(updated);

    if (isRealUser && user) {
      try {
        const { data, error } = await supabase
          .from('circle_posts')
          .insert({
            user_id: user.id,
            user_name: userName,
            user_avatar: userAvatar,
            type,
            title,
            detail,
          })
          .select()
          .single();

        if (!error && data) {
          const updatedWithDbId = updated.map((p) =>
            p.id === tempId ? { ...p, id: data.id } : p
          );
          saveFeedPosts(updatedWithDbId);
        }
      } catch (err) {
        console.error('Error broadcasting achievement to Supabase:', err);
      }
    }
  };

  return {
    feedPosts: filteredFeedPosts,
    rawFeedPosts: feedPosts,
    members,
    invites,
    loading,
    error,
    togglePartner,
    toggleMute,
    addMemberByName,
    removeMember,
    sendCircleInvite,
    cancelCircleInvite,
    resendCircleInvite,
    generateMagicInviteLink,
    toggleLikePost,
    broadcastAchievement,
    refreshFeed: fetchCirclesData,
  };
}


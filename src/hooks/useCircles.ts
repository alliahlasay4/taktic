import { useState, useEffect, useCallback } from 'react';
import { CircleFeedPost, CircleMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_CIRCLE_FEED, INITIAL_CIRCLE_MEMBERS } from '../lib/mockData';

export function useCircles() {
  const { user, isDemo } = useAuth();
  const [feedPosts, setFeedPosts] = useState<CircleFeedPost[]>([]);
  const [members, setMembers] = useState<CircleMember[]>(() => {
    const saved = localStorage.getItem('taktic_circle_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CIRCLE_MEMBERS;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const userAvatar = user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Persist members when changed
  const saveMembers = (updated: CircleMember[]) => {
    setMembers(updated);
    localStorage.setItem('taktic_circle_members', JSON.stringify(updated));
  };

  const togglePartner = async (memberId: string) => {
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, isCirclePartner: !m.isCirclePartner } : m
    );
    saveMembers(updated);

    const target = updated.find((m) => m.id === memberId);
    if (!isDemo && isSupabaseConfigured && user && target) {
      try {
        await supabase
          .from('circle_members')
          .update({ is_circle_partner: target.isCirclePartner })
          .eq('id', memberId)
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error updating partner in DB:', err);
      }
    }
  };

  const toggleMute = async (memberId: string) => {
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, isMuted: !m.isMuted } : m
    );
    saveMembers(updated);

    const target = updated.find((m) => m.id === memberId);
    if (!isDemo && isSupabaseConfigured && user && target) {
      try {
        await supabase
          .from('circle_members')
          .update({ is_muted: target.isMuted })
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
      statusText: 'Added to Circle',
      closedRingsCount: 0,
      streak: 1,
      isCirclePartner: true,
      isMuted: false,
    };

    saveMembers([newMember, ...members]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
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
          const updatedWithDbId = members.map((m) =>
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
    saveMembers(members.filter((m) => m.id !== memberId));

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
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

  // Fetch feed posts, members, and likes from Supabase
  const fetchCirclesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Demo Mode -> Mock Data
    if (isDemo || !isSupabaseConfigured || !user || user.id === 'demo-user-123') {
      const savedFeed = localStorage.getItem('taktic_circle_feed');
      setFeedPosts(savedFeed ? JSON.parse(savedFeed) : INITIAL_CIRCLE_FEED);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch posts
      const { data: postsData, error: postsErr } = await supabase
        .from('circle_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);

      if (postsErr) throw postsErr;

      // 2. Fetch all likes
      const { data: likesData, error: likesErr } = await supabase
        .from('post_likes')
        .select('*');

      if (likesErr) throw likesErr;

      // 3. Fetch user's circle members from DB
      const { data: membersData, error: membersErr } = await supabase
        .from('circle_members')
        .select('*')
        .eq('user_id', user.id);

      if (!membersErr && membersData && membersData.length > 0) {
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
        localStorage.setItem('taktic_circle_members', JSON.stringify(dbMembers));
      }

      // 3. Map to CircleFeedPost type
      const mappedPosts: CircleFeedPost[] = (postsData || []).map((p) => {
        const likesForPost = (likesData || []).filter((l) => l.post_id === p.id);
        const userLiked = likesForPost.some((l) => l.user_id === user.id);

        return {
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userAvatar: p.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          type: (p.type as CircleFeedPost['type']) || 'ring_closed',
          title: p.title,
          detail: p.detail || '',
          timestamp: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          likes: likesForPost.length,
          userLiked,
        };
      });

      // If DB is empty, combine with mock posts so feed looks active
      if (mappedPosts.length === 0) {
        setFeedPosts(INITIAL_CIRCLE_FEED);
      } else {
        setFeedPosts(mappedPosts);
      }
    } catch (err: any) {
      console.error('Error fetching circle feed from Supabase:', err);
      setError(err.message || 'Failed to load social feed.');
      setFeedPosts(INITIAL_CIRCLE_FEED);
    } finally {
      setLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    fetchCirclesData();

    // Enable Supabase Realtime subscription for live feed updates
    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
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
              userAvatar: newPost.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              type: (newPost.type as CircleFeedPost['type']) || 'ring_closed',
              title: newPost.title,
              detail: newPost.detail || '',
              timestamp: 'Just now',
              likes: 0,
              userLiked: false,
            };
            setFeedPosts((prev) => [formatted, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchCirclesData, isDemo, user]);

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

  // Toggle Like on Post
  const toggleLikePost = async (postId: string) => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const nextLiked = !post.userLiked;
    const nextLikesCount = nextLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

    // Optimistic UI update
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, userLiked: nextLiked, likes: nextLikesCount } : p))
    );

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        if (nextLiked) {
          await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        }
      } catch (err: any) {
        console.error('Error toggling like in Supabase:', err);
        // Revert on error
        setFeedPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, userLiked: post.userLiked, likes: post.likes } : p))
        );
      }
    }
  };

  // Broadcast achievement to the circle feed
  const broadcastAchievement = async (
    type: CircleFeedPost['type'],
    title: string,
    detail: string
  ) => {
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

    setFeedPosts((prev) => [newPost, ...prev]);

    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
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

        if (error) throw error;

        if (data) {
          setFeedPosts((prev) =>
            prev.map((p) => (p.id === tempId ? { ...p, id: data.id } : p))
          );
        }
      } catch (err: any) {
        console.error('Error broadcasting achievement to Supabase:', err);
      }
    }
  };

  return {
    feedPosts: filteredFeedPosts,
    rawFeedPosts: feedPosts,
    members,
    loading,
    error,
    togglePartner,
    toggleMute,
    addMemberByName,
    removeMember,
    toggleLikePost,
    broadcastAchievement,
    refreshFeed: fetchCirclesData,
  };
}

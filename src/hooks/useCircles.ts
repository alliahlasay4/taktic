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
    return { token, link: `${baseUrl}/login?${params.toString()}` };
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
          inviteToken: token,
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

  // Accept Circle Partner Invite (calls PostgreSQL SECURITY DEFINER RPC)
  const acceptCircleInvite = async (inviteToken: string) => {
    if (isRealUser && user) {
      const { data, error: rpcErr } = await supabase.rpc('accept_circle_invite', {
        p_invite_token: inviteToken,
      });

      if (rpcErr) {
        console.error('accept_circle_invite RPC error:', rpcErr);
        throw new Error(rpcErr.message || 'Failed to accept invitation');
      }

      await fetchCirclesData();
      return data;
    } else {
      // Demo mode fallback: add partner locally
      const inviterTitle = 'Circle Partner';
      const partnerMember: CircleMember = {
        id: `partner-${Date.now()}`,
        name: inviterTitle,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'focusing',
        statusText: 'Connected as Circle Partner',
        closedRingsCount: 1,
        streak: 3,
        isCirclePartner: true,
        isMuted: false,
      };
      saveMembers([partnerMember, ...members]);
      return { success: true, inviter_name: inviterTitle };
    }
  };

  // Check database for any pending invitation sent to the logged-in user's email
  const checkMyPendingInvite = useCallback(async () => {
    if (!isRealUser || !user) return null;
    try {
      const { data, error } = await supabase.rpc('get_my_pending_circle_invite');
      if (!error && data && data.invite_token) {
        return {
          token: data.invite_token,
          inviter: data.inviter_name || 'Circle Partner',
        };
      }
    } catch (e) {
      console.warn('Could not check pending invite via RPC:', e);
    }
    return null;
  }, [isRealUser, user]);

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
        // Fetch real partner profiles, streaks, and privacy_settings from profiles table
        const partnerUserIds = membersData
          .map((m) => m.partner_user_id)
          .filter(Boolean) as string[];

        const memberNames = membersData
          .map((m) => m.member_name)
          .filter(Boolean) as string[];

        let partnerProfilesMap: Record<string, any> = {};

        try {
          const normalizePartnerProfile = (p: any) => {
            const rawPrivacy = p.privacy_settings || p.privacySettings;
            const parsedPrivacy = typeof rawPrivacy === 'string'
              ? (() => { try { return JSON.parse(rawPrivacy); } catch { return {}; } })()
              : (rawPrivacy || {});

            const isIncognito = Boolean(
              parsedPrivacy.isIncognito || 
              parsedPrivacy.is_incognito ||
              p.isIncognito ||
              p.is_incognito
            );

            return {
              ...p,
              privacy_settings: {
                showFocusHours: parsedPrivacy.showFocusHours !== false,
                showMicroGoal: parsedPrivacy.showMicroGoal !== false,
                showActivityFeed: parsedPrivacy.showActivityFeed !== false,
                showStreak: parsedPrivacy.showStreak !== false,
                isIncognito,
              },
            };
          };

          const addProfilesToMap = (profiles: any[]) => {
            profiles.forEach((rawP) => {
              const p = normalizePartnerProfile(rawP);
              if (p.id) {
                partnerProfilesMap[p.id] = p;
                partnerProfilesMap[p.id.toLowerCase()] = p;
              }
              if (p.email) {
                const em = p.email.trim().toLowerCase();
                partnerProfilesMap[em] = p;
                const emPrefix = em.split('@')[0];
                partnerProfilesMap[emPrefix] = p;
              }
              const fullName = p.full_name || p.fullName;
              if (fullName) {
                const fn = fullName.trim().toLowerCase();
                partnerProfilesMap[fn] = p;
                partnerProfilesMap[fn.replace(/\s+/g, '')] = p;
              }
              if (p.username) {
                const un = p.username.trim().toLowerCase();
                partnerProfilesMap[un] = p;
                partnerProfilesMap[un.replace(/^@/, '')] = p;
                partnerProfilesMap[`@${un.replace(/^@/, '')}`] = p;
              }
            });
          };

          // Also scan locally stored user profiles (handles immediate multi-account flip in local browser)
          try {
            const localProfiles: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('taktic_user_profile_') || key === 'taktic_user_profile')) {
                const val = localStorage.getItem(key);
                if (val) {
                  try {
                    const parsed = JSON.parse(val);
                    if (parsed && typeof parsed === 'object') {
                      localProfiles.push(parsed);
                    }
                  } catch {}
                }
              }
            }
            if (localProfiles.length > 0) {
              addProfilesToMap(localProfiles);
            }
          } catch (e) {
            console.warn('Could not read local profile cache:', e);
          }

          // 1. Fetch all profiles from Supabase using select('*') to avoid any missing column issues
          const { data: allProfiles, error: allProfilesErr } = await supabase
            .from('profiles')
            .select('*');

          if (!allProfilesErr && allProfiles) {
            addProfilesToMap(allProfiles);
          }
        } catch (e) {
          console.warn('Could not fetch partner profiles for circle members:', e);
        }

        const dbMembers: CircleMember[] = membersData.map((m) => {
          const rawMemberName = (m.member_name || '').trim().toLowerCase();
          const cleanNameNoAt = rawMemberName.replace(/^@/, '');
          const cleanNameNoSpace = rawMemberName.replace(/\s+/g, '');
          const cleanNameEmailPrefix = rawMemberName.split('@')[0];

          const partnerProfile =
            (m.partner_user_id ? partnerProfilesMap[m.partner_user_id] : null) ||
            (m.partner_user_id ? partnerProfilesMap[m.partner_user_id.toLowerCase()] : null) ||
            (rawMemberName ? partnerProfilesMap[rawMemberName] : null) ||
            (cleanNameNoAt ? partnerProfilesMap[cleanNameNoAt] : null) ||
            (cleanNameNoAt ? partnerProfilesMap[`@${cleanNameNoAt}`] : null) ||
            (cleanNameNoSpace ? partnerProfilesMap[cleanNameNoSpace] : null) ||
            (cleanNameEmailPrefix ? partnerProfilesMap[cleanNameEmailPrefix] : null);

          const isPartnerIncognito = Boolean(
            partnerProfile?.privacy_settings?.isIncognito ||
            partnerProfile?.privacySettings?.isIncognito ||
            partnerProfile?.isIncognito ||
            partnerProfile?.is_incognito
          );
          const isShowStreak = partnerProfile?.privacy_settings?.showStreak !== false;
          const liveStreak = partnerProfile?.current_streak !== undefined 
            ? partnerProfile.current_streak 
            : (m.streak || 0);

          const cleanStatusText = isPartnerIncognito
            ? 'Offline'
            : (partnerProfile?.status_message || (m.status_text || 'Online'));

          return {
            id: m.id,
            partnerUserId: m.partner_user_id || partnerProfile?.id || undefined,
            name: partnerProfile?.full_name || partnerProfile?.fullName || partnerProfile?.username || m.member_name,
            avatar: partnerProfile?.avatar_url || partnerProfile?.avatarUrl || m.member_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            // If the partner turned on incognito mode, their live status is stealth/offline
            status: isPartnerIncognito ? 'idle' : (partnerProfile?.status_message ? 'focusing' : (m.status || 'idle')),
            statusText: cleanStatusText,
            closedRingsCount: m.closed_rings_count || 0,
            streak: liveStreak,
            isCirclePartner: m.is_circle_partner ?? true,
            isMuted: m.is_muted ?? false,
            isIncognito: isPartnerIncognito,
            showStreak: isShowStreak,
            showFocusHours: partnerProfile?.privacy_settings?.showFocusHours !== false,
            showMicroGoal: partnerProfile?.privacy_settings?.showMicroGoal !== false,
            showActivityFeed: partnerProfile?.privacy_settings?.showActivityFeed !== false,
          };
        });
        setMembers(dbMembers);
        localStorage.setItem(`taktic_circle_members_${user.id}`, JSON.stringify(dbMembers));
      }

      // 2. Fetch user's circle invites from DB (only active pending invites for non-members)
      const isInvitesDisabled = localStorage.getItem('taktic_circle_invites_disabled') === 'true';
      if (!isInvitesDisabled) {
        const { data: invitesData, error: invitesErr } = await supabase
          .from('circle_invites')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
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
          const existingNames = new Set(
            (membersData || []).map((m) => m.member_name.toLowerCase())
          );

          const dbInvites: CircleInvite[] = invitesData
            .filter((inv) => inv.status === 'pending' && (!inv.name || !existingNames.has(inv.name.toLowerCase())))
            .map((inv) => ({
              id: inv.id,
              email: inv.email,
              name: inv.name,
              status: 'pending',
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
        .limit(50);

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
            isPrivate: Boolean(p.is_private),
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

    // Enable Supabase Realtime subscription for live feed updates and live circle member roster changes
    if (isRealUser && user) {
      const postsChannel = supabase
        .channel('public:circle_posts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'circle_posts' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
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
                isPrivate: Boolean(newPost.is_private),
              };
              setFeedPosts((prev) => [formatted, ...prev.filter((p) => p.id !== formatted.id)]);
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id;
              if (deletedId) {
                setFeedPosts((prev) => prev.filter((p) => p.id !== deletedId));
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedPost = payload.new;
              setFeedPosts((prev) =>
                prev.map((p) =>
                  p.id === updatedPost.id
                    ? {
                        ...p,
                        title: updatedPost.title,
                        detail: updatedPost.detail || '',
                        isPrivate: Boolean(updatedPost.is_private),
                      }
                    : p
                )
              );
            }
          }
        )
        .subscribe();

      const likesChannel = supabase
        .channel('public:post_likes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'post_likes' },
          () => {
            fetchCirclesData();
          }
        )
        .subscribe();

      const feedBroadcastChannel = supabase
        .channel('public:circle_feed_broadcast')
        .on('broadcast', { event: 'reaction_sync' }, (payload) => {
          if (payload?.payload?.postId) {
            const { postId, newLikesCount, reactingUserId, reaction, isRemoving } = payload.payload;
            setFeedPosts((prev) =>
              prev.map((p) => {
                if (p.id !== postId) return p;
                const isMe = user && reactingUserId === user.id;
                return {
                  ...p,
                  likes: typeof newLikesCount === 'number' ? newLikesCount : p.likes,
                  ...(isMe ? { userLiked: !isRemoving, userReaction: isRemoving ? null : reaction } : {}),
                };
              })
            );
          }
        })
        .subscribe();

      const membersChannel = supabase
        .channel(`public:circle_members:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'circle_members', filter: `user_id=eq.${user.id}` },
          () => {
            fetchCirclesData();
          }
        )
        .subscribe();

      const invitesChannel = supabase
        .channel(`public:circle_invites:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'circle_invites', filter: `user_id=eq.${user.id}` },
          () => {
            fetchCirclesData();
          }
        )
        .subscribe();

      const profilesChannel = supabase
        .channel('public:profiles_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            fetchCirclesData();
          }
        )
        .subscribe();

      const handleVisibilityOrFocus = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchCirclesData();
        }
      };
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key && (e.key.includes('profile') || e.key.includes('circle'))) {
          fetchCirclesData();
        }
      };
      window.addEventListener('focus', handleVisibilityOrFocus);
      window.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('focus', handleVisibilityOrFocus);
        window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('storage', handleStorageChange);
        supabase.removeChannel(postsChannel);
        supabase.removeChannel(likesChannel);
        supabase.removeChannel(feedBroadcastChannel);
        supabase.removeChannel(membersChannel);
        supabase.removeChannel(invitesChannel);
        supabase.removeChannel(profilesChannel);
      };
    }
  }, [fetchCirclesData, isRealUser, user]);

  // Filter feed posts strictly to active, unmuted circle partners + user's own posts
  const partnerUserIds = new Set<string>();
  const partnerExactNames = new Set<string>();
  const partnerEmails = new Set<string>();

  members.forEach((m) => {
    // Only include active, unmuted circle partners
    if (m.isCirclePartner !== false && !m.isMuted) {
      if (m.partnerUserId) {
        partnerUserIds.add(m.partnerUserId.toLowerCase());
      }
      if (m.name) {
        const cleanName = m.name.trim().toLowerCase();
        // Disallow generic placeholder names from matching non-partners
        if (
          cleanName &&
          cleanName !== 'circle partner' &&
          cleanName !== 'member' &&
          cleanName !== 'user' &&
          cleanName.length >= 2
        ) {
          partnerExactNames.add(cleanName);
        }
      }
      if (m.email) {
        const cleanEmail = m.email.trim().toLowerCase();
        partnerEmails.add(cleanEmail);
      }
    }
  });

  const filteredFeedPosts = feedPosts.filter((post) => {
    const isOwnPost = Boolean(user && post.userId && post.userId === user.id) ||
      (post.userId === 'user' && !isRealUser);

    // 1. Current user's own post -> always show in own feed
    if (isOwnPost) return true;

    // 2. If another user's post is marked private/masked -> NEVER show to partners
    if (post.isPrivate) return false;

    // 3. In real user mode, strictly check if post author is an active partner in this user's roster
    if (isRealUser) {
      // Check exact partner auth user_id match
      if (post.userId && partnerUserIds.has(post.userId.toLowerCase())) {
        return true;
      }

      // Check exact partner email match
      if (post.userName && partnerEmails.has(post.userName.trim().toLowerCase())) {
        return true;
      }

      // Check exact validated partner name match (only if partner_user_id wasn't set)
      if (post.userName && partnerExactNames.has(post.userName.trim().toLowerCase())) {
        return true;
      }

      // If not authored by current user and not authored by any roster partner -> HIDE
      return false;
    }

    // Demo mode: show demo feed posts
    return true;
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

          // If reacting to a partner's post, send an in-app notification to the post author
          if (post.userId && post.userId !== user.id && post.userId !== 'user') {
            const reactionEmojiMap: Record<string, string> = {
              fire: '🔥 Fire',
              zap: '⚡ Sprint',
              sparkles: '✨ Sparkle',
              heart: '❤️ Love',
            };
            const emojiLabel = reactionEmojiMap[nextReaction || 'fire'] || 'Cheer';

            // Clean up any unread cheer notifications for this same post from this partner to avoid duplication
            try {
              await supabase
                .from('notifications')
                .delete()
                .eq('user_id', post.userId)
                .eq('type', 'circle')
                .ilike('message', `%${post.title}%`)
                .eq('read', false);
            } catch (err) {
              // Ignore cleanup error
            }

            await supabase.from('notifications').insert({
              user_id: post.userId,
              title: `${userName} cheered your milestone! 🎉`,
              message: `${userName} reacted with ${emojiLabel} to "${post.title}"`,
              type: 'circle',
              read: false,
              action_tab: 'circles',
            });
          }
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        }

        // Broadcast reaction update across clients via Realtime
        await supabase.channel('public:circle_feed_broadcast').send({
          type: 'broadcast',
          event: 'reaction_sync',
          payload: {
            postId,
            newLikesCount: nextLikesCount,
            reactingUserId: user.id,
            reaction: nextReaction,
            isRemoving,
          },
        });
      } catch (err: any) {
        console.error('Error toggling like in Supabase:', err);
      }
    }
  };

  // Broadcast achievement to the circle feed
  const broadcastAchievement = async (
    type: CircleFeedPost['type'],
    title: string,
    detail: string,
    isPrivate: boolean = false
  ) => {
    // Check privacy setting: if disabled or incognito, and trying to post public circle broadcast, return
    if (!isPrivate && profile?.privacySettings && (profile.privacySettings.showActivityFeed === false || profile.privacySettings.isIncognito === true)) {
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
      isPrivate,
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
            is_private: isPrivate,
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

  const deletePost = async (postId: string) => {
    const updated = feedPosts.filter((p) => p.id !== postId);
    saveFeedPosts(updated);

    if (isRealUser && user) {
      try {
        await supabase.from('circle_posts').delete().eq('id', postId).eq('user_id', user.id);
      } catch (err) {
        console.error('Error deleting post from Supabase:', err);
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
    acceptCircleInvite,
    checkMyPendingInvite,
    toggleLikePost,
    broadcastAchievement,
    deletePost,
    refreshFeed: fetchCirclesData,
  };
}


import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchUserProfileFromSupabase, saveUserProfileToSupabase } from '../lib/profileSupabase';
import { UserProfile } from '../types';

export interface DemoUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | DemoUser | null;
  session: Session | null;
  profile: UserProfile;
  isDemo: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  id: 'demo-user-123',
  fullName: 'Portfolio Reviewer',
  username: '@reviewer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Productivity enthusiast building deep work habits with Taktic.',
  microGoal: 'Complete 3 pomodoros before 2 PM',
  statusMessage: 'In Deep Flow Mode ⚡',
  timezone: 'GMT+8 (Asia/Manila)',
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  favoriteSoundscape: 'Gentle Rain',
  privacySettings: {
    showFocusHours: true,
    showMicroGoal: true,
    showActivityFeed: true,
    showStreak: true,
    isIncognito: false,
  },
};

const DEMO_USER: DemoUser = {
  id: 'demo-user-123',
  email: 'reviewer@taktic.app',
  user_metadata: {
    full_name: 'Portfolio Reviewer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
};

export const hasIncomingAuthLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    hash.includes('access_token') ||
    hash.includes('type=signup') ||
    hash.includes('type=recovery') ||
    hash.includes('type=invite') ||
    hash.includes('type=magiclink') ||
    hash.includes('type=email_change') ||
    search.includes('code=')
  );
};

export const extractEmailFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const search = window.location.search;

  const searchParams = new URLSearchParams(search);
  if (searchParams.get('email')) {
    return searchParams.get('email') || '';
  }

  if (hash.includes('access_token')) {
    try {
      const match = hash.match(/access_token=([^&]+)/);
      if (match && match[1]) {
        const base64Url = match[1].split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload?.email) {
          return payload.email;
        }
      }
    } catch (e) {
      console.warn('Could not decode access_token payload:', e);
    }
  }
  return '';
};

export const clearDemoData = () => {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clear all session storage (where temporary demo state lives)
    sessionStorage.clear();

    // 2. Clear any lingering demo-related localStorage items while preserving real user keys
    const demoKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('demo') ||
          key.includes('demo-user-123') ||
          key.endsWith('_demo') ||
          key.startsWith('taktic_demo_') ||
          key === 'taktic_demo_mode')
      ) {
        demoKeysToRemove.push(key);
      }
    }
    demoKeysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.error('Error clearing demo data:', err);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    if (hasIncomingAuthLink()) {
      clearDemoData();
      localStorage.removeItem('taktic_demo_mode');
      return false;
    }
    return localStorage.getItem('taktic_demo_mode') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  const [profile, setProfile] = useState<UserProfile>(() => {
    if (hasIncomingAuthLink()) {
      return DEFAULT_PROFILE;
    }
    if (localStorage.getItem('taktic_demo_mode') === 'true') {
      const demoSaved = sessionStorage.getItem('taktic_demo_profile');
      if (demoSaved) {
        try {
          return { ...DEFAULT_PROFILE, ...JSON.parse(demoSaved) };
        } catch {}
      }
      return DEFAULT_PROFILE;
    }
    const saved = localStorage.getItem('taktic_user_profile');
    if (saved) {
      try {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error parsing saved profile:', e);
      }
    }
    return DEFAULT_PROFILE;
  });

  const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const realUserId = (!isDemo && user?.id && user.id !== 'demo-user-123') ? user.id : undefined;
    const targetId = realUserId || profile.id || 'demo-user-123';

    const updated: UserProfile = {
      ...profile,
      ...updates,
      id: targetId,
      privacySettings: updates.privacySettings
        ? {
            showFocusHours: updates.privacySettings.showFocusHours ?? profile.privacySettings?.showFocusHours ?? true,
            showMicroGoal: updates.privacySettings.showMicroGoal ?? profile.privacySettings?.showMicroGoal ?? true,
            showActivityFeed: updates.privacySettings.showActivityFeed ?? profile.privacySettings?.showActivityFeed ?? true,
            showStreak: updates.privacySettings.showStreak ?? profile.privacySettings?.showStreak ?? true,
            isIncognito: updates.privacySettings.isIncognito !== undefined
              ? Boolean(updates.privacySettings.isIncognito)
              : Boolean(profile.privacySettings?.isIncognito),
          }
        : profile.privacySettings,
    };

    setProfile(updated);

    if (isDemo || targetId === 'demo-user-123') {
      sessionStorage.setItem('taktic_demo_profile', JSON.stringify(updated));
    } else {
      localStorage.setItem(`taktic_user_profile_${targetId}`, JSON.stringify(updated));
      localStorage.setItem('taktic_user_profile', JSON.stringify(updated));
    }

    if (!isDemo && isSupabaseConfigured && targetId && targetId !== 'demo-user-123') {
      await saveUserProfileToSupabase(updated, targetId);
    }

    return updated;
  };

  const syncSupabaseProfile = async (currentSession: Session | null) => {
    if (!currentSession?.user) return;
    const userId = currentSession.user.id;

    // Check local cached profile for this user ID to immediately render without delay
    const cachedStr = localStorage.getItem(`taktic_user_profile_${userId}`);
    let cachedProfile: UserProfile | null = null;
    if (cachedStr) {
      try {
        cachedProfile = JSON.parse(cachedStr);
      } catch {}
    }

    if (cachedProfile) {
      setProfile(cachedProfile);
    }

    const dbProfile = await fetchUserProfileFromSupabase(userId);
    if (dbProfile) {
      const finalProfile: UserProfile = {
        ...dbProfile,
        privacySettings: {
          ...dbProfile.privacySettings,
          isIncognito: dbProfile.privacySettings?.isIncognito ?? cachedProfile?.privacySettings?.isIncognito ?? false,
        },
      };
      setProfile(finalProfile);
      localStorage.setItem(`taktic_user_profile_${userId}`, JSON.stringify(finalProfile));
      localStorage.setItem('taktic_user_profile', JSON.stringify(finalProfile));
    } else {
      const userMetaName = currentSession.user.user_metadata?.full_name?.trim();
      const emailPrefix = currentSession.user.email ? currentSession.user.email.split('@')[0] : 'user';
      const fallbackName = userMetaName || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)) || 'New User';

      const initialProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        id: userId,
        fullName: fallbackName,
        username: `@${emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        avatarUrl: currentSession.user.user_metadata?.avatar_url || DEFAULT_PROFILE.avatarUrl,
        privacySettings: cachedProfile?.privacySettings || DEFAULT_PROFILE.privacySettings,
      };
      setProfile(initialProfile);
      localStorage.setItem(`taktic_user_profile_${userId}`, JSON.stringify(initialProfile));
      localStorage.setItem('taktic_user_profile', JSON.stringify(initialProfile));
      await saveUserProfileToSupabase(initialProfile, userId);
    }
  };

  useEffect(() => {
    // Process incoming auth links (Email Confirmation, Password Reset, Magic Link)
    const handleIncomingAuthLink = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = window.location.search;
      const isAuthCallback = hasIncomingAuthLink();
      const hasAuthError = hash.includes('error=') || search.includes('error=');

      if (isAuthCallback && !hasAuthError) {
        // 1. Immediately purge demo state & cached profiles
        clearDemoData();
        localStorage.removeItem('taktic_demo_mode');
        localStorage.removeItem('taktic_user_profile');
        setIsDemo(false);

        // 2. Cleanly sign out Account A FIRST before doing anything with the new link
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {}
        }

        // 3. Extract confirmed email from URL token payload
        let confirmedEmail = extractEmailFromUrl();

        // 4. If PKCE code is present, exchange it with Supabase to finalize Account B's verification
        if (isSupabaseConfigured && search.includes('code=')) {
          try {
            const searchParams = new URLSearchParams(search);
            const code = searchParams.get('code');
            if (code) {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && data?.user?.email) {
                confirmedEmail = data.user.email;
              }
              // Sign out immediately so Account B is NOT automatically logged in
              await supabase.auth.signOut({ scope: 'local' });
            }
          } catch (err) {
            console.error('Error handling auth confirmation:', err);
          }
        }

        const notice = {
          email: confirmedEmail,
          message: 'Your email has been verified! Please sign in with your password to continue.',
        };

        // 5. Save confirmation notice into sessionStorage for AuthPage
        sessionStorage.setItem('taktic_auth_confirmation_notice', JSON.stringify(notice));

        // 6. Clean URL to /login and broadcast events to open AuthPage and pre-fill form
        window.history.replaceState(null, '', '/login');
        window.dispatchEvent(new CustomEvent('taktic_auth_notice', { detail: notice }));
        window.dispatchEvent(new Event('popstate'));

        setUser(null);
        setSession(null);
        setProfile(DEFAULT_PROFILE);
        setLoading(false);
        return;
      }

      if (hasAuthError) {
        // Clean error hash and navigate to /login to display error
        window.history.replaceState(null, '', '/login' + search + hash);
        window.dispatchEvent(new Event('popstate'));
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      if (isDemo) {
        setUser(DEMO_USER);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          syncSupabaseProfile(session);
        }
        setLoading(false);
      });
    };

    handleIncomingAuthLink();

    if (!isSupabaseConfigured) return;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // If we are currently handling an email confirmation redirect, do not auto-login
      if (hasIncomingAuthLink()) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await syncSupabaseProfile(session);
      } else if (!isDemo) {
        setProfile(DEFAULT_PROFILE);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials are not configured in .env.local') };
    }
    setIsDemo(false);
    localStorage.removeItem('taktic_demo_mode');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials are not configured in .env.local') };
    }
    setIsDemo(false);
    localStorage.removeItem('taktic_demo_mode');

    let emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const pendingRaw = typeof window !== 'undefined' ? (localStorage.getItem('taktic_pending_circle_invite') || sessionStorage.getItem('taktic_pending_circle_invite')) : null;
    if (pendingRaw && typeof window !== 'undefined') {
      try {
        const parsed = JSON.parse(pendingRaw);
        if (parsed?.token) {
          emailRedirectTo = `${window.location.origin}/login?circle_invite=${parsed.token}&inviter=${encodeURIComponent(parsed.inviter || 'Circle Partner')}`;
        }
      } catch {}
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo,
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials are not configured in .env.local') };
    }
    setIsDemo(false);
    localStorage.removeItem('taktic_demo_mode');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const loginAsDemo = () => {
    clearDemoData();
    setIsDemo(true);
    localStorage.setItem('taktic_demo_mode', 'true');
    setUser(DEMO_USER);
    setProfile(DEFAULT_PROFILE);
  };

  const signOut = async () => {
    if (isDemo) {
      clearDemoData();
      setIsDemo(false);
      localStorage.removeItem('taktic_demo_mode');
      setUser(null);
      setSession(null);
      setProfile(DEFAULT_PROFILE);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(DEFAULT_PROFILE);
    localStorage.removeItem('taktic_user_profile');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isDemo,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        loginAsDemo,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

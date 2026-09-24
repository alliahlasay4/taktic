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
  updateProfile: (updates: Partial<UserProfile>) => void;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('taktic_demo_mode') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  const [profile, setProfile] = useState<UserProfile>(() => {
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

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        ...updates,
        privacySettings: updates.privacySettings
          ? { ...prev.privacySettings, ...updates.privacySettings }
          : prev.privacySettings,
      };
      if (user?.id) {
        localStorage.setItem(`taktic_user_profile_${user.id}`, JSON.stringify(updated));
      } else {
        localStorage.setItem('taktic_user_profile', JSON.stringify(updated));
      }

      // Asynchronously sync profile changes to Supabase table if logged in
      if (!isDemo && isSupabaseConfigured && updated.id && updated.id !== 'demo-user-123') {
        saveUserProfileToSupabase(updated);
      }

      return updated;
    });
  };

  const syncSupabaseProfile = async (currentSession: Session | null) => {
    if (!currentSession?.user) return;
    const userId = currentSession.user.id;

    const dbProfile = await fetchUserProfileFromSupabase(userId);
    if (dbProfile) {
      setProfile(dbProfile);
      localStorage.setItem(`taktic_user_profile_${userId}`, JSON.stringify(dbProfile));
    } else {
      // Initialize initial profile state for new session cleanly
      const userMetaName = currentSession.user.user_metadata?.full_name?.trim();
      const emailPrefix = currentSession.user.email ? currentSession.user.email.split('@')[0] : 'user';
      const fallbackName = userMetaName || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)) || 'New User';

      const initialProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        id: userId,
        fullName: fallbackName,
        username: `@${emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
        avatarUrl: currentSession.user.user_metadata?.avatar_url || DEFAULT_PROFILE.avatarUrl,
      };
      setProfile(initialProfile);
      localStorage.setItem(`taktic_user_profile_${userId}`, JSON.stringify(initialProfile));
      saveUserProfileToSupabase(initialProfile);
    }
  };

  useEffect(() => {
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncSupabaseProfile(session);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
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
    setIsDemo(true);
    localStorage.setItem('taktic_demo_mode', 'true');
    setUser(DEMO_USER);
  };

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      localStorage.removeItem('taktic_demo_mode');
      setUser(null);
      setSession(null);
      setProfile(DEFAULT_PROFILE);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
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
      window.history.replaceState(null, '', window.location.pathname);
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

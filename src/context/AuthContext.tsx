import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  isDemo: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
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
      return;
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isDemo,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        loginAsDemo,
        signOut,
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

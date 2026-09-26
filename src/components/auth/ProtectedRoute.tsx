import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthPage } from './AuthPage';
import { LandingPage } from '../landing/LandingPage';
import {
  LANDING_PATH,
  isAuthPath,
  isLandingPath,
  normalizePath,
} from '../../lib/routes';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  const getAuthStateFromLocation = () => {
    if (typeof window === 'undefined') return { open: false, signUp: false };
    const pathname = normalizePath(window.location.pathname);
    const hash = window.location.hash.toLowerCase();

    const isSignUp =
      pathname === '/signup' ||
      pathname === '/register' ||
      hash === '#signup' ||
      hash === '#register';

    const isSignIn =
      pathname === '/login' ||
      pathname === '/signin' ||
      pathname === '/auth' ||
      hash === '#login' ||
      hash === '#signin' ||
      hash === '#auth';

    return {
      open: isSignUp || isSignIn,
      signUp: isSignUp,
    };
  };

  const initial = getAuthStateFromLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(initial.open);
  const [defaultSignUp, setDefaultSignUp] = useState(initial.signUp);
  const prevUserRef = React.useRef(user);

  // Sync state with popstate and hashchange events (back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      if (!user) {
        const authState = getAuthStateFromLocation();
        setIsAuthOpen(authState.open);
        setDefaultSignUp(authState.signUp);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [user]);

  // When user is authenticated:
  // Clean up any public/auth URLs (e.g. /login, /signup, /landing, #login) to the canonical app path
  useEffect(() => {
    if (user) {
      setIsAuthOpen(false);
      prevUserRef.current = user;
      if (typeof window !== 'undefined') {
        const pathname = normalizePath(window.location.pathname);
        if (isLandingPath(pathname) || isAuthPath(pathname) || window.location.hash) {
          window.history.replaceState(null, '', '/focushub');
        }
      }
    } else {
      prevUserRef.current = null;
    }
  }, [user]);

  // When user is NOT authenticated:
  // If they are on a protected tab (e.g. after signout or navigating directly to /focushub),
  // automatically update the URL to /landing
  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      const pathname = normalizePath(window.location.pathname);
      if (!isLandingPath(pathname) && !isAuthPath(pathname)) {
        window.history.replaceState(null, '', LANDING_PATH);
      }
    }
  }, [loading, user]);

  // Detect immediate logout transition in the current render frame
  const justLoggedOut = Boolean(prevUserRef.current && !user);
  if (justLoggedOut && isAuthOpen) {
    setIsAuthOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-lg shadow-[#C06C4C]/25 animate-pulse">
            <span className="font-heading font-bold text-2xl">T</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent-terracotta)] border-t-transparent" />
            <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Loading Taktic Hub...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    const shouldShowAuth = isAuthOpen && !justLoggedOut;

    if (shouldShowAuth) {
      return (
        <AuthPage
          onBackToHome={() => {
            setIsAuthOpen(false);
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', LANDING_PATH);
            }
          }}
          defaultSignUp={defaultSignUp}
        />
      );
    }

    return (
      <LandingPage
        onOpenAuth={(signUpMode = false) => {
          setDefaultSignUp(signUpMode);
          setIsAuthOpen(true);
          if (typeof window !== 'undefined') {
            const authPath = signUpMode ? '/signup' : '/login';
            window.history.pushState(null, '', authPath);
          }
        }}
      />
    );
  }

  return <>{children}</>;
};


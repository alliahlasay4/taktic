import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth, isEmailConfirmationLink, isPasswordRecoveryLink } from '../../context/AuthContext';
import {
  LANDING_PATH,
  isAuthPath,
  isLandingPath,
  normalizePath,
} from '../../lib/routes';
import { TakticLogo } from '../common/TakticLogo';

const AuthPage = lazy(() => import('./AuthPage').then((m) => ({ default: m.AuthPage })));
const LandingPage = lazy(() => import('../landing/LandingPage').then((m) => ({ default: m.LandingPage })));

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  const getAuthStateFromLocation = () => {
    if (typeof window === 'undefined') return { open: false, signUp: false };
    const pathname = normalizePath(window.location.pathname);
    const hash = window.location.hash.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const circleInvite = searchParams.get('circle_invite');
    const inviterParam = searchParams.get('inviter');
    const isAuthLink = isEmailConfirmationLink() || isPasswordRecoveryLink();
    const hasNotice = Boolean(sessionStorage.getItem('taktic_auth_confirmation_notice'));

    // Automatically capture & preserve invite token across all tabs using localStorage & sessionStorage
    if (circleInvite) {
      const inviteData = JSON.stringify({
        token: circleInvite,
        inviter: inviterParam ? decodeURIComponent(inviterParam) : 'Circle Partner',
      });
      localStorage.setItem('taktic_pending_circle_invite', inviteData);
      sessionStorage.setItem('taktic_pending_circle_invite', inviteData);
    }

    const isSignUp =
      pathname === '/signup' ||
      pathname === '/register' ||
      hash === '#signup' ||
      hash === '#register';

    const hasAuthError = hash.includes('error=') || searchParams.has('error') || searchParams.has('error_code');

    const isSignIn =
      pathname === '/login' ||
      pathname === '/signin' ||
      pathname === '/auth' ||
      hash === '#login' ||
      hash === '#signin' ||
      hash === '#auth' ||
      hasAuthError ||
      isAuthLink ||
      hasNotice;

    return {
      open: isSignUp || isSignIn || Boolean(circleInvite) || isAuthLink || hasNotice,
      signUp: isSignUp && !isAuthLink && !hasNotice,
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
        if (isLandingPath(pathname) || isAuthPath(pathname) || window.location.hash || window.location.search.includes('circle_invite')) {
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

  // Detect explicit manual logout vs email verification redirect
  const isAuthCallback = isEmailConfirmationLink() || (typeof window !== 'undefined' && Boolean(sessionStorage.getItem('taktic_auth_confirmation_notice')));
  const currentPath = typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/';
  const isExplicitAuthPath = isAuthPath(currentPath);

  const justLoggedOut = Boolean(prevUserRef.current && !user && !isAuthCallback && !isExplicitAuthPath);
  if (justLoggedOut && isAuthOpen) {
    setIsAuthOpen(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <TakticLogo size="lg" className="animate-pulse" />
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
    const shouldShowAuth = (isAuthOpen || isAuthCallback || isExplicitAuthPath) && !justLoggedOut;

    if (shouldShowAuth) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
              <div className="flex flex-col items-center gap-3">
                <TakticLogo className="h-10 w-10 animate-pulse text-[var(--accent-terracotta)]" />
                <div className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  Loading secure portal...
                </div>
              </div>
            </div>
          }
        >
          <AuthPage
            onBackToHome={() => {
              setIsAuthOpen(false);
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('taktic_auth_confirmation_notice');
                window.history.pushState(null, '', LANDING_PATH);
              }
            }}
            defaultSignUp={defaultSignUp}
          />
        </Suspense>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3">
              <TakticLogo className="h-10 w-10 animate-pulse text-[var(--accent-terracotta)]" />
              <div className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                Loading Taktic...
              </div>
            </div>
          </div>
        }
      >
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
      </Suspense>
    );
  }

  return <>{children}</>;
};


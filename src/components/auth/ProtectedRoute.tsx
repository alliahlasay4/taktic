import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth, isEmailConfirmationLink, isPasswordRecoveryLink } from '../../context/AuthContext';
import {
  LANDING_PATH,
  isAuthPath,
  isLandingPath,
  normalizePath,
} from '../../lib/routes';
import { TakticLogo } from '../common/TakticLogo';
import { getSynchronousAuthUserId, getSynchronousAuthUserEmail } from '../../lib/storage';
import { InviteAccountMismatchModal } from './InviteAccountMismatchModal';

const AuthPage = lazy(() => import('./AuthPage').then((m) => ({ default: m.AuthPage })));
const LandingPage = lazy(() => import('../landing/LandingPage').then((m) => ({ default: m.LandingPage })));

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isPasswordRecovery, signOut } = useAuth();

  // Helper to synchronously detect invite account mismatch
  const getInitialInviteMismatch = () => {
    if (typeof window === 'undefined') return null;
    const searchParams = new URLSearchParams(window.location.search);
    const circleInvite = searchParams.get('circle_invite');
    const emailParam = searchParams.get('email');
    const inviterParam = searchParams.get('inviter');
    const currentEmail = user?.email || getSynchronousAuthUserEmail();

    if (circleInvite && emailParam && currentEmail) {
      if (emailParam.trim().toLowerCase() !== currentEmail.trim().toLowerCase()) {
        return {
          currentUserEmail: currentEmail,
          invitedEmail: emailParam.trim().toLowerCase(),
          inviterName: inviterParam ? decodeURIComponent(inviterParam) : 'Circle Partner',
          token: circleInvite,
        };
      }
    }
    return null;
  };

  // State to hold invite mismatch details if logged-in user email doesn't match invite email
  const [inviteMismatch, setInviteMismatch] = useState<{
    currentUserEmail: string;
    invitedEmail: string;
    inviterName: string;
    token: string;
  } | null>(getInitialInviteMismatch);

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
      const inviterIdParam = searchParams.get('inviter_id');
      const emailParam = searchParams.get('email');
      const currentEmail = user?.email || getSynchronousAuthUserEmail();
      const isSelf = Boolean(
        (user?.id && inviterIdParam && inviterIdParam === user.id) ||
        (currentEmail && inviterParam && inviterParam.toLowerCase() === currentEmail.toLowerCase())
      );
      const isMismatch = Boolean(
        emailParam && currentEmail && emailParam.trim().toLowerCase() !== currentEmail.trim().toLowerCase()
      );

      if (!isSelf && !isMismatch) {
        const inviteData = JSON.stringify({
          token: circleInvite,
          inviter: inviterParam ? decodeURIComponent(inviterParam) : 'Circle Partner',
          inviterId: inviterIdParam || undefined,
          email: emailParam || undefined,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('taktic_pending_circle_invite', inviteData);
        sessionStorage.setItem('taktic_pending_circle_invite', inviteData);
      } else {
        localStorage.removeItem('taktic_pending_circle_invite');
        sessionStorage.removeItem('taktic_pending_circle_invite');
      }
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
      pathname === '/reset-password' ||
      pathname === '/update-password' ||
      hash === '#login' ||
      hash === '#signin' ||
      hash === '#auth' ||
      hash === '#reset' ||
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

  // Check for email mismatch on invite links when a user is already signed in
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const circleInvite = searchParams.get('circle_invite');
    const emailParam = searchParams.get('email');
    const inviterParam = searchParams.get('inviter');
    const currentEmail = user?.email || getSynchronousAuthUserEmail();

    if (user && circleInvite && emailParam && currentEmail) {
      if (emailParam.trim().toLowerCase() !== currentEmail.trim().toLowerCase()) {
        setInviteMismatch({
          currentUserEmail: currentEmail,
          invitedEmail: emailParam.trim().toLowerCase(),
          inviterName: inviterParam ? decodeURIComponent(inviterParam) : 'Circle Partner',
          token: circleInvite,
        });
        return;
      }
    }
    setInviteMismatch(null);
  }, [user]);

  // When user is authenticated:
  // Clean up any public/auth URLs (e.g. /login, /signup, /landing, #login) to the canonical app path,
  // UNLESS there is an invite account mismatch requiring their attention!
  useEffect(() => {
    if (user && !isPasswordRecovery && !inviteMismatch) {
      setIsAuthOpen(false);
      prevUserRef.current = user;
      if (typeof window !== 'undefined') {
        const pathname = normalizePath(window.location.pathname);
        if (isLandingPath(pathname) || isAuthPath(pathname) || window.location.hash || window.location.search.includes('circle_invite')) {
          window.history.replaceState(null, '', '/focushub');
        }
      }
    } else if (!user) {
      prevUserRef.current = null;
    }
  }, [user, isPasswordRecovery, inviteMismatch]);

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

  // If user is on a public route (/landing, /login, /signup) and has NO stored auth token in localStorage,
  // do not hold them on the full-screen "Loading Taktic Hub..." spinner.
  // Instead, render the public landing or auth page immediately to eliminate LCP delay.
  const hasLocalSessionToken = Boolean(getSynchronousAuthUserId());
  const isPublicRoute = isLandingPath(currentPath) || isExplicitAuthPath;

  if (loading && !(!user && isPublicRoute && !hasLocalSessionToken)) {
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

  if (isPasswordRecovery) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3">
              <TakticLogo className="h-10 w-10 animate-pulse text-[var(--accent-terracotta)]" />
              <div className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                Loading password recovery...
              </div>
            </div>
          </div>
        }
      >
        <AuthPage isUpdatePassword={true} />
      </Suspense>
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

  // If there is an invite account mismatch, do NOT render the authenticated children (the inviter's dashboard)
  // to avoid exposing any glimpse of the inviter's account data to the wrong user.
  if (inviteMismatch) {
    return (
      <InviteAccountMismatchModal
        currentUserEmail={inviteMismatch.currentUserEmail}
        invitedEmail={inviteMismatch.invitedEmail}
        inviterName={inviteMismatch.inviterName}
        onSwitchAccount={async () => {
          const preservedInvite = {
            token: inviteMismatch.token,
            inviter: inviteMismatch.inviterName,
            email: inviteMismatch.invitedEmail,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('taktic_pending_circle_invite', JSON.stringify(preservedInvite));
          sessionStorage.setItem('taktic_pending_circle_invite', JSON.stringify(preservedInvite));
          
          // Sign out the current user session
          await signOut();
          setInviteMismatch(null);
          setDefaultSignUp(true);
          setIsAuthOpen(true);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.origin + '/signup');
            url.searchParams.set('circle_invite', preservedInvite.token);
            url.searchParams.set('inviter', preservedInvite.inviter);
            url.searchParams.set('email', preservedInvite.email);
            window.history.pushState(null, '', url.pathname + url.search);
          }
        }}
        onContinueCurrentAccount={() => {
          setInviteMismatch(null);
          localStorage.removeItem('taktic_pending_circle_invite');
          sessionStorage.removeItem('taktic_pending_circle_invite');
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('circle_invite');
            url.searchParams.delete('inviter');
            url.searchParams.delete('inviter_id');
            url.searchParams.delete('email');
            url.searchParams.delete('name');
            window.history.replaceState(null, '', '/focushub');
          }
        }}
      />
    );
  }

  return (
    <>
      {children}
    </>
  );
};


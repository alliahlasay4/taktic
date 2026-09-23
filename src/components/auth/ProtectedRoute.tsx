import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from './AuthModal';
import { LandingPage } from '../landing/LandingPage';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  const getInitialAuthState = () => {
    if (typeof window === 'undefined') return { open: false, signUp: false };
    const hash = window.location.hash.toLowerCase();
    if (hash === '#signup' || hash === '#register') return { open: true, signUp: true };
    if (hash === '#login' || hash === '#signin' || hash === '#auth') return { open: true, signUp: false };
    return { open: false, signUp: false };
  };

  const initial = getInitialAuthState();
  const [isAuthOpen, setIsAuthOpen] = useState(initial.open);
  const [defaultSignUp, setDefaultSignUp] = useState(initial.signUp);

  // Listen to hash changes in browser (e.g. user visits #login directly)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#signup' || hash === '#register') {
        setDefaultSignUp(true);
        setIsAuthOpen(true);
      } else if (hash === '#login' || hash === '#signin' || hash === '#auth') {
        setDefaultSignUp(false);
        setIsAuthOpen(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    return (
      <>
        <LandingPage
          onOpenAuth={(signUpMode = false) => {
            setDefaultSignUp(signUpMode);
            setIsAuthOpen(true);
            window.location.hash = signUpMode ? '#signup' : '#login';
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            if (
              window.location.hash.startsWith('#login') ||
              window.location.hash.startsWith('#signup') ||
              window.location.hash.startsWith('#signin')
            ) {
              window.history.pushState(null, '', window.location.pathname + window.location.search);
            }
          }}
          defaultSignUp={defaultSignUp}
        />
      </>
    );
  }

  return <>{children}</>;
};

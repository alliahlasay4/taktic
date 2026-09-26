import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  LogIn,
  UserPlus,
  Sparkles,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  defaultSignUp?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultSignUp = false }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [isResetPassword, setIsResetPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  useEffect(() => {
    setIsSignUp(defaultSignUp);
    setIsResetPassword(false);
    resetFormFields();
  }, [defaultSignUp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isResetPassword) {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset link sent! Check your inbox for instructions.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send reset link.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password || (isSignUp && !fullName.trim())) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) {
          setErrorMsg(error.message);
        } else {
          const { error: loginErr } = await signInWithEmail(email.trim(), password);
          if (loginErr) {
            setSuccessMsg('Account created! Please check your email to confirm your account or sign in directly.');
            setIsSignUp(false);
          }
        }
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) setErrorMsg(error.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl overflow-hidden my-auto transition-colors duration-300">
        
        {/* Top Decorative Header */}
        <div className="relative bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] px-6 pt-6 pb-7 text-white overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

          {/* Top Bar: Brand & Close */}
          <div className="relative z-10 flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#C06C4C] font-heading font-bold text-sm shadow-md">
                T
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                Taktic
              </span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Header Title & Subtitle */}
          <div className="relative z-10 space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              {isResetPassword
                ? 'Reset your password'
                : isSignUp
                ? 'Create your free account'
                : 'Welcome back'}
            </h1>
            <p className="text-xs text-white/90 leading-relaxed">
              {isResetPassword
                ? 'Enter your email address to receive password reset instructions.'
                : isSignUp
                ? 'Join Taktic to organize daily tasks, routines, and focus sessions.'
                : 'Sign in to access your tactical focus and daily rhythm.'}
            </p>
          </div>
        </div>

        {/* Main Content Form */}
        <div className="p-6 space-y-5">
          {/* Prominent Tab Switcher (Highlighting Create Account vs Sign In) */}
          {!isResetPassword && (
            <div className="flex rounded-2xl bg-[var(--bg-main)] p-1.5 border border-[var(--border-subtle)] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  resetFormFields();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isSignUp
                    ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  resetFormFields();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSignUp
                    ? 'bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-md'
                    : 'text-[#C06C4C] hover:bg-[var(--card-surface)] font-extrabold'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label htmlFor="auth-full-name" className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    id="auth-full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email-address" className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="auth-email-address"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                  required
                />
              </div>
            </div>

            {!isResetPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-bold text-[var(--text-primary)]">
                    Password
                  </label>
                    {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetPassword(true);
                        resetFormFields();
                      }}
                      className="text-[11px] font-semibold text-[#C06C4C] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] py-2.5 pl-10 pr-12 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                    required={!isResetPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-[#C06C4C]/25 hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isResetPassword ? (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Send Password Reset Link</span>
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Free Account</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Login link when in Reset mode */}
          {isResetPassword && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  resetFormFields();
                }}
                className="text-xs font-bold text-[#C06C4C] hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Social Google Sign In */}
          {!isResetPassword && (
            <div className="space-y-4 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-subtle)]" />
                </div>
                <span className="relative bg-[var(--card-surface)] px-3 text-[11px] font-medium text-[var(--text-muted)]">
                  or continue with
                </span>
              </div>

              <button
                onClick={handleGoogleAuth}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer shadow-2xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
                <span>Google</span>
              </button>

              {/* Highlighted Create Account Banner for Sign-in mode */}
              {!isSignUp && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#C06C4C]/10 via-[#C87D87]/10 to-[#CFA052]/10 border border-[#C06C4C]/25 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      New to Taktic?
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Create an account in seconds
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white text-xs font-bold hover:opacity-95 active:scale-95 transition shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Fast-Pass Demo Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#CFA052]" />
                  <span>Or try <strong>1-Click Interactive Demo</strong> without signing in</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

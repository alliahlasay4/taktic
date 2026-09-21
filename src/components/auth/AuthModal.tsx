import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogIn, UserPlus, Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isResetPassword) {
      if (!email) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset link sent! Please check your email inbox.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send reset link.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password || (isSignUp && !fullName)) {
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
        const { error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          // Attempt auto sign in
          const { error: loginErr } = await signInWithEmail(email, password);
          if (loginErr) {
            setSuccessMsg('Account created! If email confirmation is enabled in your Supabase settings, please check your inbox or confirm your user in the Supabase Dashboard to log in.');
            setIsSignUp(false);
          }
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
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
      setErrorMsg(err.message || 'Google sign in failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/20 bg-[var(--bg-card,#121824)] p-8 shadow-2xl shadow-emerald-950/40 text-[var(--text-primary,#f3f4f6)]">
        {/* Top Decorative Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

        {/* Header */}
        <div className="relative text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/30">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Taktic</span>
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {isSignUp ? 'Create your account to sync your habits & focus sessions' : 'Sign in to access your personal focus workspace'}
          </p>
        </div>

        {/* Demo Reviewer Fast Pass Banner */}
        <div className="relative mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" /> Portfolio Fast Pass
              </span>
              <p className="mt-0.5 text-xs text-gray-300">
                Evaluating Taktic? Skip registration and explore full interactive features instantly.
              </p>
            </div>
            <button
              onClick={loginAsDemo}
              type="button"
              className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <span>Try Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-gray-800" />
          <span className="bg-[var(--bg-card,#121824)] px-3 text-xs uppercase text-gray-500 tracking-wider">
            or sign in with email
          </span>
          <div className="w-full border-t border-gray-800" />
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                required
              />
            </div>
          </div>

          {!isResetPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-400">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(true);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-medium text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  required={!isResetPassword}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-black transition hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : isResetPassword ? (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Send Reset Link</span>
              </>
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Google Auth Button */}
        {!isResetPassword && (
          <div className="mt-3">
            <button
              onClick={handleGoogleAuth}
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-800 bg-gray-900/40 py-2.5 text-xs font-medium text-gray-300 hover:bg-gray-800/60 hover:text-white transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Bottom Switch Tab */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {isResetPassword ? (
            <button
              onClick={() => {
                setIsResetPassword(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              type="button"
              className="font-semibold text-emerald-400 hover:underline"
            >
              ← Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                type="button"
                className="font-semibold text-emerald-400 hover:underline ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

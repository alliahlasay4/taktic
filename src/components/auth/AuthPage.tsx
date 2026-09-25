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
  ArrowLeft,
  Sun,
  Moon,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthPageProps {
  onBackToHome?: () => void;
  defaultSignUp?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBackToHome, defaultSignUp = false }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [isResetPassword, setIsResetPassword] = useState(false);

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  useEffect(() => {
    setIsSignUp(defaultSignUp);
    setIsResetPassword(false);
    resetFormFields();
  }, [defaultSignUp]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Theme Toggle State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('taktic_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('taktic_dark_mode', String(darkMode));
  }, [darkMode]);

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

    if (!email.trim() || !password || (isSignUp && (!fullName.trim() || !confirmPassword))) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
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
    <div className="min-h-screen lg:h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden">
      
      {/* ================= LEFT COLUMN (60%): HERO VISUAL WITH ORGANIC FLUID WAVES ================= */}
      <div className="w-full lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] p-6 sm:p-8 lg:p-10 xl:p-12 text-white flex flex-col justify-between shadow-2xl min-h-[300px] lg:min-h-0">
        
        {/* Layered Organic Wave SVGs in the Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
          <svg
            className="absolute -right-20 -bottom-20 w-[140%] h-[140%] min-w-[500px]"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 150 C 150 260 280 40 450 180 C 550 250 500 450 500 500 L 0 500 Z"
              fill="url(#waveGrad1)"
              opacity="0.6"
            />
            <path
              d="M0 280 C 120 180 320 320 500 200 L 500 500 L 0 500 Z"
              fill="url(#waveGrad2)"
              opacity="0.7"
            />
            <path
              d="M0 380 C 200 280 350 420 500 340 L 500 500 L 0 500 Z"
              fill="#FFFFFF"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA066" />
                <stop offset="100%" stopColor="#C87D87" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C87D87" />
                <stop offset="100%" stopColor="#C06C4C" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#CFA052]/30 blur-3xl pointer-events-none" />

        {/* Top Header: Brand Logo & Back to Home inside Left Column */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-white text-[#C06C4C] font-heading font-extrabold text-xl shadow-lg">
              T
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-white drop-shadow-xs">
              Taktic
            </span>
          </div>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-semibold text-white transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}
        </div>

        {/* Middle Hero Typography */}
        <div className="relative z-10 py-6 sm:py-8 lg:py-0 space-y-3 sm:space-y-4 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tactical Focus & Daily Rhythm</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-sm">
            {isResetPassword ? (
              <>
                Reset <br /> Password.
              </>
            ) : isSignUp ? (
              <>
                Start Your <br /> Journey!
              </>
            ) : (
              <>
                Welcome <br /> Back!
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-white/90 leading-relaxed font-normal">
            {isResetPassword
              ? 'Enter your registered email to receive password reset instructions and reclaim your workspace.'
              : isSignUp
              ? 'Turn scattered to-do lists into 3 sharp focus priorities, streak-protected habits, and deep flow sessions.'
              : 'Command your daily execution, stack habit routines, and lock in deep focus sprints in synchrony.'}
          </p>
        </div>

        {/* Bottom Social Proof / Rhythm Pill */}
        <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-white/20 text-xs text-white/85">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white/60 bg-[#CFA052] flex items-center justify-center font-bold text-[10px] text-black">
              ★
            </div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white/60 bg-white text-[#C06C4C] flex items-center justify-center font-bold text-[9px]">
              99%
            </div>
          </div>
          <span className="text-xs">Built for builders who execute every single day.</span>
        </div>
      </div>

      {/* ================= RIGHT COLUMN (40%): CLEAN AUTHENTICATION FORM ================= */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-5 sm:p-7 lg:p-8 xl:p-10 bg-[var(--bg-main)] overflow-y-auto">
        
        {/* Top Controls: Theme Switcher & Mobile Back */}
        <div className="flex items-center justify-between pb-2 sm:pb-3">
          <div className="lg:hidden">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
            )}
          </div>
          <div className="hidden lg:block" />

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex h-9 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-2xs ml-auto"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <>
                <Sun className="h-4 w-4 text-[#CFA052]" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#C06C4C]" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Centered Form Wrapper */}
        <div className="max-w-sm w-full mx-auto my-auto space-y-4 sm:space-y-4">
          
          {/* Header Title & Subtitle */}
          <div className="space-y-1 text-left">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Login'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isResetPassword
                ? 'Please enter your email to receive recovery instructions.'
                : isSignUp
                ? 'Welcome to Taktic! Fill in your details to get started.'
                : 'Welcome back! Please login to your account.'}
            </p>
          </div>

          {/* Prominent Segmented Switcher (Sign In vs Create Account) */}
          {!isResetPassword && (
            <div className="flex rounded-xl bg-[var(--card-surface)] p-1 border border-[var(--border-subtle)] shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  resetFormFields();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isSignUp
                    ? 'bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-sm'
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
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSignUp
                    ? 'bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Error / Success Notifications */}
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-2.5 sm:space-y-3">
            {/* Full Name Input (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label htmlFor="auth-full-name" className="block text-xs font-bold text-[var(--text-primary)]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    id="auth-full-name"
                    name="fullName"
                    type="text"
                    autoComplete="off"
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[#282421] py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label htmlFor="auth-email-address" className="block text-xs font-bold text-[var(--text-primary)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="auth-email-address"
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="username@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[#282421] py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Password */}
            {!isResetPassword && (
              <div className="space-y-1">
                <label htmlFor="auth-password" className="block text-xs font-bold text-[var(--text-primary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[#282421] py-2.5 pl-9 pr-10 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                    required={!isResetPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && !isResetPassword && (
              <div className="space-y-1">
                <label htmlFor="auth-confirm-password" className="block text-xs font-bold text-[var(--text-primary)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-[#282421] py-2.5 pl-9 pr-10 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#C06C4C] focus:outline-hidden focus:ring-2 focus:ring-[#C06C4C]/20 transition shadow-2xs"
                    required={isSignUp}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password Row */}
            {!isResetPassword && !isSignUp && (
              <div className="flex items-center justify-between pt-0.5">
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-secondary)] select-none hover:text-[var(--text-primary)]"
                >
                  <span className="text-[#C06C4C]">
                    {rememberMe ? (
                      <CheckSquare className="w-3.5 h-3.5 fill-[#C06C4C] text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                  </span>
                  <span>Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    resetFormFields();
                  }}
                  className="text-xs font-semibold text-[#C06C4C] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-[#C06C4C]/20 hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Sign In Link for Password Reset */}
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
                ← Back to Login
              </button>
            </div>
          )}

          {/* Social Sign In (Google) */}
          {!isResetPassword && (
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-subtle)]" />
                </div>
                <span className="relative bg-[var(--bg-main)] px-3 text-[11px] font-medium text-[var(--text-muted)]">
                  or continue with
                </span>
              </div>

              <button
                onClick={handleGoogleAuth}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] hover:bg-[var(--card-hover)] text-xs font-bold text-[var(--text-primary)] transition cursor-pointer shadow-2xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Quick Switch Link */}
              <div className="text-center text-xs text-[var(--text-secondary)]">
                {isSignUp ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        resetFormFields();
                      }}
                      className="font-bold text-[#C06C4C] hover:underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    New to Taktic?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        resetFormFields();
                      }}
                      className="font-bold text-[#C06C4C] hover:underline cursor-pointer ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
              </div>

              {/* 1-Click Fast Pass Demo Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#CFA052]" />
                  <span>Or explore <strong>1-Click Interactive Demo</strong></span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer general security info */}
        <div className="pt-3 text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-[var(--text-muted)]" />
          <span>Secure & encrypted connection</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { soundEngine } from '../../lib/audio';
import {
  LogIn,
  UserPlus,
  Sparkles,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Sun,
  Moon,
  CloudRain,
  Waves,
  Headphones,
  Coffee,
  Volume2,
  VolumeX,
  Target,
  Repeat,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  defaultSignUp?: boolean;
}

const PREVIEW_SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Rain', icon: CloudRain },
  { id: 'Ocean Waves', label: 'Ocean', icon: Waves },
  { id: 'Lo-Fi Autumn Beats', label: 'Lo-Fi', icon: Headphones },
  { id: 'Coffee Shop Ambience', label: 'Cafe', icon: Coffee },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultSignUp = false }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    setIsSignUp(defaultSignUp);
  }, [defaultSignUp]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreviewSound, setActivePreviewSound] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Live Theme Toggle
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

  // Clean up preview audio on unmount
  useEffect(() => {
    return () => {
      soundEngine.stopSoundscape();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleAudioPreview = (soundName: string) => {
    if (activePreviewSound === soundName) {
      soundEngine.stopSoundscape();
      setActivePreviewSound(null);
    } else {
      soundEngine.playSoundscape(soundName);
      setActivePreviewSound(soundName);
    }
  };

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
          setSuccessMsg('Password reset link sent! Check your inbox for instructions.');
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
          const { error: loginErr } = await signInWithEmail(email, password);
          if (loginErr) {
            setSuccessMsg('Account created! Please check your email to confirm your account or sign in directly.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl lg:max-w-5xl rounded-3xl sm:rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-main)] shadow-2xl overflow-hidden my-auto transition-colors duration-300">
        
        {/* 1. TOP SPLIT GRADIENT HORIZON BANNER */}
        <div className="relative w-full bg-gradient-to-r from-[#FF6B4A] via-[#E85D75] to-[#FFA066] dark:from-[#5E281C] dark:via-[#4C1C2C] dark:to-[#633916] px-6 sm:px-9 pt-4 sm:pt-5 pb-10 sm:pb-12 text-white overflow-hidden transition-colors duration-300">
          {/* Ambient Glows inside Banner */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

          {/* Top Header Controls Bar */}
          <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/20">
            {/* Logo Badge */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#FF6B4A] font-heading font-black text-sm shadow-md">
                T
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-base font-bold tracking-tight text-white">
                  Taktic
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                  v1.0
                </span>
              </div>
            </div>

            {/* Top Right Controls: Theme Toggle & Dismiss */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="flex h-7 items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 text-xs font-semibold text-white transition cursor-pointer backdrop-blur-xs shadow-2xs"
                title={darkMode ? 'Switch to Light Mode (Sepia Oat)' : 'Switch to Dark Mode (Dark Espresso)'}
                aria-label="Toggle Theme"
              >
                {darkMode ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Sepia Oat</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-white" />
                    <span className="hidden sm:inline">Dark Espresso</span>
                  </>
                )}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition cursor-pointer backdrop-blur-xs shadow-2xs"
                  title="Close"
                  aria-label="Close modal"
                >
                  <span className="text-sm font-bold leading-none">✕</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner Hero Copy */}
          <div className="relative z-10 pt-3 max-w-xl space-y-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Login to Account'}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-md">
              Command your daily execution, stack habit routines, and focus in synchrony with your team.
            </p>

            {/* Quick Switch Action Link */}
            <div className="pt-0.5 text-xs text-white/90">
              {isResetPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold underline underline-offset-2 hover:text-white transition cursor-pointer"
                >
                  ← Back to Login
                </button>
              ) : isSignUp ? (
                <>
                  Already Have an Account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold underline underline-offset-2 hover:text-white ml-1 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't Have an Account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold underline underline-offset-2 hover:text-white ml-1 transition cursor-pointer"
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. LOWER CANVAS & OVERLAPPING FLOATING CARD */}
        <div className="px-5 sm:px-8 pb-5 sm:pb-6 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start relative z-10">
          
          {/* LEFT COLUMN: Interactive Feature Showcase & Ambient Audio (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-2.5 pt-1 lg:pt-2.5 order-2 lg:order-1">
            {/* Live Concentric Daily Rhythm Showcase Card */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 sm:p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold font-heading text-[var(--text-primary)]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-warm-ochre)]" />
                  Concentric Daily Rhythm
                </span>
                <span className="rounded-full bg-[#6B8E6E]/15 px-2 py-0.5 text-[9px] font-bold text-[#6B8E6E]">
                  100% Closed
                </span>
              </div>

              {/* Concentric Mini SVG + Badges */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 140 140" className="w-16 h-16 sm:w-18 sm:h-18 rotate-[-90deg]">
                    <defs>
                      <linearGradient id="miniTaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4E7A52" />
                        <stop offset="100%" stopColor="#7BB280" />
                      </linearGradient>
                      <linearGradient id="miniHabitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#B85D6A" />
                        <stop offset="100%" stopColor="#E58A97" />
                      </linearGradient>
                      <linearGradient id="miniFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#CFA052" />
                        <stop offset="100%" stopColor="#E6B870" />
                      </linearGradient>
                    </defs>

                    {/* Ring 1 - Tasks (Botanical Sage) */}
                    <circle cx="70" cy="70" r="56" stroke="#6B8E6E" strokeWidth="7" fill="transparent" opacity="0.15" />
                    <circle cx="70" cy="70" r="56" stroke="url(#miniTaskGrad)" strokeWidth="7" fill="transparent" strokeDasharray="351.8" strokeDashoffset="0" strokeLinecap="round" />

                    {/* Ring 2 - Habits (Dusty Rose) */}
                    <circle cx="70" cy="70" r="43" stroke="#C87D87" strokeWidth="7" fill="transparent" opacity="0.15" />
                    <circle cx="70" cy="70" r="43" stroke="url(#miniHabitGrad)" strokeWidth="7" fill="transparent" strokeDasharray="270.2" strokeDashoffset="0" strokeLinecap="round" />

                    {/* Ring 3 - Focus (Warm Ochre) */}
                    <circle cx="70" cy="70" r="30" stroke="#CFA052" strokeWidth="7" fill="transparent" opacity="0.15" />
                    <circle cx="70" cy="70" r="30" stroke="url(#miniFocusGrad)" strokeWidth="7" fill="transparent" strokeDasharray="188.5" strokeDashoffset="0" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="font-heading text-xs font-black tracking-tight text-[var(--text-primary)]">
                      100%
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-[#6B8E6E] font-bold">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>3/3 Priorities Executed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#C87D87] font-bold">
                    <Repeat className="h-3 w-3 shrink-0" />
                    <span>Habits Maintained</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CFA052] font-bold">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>100m Deep Focus Logged</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Soundscapes Live Dock Preview */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-3 w-3 text-[var(--accent-warm-ochre)]" />
                  <span>Preview Ambient Audio</span>
                </span>
                {activePreviewSound && (
                  <span className="text-[9px] text-[var(--accent-warm-ochre)] font-bold animate-pulse">
                    Playing
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PREVIEW_SOUNDSCAPES.map((snd) => {
                  const Icon = snd.icon;
                  const isPlaying = activePreviewSound === snd.id;
                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => handleToggleAudioPreview(snd.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isPlaying
                          ? 'border-[var(--accent-warm-ochre)] bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] font-bold shadow-2xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-warm-ochre)]/40'
                      }`}
                      title={isPlaying ? 'Click to stop preview' : `Preview ${snd.label}`}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{snd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy & Security Tag */}
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-0.5 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#6B8E6E]" />
                Encrypted Supabase Auth & RLS
              </span>
              <span>Local-First Ready</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Elevated Floating Card (lg:col-span-7) */}
          <div className="lg:col-span-7 -mt-8 sm:-mt-10 relative z-20 order-1 lg:order-2">
            <div className="rounded-2xl sm:rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 space-y-3">
              
              {/* Card Header */}
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {isResetPassword ? 'Reset Password' : isSignUp ? 'Personal Details' : 'User Information'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isResetPassword
                    ? 'Enter your registered email address to receive reset instructions.'
                    : isSignUp
                    ? 'Fill in your details to create your secure Taktic account.'
                    : 'Enter your credentials to access your tactical workspace.'}
                </p>
              </div>

              {/* Fast Pass Demo Pill (Top Highlight) */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[var(--accent-warm-ochre)]/35 bg-[var(--accent-warm-ochre)]/10 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-warm-ochre)] text-black">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                      Instant Guest Demo
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                      Evaluate with preloaded data
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="px-2.5 py-1 rounded-lg bg-[var(--accent-warm-ochre)] text-black text-xs font-bold hover:brightness-105 active:scale-95 transition shadow-2xs cursor-pointer"
                >
                  1-Click Pass
                </button>
              </div>

              {/* Error / Success Alerts */}
              {errorMsg && (
                <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {isSignUp && (
                  <div>
                    <label htmlFor="auth-full-name" className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
                      <input
                        id="auth-full-name"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex Rivera"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A] transition shadow-2xs"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email-address" className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
                    <input
                      id="auth-email-address"
                      name="email"
                      type="email"
                      autoComplete="username email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A] transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {!isResetPassword && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="auth-password" className="block text-xs font-bold text-[var(--text-primary)]">
                        Password
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetPassword(true);
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] font-semibold text-[#FF6B4A] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
                      <input
                        id="auth-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] py-2 pl-9 pr-9 text-xs sm:text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A] transition shadow-2xs"
                        required={!isResetPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary CTA Button (Matching Mockup Coral/Terracotta Button) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B4A] via-[#E85D75] to-[#FFA066] text-white font-extrabold text-xs sm:text-sm tracking-wider shadow-md shadow-[#FF6B4A]/25 hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
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
                      <span>Login Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Option */}
              {!isResetPassword && (
                <div className="pt-0.5">
                  <button
                    onClick={handleGoogleAuth}
                    type="button"
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      </svg>
                      <span>Login with Google</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


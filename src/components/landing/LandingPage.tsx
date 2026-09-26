import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { soundEngine } from '../../lib/audio';
import {
  Sparkles,
  ArrowRight,
  Target,
  Repeat,
  Clock,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Headphones,
  Coffee,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
  StickyNote,
  Archive,
  Trophy,
  Flame,
  Sun,
  Moon,
  ChevronRight,
  Play,
  Pause,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (defaultSignUp?: boolean) => void;
}

const SOUNDSCAPES = [
  { id: 'Gentle Rain', label: 'Rain', icon: CloudRain },
  { id: 'Ocean Waves', label: 'Ocean', icon: Waves },
  { id: 'Warm Chords', label: 'Chords', icon: Headphones },
  { id: 'Coffee Shop Ambience', label: 'Cafe', icon: Coffee },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { loginAsDemo } = useAuth();

  // Dark/Light Mode
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

  useEffect(() => {
    document.title = 'Taktic — Daily Priorities, Habits & Focus';
  }, []);

  // Audio Preview State
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const toggleSoundscape = (soundId: string) => {
    if (activeSound === soundId) {
      soundEngine.stopSoundscape();
      setActiveSound(null);
    } else {
      soundEngine.playSoundscape(soundId);
      setActiveSound(soundId);
    }
  };

  useEffect(() => {
    return () => {
      soundEngine.stopSoundscape();
    };
  }, []);

  // Interactive Rhythm Demo State
  const [demoTasks, setDemoTasks] = useState(2);
  const [demoHabits, setDemoHabits] = useState(2);
  const [demoFocusMins, setDemoFocusMins] = useState(60);

  const taskPct = Math.min(100, Math.round((demoTasks / 3) * 100));
  const habitPct = Math.min(100, Math.round((demoHabits / 3) * 100));
  const focusPct = Math.min(100, Math.round((demoFocusMins / 100) * 100));
  const allClosed = taskPct >= 100 && habitPct >= 100 && focusPct >= 100;

  const triggerCelebration = () => {
    soundEngine.playCelebrationSound();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6B8E6E', '#C87D87', '#CFA052', '#C06C4C'],
    });
  };

  const handleIncrementTask = () => {
    const next = demoTasks >= 3 ? 1 : demoTasks + 1;
    const nextTaskPct = Math.min(100, Math.round((next / 3) * 100));
    const nextAvg = Math.round((nextTaskPct + habitPct + focusPct) / 3);

    if (nextAvg >= 100) {
      triggerCelebration();
    } else {
      soundEngine.playCheckoffSound();
    }
    setDemoTasks(next);
  };

  const handleIncrementHabit = () => {
    const next = demoHabits >= 3 ? 1 : demoHabits + 1;
    const nextHabitPct = Math.min(100, Math.round((next / 3) * 100));
    const nextAvg = Math.round((taskPct + nextHabitPct + focusPct) / 3);

    if (nextAvg >= 100) {
      triggerCelebration();
    } else {
      soundEngine.playCheckoffSound();
    }
    setDemoHabits(next);
  };

  const handleIncrementFocus = () => {
    const next = demoFocusMins >= 100 ? 25 : demoFocusMins + 25;
    const nextFocusPct = Math.min(100, Math.round((next / 100) * 100));
    const nextAvg = Math.round((taskPct + habitPct + nextFocusPct) / 3);

    if (nextAvg >= 100) {
      triggerCelebration();
    } else {
      soundEngine.playCheckoffSound();
    }
    setDemoFocusMins(next);
  };

  // Concentric SVG math (200x200 canvas with generous inner clear radius)
  const center = 100;
  const r1 = 80; // Tasks (Botanical Sage)
  const c1 = 2 * Math.PI * r1;
  const strokeDashoffset1 = c1 - (c1 * taskPct) / 100;

  const r2 = 62; // Habits (Dusty Rose)
  const c2 = 2 * Math.PI * r2;
  const strokeDashoffset2 = c2 - (c2 * habitPct) / 100;

  const r3 = 44; // Focus Time (Warm Ochre)
  const c3 = 2 * Math.PI * r3;
  const strokeDashoffset3 = c3 - (c3 * focusPct) / 100;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden selection:bg-[var(--accent-terracotta)]/30 selection:text-[var(--text-primary)]">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Clean Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white shadow-md shadow-[#C06C4C]/25">
              <span className="text-lg sm:text-xl font-bold font-heading">T</span>
            </div>
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
              Taktic
            </span>
          </div>

          {/* Center Navigation Anchors (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition">
              How It Works
            </a>
            <a href="#bento" className="hover:text-[var(--text-primary)] transition">
              Features
            </a>
            <a href="#social" className="hover:text-[var(--text-primary)] transition">
              Focus Circles
            </a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition">
              Privacy & Speed
            </a>
          </nav>

          {/* Right Action Controls & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-2xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-[#CFA052]" />
              ) : (
                <Moon className="h-4 w-4 text-[#C06C4C]" />
              )}
            </button>

            {/* Fast-Pass Demo Button */}
            <button
              type="button"
              onClick={loginAsDemo}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--accent-warm-ochre)]/40 bg-[var(--accent-warm-ochre)]/15 px-3 py-2 text-xs font-bold text-[var(--accent-warm-ochre)] hover:bg-[var(--accent-warm-ochre)]/25 transition cursor-pointer shadow-2xs"
              title="Skip sign in and explore interactive demo"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>1-Click Demo</span>
            </button>

            {/* Sign In CTA */}
            <button
              type="button"
              onClick={() => onOpenAuth(false)}
              className="rounded-xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#C06C4C]/20 hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH LIVE INTERACTIVE SHOWCASE */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#C06C4C]/15 via-[#C87D87]/15 to-[#CFA052]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 px-3.5 py-1 text-xs font-bold text-[var(--accent-terracotta)] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>A calmer way to organize your day</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.15]">
              Plan what matters today.{' '}
              <span className="bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] bg-clip-text text-transparent">
                Build steady habits.
              </span>{' '}
              Work without distractions.
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Endless to-do lists create overwhelm. Taktic combines your <strong>top 3 daily priorities</strong>, <strong>habit routines</strong>, and <strong>timed focus sessions</strong> into one calm, clutter-free dashboard.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#C06C4C]/25 hover:brightness-105 active:scale-98 transition cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={loginAsDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-6 py-3.5 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:border-[var(--accent-warm-ochre)]/50 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                <span>Try Interactive Demo</span>
              </button>
            </div>
          </div>

          {/* HERO LIVE INTERACTIVE CANVAS */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-8 shadow-2xl shadow-black/10 relative overflow-hidden">
              
              {/* Header inside Mockup Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold font-heading text-[var(--text-primary)]">
                      Interactive Preview
                    </span>
                    <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                      Try clicking below
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    See how your daily progress rings, habits, and background audio work together in real time
                  </p>
                </div>

                {/* Floating Soundscape Player Mini-Dock */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xs">
                  <div className="px-2 text-[10px] font-bold text-[var(--accent-warm-ochre)] uppercase tracking-wider flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    <span>Audio:</span>
                  </div>
                  {SOUNDSCAPES.map((snd) => {
                    const Icon = snd.icon;
                    const isPlaying = activeSound === snd.id;
                    return (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => toggleSoundscape(snd.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                          isPlaying
                            ? 'bg-[var(--accent-warm-ochre)] text-black shadow-xs font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                        }`}
                        title={isPlaying ? `Stop ${snd.label}` : `Play ${snd.label}`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="hidden sm:inline">{snd.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Showcase Grid: Rings + Controls + Live Sprint Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">
                
                {/* Left: Concentric Triple Rings Interactive SVG (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-lg relative overflow-hidden group">
                  {/* Subtle Background Radial Ambient Aura */}
                  <div className="absolute inset-0 bg-radial from-[var(--accent-warm-ochre)]/10 via-[var(--accent-terracotta)]/5 to-transparent blur-xl pointer-events-none" />

                  <div className="relative flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-52 h-52 sm:w-60 sm:h-60 rotate-[-90deg]">
                      <defs>
                        {/* Task Ring Gradient */}
                        <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4E7A52" />
                          <stop offset="100%" stopColor="#7BB280" />
                        </linearGradient>

                        {/* Habit Ring Gradient */}
                        <linearGradient id="habitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#B85D6A" />
                          <stop offset="100%" stopColor="#E58A97" />
                        </linearGradient>

                        {/* Focus Ring Gradient */}
                        <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#CFA052" />
                          <stop offset="100%" stopColor="#E6B870" />
                        </linearGradient>

                        {/* Soft Glow Filter */}
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#CFA052" floodOpacity="0.3" />
                        </filter>
                      </defs>

                      {/* Ring 1 Track & Fill - Tasks (Botanical Sage) */}
                      <circle cx={center} cy={center} r={r1} stroke="#6B8E6E" strokeWidth="12" fill="transparent" opacity="0.15" />
                      <motion.circle
                        cx={center}
                        cy={center}
                        r={r1}
                        stroke="url(#taskGradient)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={c1}
                        animate={{ strokeDashoffset: strokeDashoffset1 }}
                        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                        strokeLinecap="round"
                      />

                      {/* Ring 2 Track & Fill - Habits (Dusty Rose) */}
                      <circle cx={center} cy={center} r={r2} stroke="#C87D87" strokeWidth="12" fill="transparent" opacity="0.15" />
                      <motion.circle
                        cx={center}
                        cy={center}
                        r={r2}
                        stroke="url(#habitGradient)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={c2}
                        animate={{ strokeDashoffset: strokeDashoffset2 }}
                        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                        strokeLinecap="round"
                      />

                      {/* Ring 3 Track & Fill - Focus (Warm Ochre) */}
                      <circle cx={center} cy={center} r={r3} stroke="#CFA052" strokeWidth="12" fill="transparent" opacity="0.15" />
                      <motion.circle
                        cx={center}
                        cy={center}
                        r={r3}
                        stroke="url(#focusGradient)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={c3}
                        animate={{ strokeDashoffset: strokeDashoffset3 }}
                        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                    </svg>

                    {/* Center Percentage Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10 px-2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={Math.round((taskPct + habitPct + focusPct) / 3)}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="flex flex-col items-center"
                        >
                          <span className="font-heading text-3xl sm:text-4xl font-black text-[var(--text-primary)] leading-none tracking-tight">
                            {Math.round((taskPct + habitPct + focusPct) / 3)}%
                          </span>
                        </motion.div>
                      </AnimatePresence>

                      {/* Status Pill */}
                      <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card-surface)]/95 dark:bg-[#25201D]/95 border border-[var(--border-subtle)] shadow-md backdrop-blur-md">
                        <span className={`h-1.5 w-1.5 rounded-full ${allClosed ? 'bg-emerald-500 animate-ping' : 'bg-[#CFA052] animate-pulse'}`} />
                        <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] bg-clip-text text-transparent">
                          {allClosed ? 'All Done for Today! 🎉' : 'Daily Progress'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Trigger Buttons to test rings live */}
                  <div className="mt-6 flex items-center gap-2 flex-wrap justify-center relative z-10">
                    <button
                      type="button"
                      onClick={handleIncrementTask}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 dark:border-emerald-500/30 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>+ Task ({demoTasks}/3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIncrementHabit}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-300 dark:border-rose-500/30 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Repeat className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>+ Habit ({demoHabits}/3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIncrementFocus}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 dark:border-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>+ Focus ({demoFocusMins}m)</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Sprint & Co-Working Pod Card (7 cols) */}
                <div className="md:col-span-7 space-y-3.5">
                  {/* Co-Working Live Sprint Room Snippet */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#6B8E6E] animate-pulse" />
                        <span className="text-xs font-bold font-heading text-[var(--text-primary)]">
                          Shared Focus Room: Sprint Alpha
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--accent-terracotta)] px-2 py-0.5 rounded-full bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30">
                        18:45 Remaining
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <div className="flex -space-x-2 overflow-hidden">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-[9px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          AL
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#C06C4C] to-[#CFA052] text-[9px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          MV
                        </span>
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#B08B9E] to-[#6B8E6E] text-[9px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          SJ
                        </span>
                      </div>
                      <span className="text-[11px] font-medium">
                        3 peers focusing quietly together with distraction filters enabled
                      </span>
                    </div>
                  </div>

                  {/* Feature Highlights Mini Pills */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--accent-botanical-sage)]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Daily Sweep</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Archive completed tasks with 1 click so tomorrow always starts clean.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--accent-warm-ochre)]">
                        <StickyNote className="h-4 w-4" />
                        <span>Quick Capture</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Press <kbd className="px-1 py-0.5 rounded bg-[var(--card-surface)] border border-[var(--border-subtle)] font-mono text-[9px]">Ctrl+J</kbd> anytime to capture sudden ideas without losing flow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS: HOW TAKTIC WORKS (3 COLUMNS) */}
      <section id="features" className="py-16 sm:py-24 border-t border-[var(--border-subtle)] bg-[var(--card-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-terracotta)] font-heading">
              Designed for Clarity
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              Everything You Need to Run Your Day, Without the Noise
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Instead of switching between separate apps for to-dos, habit trackers, and focus timers, Taktic brings your day into one calm view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Task Execution */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#6B8E6E]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6B8E6E]/15 text-[#6B8E6E] shadow-sm">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                1. Prioritize What Actually Matters
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Long to-do lists cause decision fatigue. Taktic prompts you to pick your top 3 commitments each morning, organize them across the day, and mark them off with clarity.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[var(--text-secondary)] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>Top 3 commitments highlighted for today</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>Morning, afternoon & evening scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>1-click sweep to archive completed work</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Habit Rings */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#C87D87]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C87D87]/15 text-[#C87D87] shadow-sm">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                2. Build Consistent Daily Habits
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Consistency beats intensity. Keep track of daily routines—like reading, movement, or writing—alongside your tasks, with streak milestones that celebrate steady progress.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[var(--text-secondary)] pt-2">
                <li className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Daily streak tracking & emergency streak freezes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Milestone badges that reward consistency</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Visual progress rings that close as you finish</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Deep Work & Soundscapes */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#CFA052]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CFA052]/15 text-[#CFA052] shadow-sm">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                3. Focus Timer & Ambient Audio
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Get into deep flow without external distractions. Start timed Pomodoro sprints paired with soothing background audio, and switch into immersive full-screen mode whenever you need locked-in focus.
              </p>
              <ul className="space-y-2 text-xs font-medium text-[var(--text-secondary)] pt-2">
                <li className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Rain, ocean waves, warm chords & cafe ambiance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Full-screen distraction-free focus mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Automatic daily focus time tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE BENTO GRID */}
      <section id="bento" className="py-16 sm:py-24 bg-[var(--bg-main)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)] font-heading">
              Thoughtful Features
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              Designed to Fit How You Actually Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento 1: Live Co-Working & Pods (8 cols) */}
            <div id="social" className="md:col-span-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C06C4C]/15 text-[#C06C4C]">
                  <Users className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C06C4C] font-heading">
                  Gentle Accountability
                </span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Quiet Focus Rooms & Study Circles
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                Staying disciplined is easier when you work alongside others. Join shared 25-minute sprints with friends or coworkers, send silent cheers, and catch up in the break room when the timer ends—no cameras or microphones required.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                    <Zap className="h-3.5 w-3.5 text-[#CFA052]" />
                    <span>Silent Cheers</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Send encouraging emoji reactions without interrupting someone's concentration.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                    <Coffee className="h-3.5 w-3.5 text-amber-500" />
                    <span>Break Room</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Chat unlocks automatically between sprints and mutes during focus sessions.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#6B8E6E]" />
                    <span>Private Circles</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Create invite-only spaces for study groups, friends, or project teams.</p>
                </div>
              </div>
            </div>

            {/* Bento 2: Quick Notes Scratchpad (4 cols) */}
            <div className="md:col-span-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CFA052]/15 text-[#CFA052]">
                    <StickyNote className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#CFA052] font-heading">
                    Instant Capture
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                  Global Scratchpad
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
                  Press <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] font-mono text-[10px]">Ctrl+J</kbd> from anywhere in the app to jot down a quick note, meeting takeaway, or idea. Convert any note to an actionable task in one click.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-primary)]">
                  <span>💡 Follow up with client feedback</span>
                  <span className="text-[#CFA052] font-mono text-[10px]">Pinned</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">
                  Review morning comments and prepare final deck updates.
                </p>
              </div>
            </div>

            {/* Bento 3: Safe Task Archive (4 cols) */}
            <div className="md:col-span-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-8 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B8E6E]/15 text-[#6B8E6E]">
                  <Archive className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B8E6E] font-heading">
                  Searchable History
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                Task Archive & Reflection
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Never lose track of what you accomplished. Look back at past completed tasks, filter by date range, and export your history anytime.
              </p>
            </div>

            {/* Bento 4: Architecture & Security (8 cols) */}
            <div id="security" className="md:col-span-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-8 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B08B9E]/15 text-[#B08B9E]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#B08B9E] font-heading">
                  Fast & Private
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                Instant Responsiveness with Offline Support
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Taktic saves changes instantly in your browser and works seamlessly even without an active internet connection. Your data syncs securely to your account whenever you reconnect, keeping your personal routines and notes completely private.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. FINAL CTA BANNER */}
      <section className="py-16 sm:py-24 bg-[var(--card-surface)] border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] p-8 sm:p-12 text-white shadow-2xl shadow-[#C06C4C]/25 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Start your free workspace today</span>
            </div>

            <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to Bring Calm and Focus to Your Workday?
            </h2>

            <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
              Plan your priorities, stay consistent with your habits, and work in deep flow with Taktic.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-xs sm:text-sm font-bold text-[#C06C4C] hover:bg-white/90 active:scale-98 transition shadow-lg cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={loginAsDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/30 px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#CFA052]" />
                <span>Try Interactive Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-main)] py-12 text-xs text-[var(--text-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C06C4C] via-[#C87D87] to-[#CFA052] text-white font-heading font-bold text-xs">
              T
            </div>
            <span className="font-heading font-bold text-[var(--text-primary)]">Taktic</span>
            <span>— A calm workspace for daily priorities, habits, and focus.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenAuth(false)}
              className="hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={loginAsDemo}
              className="hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Interactive Demo
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text-primary)] transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

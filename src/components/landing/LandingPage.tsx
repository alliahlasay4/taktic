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
  Lock,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { TakticLogo } from '../common/TakticLogo';

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
  const [demoTasks, setDemoTasks] = useState(3);
  const [demoHabits, setDemoHabits] = useState(2);
  const [demoFocusMins, setDemoFocusMins] = useState(50);

  const taskPct = Math.min(100, Math.round((demoTasks / 5) * 100));
  const habitPct = Math.min(100, Math.round((demoHabits / 3) * 100));
  const focusPct = Math.min(100, Math.round((demoFocusMins / 100) * 100));
  const overallAvg = Math.round((taskPct + habitPct + focusPct) / 3);
  const allClosed = taskPct >= 100 && habitPct >= 100 && focusPct >= 100;

  const triggerCelebration = () => {
    soundEngine.playCelebrationSound();
    confetti({
      particleCount: 75,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#6B8E6E', '#C87D87', '#CFA052', '#C06C4C'],
    });
  };

  const handleIncrementTask = () => {
    const next = demoTasks >= 5 ? 1 : demoTasks + 1;
    const nextTaskPct = Math.min(100, Math.round((next / 5) * 100));
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

  // SVG Triple Rings geometry
  const center = 100;
  const r1 = 80; // Tasks (Botanical Sage)
  const c1 = 2 * Math.PI * r1;
  const strokeDashoffset1 = Math.max(0, c1 - (c1 * taskPct) / 100);

  const r2 = 62; // Habits (Dusty Rose)
  const c2 = 2 * Math.PI * r2;
  const strokeDashoffset2 = Math.max(0, c2 - (c2 * habitPct) / 100);

  const r3 = 44; // Focus Time (Warm Ochre)
  const c3 = 2 * Math.PI * r3;
  const strokeDashoffset3 = Math.max(0, c3 - (c3 * focusPct) / 100);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden selection:bg-[var(--accent-terracotta)]/25 selection:text-[var(--text-primary)]">

      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center text-left cursor-pointer focus-visible:outline-hidden group"
            aria-label="Taktic Home"
          >
            <TakticLogo size="md" showText={true} />
          </button>

          {/* Center Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[var(--text-secondary)]">
            <a
              href="#how-it-works"
              className="relative py-1 hover:text-[var(--text-primary)] transition duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#C06C4C] after:to-[#CFA052] hover:after:w-full after:transition-all after:duration-300"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="relative py-1 hover:text-[var(--text-primary)] transition duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#C06C4C] after:to-[#CFA052] hover:after:w-full after:transition-all after:duration-300"
            >
              Features
            </a>
            <a
              href="#circles"
              className="relative py-1 hover:text-[var(--text-primary)] transition duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#C06C4C] after:to-[#CFA052] hover:after:w-full after:transition-all after:duration-300"
            >
              Focus Circles
            </a>
            <a
              href="#comparison"
              className="relative py-1 hover:text-[var(--text-primary)] transition duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#C06C4C] after:to-[#CFA052] hover:after:w-full after:transition-all after:duration-300"
            >
              Why Taktic
            </a>
          </nav>

          {/* Right Action Controls */}
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

            {/* 1-Click Guest Demo Button */}
            <button
              type="button"
              onClick={loginAsDemo}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--accent-warm-ochre)]/40 bg-[var(--accent-warm-ochre)]/15 px-3.5 py-2 text-xs font-bold text-[var(--accent-warm-ochre)] hover:bg-[var(--accent-warm-ochre)]/25 transition cursor-pointer shadow-2xs"
              title="Explore full app in guest mode with sample data"
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

      {/* 2. HERO SECTION */}
      <section className="relative pt-10 pb-14 sm:pt-14 sm:pb-20 overflow-hidden">
        {/* Ambient Warm Aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#C06C4C]/15 via-[#C87D87]/15 to-[#CFA052]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">

            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-terracotta)]/30 bg-[var(--accent-terracotta)]/10 px-4 py-1.5 text-xs font-bold text-[var(--accent-terracotta)] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>A calm, distraction-free daily workspace</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.22] sm:leading-[1.12]">
              Focus on what matters today.{' '}
              <span className="bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] bg-clip-text text-transparent">
                Build steady habits.
              </span>{' '}
              Work without distractions.
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto px-1 sm:px-0">
              Endless to-do lists make it hard to focus. Taktic keeps your day simple: <strong>your top 3–5 daily priorities</strong>, <strong>daily habits</strong>, and <strong>focused work sessions</strong> in one clear view.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-3">
              <button
                type="button"
                onClick={() => onOpenAuth(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#C06C4C]/25 hover:brightness-105 active:scale-98 transition cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={loginAsDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-7 py-3.5 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--card-hover)] hover:border-[var(--accent-warm-ochre)]/50 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[var(--accent-warm-ochre)]" />
                <span>Try Interactive Demo</span>
              </button>
            </div>
          </div>

          {/* HERO LIVE INTERACTIVE CANVAS */}
          <div className="mt-10 sm:mt-14 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 sm:p-7 md:p-8 shadow-2xl shadow-black/10 relative overflow-hidden">

              {/* Header inside Mockup Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold font-heading text-[var(--text-primary)]">
                      Interactive Live Preview
                    </span>
                    <span className="rounded-full bg-[var(--accent-botanical-sage)]/15 px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent-botanical-sage)]">
                      Click below to test
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Experience daily completion rings, habit progress, and soothing soundscapes in real time.
                  </p>
                </div>

                {/* Floating Soundscape Player Mini-Dock */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-2xs self-stretch sm:self-auto justify-between sm:justify-start">
                  <div className="px-2 text-[10px] font-bold text-[var(--accent-warm-ochre)] uppercase tracking-wider flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Sound:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {SOUNDSCAPES.map((snd) => {
                      const Icon = snd.icon;
                      const isPlaying = activeSound === snd.id;
                      return (
                        <button
                          key={snd.id}
                          type="button"
                          onClick={() => toggleSoundscape(snd.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${isPlaying
                            ? 'bg-[var(--accent-warm-ochre)] text-black shadow-xs font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          title={isPlaying ? `Stop ${snd.label}` : `Play ${snd.label}`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden sm:inline">{snd.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Showcase Grid: Rings + Controls + Live Sprint Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-center">

                {/* Left: Concentric Triple Rings Interactive SVG */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 sm:p-6 md:p-7 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-sm relative overflow-hidden group">
                  <div className="relative flex items-center justify-center my-1 sm:my-2">
                    <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-48 sm:h-48 rotate-[-90deg]">
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
                      </defs>

                      {/* Ring 1 - Tasks (Botanical Sage) */}
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
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        strokeLinecap="round"
                      />

                      {/* Ring 2 - Habits (Dusty Rose) */}
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
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        strokeLinecap="round"
                      />

                      {/* Ring 3 - Focus (Warm Ochre) */}
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
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Center Percentage Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none z-10 px-2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={overallAvg}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="flex flex-col items-center"
                        >
                          <span className="font-heading text-3xl sm:text-4xl font-black text-[var(--text-primary)] leading-none tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_3px_12px_rgba(0,0,0,0.5)]">
                            {overallAvg}%
                          </span>
                        </motion.div>
                      </AnimatePresence>

                      <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--card-surface)]/95 border border-[var(--border-subtle)] shadow-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${allClosed ? 'bg-emerald-500 animate-ping' : 'bg-[#CFA052] animate-pulse'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] bg-clip-text text-transparent">
                          {allClosed ? 'Goal Reached! 🎉' : 'Daily Rhythm'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Buttons */}
                  <div className="mt-5 flex items-center gap-2 flex-wrap justify-center relative z-10 w-full">
                    <button
                      type="button"
                      onClick={handleIncrementTask}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>+ Task ({demoTasks}/5)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIncrementHabit}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-300 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Repeat className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>+ Habit ({demoHabits}/3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleIncrementFocus}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:scale-105 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>+ Focus ({demoFocusMins}m)</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Sprint & Micro-Preview Cards */}
                <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
                  {/* Co-Working Live Sprint Room Snippet */}
                  <div className="p-4 sm:p-4.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#6B8E6E] animate-pulse shrink-0" />
                        <span className="text-xs sm:text-sm font-bold font-heading text-[var(--text-primary)]">
                          Shared Focus Room: Timed Sprint
                        </span>
                      </div>
                      <span className="shrink-0 whitespace-nowrap font-mono text-[10px] sm:text-xs font-bold text-[var(--accent-terracotta)] px-2.5 py-0.5 rounded-full bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30">
                        18:45 Left
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-[var(--text-secondary)]">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#6B8E6E] to-[#C87D87] text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          AL
                        </span>
                        <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#C06C4C] to-[#CFA052] text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          MV
                        </span>
                        <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#B08B9E] to-[#6B8E6E] text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-[var(--card-surface)]">
                          SJ
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs font-medium leading-relaxed">
                        3 people working quietly in a 25-minute Pomodoro sprint with break chat
                      </span>
                    </div>
                  </div>

                  {/* Micro-Features Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 text-xs">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--accent-botanical-sage)] text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Daily Sweep</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed">
                        Archive finished tasks in one click to keep your workspace clean each morning.
                      </p>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--accent-warm-ochre)] text-xs sm:text-sm">
                        <StickyNote className="h-4 w-4 shrink-0" />
                        <span>Quick Capture</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--card-surface)] border border-[var(--border-subtle)] font-mono text-[10px]">Ctrl+J</kbd> anytime to record quick thoughts and turn them into tasks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS: HOW TAKTIC WORKS */}
      <section id="how-it-works" className="scroll-mt-0 py-14 sm:py-20 border-t border-[var(--border-subtle)] bg-[var(--card-surface)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-terracotta)] font-heading">
              Designed for Clarity
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
              Everything You Need to Run Your Day, Without the Noise
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Instead of switching between separate apps for to-dos, habit trackers, and focus timers, Taktic brings your day into one calm view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Pillar 1: Task Execution */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#6B8E6E]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6B8E6E]/15 text-[#6B8E6E] shadow-xs">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                1. Focus on What Matters
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Long to-do lists make it easy to feel busy without getting much done. Taktic limits your active list to 3–5 daily priorities so you can focus on real progress without burning out.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] pt-3 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>3–5 main priorities per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>Organize by morning, afternoon & evening</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                  <span>1-click sweep to archive finished items</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Habit Rings */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#C87D87]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C87D87]/15 text-[#C87D87] shadow-xs">
                <Repeat className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                2. Build Consistent Daily Habits
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Small actions done daily add up. Track routines like reading, exercise, or study alongside your daily tasks, and watch your progress ring close as you check them off.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] pt-3 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Track streaks and daily consistency</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Milestone badges as you stay on track</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#C87D87] shrink-0" />
                  <span>Visual rings that fill as you complete routines</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Deep Work & Soundscapes */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-6 sm:p-7 space-y-4 hover:border-[#CFA052]/50 transition shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CFA052]/15 text-[#CFA052] shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                3. Focus Timer & Ambient Audio
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Stay in your flow without leaving the tab. Run timed Pomodoro sessions with calming background sounds, or switch to full-screen mode to remove all on-screen distractions.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] pt-3 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2.5">
                  <Headphones className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Rain, ocean waves, warm chords & cafe sounds</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Distraction-free full-screen focus view</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#CFA052] shrink-0" />
                  <span>Automatic daily focus time tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE BENTO GRID */}
      <section id="features" className="scroll-mt-0 py-14 sm:py-20 bg-[var(--bg-main)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-warm-ochre)] font-heading">
              Thoughtful Features
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
              Crafted for Real Focus, Not Busywork
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">

            {/* Bento 1: Live Co-Working & Pods (8 cols) */}
            <div id="circles" className="scroll-mt-20 md:col-span-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 md:p-8 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C06C4C]/15 text-[#C06C4C]">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C06C4C] font-heading">
                    Shared Focus
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                  Quiet Focus Rooms & Study Circles
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  Staying on track is easier alongside others. Join 25-minute quiet focus sprints with friends or teammates, share silent cheers, and chat during breaks—with no cameras or audio required.
                </p>
              </div>

              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    <Zap className="h-4 w-4 text-[#CFA052] shrink-0" />
                    <span>Silent Cheers</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed">Send a quick thumbs up or cheer without interrupting someone's focus.</p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Break Room</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed">Chat opens between sessions and automatically mutes once a focus sprint begins.</p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    <ShieldCheck className="h-4 w-4 text-[#6B8E6E] shrink-0" />
                    <span>Private Circles</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed">Create private rooms with invite codes for your study group or team.</p>
                </div>
              </div>
            </div>

            {/* Bento 2: Quick Notes Scratchpad (4 cols) */}
            <div className="md:col-span-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#CFA052]/15 text-[#CFA052]">
                    <StickyNote className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#CFA052] font-heading">
                    Quick Capture
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                  Global Scratchpad
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Press <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] font-mono text-[10px]">Ctrl+J</kbd> from anywhere to jot down ideas. Turn any note into a task with one click.
                </p>
              </div>

              {/* Realistic Notepad Container with 2 Notes */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <span className="truncate">💡 Prepare slides for Thursday</span>
                    <span className="shrink-0 whitespace-nowrap text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-warm-ochre)]/15 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/30">
                      Pinned
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                    Review comments and clean up summary notes.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-primary)]">
                    <span className="truncate">🎯 Send team update</span>
                    <span className="shrink-0 whitespace-nowrap text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-botanical-sage)]/15 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/30">
                      + To Task
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                    Add as one of today&apos;s main focus priorities.
                  </p>
                </div>
              </div>
            </div>

            {/* Bento 3: Safe Task Archive (4 cols) */}
            <div className="md:col-span-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6B8E6E]/15 text-[#6B8E6E]">
                    <Archive className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B8E6E] font-heading">
                    History
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                  Task Archive & History
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Look back on what you accomplished, search completed tasks, restore previous items, or export your log to CSV.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent-botanical-sage)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">14 tasks archived</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] shrink-0">1-click restore</span>
              </div>
            </div>

            {/* Bento 4: Private & Distraction-Free (8 cols) */}
            <div className="md:col-span-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 sm:p-7 md:p-8 space-y-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B08B9E]/15 text-[#B08B9E]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B08B9E] font-heading">
                    Private & Clutter-Free
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                  A Quiet Workspace with Zero Distractions
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Taktic has no ads, algorithmic feeds, or data selling. Your routines, notes, and tasks stay private to your account—giving you an uncluttered space to get things done.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#B08B9E] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Zero Advertisements</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#B08B9E] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">No Social Feeds</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-[#B08B9E] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Private Account Data</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. WHY TAKTIC IS DIFFERENT (COMPARISON / SIMPLICITY BY DESIGN) */}
      <section id="comparison" className="scroll-mt-0 py-14 sm:py-20 border-t border-[var(--border-subtle)] bg-[var(--card-surface)]/50 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-[var(--accent-terracotta)]/5 via-[var(--accent-botanical-sage)]/5 to-[var(--accent-warm-ochre)]/5 blur-3xl rounded-full pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-botanical-sage)]/10 border border-[var(--accent-botanical-sage)]/25 px-3.5 py-1 text-xs font-bold text-[var(--accent-botanical-sage)] font-heading">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simplicity by Design</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              Less Time Managing. More Time Doing.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto">
              Most productivity apps become another chore to maintain. Taktic keeps planning minimal so your energy goes toward actual work.
            </p>
          </div>

          {/* Side-by-Side Unified Comparison Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 items-stretch">

            {/* The Traditional Way (High contrast, clearly visible card with dusty rose accents) */}
            <div className="relative flex flex-col justify-between rounded-3xl border border-[var(--border-subtle)] dark:border-[var(--accent-dusty-rose)]/30 bg-[var(--card-surface)] dark:bg-[#25211E] p-5 sm:p-7 space-y-5 shadow-lg shadow-black/10 transition-all">
              {/* Subtle top indicator */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-dusty-rose)]/70 to-transparent" />

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] dark:border-white/10 pb-3.5">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-dusty-rose)]/15 dark:bg-[var(--accent-dusty-rose)]/25 border border-[var(--accent-dusty-rose)]/35 text-[var(--accent-dusty-rose)] font-bold shadow-sm">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                        The Traditional Way
                      </h3>
                      <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)] leading-snug">
                        Scattered and complicated apps
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--accent-dusty-rose)]/15 dark:bg-[var(--accent-dusty-rose)]/25 border border-[var(--accent-dusty-rose)]/35 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[var(--accent-dusty-rose)] shadow-sm">
                    High Friction
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--surface-sunken)] dark:bg-[#1D1917] border border-[var(--border-subtle)] dark:border-white/10 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/20 dark:bg-[var(--accent-dusty-rose)]/25 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30">
                      <Layers className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">Overwhelming Lists</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Dozens of lingering tasks that pile up and make it hard to choose where to start.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--surface-sunken)] dark:bg-[#1D1917] border border-[var(--border-subtle)] dark:border-white/10 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/20 dark:bg-[var(--accent-dusty-rose)]/25 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30">
                      <Repeat className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">App Switching</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Constantly jumping between timers, habit logs, and ambient music apps.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--surface-sunken)] dark:bg-[#1D1917] border border-[var(--border-subtle)] dark:border-white/10 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-dusty-rose)]/20 dark:bg-[var(--accent-dusty-rose)]/25 text-[var(--accent-dusty-rose)] border border-[var(--accent-dusty-rose)]/30">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">Too Much Setup</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Spending time tweaking tags and filters instead of making progress.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--accent-dusty-rose)]/10 dark:bg-[var(--accent-dusty-rose)]/15 border border-[var(--accent-dusty-rose)]/25 dark:border-[var(--accent-dusty-rose)]/30 text-xs font-semibold text-[var(--accent-dusty-rose)] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-dusty-rose)] animate-pulse" />
                <span>Result: Time spent organizing instead of finishing work.</span>
              </div>
            </div>

            {/* The Taktic Way (Elevated, warm, signature aesthetic) */}
            <div className="relative flex flex-col justify-between rounded-3xl border border-[var(--accent-botanical-sage)]/50 dark:border-[var(--accent-botanical-sage)]/60 bg-[var(--card-surface)] dark:bg-[#25211E] p-5 sm:p-7 space-y-5 shadow-xl shadow-[var(--accent-botanical-sage)]/10 ring-1 ring-[var(--accent-botanical-sage)]/30 transition-all">
              {/* Subtle warm accent banner */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-botanical-sage)] to-transparent opacity-90" />

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] dark:border-white/10 pb-3.5">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-botanical-sage)]/15 dark:bg-[var(--accent-botanical-sage)]/25 border border-[var(--accent-botanical-sage)]/35 text-[var(--accent-botanical-sage)] font-bold shadow-sm">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-1.5 leading-snug">
                        The Taktic Approach
                      </h3>
                      <p className="text-[10px] sm:text-xs text-[var(--accent-botanical-sage)] font-semibold leading-snug">
                        Clear, intentional daily focus
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--accent-botanical-sage)]/15 dark:bg-[var(--accent-botanical-sage)]/25 border border-[var(--accent-botanical-sage)]/35 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[var(--accent-botanical-sage)] shadow-sm">
                    Focus First
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--accent-botanical-sage)]/10 dark:bg-[var(--accent-botanical-sage)]/20 border border-[var(--accent-botanical-sage)]/25 dark:border-[var(--accent-botanical-sage)]/40 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-botanical-sage)]/25 dark:bg-[var(--accent-botanical-sage)]/35 text-[var(--accent-botanical-sage)] border border-[var(--accent-botanical-sage)]/35">
                      <Target className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">Top 3–5 Daily Priorities</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Focus on the few tasks that matter most each day. No endless task debt.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--accent-terracotta)]/10 dark:bg-[var(--accent-terracotta)]/20 border border-[var(--accent-terracotta)]/25 dark:border-[var(--accent-terracotta)]/40 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-terracotta)]/25 dark:bg-[var(--accent-terracotta)]/35 text-[var(--accent-terracotta)] border border-[var(--accent-terracotta)]/35">
                      <Zap className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">All in One Place</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Tasks, focus timers, habit rings, and ambient sounds unified in one tab.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--accent-warm-ochre)]/10 dark:bg-[var(--accent-warm-ochre)]/20 border border-[var(--accent-warm-ochre)]/25 dark:border-[var(--accent-warm-ochre)]/40 text-xs shadow-sm">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-warm-ochre)]/25 dark:bg-[var(--accent-warm-ochre)]/35 text-[var(--accent-warm-ochre)] border border-[var(--accent-warm-ochre)]/35">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <div className="space-y-0.5">
                      <strong className="font-semibold text-[var(--text-primary)] dark:text-stone-100 block text-xs sm:text-sm">A Fresh Start Each Morning</strong>
                      <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed block">Archive finished items and start every morning with a clear mind and a clean board.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--accent-botanical-sage)]/10 dark:bg-[var(--accent-botanical-sage)]/15 border border-[var(--accent-botanical-sage)]/25 dark:border-[var(--accent-botanical-sage)]/30 text-xs font-semibold text-[var(--accent-botanical-sage)] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-botanical-sage)] animate-pulse" />
                <span>Result: Steady momentum and real progress each day.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FINAL CTA BANNER */}
      <section className="py-12 sm:py-16 bg-[var(--bg-main)] border-t border-[var(--border-subtle)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#C06C4C] via-[#C87D87] to-[#CFA052] p-7 sm:p-10 md:p-12 text-white shadow-2xl shadow-[#C06C4C]/25 text-center space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free workspace • No credit card required</span>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
              Ready to Bring Calm and Focus to Your Workday?
            </h2>

            <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto leading-relaxed">
              Plan your priorities, stay consistent with your habits, and work in deep flow with Taktic.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2">
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

      {/* 7. FOOTER */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-main)] py-10 text-xs text-[var(--text-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus-visible:outline-hidden"
            aria-label="Taktic Home"
          >
            <TakticLogo size="sm" showText={true} />
            <span className="text-[var(--text-muted)] hidden md:inline">— A calm workspace for daily priorities, habits, and focus.</span>
          </button>

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
              href="#how-it-works"
              className="hover:text-[var(--text-primary)] transition"
            >
              How It Works
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

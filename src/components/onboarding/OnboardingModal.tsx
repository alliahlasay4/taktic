import React, { useState } from 'react';
import { Sparkles, Target, CheckCircle2, Volume2, Bell, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Habit, Task } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  requestNotificationPermission: () => Promise<string>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onAddHabit,
  onAddTask,
  requestNotificationPermission,
}) => {
  const { user, isDemo } = useAuth();
  const [step, setStep] = useState(1);

  // Form states
  const [microGoal, setMicroGoal] = useState('Build deep focus discipline daily');
  const [habitTitle, setHabitTitle] = useState('Morning Focus Warmup');
  const [habitCategory, setHabitCategory] = useState<Habit['category']>('mindset');
  const [taskTitle, setTaskTitle] = useState('Plan top 3 daily priorities');
  const [soundscape, setSoundscape] = useState('rain');
  const [notificationsRequested, setNotificationsRequested] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    // 1. Add sample habit
    if (habitTitle.trim()) {
      onAddHabit({
        title: habitTitle.trim(),
        category: habitCategory,
        icon: habitCategory === 'mindset' ? '🧘' : '⚡',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        timeOfDay: 'morning',
        freezeShieldsRemaining: 3,
      });
    }

    // 2. Add sample task
    if (taskTitle.trim()) {
      onAddTask({
        title: taskTitle.trim(),
        priority: 'high',
        tags: ['onboarding', 'focus'],
        isTodayFocus: true,
        estimatedMinutes: 25,
        timeBlock: 'morning',
      });
    }

    // 3. Save profile micro_goal & onboarding_completed
    if (!isDemo && isSupabaseConfigured && user && user.id !== 'demo-user-123') {
      try {
        await supabase
          .from('profiles')
          .update({
            micro_goal: microGoal,
            favorite_soundscape: soundscape,
            onboarding_completed: true,
          })
          .eq('id', user.id);
      } catch (err) {
        console.error('Error saving onboarding data to DB:', err);
      }
    }

    localStorage.setItem('taktic_onboarding_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-[var(--bg-card,#121824)] p-8 shadow-2xl shadow-emerald-950/50 text-white">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold text-xs border border-emerald-500/30">
              {step}/4
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              {step === 1 && 'Welcome & Goal'}
              {step === 2 && 'First Habit'}
              {step === 3 && 'First Focus Task'}
              {step === 4 && 'Soundscape & Reminders'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-emerald-400' : i < step ? 'w-3 bg-emerald-600' : 'w-3 bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Welcome & Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Welcome to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Taktic</span>
              </h3>
              <p className="mt-2 text-sm text-gray-300 max-w-md mx-auto">
                Taktic helps you build high-impact habits, maintain focus streaks, and collaborate with accountability partners in real time.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Target className="h-4 w-4" /> What is your primary micro-goal?
              </label>
              <input
                type="text"
                value={microGoal}
                onChange={(e) => setMicroGoal(e.target.value)}
                placeholder="e.g. Complete 2 deep focus sessions every day"
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>
        )}

        {/* STEP 2: First Habit */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🌱</span> Set Up Your First Habit
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Consistency is key. What is one habit you want to lock in this week?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Habit Title</label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="e.g. 15-min Morning Reading"
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mindset', label: 'Mindset 🧘' },
                    { id: 'health', label: 'Health 💧' },
                    { id: 'fitness', label: 'Fitness 🌅' },
                    { id: 'growth', label: 'Growth 🌱' },
                    { id: 'creative', label: 'Creative ✍️' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setHabitCategory(cat.id as Habit['category'])}
                      className={`rounded-xl border p-2.5 text-xs font-medium transition ${
                        habitCategory === cat.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: First Task */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🎯</span> Add Your First Priority Task
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                What single task will move the needle for you today?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Finish project outline"
                  className="w-full rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                <span>This task will automatically be tagged into your Today's Focus Queue.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Preferences */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🎧</span> Soundscapes & Notifications
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Customize your focus environment and enable desktop alerts.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                  <Volume2 className="h-4 w-4 text-emerald-400" /> Favorite Ambient Soundscape
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'rain', label: '🌧️ Cozy Rain' },
                    { id: 'cafe', label: '☕ Cyber Cafe' },
                    { id: 'waves', label: '🌊 Ocean Waves' },
                    { id: 'binaural', label: '🧠 Alpha Beats' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSoundscape(s.id)}
                      className={`rounded-xl border p-3 text-xs font-medium transition ${
                        soundscape === s.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                          : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Browser Notifications</h4>
                    <p className="text-[11px] text-gray-400">Receive alerts when timers finish or habits are due</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await requestNotificationPermission();
                    setNotificationsRequested(true);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    notificationsRequested
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  {notificationsRequested ? 'Allowed ✓' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-800/80 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-bold text-black hover:from-emerald-400 hover:to-teal-300 transition shadow-lg shadow-emerald-500/30 ml-auto"
            >
              <Sparkles className="h-4 w-4" />
              <span>Enter Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

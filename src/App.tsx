import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InboxView } from './components/inbox/InboxView';
import { FocusView } from './components/focus/FocusView';
import { HabitView } from './components/habits/HabitView';
import { CirclesView } from './components/circles/CirclesView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { RewardModal } from './components/rewards/RewardModal';
import { EndOfDaySummary } from './components/rewards/EndOfDaySummary';

import {
  INITIAL_TASKS,
  INITIAL_CIRCLE_MEMBERS,
  INITIAL_CIRCLE_FEED,
  INITIAL_FOCUS_SESSIONS,
} from './lib/mockData';
import { Task, CircleMember, CircleFeedPost, FocusSession, ActiveTab, TimeBlockSlot } from './types';
import { soundEngine } from './lib/audio';
import { useHabits } from './hooks/useHabits';
import { useFocusSessions } from './hooks/useFocusSessions';
import { useTasks } from './hooks/useTasks';
import { useCircles } from './hooks/useCircles';

function MainLayout() {
  // Dark mode state
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

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Habits State from Custom Hook (Supabase + RLS + Demo mode)
  const { habits, loading: habitsLoading, error: habitsError, addHabit, toggleHabit, deleteHabit } = useHabits();

  // Focus Sessions State from Custom Hook (Supabase + RLS + Demo mode)
  const { addFocusSession, totalFocusMinutesToday } = useFocusSessions();

  // Tasks State from Custom Hook (Supabase + RLS + Demo mode)
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask: handleAddTask,
    toggleCompleteTask: handleToggleCompleteTask,
    toggleTodayFocus: handleToggleTodayFocus,
    updateTimeBlock: handleUpdateTimeBlock,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    rolloverOverdueTasksToToday: handleRolloverOverdueTasks,
  } = useTasks();


  // Social Circles & Feed State from Custom Hook (Supabase Realtime + RLS)
  const {
    feedPosts,
    members,
    togglePartner,
    toggleMute,
    addMemberByName,
    removeMember,
    toggleLikePost,
    broadcastAchievement,
  } = useCircles();

  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const [userStreak] = useState<number>(14);

  // Modals
  const [rewardModal, setRewardModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Focus Complete Handler (Persists to Supabase & Broadcasts to Circle Feed)
  const handleFocusComplete = (durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => {
    addFocusSession(durationMinutes, taskTitle, 'pomodoro', activeSoundscape || undefined, focusQuality);

    const qualityText = focusQuality === 'high_flow' ? ' (High Flow ⚡)' : focusQuality === 'distracted' ? ' (Low Energy 🥱)' : '';

    // Broadcast social achievement
    broadcastAchievement(
      'focus_marathon',
      'Completed Focus Session 🌾',
      `Focused uninterrupted for ${durationMinutes} minutes${taskTitle ? ` on "${taskTitle}"` : ''}${qualityText}.`
    );

    // Show celebration reward
    setRewardModal({
      open: true,
      title: 'Deep Focus Session Completed! 🌾',
      message: `You completed ${durationMinutes} minutes of uninterrupted focus${
        taskTitle ? ` on "${taskTitle}"` : ''
      }${qualityText}.`,
    });
  };

  const handleToggleSoundscapeGlobal = () => {
    if (activeSoundscape) {
      soundEngine.stopSoundscape();
      setActiveSoundscape(null);
    } else {
      const sound = 'Gentle Rain';
      soundEngine.playSoundscape(sound);
      setActiveSoundscape(sound);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const focusTasks = tasks.filter((t) => t.isTodayFocus);
  const tasksCompletedToday = tasks.filter((t) => t.completed && t.completedAt?.startsWith(todayStr)).length;
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Top Navbar Header */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        userStreak={userStreak}
        activeSoundscape={activeSoundscape}
        onToggleSoundscape={handleToggleSoundscapeGlobal}
        onOpenSummary={() => setIsSummaryOpen(true)}
      />

      {/* Database Error Banner */}
      {habitsError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400">
          ⚠️ {habitsError} (Running in Local Mode)
        </div>
      )}

      {/* Main Container Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            todayFocusCount={focusTasks.length}
            inboxCount={tasks.filter((t) => !t.completed).length}
          />

          {/* View Content Panel */}
          <section className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardView
                tasks={tasks}
                habits={habits}
                focusMinutes={totalFocusMinutesToday}
                userStreak={userStreak}
                members={members}
                onToggleComplete={handleToggleCompleteTask}
                onToggleTodayFocus={handleToggleTodayFocus}
                onDeleteTask={handleDeleteTask}
                onToggleHabit={toggleHabit}
                setActiveTab={setActiveTab}
                onOpenSummary={() => setIsSummaryOpen(true)}
              />
            )}

            {activeTab === 'inbox' && (
              <InboxView
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onToggleComplete={handleToggleCompleteTask}
                onToggleTodayFocus={handleToggleTodayFocus}
                onDeleteTask={handleDeleteTask}
                onRolloverOverdueTasks={handleRolloverOverdueTasks}
              />
            )}

            {activeTab === 'focus' && (
              <FocusView
                tasks={tasks}
                onFocusComplete={handleFocusComplete}
                onUpdateTimeBlock={handleUpdateTimeBlock}
                activeSoundscape={activeSoundscape}
                setActiveSoundscape={setActiveSoundscape}
                totalFocusMinutesToday={totalFocusMinutesToday}
              />
            )}

            {activeTab === 'habits' && (
              <div>
                {habitsLoading && habits.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-sm text-[var(--text-secondary)]">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mr-3" />
                    Loading your habit routines...
                  </div>
                ) : (
                  <HabitView
                    habits={habits}
                    tasksCompleted={tasksCompletedToday}
                    totalTasks={Math.max(1, focusTasks.length)}
                    focusMinutes={totalFocusMinutesToday}
                    targetFocusMinutes={100}
                    onToggleHabit={toggleHabit}
                    onAddHabit={addHabit}
                    onDeleteHabit={deleteHabit}
                  />
                )}
              </div>
            )}

            {activeTab === 'circles' && (
              <CirclesView
                members={members}
                feedPosts={feedPosts}
                userStreak={userStreak}
                onToggleLike={toggleLikePost}
                onBroadcastAchievement={broadcastAchievement}
                onTogglePartner={togglePartner}
                onToggleMute={toggleMute}
                onAddMemberByName={addMemberByName}
                onRemoveMember={removeMember}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                tasksCompleted={tasksCompletedToday}
                totalTasks={tasks.length}
                focusMinutes={totalFocusMinutesToday}
                userStreak={userStreak}
              />
            )}
          </section>
        </div>
      </main>

      {/* Confetti & Reward Modal */}
      <RewardModal
        isOpen={rewardModal.open}
        onClose={() => setRewardModal((prev) => ({ ...prev, open: false }))}
        title={rewardModal.title}
        message={rewardModal.message}
        streakCount={userStreak}
      />

      {/* End of Day Reflection Summary Modal */}
      <EndOfDaySummary
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        tasksCompleted={tasksCompletedToday}
        totalTasks={Math.max(1, tasks.length)}
        habitsCompleted={habitsCompletedToday}
        totalHabits={habits.length}
        focusMinutes={totalFocusMinutesToday}
        userStreak={userStreak}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    </AuthProvider>
  );
}

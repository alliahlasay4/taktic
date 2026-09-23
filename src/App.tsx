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
import { ProfileView } from './components/ProfileView';
import { ArchiveView } from './components/archive/ArchiveView';
import { RewardModal } from './components/rewards/RewardModal';
import { EndOfDaySummary } from './components/rewards/EndOfDaySummary';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

import { ActiveTab } from './types';
import { soundEngine } from './lib/audio';
import { useHabits } from './hooks/useHabits';
import { useFocusSessions } from './hooks/useFocusSessions';
import { useTasks } from './hooks/useTasks';
import { useQuickNotes } from './hooks/useQuickNotes';
import { useCircles } from './hooks/useCircles';
import { useNotifications } from './hooks/useNotifications';
import { useInAppNotifications } from './hooks/useInAppNotifications';
import { NotificationToastOverlay } from './components/layout/NotificationToastOverlay';
import { QuickNotesDrawer } from './components/notes/QuickNotesDrawer';
import { QuickNotesFloatingTrigger } from './components/notes/QuickNotesFloatingTrigger';
import { TimerProvider } from './context/TimerContext';

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
  const { habits, overallStreak, loading: habitsLoading, error: habitsError, addHabit, toggleHabit, deleteHabit } = useHabits();

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
    archiveTask: handleArchiveTask,
    unarchiveTask: handleUnarchiveTask,
    sweepCompletedTasks: handleSweepCompletedTasks,
    batchArchiveTasks: handleBatchArchiveTasks,
    batchUnarchiveTasks: handleBatchUnarchiveTasks,
    batchDeleteTasks: handleBatchDeleteTasks,
    rolloverOverdueTasksToToday: handleRolloverOverdueTasks,
  } = useTasks();

  // Quick Notes Scratchpad Hook & Drawer State
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState<boolean>(false);
  const {
    notes: quickNotes,
    addNote: handleAddQuickNote,
    updateNote: handleUpdateQuickNote,
    deleteNote: handleDeleteQuickNote,
    togglePin: handleTogglePinQuickNote,
  } = useQuickNotes();

  // Global Keyboard Shortcuts (Ctrl+J to toggle notes, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsQuickNotesOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isQuickNotesOpen) {
        setIsQuickNotesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickNotesOpen]);

  // Notifications Hook
  const { sendNotification, requestPermission } = useNotifications();
  const {
    notifications,
    toasts,
    unreadCount,
    notify,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useInAppNotifications();

  // Social Circles & Feed State from Custom Hook (Supabase Realtime + RLS)
  const {
    feedPosts,
    members,
    invites,
    togglePartner,
    toggleMute,
    addMemberByName,
    removeMember,
    sendCircleInvite,
    cancelCircleInvite,
    resendCircleInvite,
    generateMagicInviteLink,
    toggleLikePost,
    broadcastAchievement,
  } = useCircles();

  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const userStreak = Math.max(1, overallStreak);

  // Onboarding Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('taktic_onboarding_completed') !== 'true';
  });

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

    const qualityText = focusQuality === 'high_flow' ? ' (High Flow)' : focusQuality === 'distracted' ? ' (Low Energy)' : '';

    // Trigger browser & in-app notification
    sendNotification('Focus Session Completed', {
      body: `Great job! You completed ${durationMinutes} minutes of focus${taskTitle ? ` on ${taskTitle}` : ''}.`,
    });

    notify(
      'Deep Focus Complete',
      `Focused for ${durationMinutes} minutes${taskTitle ? ` on "${taskTitle}"` : ''}.`,
      'timer',
      'analytics'
    );

    // Broadcast social achievement
    broadcastAchievement(
      'focus_marathon',
      'Completed Focus Session',
      `Focused uninterrupted for ${durationMinutes} minutes${taskTitle ? ` on "${taskTitle}"` : ''}${qualityText}.`
    );

    // Show celebration reward
    setRewardModal({
      open: true,
      title: 'Deep Focus Session Completed',
      message: `You completed ${durationMinutes} minutes of uninterrupted focus${
        taskTitle ? ` on "${taskTitle}"` : ''
      }${qualityText}.`,
    });
  };

  const handleToggleHabitWithNotification = (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (target) {
      const today = new Date().toISOString().split('T')[0];
      const isDone = target.completedDates.includes(today);
      if (!isDone) {
        notify('Habit Completed', `Great work locking in "${target.title}". Keep the streak going!`, 'habit', 'habits');
      }
    }
    toggleHabit(id);
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
  const isImmersiveFocusMode = activeTab === 'focus';

  return (
    <TimerProvider onFocusComplete={handleFocusComplete}>
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
        {/* Top Navbar Header (Hidden in Immersive Focus Mode) */}
        {!isImmersiveFocusMode && (
          <Navbar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            userStreak={userStreak}
            activeSoundscape={activeSoundscape}
            onToggleSoundscape={handleToggleSoundscapeGlobal}
            onOpenSummary={() => setIsSummaryOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            onToggleQuickNotes={() => setIsQuickNotesOpen((prev) => !prev)}
            notesCount={quickNotes.length}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            onSelectTab={setActiveTab}
          />
        )}

        {/* Database Error Banner */}
        {habitsError && (
          <div role="alert" className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400 flex items-center justify-center gap-2">
            <span className="font-semibold">{habitsError} (Running in Local Mode)</span>
          </div>
        )}

        {/* Main Container Layout */}
        <main className={isImmersiveFocusMode ? 'w-full min-h-screen p-0' : 'mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6'}>
          {isImmersiveFocusMode ? (
            <FocusView
              tasks={tasks}
              onFocusComplete={handleFocusComplete}
              onUpdateTimeBlock={handleUpdateTimeBlock}
              activeSoundscape={activeSoundscape}
              setActiveSoundscape={setActiveSoundscape}
              totalFocusMinutesToday={totalFocusMinutesToday}
              onExitImmersive={() => setActiveTab('dashboard')}
            />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Navigation Sidebar */}
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                todayFocusCount={focusTasks.length}
                inboxCount={tasks.filter((t) => !t.completed).length}
                totalFocusMinutesToday={totalFocusMinutesToday}
                members={members}
                activeSoundscape={activeSoundscape}
                setActiveSoundscape={setActiveSoundscape}
                onQuickAddTask={(title) =>
                  handleAddTask({
                    title,
                    priority: 'medium',
                    tags: ['Quick Capture'],
                    isTodayFocus: true,
                    timeBlock: 'morning',
                    estimatedMinutes: 25,
                  })
                }
                onFocusComplete={handleFocusComplete}
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
                    onToggleHabit={handleToggleHabitWithNotification}
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
                    onArchiveTask={handleArchiveTask}
                    onSweepCompleted={handleSweepCompletedTasks}
                    onRolloverOverdueTasks={handleRolloverOverdueTasks}
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
                        onToggleHabit={handleToggleHabitWithNotification}
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
                    invites={invites}
                    userStreak={userStreak}
                    onToggleLike={toggleLikePost}
                    onBroadcastAchievement={broadcastAchievement}
                    onTogglePartner={togglePartner}
                    onToggleMute={toggleMute}
                    onAddMemberByName={addMemberByName}
                    onRemoveMember={removeMember}
                    onSendInvite={sendCircleInvite}
                    onCancelInvite={cancelCircleInvite}
                    onResendInvite={resendCircleInvite}
                    onGenerateMagicLink={generateMagicInviteLink}
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

                {activeTab === 'archive' && (
                  <ArchiveView
                    tasks={tasks}
                    onUnarchiveTask={handleUnarchiveTask}
                    onDeleteTask={handleDeleteTask}
                    onBatchUnarchiveTasks={handleBatchUnarchiveTasks}
                    onBatchDeleteTasks={handleBatchDeleteTasks}
                    onNavigateToInbox={() => setActiveTab('inbox')}
                  />
                )}

                {activeTab === 'profile' && <ProfileView />}
              </section>
            </div>
          )}
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

        {/* First-time Onboarding Wizard */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onComplete={() => setIsOnboardingOpen(false)}
          onAddHabit={addHabit}
          onAddTask={handleAddTask}
          requestNotificationPermission={requestPermission}
        />

        {/* Global Quick Notes Floating Trigger */}
        <QuickNotesFloatingTrigger
          onClick={() => setIsQuickNotesOpen(true)}
          notesCount={quickNotes.length}
          isOpen={isQuickNotesOpen}
        />

        {/* Global Quick Notes Slide-over Drawer */}
        <QuickNotesDrawer
          isOpen={isQuickNotesOpen}
          onClose={() => setIsQuickNotesOpen(false)}
          notes={quickNotes}
          onAddNote={handleAddQuickNote}
          onUpdateNote={handleUpdateQuickNote}
          onDeleteNote={handleDeleteQuickNote}
          onTogglePin={handleTogglePinQuickNote}
          onConvertToTask={handleAddTask}
        />

        {/* Real-time Floating Toast Overlay */}
        <NotificationToastOverlay toasts={toasts} onDismiss={dismissToast} />
      </div>
    </TimerProvider>
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

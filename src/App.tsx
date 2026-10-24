import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';

// Secondary views lazy loaded on demand to keep initial load lightweight
const InboxView = lazy(() => import('./components/inbox/InboxView').then((m) => ({ default: m.InboxView })));
const FocusView = lazy(() => import('./components/focus/FocusView').then((m) => ({ default: m.FocusView })));
const HabitView = lazy(() => import('./components/habits/HabitView').then((m) => ({ default: m.HabitView })));
const CoWorkingPodsView = lazy(() => import('./components/circles/CoWorkingPodsView').then((m) => ({ default: m.CoWorkingPodsView })));
const CirclesView = lazy(() => import('./components/circles/CirclesView').then((m) => ({ default: m.CirclesView })));
const PartnerNetworkView = lazy(() => import('./components/circles/PartnerNetworkView').then((m) => ({ default: m.PartnerNetworkView })));
const AnalyticsView = lazy(() => import('./components/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView })));
const ProfileView = lazy(() => import('./components/ProfileView').then((m) => ({ default: m.ProfileView })));
const ArchiveView = lazy(() => import('./components/archive/ArchiveView').then((m) => ({ default: m.ArchiveView })));

// Modals lazy loaded on demand
const RewardModal = lazy(() => import('./components/rewards/RewardModal').then((m) => ({ default: m.RewardModal })));
const EndOfDaySummary = lazy(() => import('./components/rewards/EndOfDaySummary').then((m) => ({ default: m.EndOfDaySummary })));
const OnboardingModal = lazy(() => import('./components/onboarding/OnboardingModal').then((m) => ({ default: m.OnboardingModal })));
const CircleInviteAcceptModal = lazy(() => import('./components/circles/CircleInviteAcceptModal').then((m) => ({ default: m.CircleInviteAcceptModal })));

import { ActiveTab } from './types';
import { getTabFromPath, getPathFromTab } from './lib/routes';
import { soundEngine } from './lib/audio';
import { calculateGlobalActivityStreak, getLocalDateString } from './lib/streak';
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
import { CalendarDrawer } from './components/inbox/CalendarDrawer';
import { CalendarFloatingTrigger } from './components/inbox/CalendarFloatingTrigger';
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

  // Tab State initialized from URL route
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return getTabFromPath(window.location.pathname);
  });

  const setActiveTab = React.useCallback((tab: ActiveTab, replace = false) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = getPathFromTab(tab);
      const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (currentPath !== targetPath) {
        if (replace) {
          window.history.replaceState(null, '', targetPath + window.location.search);
        } else {
          window.history.pushState(null, '', targetPath + window.location.search);
        }
      }
    }
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setActiveTabState(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync initial canonical URL path (e.g., '/' or legacy '/dashboard' to '/focushub')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      const canonicalPath = getPathFromTab(activeTab);
      if (currentPath === '/' || currentPath !== canonicalPath) {
        window.history.replaceState(null, '', canonicalPath + window.location.search);
      }
    }
  }, [activeTab]);

  // Dynamic document title based on current tab
  useEffect(() => {
    const TITLES: Record<ActiveTab, string> = {
      dashboard: 'Focus Hub | Taktic',
      inbox: 'Inbox & Planning | Taktic',
      focus: 'Deep Focus Mode | Taktic',
      habits: 'Habit Rings | Taktic',
      pods: 'Focus Pods | Taktic',
      circles: 'Social Circles | Taktic',
      partners: 'Accountability Network | Taktic',
      analytics: 'Insights & Recap | Taktic',
      archive: 'Archive & History | Taktic',
      profile: 'My Profile | Taktic',
    };
    document.title = TITLES[activeTab] || 'Taktic';
  }, [activeTab]);

  // Habits State from Custom Hook (Supabase + RLS + Demo mode)
  const {
    habits,
    loading: habitsLoading,
    error: habitsError,
    addHabit,
    toggleHabit,
    deleteHabit,
    archiveHabit,
    unarchiveHabit,
    batchUnarchiveHabits,
    batchDeleteHabits,
  } = useHabits();

  // Focus Sessions State from Custom Hook (Supabase + RLS + Demo mode)
  const { addFocusSession, deleteFocusSession, totalFocusMinutesToday, focusSessions } = useFocusSessions();

  // Tasks State from Custom Hook (Supabase + RLS + Demo mode)
  const {
    tasks,
    addTask: handleAddTask,
    toggleCompleteTask: handleToggleCompleteTask,
    toggleTodayFocus: handleToggleTodayFocus,
    updateTimeBlock: handleUpdateTimeBlock,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    restoreTask: handleRestoreTask,
    archiveTask: handleArchiveTask,
    unarchiveTask: handleUnarchiveTask,
    sweepCompletedTasks: handleSweepCompletedTasks,
    batchUnarchiveTasks: handleBatchUnarchiveTasks,
    batchDeleteTasks: handleBatchDeleteTasks,
    rolloverOverdueTasksToToday: handleRolloverOverdueTasks,
  } = useTasks();

  // Quick Notes Scratchpad Hook & Drawer State
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const overdueCalendarTasksCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      if (t.dueDate.toLowerCase() === 'today' || t.dueDate.toLowerCase() === 'tomorrow' || t.dueDate === 'This Weekend') return false;
      return t.dueDate < today;
    }).length;
  }, [tasks]);

  const {
    notes: quickNotes,
    addNote: handleAddQuickNote,
    updateNote: handleUpdateQuickNote,
    deleteNote: handleDeleteQuickNote,
    archiveNote: handleArchiveQuickNote,
    unarchiveNote: handleUnarchiveQuickNote,
    batchUnarchiveNotes: handleBatchUnarchiveQuickNotes,
    batchDeleteNotes: handleBatchDeleteQuickNotes,
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
    showToast,
    notify,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useInAppNotifications();

  const { user, profile, isDemo } = useAuth();
  const currentUserName = profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  // Social Circles & Feed State from Custom Hook (Supabase Realtime + RLS)
  const {
    feedPosts,
    members,
    invites,
    incomingInvites,
    togglePartner,
    toggleMute,
    addMemberByName,
    removeMember,
    sendCircleInvite,
    cancelCircleInvite,
    generateMagicInviteLink,
    acceptCircleInvite,
    declineCircleInvite,
    toggleLikePost,
    broadcastAchievement,
    deletePost,
  } = useCircles();

  // Pending Circle Partner Invitation State (Controls full-screen welcome modal)
  const [pendingCircleInvite, setPendingCircleInvite] = useState<{ token: string; inviter: string } | null>(null);

  // Automatically check Supabase database and local storage for pending invitations from non-members
  useEffect(() => {
    const existingMemberNames = new Set(members.map((m) => m.name.toLowerCase()));

    // 1. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('circle_invite');
    const urlInviter = urlParams.get('inviter');
    const inviterTitle = urlInviter ? decodeURIComponent(urlInviter) : 'Circle Partner';

    // 2. Check storage
    const savedRaw = localStorage.getItem('taktic_pending_circle_invite') || sessionStorage.getItem('taktic_pending_circle_invite');
    let candidate = urlToken ? { token: urlToken, inviter: inviterTitle } : null;

    if (!candidate && savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.token) {
          candidate = { token: parsed.token, inviter: parsed.inviter || 'Circle Partner' };
        }
      } catch {}
    }

    // Check if this invite is from oneself or addressed to someone else
    const urlInviterId = urlParams.get('inviter_id');
    const urlEmail = urlParams.get('email');
    const savedEmail = (() => {
      if (!savedRaw) return null;
      try { return JSON.parse(savedRaw)?.email; } catch { return null; }
    })();
    const targetEmail = urlEmail || savedEmail;

    // Self-invite check: current logged in user created this invite
    const isSelfInvite = Boolean(
      (candidate && invites.some((inv) => inv.inviteToken === candidate?.token)) ||
      (user?.id && urlInviterId && urlInviterId === user.id) ||
      (user?.id && candidate && currentUserName && candidate.inviter.toLowerCase() === currentUserName.toLowerCase())
    );

    // Recipient mismatch check: invite is specifically for another email
    const isRecipientMismatch = Boolean(
      user?.email && targetEmail && targetEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()
    );

    if (isSelfInvite || isRecipientMismatch) {
      localStorage.removeItem('taktic_pending_circle_invite');
      sessionStorage.removeItem('taktic_pending_circle_invite');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('circle_invite');
        url.searchParams.delete('inviter');
        url.searchParams.delete('inviter_id');
        url.searchParams.delete('email');
        url.searchParams.delete('name');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
      setPendingCircleInvite(null);
      return;
    }

    // If candidate exists but is already an active partner, clear and discard
    if (candidate && existingMemberNames.has(candidate.inviter.toLowerCase())) {
      localStorage.removeItem('taktic_pending_circle_invite');
      sessionStorage.removeItem('taktic_pending_circle_invite');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('circle_invite');
        url.searchParams.delete('inviter');
        url.searchParams.delete('inviter_id');
        url.searchParams.delete('email');
        url.searchParams.delete('name');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
      setPendingCircleInvite(null);
      return;
    }

    const processCandidateInvite = (cand: { token: string; inviter: string }) => {
      // Create or ensure notification exists for this invite
      const isSnoozed = sessionStorage.getItem(`taktic_snoozed_circle_invite_${cand.token}`) === 'true';
      if (!isSnoozed) {
        setPendingCircleInvite(cand);
      } else {
        setPendingCircleInvite(null);
      }
    };

    if (candidate) {
      processCandidateInvite(candidate);
      return;
    }

    // 3. Check incomingInvites already fetched by useCircles from RPC / storage
    const firstIncoming = incomingInvites && incomingInvites.length > 0 ? incomingInvites[0] : null;
    if (firstIncoming && !existingMemberNames.has(firstIncoming.inviter.toLowerCase())) {
      processCandidateInvite({ token: firstIncoming.token, inviter: firstIncoming.inviter });
    } else {
      setPendingCircleInvite(null);
    }
  }, [members, incomingInvites]);

  const handleAcceptCircleInvite = async (token: string) => {
    try {
      const res = await acceptCircleInvite(token);
      const inviterName = res?.inviter_name || pendingCircleInvite?.inviter || 'Circle Partner';
      notify(
        'Circle Partner Connected!',
        `You and ${inviterName} are now accountability partners!`,
        'circle',
        'circles'
      );
      localStorage.removeItem('taktic_pending_circle_invite');
      sessionStorage.removeItem('taktic_pending_circle_invite');
      sessionStorage.removeItem(`taktic_snoozed_circle_invite_${token}`);
      setPendingCircleInvite(null);

      // Clean query parameters from URL gracefully
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('circle_invite');
        url.searchParams.delete('inviter');
        window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch (err: any) {
      console.error('Failed to accept circle invite:', err);
      // If the invite is expired, cancelled, or orphaned, clean up storage so it won't repeatedly re-prompt
      const isFatal = /expired|not found|cancelled|no longer has an active account/i.test(err?.message || '');
      if (isFatal) {
        localStorage.removeItem('taktic_pending_circle_invite');
        sessionStorage.removeItem('taktic_pending_circle_invite');
        sessionStorage.removeItem(`taktic_snoozed_circle_invite_${token}`);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('circle_invite');
          url.searchParams.delete('inviter');
          window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
        }
      }
      throw err;
    }
  };

  const handleMaybeLaterCircleInvite = () => {
    if (pendingCircleInvite) {
      sessionStorage.setItem(`taktic_snoozed_circle_invite_${pendingCircleInvite.token}`, 'true');
      notify(
        `Circle Request from ${pendingCircleInvite.inviter}`,
        `${pendingCircleInvite.inviter} invited you to connect as accountability Circle Partners.`,
        'circle',
        'circles',
        pendingCircleInvite.token
      );
    }
    setPendingCircleInvite(null);
  };

  const handleDeclineCircleInvite = async (token?: string) => {
    const tokenToDecline = token || pendingCircleInvite?.token;
    if (tokenToDecline) {
      await declineCircleInvite(tokenToDecline);
    }
    localStorage.removeItem('taktic_pending_circle_invite');
    sessionStorage.removeItem('taktic_pending_circle_invite');
    if (tokenToDecline) {
      sessionStorage.removeItem(`taktic_snoozed_circle_invite_${tokenToDecline}`);
    }
    setPendingCircleInvite(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('circle_invite');
      url.searchParams.delete('inviter');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
    showToast('Invitation Declined', 'The partner request has been removed.', 'system');
  };

  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const userStreak = useMemo(() => {
    const habitDates = habits.flatMap((h) => h.completedDates);
    const focusDates = (focusSessions || []).map((s) => s.completedAt);
    const taskDates = tasks
      .filter((t) => t.completed && t.completedAt)
      .map((t) => t.completedAt as string);

    return calculateGlobalActivityStreak(habitDates, focusDates, taskDates);
  }, [habits, focusSessions, tasks]);

  // Onboarding Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Determine whether onboarding should be shown once user & profile state is resolved
  useEffect(() => {
    // If not authenticated yet or demo mode, do not show
    if (!user || isDemo) {
      setIsOnboardingOpen(false);
      return;
    }

    // Check if user has already completed onboarding
    const isCompletedInProfile = Boolean(profile?.onboardingCompleted);
    const isCompletedForUser = localStorage.getItem(`taktic_onboarding_completed_${user.id}`) === 'true';
    const isCompletedGlobally = localStorage.getItem('taktic_onboarding_completed') === 'true';

    if (isCompletedInProfile || isCompletedForUser || isCompletedGlobally) {
      localStorage.setItem('taktic_onboarding_completed', 'true');
      localStorage.setItem(`taktic_onboarding_completed_${user.id}`, 'true');
      setIsOnboardingOpen(false);
      return;
    }

    // Only open onboarding for newly registered accounts whose onboarding has not been completed
    setIsOnboardingOpen(true);
  }, [user, profile?.onboardingCompleted, isDemo]);

  // Modals
  const [rewardModal, setRewardModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Focus Complete Handler (Persists to Supabase & Broadcasts to Circle Feed)
  const handleFocusComplete = React.useCallback((durationMinutes: number, taskTitle?: string, focusQuality?: 'high_flow' | 'moderate' | 'distracted') => {
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
  }, [activeSoundscape, addFocusSession, broadcastAchievement, notify, sendNotification]);

  const handleToggleHabitWithNotification = React.useCallback((id: string) => {
    const target = habits.find((h) => h.id === id);
    if (target) {
      const today = new Date().toISOString().split('T')[0];
      const isDone = target.completedDates.includes(today);
      if (!isDone) {
        notify('Habit Completed', `Great work locking in "${target.title}". Keep the streak going!`, 'habit', 'habits');
      }
    }
    toggleHabit(id);
  }, [habits, notify, toggleHabit]);

  const handleToggleSoundscapeGlobal = React.useCallback(() => {
    if (activeSoundscape) {
      soundEngine.stopSoundscape();
      setActiveSoundscape(null);
    } else {
      const sound = 'Gentle Rain';
      soundEngine.playSoundscape(sound);
      setActiveSoundscape(sound);
    }
  }, [activeSoundscape]);

  const todayStr = getLocalDateString();
  const focusTasks = tasks.filter((t) => t.isTodayFocus);
  const tasksCompletedToday = tasks.filter((t) => t.completed && t.completedAt?.startsWith(todayStr)).length;
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const isImmersiveFocusMode = activeTab === 'focus';

  const handleToggleTodayFocusWithToast = React.useCallback(
    async (id: string) => {
      const res = await handleToggleTodayFocus(id);
      if (res && !res.success && res.reason === 'limit_reached') {
        showToast(
          'Focus Queue Full (5/5)',
          'Complete or unstar an active focus task to add this one ✨',
          'system'
        );
      }
    },
    [handleToggleTodayFocus, showToast]
  );

  const handleDeleteTaskWithToast = React.useCallback(
    (id: string) => {
      const taskToDelete = tasks.find((t) => t.id === id);
      if (!taskToDelete) return;

      handleDeleteTask(id);

      showToast(
        'Task deleted',
        `"${taskToDelete.title}" was permanently removed.`,
        'system',
        {
          label: 'Undo',
          onClick: () => {
            handleRestoreTask(taskToDelete);
            showToast('Task restored', `"${taskToDelete.title}" has been restored.`, 'system');
          },
        },
        7000
      );
    },
    [tasks, handleDeleteTask, handleRestoreTask, showToast]
  );

  const handleQuickAddTask = React.useCallback(
    (taskData: any) =>
      handleAddTask({
        title: taskData.title,
        priority: taskData.priority || 'medium',
        tags: taskData.tags || ['Quick Capture'],
        dueDate: taskData.dueDate,
        isTodayFocus: taskData.isTodayFocus ?? false,
        timeBlock: taskData.timeBlock || 'morning',
        estimatedMinutes: taskData.estimatedMinutes || 25,
      }),
    [handleAddTask]
  );

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
            notesCount={quickNotes.filter((n) => !n.archived).length}
            onToggleCalendar={() => setIsCalendarOpen((prev) => !prev)}
            calendarActiveDate={selectedCalendarDate}
            overdueTasksCount={overdueCalendarTasksCount}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            onSelectTab={setActiveTab}
            onAcceptCircleInvite={handleAcceptCircleInvite}
          />
        )}

        {/* Database Error Banner */}
        {habitsError && (
          <div role="alert" className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400 flex items-center justify-center gap-2">
            <span className="font-semibold">{habitsError} (Running in Local Mode)</span>
          </div>
        )}

        {/* Main Container Layout */}
        <main className={isImmersiveFocusMode ? 'w-full min-h-screen p-0' : 'mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-6'}>
          {isImmersiveFocusMode ? (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-8">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--accent-terracotta)] border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                    Loading Focus Room...
                  </span>
                </div>
              }
            >
              <FocusView
                tasks={tasks}
                onFocusComplete={handleFocusComplete}
                onUpdateTimeBlock={handleUpdateTimeBlock}
                activeSoundscape={activeSoundscape}
                setActiveSoundscape={setActiveSoundscape}
                totalFocusMinutesToday={totalFocusMinutesToday}
                focusSessions={focusSessions}
                onDeleteFocusSession={deleteFocusSession}
                onExitImmersive={() => setActiveTab('dashboard')}
              />
            </Suspense>
          ) : (
            <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-4 lg:gap-6">
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
                onQuickAddTask={handleQuickAddTask}
                onFocusComplete={handleFocusComplete}
              />

              {/* View Content Panel */}
              <section className="flex-1 min-w-0">
                <Suspense
                  fallback={
                    <div className="space-y-4 animate-pulse p-4" aria-busy="true" aria-label="Loading view">
                      <div className="h-28 rounded-2xl bg-[var(--border-subtle)]/40" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-44 rounded-2xl bg-[var(--border-subtle)]/30" />
                        <div className="h-44 rounded-2xl bg-[var(--border-subtle)]/30" />
                      </div>
                      <div className="h-64 rounded-2xl bg-[var(--border-subtle)]/30" />
                    </div>
                  }
                >
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      tasks={tasks}
                      habits={habits}
                      focusMinutes={totalFocusMinutesToday}
                      userStreak={userStreak}
                      members={members}
                      onToggleComplete={handleToggleCompleteTask}
                      onToggleTodayFocus={handleToggleTodayFocusWithToast}
                      onDeleteTask={handleDeleteTaskWithToast}
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
                      onToggleTodayFocus={handleToggleTodayFocusWithToast}
                      onDeleteTask={handleDeleteTaskWithToast}
                      onArchiveTask={handleArchiveTask}
                      onSweepCompleted={handleSweepCompletedTasks}
                      onRolloverOverdueTasks={handleRolloverOverdueTasks}
                      selectedCalendarDate={selectedCalendarDate}
                      onSelectCalendarDate={setSelectedCalendarDate}
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
                          onToggleHabit={handleToggleHabitWithNotification}
                          onAddHabit={addHabit}
                          onDeleteHabit={deleteHabit}
                          onArchiveHabit={archiveHabit}
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'pods' && (
                    <CoWorkingPodsView
                      members={members}
                      userStreak={userStreak}
                      onTogglePartner={togglePartner}
                    />
                  )}

                  {activeTab === 'circles' && (
                    <CirclesView
                      members={members}
                      feedPosts={feedPosts}
                      userStreak={userStreak}
                      currentUserId={user?.id}
                      currentUserName={currentUserName}
                      currentUserEmail={user?.email}
                      onToggleLike={toggleLikePost}
                      onBroadcastAchievement={broadcastAchievement}
                      onDeletePost={deletePost}
                      onTogglePartner={togglePartner}
                      onToggleMute={toggleMute}
                      onAddMemberByName={addMemberByName}
                      onRemoveMember={removeMember}
                    />
                  )}

                  {activeTab === 'partners' && (
                    <PartnerNetworkView
                      members={members}
                      invites={invites}
                      incomingInvites={incomingInvites}
                      currentUserId={user?.id}
                      currentUserName={currentUserName}
                      currentUserEmail={user?.email}
                      onTogglePartner={togglePartner}
                      onToggleMute={toggleMute}
                      onRemoveMember={removeMember}
                      onSendInvite={sendCircleInvite}
                      onCancelInvite={cancelCircleInvite}
                      onGenerateMagicLink={generateMagicInviteLink}
                      onAcceptInvite={handleAcceptCircleInvite}
                      onDeclineInvite={handleDeclineCircleInvite}
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
                      notes={quickNotes}
                      habits={habits}
                      onUnarchiveTask={handleUnarchiveTask}
                      onDeleteTask={handleDeleteTask}
                      onBatchUnarchiveTasks={handleBatchUnarchiveTasks}
                      onBatchDeleteTasks={handleBatchDeleteTasks}
                      onUnarchiveNote={handleUnarchiveQuickNote}
                      onDeleteNote={handleDeleteQuickNote}
                      onBatchUnarchiveNotes={handleBatchUnarchiveQuickNotes}
                      onBatchDeleteNotes={handleBatchDeleteQuickNotes}
                      onUnarchiveHabit={unarchiveHabit}
                      onDeleteHabit={deleteHabit}
                      onBatchUnarchiveHabits={batchUnarchiveHabits}
                      onBatchDeleteHabits={batchDeleteHabits}
                      onNavigateToInbox={() => setActiveTab('inbox')}
                    />
                  )}

                  {activeTab === 'profile' && <ProfileView />}
                </Suspense>
              </section>
            </div>
          )}
        </main>

        {/* Confetti & Reward Modal */}
        {rewardModal.open && (
          <Suspense fallback={null}>
            <RewardModal
              isOpen={rewardModal.open}
              onClose={() => setRewardModal((prev) => ({ ...prev, open: false }))}
              title={rewardModal.title}
              message={rewardModal.message}
              streakCount={userStreak}
            />
          </Suspense>
        )}

        {/* End of Day Reflection Summary Modal */}
        {isSummaryOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* First-time Onboarding Wizard */}
        {isOnboardingOpen && (
          <Suspense fallback={null}>
            <OnboardingModal
              isOpen={isOnboardingOpen}
              onComplete={() => setIsOnboardingOpen(false)}
              onAddHabit={addHabit}
              onAddTask={handleAddTask}
              requestNotificationPermission={requestPermission}
            />
          </Suspense>
        )}

        {/* Pending Circle Partner Invitation Acceptance Modal */}
        {Boolean(pendingCircleInvite) && (
          <Suspense fallback={null}>
            <CircleInviteAcceptModal
              isOpen={Boolean(pendingCircleInvite)}
              inviterName={pendingCircleInvite?.inviter || 'Circle Partner'}
              inviteToken={pendingCircleInvite?.token || ''}
              onAccept={handleAcceptCircleInvite}
              onMaybeLater={handleMaybeLaterCircleInvite}
              onDecline={handleDeclineCircleInvite}
            />
          </Suspense>
        )}

        {/* Global Quick Notes Floating Trigger */}
        <QuickNotesFloatingTrigger
          onClick={() => setIsQuickNotesOpen(true)}
          notesCount={quickNotes.filter((n) => !n.archived).length}
          isOpen={isQuickNotesOpen}
          isFocusMode={isImmersiveFocusMode}
        />

        {/* Global Calendar Floating Trigger (stacked vertically above QuickNotes) */}
        <CalendarFloatingTrigger
          onClick={() => setIsCalendarOpen(true)}
          isOpen={isCalendarOpen}
          selectedDate={selectedCalendarDate}
          overdueCount={overdueCalendarTasksCount}
          isFocusMode={isImmersiveFocusMode}
        />

        {/* Global Quick Notes Slide-over Drawer */}
        <QuickNotesDrawer
          isOpen={isQuickNotesOpen}
          onClose={() => setIsQuickNotesOpen(false)}
          notes={quickNotes}
          onAddNote={handleAddQuickNote}
          onUpdateNote={handleUpdateQuickNote}
          onDeleteNote={(id) => {
            handleArchiveQuickNote(id);
            notify('Note Archived', 'Moved note to your Archive. You can restore it anytime.', 'system', 'archive');
          }}
          onTogglePin={handleTogglePinQuickNote}
          onConvertToTask={(taskData) => {
            handleAddTask(taskData);
            notify('Task Created from Note', `Added "${taskData.title}" to your active master tasks.`, 'system', 'inbox');
          }}
          onSwitchToCalendar={() => {
            setIsQuickNotesOpen(false);
            setIsCalendarOpen(true);
          }}
        />

        {/* Global Calendar Slide-over Drawer */}
        <CalendarDrawer
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          tasks={tasks}
          selectedDate={selectedCalendarDate}
          onSelectDate={(date) => {
            setSelectedCalendarDate(date);
          }}
          onSwitchToNotes={() => {
            setIsCalendarOpen(false);
            setIsQuickNotesOpen(true);
          }}
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

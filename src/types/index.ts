export type PriorityLevel = 'low' | 'medium' | 'high';
export type TimeBlockSlot = 'morning' | 'afternoon' | 'evening' | null;

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  tags: string[];
  dueDate?: string;
  completed: boolean;
  isTodayFocus: boolean;
  timeBlock: TimeBlockSlot;
  estimatedMinutes?: number;
  completedAt?: string;
  isSomeday?: boolean;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  archived?: boolean;
  archivedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  category: 'health' | 'mindset' | 'growth' | 'creative' | 'fitness';
  icon: string;
  streak: number;
  completedDates: string[]; // ISO date strings (YYYY-MM-DD)
  frequency: 'daily' | 'weekly';
  targetDaysPerWeek: number;
  createdAt: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  freezeShieldsRemaining?: number;
}

export interface FocusSession {
  id: string;
  durationMinutes: number;
  taskTitle?: string;
  mode: 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch';
  completedAt: string;
  soundscape?: string;
  focusQuality?: 'high_flow' | 'moderate' | 'distracted';
}

export interface CircleMember {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  status: 'focusing' | 'idle' | 'completed_day';
  statusText?: string;
  closedRingsCount: number; // 0 to 3
  streak: number;
  activeSoundscape?: string;
  isCirclePartner?: boolean;
  isMuted?: boolean;
  microGoal?: string;
}

export interface CircleInvite {
  id: string;
  email?: string;
  name?: string;
  status: 'pending' | 'accepted' | 'cancelled';
  inviteToken: string;
  inviteLink: string;
  createdAt: string;
  inviterName?: string;
}


export interface CircleFeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'ring_closed' | 'streak_milestone' | 'habit_mastered' | 'focus_marathon';
  title: string;
  detail: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export type ActiveTab = 'dashboard' | 'inbox' | 'focus' | 'habits' | 'circles' | 'analytics' | 'archive' | 'profile';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'timer' | 'habit' | 'streak' | 'circle' | 'system';
  read: boolean;
  createdAt: string;
  actionTab?: ActiveTab;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  microGoal?: string;
  statusMessage?: string;
  timezone?: string;
  workHoursStart?: string;
  workHoursEnd?: string;
  favoriteSoundscape?: string;
  privacySettings: {
    showFocusHours: boolean;
    showMicroGoal: boolean;
    showActivityFeed: boolean;
    showStreak: boolean;
  };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'focus' | 'habit' | 'social';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface FocusPod {
  id: string;
  name: string;
  creatorId: string;
  allowedMemberIds: string[];
  allowedMemberNames?: string[];
  durationMinutes: number;
  isPermanent: boolean;
  expiresAt: string; // ISO date string
  activeMembersCount?: number;
  recentLogs?: {
    id: string;
    userName: string;
    taskTitle?: string;
    durationMinutes: number;
    completedAt: string;
  }[];
}

export type NoteColor = 'terracotta' | 'sage' | 'ochre' | 'rose' | 'slate';

export interface QuickNote {
  id: string;
  title?: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

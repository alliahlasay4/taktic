import React, { useState } from 'react';
import { 
  Plus, 
  Repeat, 
  Sparkles, 
  X, 
  SlidersHorizontal, 
  Trophy, 
  Clock, 
  Sun, 
  Moon, 
  Sunrise, 
  Search, 
  RotateCcw,
  Droplets,
  BookOpen,
  Activity,
  Heart,
  Target,
  Coffee,
  Zap,
  Shield,
  CheckCircle2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit } from '../../types';
import { HabitItem } from './HabitItem';
import { IconRenderer } from '../common/IconRenderer';
import { Pagination } from '../common/Pagination';
import { soundEngine } from '../../lib/audio';
import { getLocalDateString } from '../../lib/streak';

interface HabitViewProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
  onDeleteHabit: (id: string) => void;
  onArchiveHabit?: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories', iconName: 'sparkles' },
  { id: 'health', label: 'Health', iconName: 'droplet' },
  { id: 'mindset', label: 'Mindset', iconName: 'book' },
  { id: 'fitness', label: 'Fitness', iconName: 'activity' },
  { id: 'creative', label: 'Creative', iconName: 'target' },
  { id: 'growth', label: 'Growth', iconName: 'sunrise' },
];

const TIME_OF_DAY_TABS = [
  { id: 'all', label: 'All Routines', icon: Clock },
  { id: 'morning', label: 'Morning', icon: Sunrise },
  { id: 'afternoon', label: 'Afternoon', icon: Sun },
  { id: 'evening', label: 'Evening', icon: Moon },
];

const AVAILABLE_ICONS = [
  { name: 'droplet', label: 'Hydration', icon: Droplets },
  { name: 'book', label: 'Reading', icon: BookOpen },
  { name: 'activity', label: 'Fitness', icon: Activity },
  { name: 'heart', label: 'Wellness', icon: Heart },
  { name: 'target', label: 'Focus', icon: Target },
  { name: 'coffee', label: 'Break', icon: Coffee },
  { name: 'sunrise', label: 'Morning', icon: Sunrise },
  { name: 'moon', label: 'Night', icon: Moon },
  { name: 'zap', label: 'Energy', icon: Zap },
  { name: 'sparkles', label: 'Habit', icon: Sparkles },
];

export const HabitView: React.FC<HabitViewProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onArchiveHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddCategory] = useState<'health' | 'mindset' | 'growth' | 'creative' | 'fitness'>('health');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'health' | 'mindset' | 'growth' | 'creative' | 'fitness'>('health');
  const [newIcon, setNewIcon] = useState('droplet');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newTargetDays, setNewTargetDays] = useState<number>(7);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const today = getLocalDateString();
  const activeHabits = habits.filter((h) => !h.archived);
  const habitsCompletedToday = activeHabits.filter((h) => h.completedDates.includes(today)).length;
  const habitsPendingToday = activeHabits.length - habitsCompletedToday;

  // Filter habits by category, time of day, completion status, and search query
  const filteredHabits = activeHabits.filter((h) => {
    const isDoneToday = h.completedDates.includes(today);
    
    // Status filter
    if (selectedStatus === 'pending' && isDoneToday) return false;
    if (selectedStatus === 'completed' && !isDoneToday) return false;

    // Time of day filter
    const matchesTimeOfDay = selectedTimeOfDay === 'all' || (h.timeOfDay || 'morning') === selectedTimeOfDay;
    if (!matchesTimeOfDay) return false;

    // Category filter
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    if (!matchesCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = h.title.toLowerCase().includes(q);
      const matchesCat = h.category.toLowerCase().includes(q);
      if (!matchesTitle && !matchesCat) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHabits.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedHabits = filteredHabits.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const isAnyFilterActive = selectedCategory !== 'all' || selectedTimeOfDay !== 'all' || selectedStatus !== 'all' || Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedTimeOfDay('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleToggleHabitWithConfetti = (id: string) => {
    const habitToToggle = habits.find((h) => h.id === id);
    if (habitToToggle) {
      const isCurrentlyDone = habitToToggle.completedDates.includes(today);
      if (!isCurrentlyDone && habitsCompletedToday + 1 === habits.length && habits.length > 0) {
        soundEngine.playCelebrationSound();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C87D87', '#C06C4C', '#10b981', '#f59e0b'],
        });
      }
    }
    onToggleHabit(id);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const defaultIconMap: Record<string, string> = {
      health: 'droplet',
      mindset: 'book',
      fitness: 'activity',
      creative: 'target',
      growth: 'sunrise',
    };

    onAddHabit({
      title: quickAddTitle.trim(),
      category: quickAddCategory,
      icon: defaultIconMap[quickAddCategory] || 'sparkles',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      timeOfDay: 'morning',
    });

    setQuickAddTitle('');
  };

  const handleSubmitNewHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon || 'sparkles',
      frequency: newTargetDays < 7 ? 'weekly' : 'daily',
      targetDaysPerWeek: Number(newTargetDays) || 7,
      timeOfDay: newTimeOfDay,
    });

    setNewTitle('');
    setIsModalOpen(false);
  };

  const totalHabitsCount = activeHabits.length;
  const habitCompletionPct = totalHabitsCount > 0 ? Math.round((habitsCompletedToday / totalHabitsCount) * 100) : 0;
  const isAllHabitsCompleted = totalHabitsCount > 0 && habitsCompletedToday === totalHabitsCount;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Page Header & Completion Bar Card - Dusty Rose Habits Theme */}
      <div className={`rounded-2xl border ${isAllHabitsCompleted ? 'border-[#C87D87]/40 bg-gradient-to-r from-[var(--card-surface)] to-[#C87D87]/5 shadow-[#C87D87]/10' : 'border-[var(--border-subtle)] bg-[var(--card-surface)]'} p-3.5 sm:p-5 shadow-xs transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 ${
              isAllHabitsCompleted
                ? 'bg-[#C87D87]/15 text-[#C87D87] dark:text-[#D88E98] border border-[#C87D87]/30'
                : 'bg-[#C87D87]/10 text-[#C87D87] dark:text-[#D88E98] border border-[#C87D87]/20'
            }`}>
              {isAllHabitsCompleted ? (
                <CheckCircle2 className="h-5 w-5 animate-in zoom-in-75 duration-300" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base sm:text-lg text-[var(--text-primary)] tracking-tight">
                  Daily Habits & Routines
                </h1>
                {isAllHabitsCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#C87D87]/15 border border-[#C87D87]/30 px-2 py-0.5 text-[10px] font-bold text-[#B85D6A] dark:text-[#D88E98] animate-pulse">
                    <Check className="h-3 w-3" />
                    All Complete! 🎉
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                    {habitsPendingToday} left today
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {habitsCompletedToday} of {totalHabitsCount} habits completed today ({habitCompletionPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              Today's Rhythm: <strong className="text-[#C87D87] dark:text-[#D88E98] font-bold">{habitsCompletedToday}/{totalHabitsCount}</strong>
            </span>
          </div>
        </div>

        {/* Habit Completion Progress Bar - Dusty Rose */}
        <div
          className="h-2 w-full rounded-full bg-[var(--border-subtle)]/40 overflow-hidden"
          role="progressbar"
          aria-label="Habit completion progress"
          aria-valuenow={habitCompletionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${habitsCompletedToday} of ${totalHabitsCount} habits completed (${habitCompletionPct}%)`}
        >
          <div
            className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-[#B85D6A] to-[#E58A97]"
            style={{ width: `${habitCompletionPct}%` }}
          />
        </div>
      </div>

      {/* Primary Action Hub: Daily Habit Rhythm Checklist Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-3.5 sm:p-6 shadow-xs space-y-3 sm:space-y-4 transition-colors duration-300">
        {/* Top Header: Segmented Tabs & Action Controls */}
        <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-3 border-b border-[var(--border-subtle)]">
          {/* Top Row: Segmented Tab Bar (Full Width, 3 Equal Columns - Zero Horizontal Scroll on Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            {/* Sleek Segmented Switcher (All, To Do, Done) */}
            <div className="w-full sm:w-auto">
              <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] shadow-inner">
                {/* 1. All */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('all');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    selectedStatus === 'all'
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Repeat className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="leading-none">All</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    selectedStatus === 'all'
                      ? 'bg-[var(--text-primary)]/10 text-[var(--text-primary)]'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {habits.length}
                  </span>
                </button>

                {/* 2. To Do */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('pending');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    selectedStatus === 'pending'
                      ? 'bg-[var(--card-surface)] text-[var(--accent-terracotta)] shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="leading-none">To Do</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    selectedStatus === 'pending'
                      ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {habitsPendingToday}
                  </span>
                </button>

                {/* 3. Done */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('completed');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl transition-all min-h-[34px] sm:min-h-[36px] cursor-pointer whitespace-nowrap ${
                    selectedStatus === 'completed'
                      ? 'bg-[var(--card-surface)] text-emerald-500 shadow-xs border border-[var(--border-subtle)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="leading-none">Done</span>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shrink-0 ${
                    selectedStatus === 'completed'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-[var(--card-hover)] text-[var(--text-muted)]'
                  }`}>
                    {habitsCompletedToday}
                  </span>
                </button>
              </div>
            </div>

            {/* Desktop Right: + New Habit Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2 text-xs font-semibold shadow-xs transition-all min-h-[36px] shrink-0 sm:ml-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* Quick Add Bar with Search & Filter Action on Mobile */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleQuickAddSubmit} className="relative flex items-center flex-1 min-w-0">
            <Sparkles className="absolute left-3 h-3.5 w-3.5 text-[var(--accent-terracotta)] shrink-0 pointer-events-none" />
            <input
              id="quick-add-habit-title"
              name="quickAddHabitTitle"
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Quick add: e.g. 'Morning meditation 10m'..."
              aria-label="Quick add habit routine"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 pl-9 pr-16 sm:pr-24 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] transition-all min-h-[36px] sm:min-h-[38px]"
            />
            <button
              type="submit"
              disabled={!quickAddTitle.trim()}
              className="absolute right-1 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 transition shadow-2xs min-h-[28px] sm:min-h-[30px] cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Mobile Right Quick Action Icons: Search & Filter Drawer Trigger */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileSearchVisible((prev) => !prev)}
              aria-label="Toggle search input"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isMobileSearchVisible || searchQuery
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              aria-label="Open filter options"
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                selectedCategory !== 'all' || selectedTimeOfDay !== 'all'
                  ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {(selectedCategory !== 'all' || selectedTimeOfDay !== 'all') && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-[var(--accent-terracotta)] ring-2 ring-[var(--card-surface)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchVisible && (
          <div className="sm:hidden relative animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              id="habit-mobile-search-filter-input"
              name="mobileHabitSearchQuery"
              type="text"
              placeholder="Search active habits..."
              aria-label="Filter habits by keyword"
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-[var(--accent-terracotta)]/40 bg-[var(--bg-main)]/70 pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] min-h-[36px]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMobileSearchVisible(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md"
                aria-label="Close search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mobile Active Filter Chips Row */}
        {(Boolean(searchQuery) || selectedCategory !== 'all' || selectedTimeOfDay !== 'all') && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] shrink-0">
                <Search className="h-3 w-3 text-[var(--text-muted)]" />
                "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="ml-1 text-[var(--text-muted)] hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedTimeOfDay !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/30 text-[11px] font-semibold text-[var(--accent-terracotta)] shrink-0">
                {selectedTimeOfDay.charAt(0).toUpperCase() + selectedTimeOfDay.slice(1)}
                <button type="button" onClick={() => setSelectedTimeOfDay('all')} className="ml-1 hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] shrink-0">
                Category: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                <button type="button" onClick={() => setSelectedCategory('all')} className="ml-1 text-[var(--text-muted)] hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-rose-500 hover:underline px-1 py-0.5 shrink-0 whitespace-nowrap cursor-pointer font-medium"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Desktop Filter Bar & Routine Controls (Hidden on mobile < 640px) */}
        <div className="hidden sm:block space-y-2.5 pt-1">
          <div className="flex items-center justify-between gap-2.5">
            {/* Time of Day Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] overflow-x-auto">
              {TIME_OF_DAY_TABS.map((t) => {
                const TabIcon = t.icon;
                const isSelected = selectedTimeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTimeOfDay(t.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--card-surface)] text-[var(--accent-terracotta)] shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Filter Drawer Toggle & Search */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative w-48 lg:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  id="habit-desktop-search-input"
                  name="habitDesktopSearch"
                  type="text"
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/50 pl-9 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:bg-[var(--card-surface)] min-h-[34px] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
                aria-label="Toggle Category Filters"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[34px] cursor-pointer ${
                  isFilterOpen || selectedCategory !== 'all'
                    ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Filters</span>
                {selectedCategory !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-terracotta)]" />
                )}
              </button>
            </div>
          </div>

          {/* Desktop Category Drawer */}
          {isFilterOpen && (
            <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/80 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Filter by Category:</span>
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] font-medium transition cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all' 
                    ? habits.length 
                    : habits.filter((h) => h.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition shrink-0 border cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold'
                          : 'border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <IconRenderer name={cat.iconName} className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{cat.label}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Habits List or Empty State */}
        {filteredHabits.length > 0 ? (
          <>
            <div className="space-y-2.5 pt-1 sm:pt-2 pb-20 sm:pb-0">
              {paginatedHabits.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggleHabit={handleToggleHabitWithConfetti}
                  onDeleteHabit={onDeleteHabit}
                  onArchiveHabit={onArchiveHabit}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={safeCurrentPage}
              totalItems={filteredHabits.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 8, 12, 20]}
              itemName="routines"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)]/40 p-6 space-y-2">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] mb-1">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              No Habit Routines Found
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
              {isAnyFilterActive
                ? 'No habits match your active filter criteria. Try resetting filters or switching the time-of-day view.'
                : 'Your habit list is empty. Add a routine above or click below to build your rhythm!'}
            </p>
            {isAnyFilterActive ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Habit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spacious 2-Column Create Habit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] shadow-2xl transition-all my-auto text-[var(--text-primary)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-modal-heading"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-2 py-0.5 rounded-md shrink-0">
                  New
                </span>
                <h2 id="habit-modal-heading" className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                  New Habit
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNewHabit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 overflow-y-auto max-h-[78vh]">
                {/* Left Column (Core Info) - md: 7 cols */}
                <div className="md:col-span-7 space-y-4">
                  {/* Habit Title */}
                  <div>
                    <label 
                      htmlFor="modal-new-habit-title" 
                      className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
                    >
                      Habit Name <span className="text-[var(--accent-terracotta)]">*</span>
                    </label>
                    <input
                      id="modal-new-habit-title"
                      name="habitTitle"
                      type="text"
                      required
                      placeholder="e.g., Morning stretch, Read 10 pages..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-all"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'health', label: 'Health', iconName: 'droplet' },
                        { id: 'mindset', label: 'Mindset', iconName: 'book' },
                        { id: 'fitness', label: 'Fitness', iconName: 'activity' },
                        { id: 'creative', label: 'Creative', iconName: 'target' },
                        { id: 'growth', label: 'Growth', iconName: 'sunrise' },
                      ].map((cat) => {
                        const isSelected = newCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setNewCategory(cat.id as any);
                              setNewIcon(cat.iconName);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition text-left cursor-pointer ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-semibold ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <IconRenderer name={cat.iconName} className="h-4 w-4 shrink-0" />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Icon Selector Grid */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ICONS.map((item) => {
                        const isSelected = newIcon === item.name;
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setNewIcon(item.name)}
                            title={item.label}
                            aria-label={`Select ${item.label} icon`}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <ItemIcon className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column (Schedule & Frequency) - md: 5 cols */}
                <div className="md:col-span-5 space-y-4 md:border-l md:border-[var(--border-subtle)] md:pl-6">
                  {/* Time of Day */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Time of Day
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'morning', label: 'Morning', sub: 'Start of day', icon: Sunrise },
                        { id: 'afternoon', label: 'Afternoon', sub: 'Midday', icon: Sun },
                        { id: 'evening', label: 'Evening', sub: 'End of day', icon: Moon },
                      ].map((slot) => {
                        const isSelected = newTimeOfDay === slot.id;
                        const SlotIcon = slot.icon;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setNewTimeOfDay(slot.id as any)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--text-primary)] ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <SlotIcon className={`h-4 w-4 ${isSelected ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'}`} strokeWidth={1.5} />
                            <div>
                              <span className="block text-xs font-semibold text-[var(--text-primary)]">{slot.label}</span>
                              <span className="block text-[11px] text-[var(--text-muted)]">{slot.sub}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Frequency */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Weekly Frequency
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[
                        { days: 7, label: 'Daily (7d)' },
                        { days: 5, label: '5 days' },
                        { days: 3, label: '3 days' },
                      ].map((freq) => {
                        const isSelected = newTargetDays === freq.days;
                        return (
                          <button
                            key={freq.days}
                            type="button"
                            onClick={() => setNewTargetDays(freq.days)}
                            className={`flex-1 py-2 rounded-xl border text-xs text-center transition cursor-pointer ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-semibold ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {freq.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Streak Freeze Info Card */}
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                      <Shield className="h-4 w-4 shrink-0" />
                      <span>Streak Protection</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      Includes 3 monthly streak freezes to protect your streak on busy days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 sm:px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) for '+ New Habit' */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-6 left-6 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[var(--accent-terracotta)] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Create new habit routine"
        title="Create new habit routine"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Mobile Filter Bottom Sheet Drawer */}
      {isMobileFiltersOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Sheet Content */}
          <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center">
              <div className="h-1 w-10 rounded-full bg-[var(--text-muted)]/30 mb-3" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--accent-terracotta)]" />
                  <span className="font-heading font-bold text-sm text-[var(--text-primary)]">Filter Habit Routines</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter: Time of Day */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Time of Day</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_OF_DAY_TABS.map((t) => {
                  const TabIcon = t.icon;
                  const isSelected = selectedTimeOfDay === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTimeOfDay(t.id);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-2xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                      }`}
                    >
                      <TabIcon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter: Category */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all' 
                    ? habits.length 
                    : habits.filter((h) => h.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-between py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold shadow-2xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconRenderer name={cat.iconName} className="h-3.5 w-3.5" />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Show Results ({filteredHabits.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

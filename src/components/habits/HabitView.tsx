import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Repeat, 
  Sparkles, 
  X, 
  SlidersHorizontal, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  Sun, 
  Sunset, 
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
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit } from '../../types';
import { HabitItem } from './HabitItem';
import { TripleRings } from './TripleRings';
import { HeatmapGrid } from './HeatmapGrid';
import { MilestoneTrophyShelf } from './MilestoneTrophyShelf';
import { IconRenderer } from '../common/IconRenderer';
import { Pagination } from '../common/Pagination';
import { soundEngine } from '../../lib/audio';

interface HabitViewProps {
  habits: Habit[];
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  targetFocusMinutes: number;
  onToggleHabit: (id: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => void;
  onDeleteHabit: (id: string) => void;
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
  tasksCompleted,
  totalTasks,
  focusMinutes,
  targetFocusMinutes,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState<'health' | 'mindset' | 'growth' | 'creative' | 'fitness'>('health');
  
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

  const today = new Date().toISOString().split('T')[0];
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const habitsPendingToday = habits.length - habitsCompletedToday;

  // Filter habits by category, time of day, completion status, and search query
  const filteredHabits = habits.filter((h) => {
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

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTimeOfDay, selectedStatus, searchQuery]);

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

  return (
    <div className="space-y-6">
      {/* Triple Progress Rings Section */}
      <TripleRings
        tasksCompleted={tasksCompleted}
        totalTasks={totalTasks}
        habitsCompleted={habitsCompletedToday}
        totalHabits={habits.length}
        focusMinutes={focusMinutes}
        targetFocusMinutes={targetFocusMinutes}
      />

      {/* Consistency Milestone Trophy Shelf */}
      <MilestoneTrophyShelf habits={habits} />

      {/* Habits Routine Checklist Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-4 sm:p-6 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]">
              <Repeat className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Daily Habit Rhythm Checklist
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[var(--text-secondary)]">
                  {habitsCompletedToday} of {habits.length} routines completed today
                </span>
                {habits.length > 0 && (
                  <span className="text-[11px] font-semibold text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-2 py-0.2 rounded-md">
                    {Math.round((habitsCompletedToday / habits.length) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-4 py-2.5 text-xs font-semibold shadow-xs transition-all min-h-[44px] shrink-0"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            <span>New Habit</span>
          </button>
        </div>

        {/* Quick Add Habit Bar */}
        <form onSubmit={handleQuickAddSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Sparkles className="absolute left-3.5 h-4 w-4 text-[var(--accent-terracotta)] shrink-0" />
            <input
              id="quick-add-habit-title"
              name="quickAddHabitTitle"
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Quick add a new daily habit routine..."
              aria-label="Quick add habit routine"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 pl-10 pr-28 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] transition-colors min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!quickAddTitle.trim()}
              className="absolute right-1.5 rounded-lg bg-[var(--accent-terracotta)] hover:opacity-90 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition shadow-2xs min-h-[34px]"
            >
              Add Habit
            </button>
          </div>
        </form>

        {/* High-Efficiency Filter Toolbar */}
        <div className="space-y-3 pt-1">
          {/* Row 1: Time of Day Tabs + Status Filter + Filter Drawer Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Time of Day Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] overflow-x-auto">
              {TIME_OF_DAY_TABS.map((t) => {
                const TabIcon = t.icon;
                const isSelected = selectedTimeOfDay === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTimeOfDay(t.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
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

            {/* Status Tabs + Filter Drawer Button */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Completion Status Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedStatus === 'all'
                      ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  All ({habits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('pending')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedStatus === 'pending'
                      ? 'bg-[var(--card-surface)] text-[var(--accent-terracotta)] shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  To Do ({habitsPendingToday})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('completed')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedStatus === 'completed'
                      ? 'bg-[var(--card-surface)] text-emerald-500 dark:text-emerald-400 shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Done ({habitsCompletedToday})
                </button>
              </div>

              {/* Collapsible Filter Toggle */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
                aria-label="Toggle Category & Keyword Filters"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all min-h-[38px] ${
                  isFilterOpen || selectedCategory !== 'all' || searchQuery.trim()
                    ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">Filters</span>
                {(selectedCategory !== 'all' || searchQuery.trim()) && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-terracotta)]" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Search & Category Filter Drawer */}
          {isFilterOpen && (
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Field */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <input
                    id="habit-search-input"
                    name="habitSearch"
                    type="text"
                    placeholder="Search habits by keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] min-h-[38px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Reset Filters Action */}
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-terracotta)] font-medium px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border-subtle)] transition shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1 shrink-0">Category:</span>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = cat.id === 'all' 
                    ? habits.length 
                    : habits.filter((h) => h.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition shrink-0 border ${
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
            <div className="space-y-2.5 pt-2">
              {paginatedHabits.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggleHabit={handleToggleHabitWithConfetti}
                  onDeleteHabit={onDeleteHabit}
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
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)]/40 p-6 space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-terracotta)]/10 text-[var(--accent-terracotta)] mb-1">
              <Trophy className="h-6 w-6" strokeWidth={1.5} />
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
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-terracotta)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Habit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Consistency Rhythm Heatmap (Connected to Real Data) */}
      <HeatmapGrid daysCount={90} habits={habits} />

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-2.5 py-1 rounded-md">
                  New Habit
                </span>
                <h2 id="habit-modal-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  Design Your Daily Rhythm
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNewHabit}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
                {/* Left Column (60% / 7 cols) - Identity, Category & Icon */}
                <div className="md:col-span-7 space-y-5">
                  {/* Habit Title */}
                  <div>
                    <label 
                      htmlFor="modal-new-habit-title" 
                      className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                    >
                      Habit Routine Title <span className="text-[var(--accent-terracotta)]">*</span>
                    </label>
                    <input
                      id="modal-new-habit-title"
                      name="habitTitle"
                      type="text"
                      required
                      placeholder="e.g. 15-minute Morning Mindful Stretches"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-3 text-base font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-terracotta)] focus:ring-1 focus:ring-[var(--accent-terracotta)] transition-all"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <div className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Focus Category
                    </div>
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
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] ring-1 ring-[var(--accent-terracotta)]'
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
                    <div className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Visual Icon
                    </div>
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
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <ItemIcon className="h-5 w-5" strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column (40% / 5 cols) - Schedule & Target Frequency */}
                <div className="md:col-span-5 space-y-5 md:border-l md:border-[var(--border-subtle)] md:pl-6">
                  {/* Time of Day */}
                  <div>
                    <div className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Time of Day Slot
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: 'morning', label: 'Morning Routine', sub: 'Start of day momentum', icon: Sunrise },
                        { id: 'afternoon', label: 'Afternoon Refresh', sub: 'Mid-day focus & recharge', icon: Sun },
                        { id: 'evening', label: 'Evening Wind-down', sub: 'End of day reflection', icon: Moon },
                      ].map((slot) => {
                        const isSelected = newTimeOfDay === slot.id;
                        const SlotIcon = slot.icon;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setNewTimeOfDay(slot.id as any)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 text-[var(--text-primary)] ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                            }`}
                          >
                            <SlotIcon className={`h-4 w-4 ${isSelected ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'}`} strokeWidth={1.5} />
                            <div>
                              <span className="block text-xs font-bold text-[var(--text-primary)]">{slot.label}</span>
                              <span className="block text-[11px] text-[var(--text-muted)]">{slot.sub}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Frequency */}
                  <div>
                    <div className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Weekly Frequency Goal
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[
                        { days: 7, label: 'Daily (7d)' },
                        { days: 5, label: '5x / wk' },
                        { days: 3, label: '3x / wk' },
                      ].map((freq) => {
                        const isSelected = newTargetDays === freq.days;
                        return (
                          <button
                            key={freq.days}
                            type="button"
                            onClick={() => setNewTargetDays(freq.days)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-semibold text-center transition ${
                              isSelected
                                ? 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] font-bold ring-1 ring-[var(--accent-terracotta)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {freq.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Freeze Shield Info Card */}
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-bold mb-1">
                      <Shield className="h-4 w-4" />
                      <span>3 Freeze Shields Protection</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      Habits automatically include 3 monthly streak protection shields to keep your consistency intact during unexpected busy days.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent-terracotta)] text-white hover:opacity-90 px-5 py-2.5 text-xs font-bold shadow-sm transition"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, Repeat, Sparkles, X, Filter, CheckCircle2, Trophy, Clock, Sun, Sunset, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit } from '../../types';
import { HabitItem } from './HabitItem';
import { TripleRings } from './TripleRings';
import { HeatmapGrid } from './HeatmapGrid';
import { MilestoneTrophyShelf } from './MilestoneTrophyShelf';

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

const CATEGORY_ICONS: Record<string, string> = {
  health: '💧',
  mindset: '📚',
  fitness: '🌅',
  creative: '✍️',
  growth: '🌱',
};

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: '✨' },
  { id: 'health', label: 'Health', icon: '💧' },
  { id: 'mindset', label: 'Mindset', icon: '📚' },
  { id: 'fitness', label: 'Fitness', icon: '🌅' },
  { id: 'creative', label: 'Creative', icon: '✍️' },
  { id: 'growth', label: 'Growth', icon: '🌱' },
];

const TIME_OF_DAY_TABS = [
  { id: 'all', label: 'All Routines', icon: '⏱️' },
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'health' | 'mindset' | 'growth' | 'creative' | 'fitness'>('health');
  const [newIcon, setNewIcon] = useState('💧');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newTargetDays, setNewTargetDays] = useState<number>(7);

  const today = new Date().toISOString().split('T')[0];
  const habitsCompletedToday = habits.filter((h) => h.completedDates.includes(today)).length;

  // Filter habits by category AND time of day
  const filteredHabits = habits.filter((h) => {
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    const matchesTimeOfDay = selectedTimeOfDay === 'all' || (h.timeOfDay || 'morning') === selectedTimeOfDay;
    return matchesCategory && matchesTimeOfDay;
  });

  const handleToggleHabitWithConfetti = (id: string) => {
    const habitToToggle = habits.find((h) => h.id === id);
    if (habitToToggle) {
      const isCurrentlyDone = habitToToggle.completedDates.includes(today);
      if (!isCurrentlyDone && habitsCompletedToday + 1 === habits.length && habits.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34d399', '#10b981', '#059669', '#f59e0b'],
        });
      }
    }
    onToggleHabit(id);
  };

  const handleSubmitNewHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      title: newTitle.trim(),
      category: newCategory,
      icon: newIcon || CATEGORY_ICONS[newCategory] || '✨',
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

      {/* Habits Routine Checklist Header & Filters */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C87D87]/20 text-[#C87D87]">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                Daily Habit Rhythm Checklist
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {habitsCompletedToday} of {habits.length} routines completed today
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C87D87] to-[#C06C4C] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#C87D87]/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Habit</span>
          </button>
        </div>

        {/* Time of Day Chronological Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Time of Day:
          </span>
          {TIME_OF_DAY_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTimeOfDay(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedTimeOfDay === t.id
                  ? 'bg-[#C87D87] text-white shadow-xs'
                  : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-[var(--border-subtle)]">
          <Filter className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold'
                  : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Habits List or Empty State */}
        {filteredHabits.length > 0 ? (
          <div className="space-y-2.5">
            {filteredHabits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                onToggleHabit={handleToggleHabitWithConfetti}
                onDeleteHabit={onDeleteHabit}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-main)]/50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
              <Trophy className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              No Habit Routines Found
            </h4>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-xs">
              Try adjusting your category or Time of Day filter, or create a new habit.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Habit</span>
            </button>
          </div>
        )}
      </div>

      {/* Consistency Rhythm Heatmap (Connected to Real Data) */}
      <HeatmapGrid daysCount={90} habits={habits} />

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                Create New Habit Routine
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15-minute Morning Stretches"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setNewCategory(cat);
                      setNewIcon(CATEGORY_ICONS[cat]);
                    }}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="health">💧 Health & Wellness</option>
                    <option value="mindset">📚 Mindset & Learning</option>
                    <option value="fitness">🌅 Movement & Fitness</option>
                    <option value="creative">✍️ Creative & Writing</option>
                    <option value="growth">🌱 Personal Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newTimeOfDay}
                    onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="morning">🌅 Morning Routine</option>
                    <option value="afternoon">☀️ Afternoon Refresh</option>
                    <option value="evening">🌙 Evening Wind-down</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Target Frequency
                  </label>
                  <select
                    value={newTargetDays}
                    onChange={(e) => setNewTargetDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value={7}>Daily (7 Days/Wk)</option>
                    <option value={5}>5x per Week</option>
                    <option value={3}>3x per Week</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--card-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#C87D87] to-[#C06C4C] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#C87D87]/20 hover:opacity-90"
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


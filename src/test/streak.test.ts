import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getLocalDateString,
  getDateWithOffset,
  calculateConsecutiveStreak,
  calculateGlobalActivityStreak,
} from '../lib/streak';

describe('Streak Calculation Utilities', () => {
  const MOCK_TODAY = '2026-10-08';
  const MOCK_YESTERDAY = '2026-10-07';
  const MOCK_TWO_DAYS_AGO = '2026-10-06';
  const MOCK_THREE_DAYS_AGO = '2026-10-05';

  beforeEach(() => {
    vi.useFakeTimers();
    // Use local time constructor to match getLocalDateString() across all timezones
    vi.setSystemTime(new Date(2026, 9, 8, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats local date string correctly', () => {
    const formatted = getLocalDateString(new Date(2026, 9, 8, 0, 0, 0));
    expect(formatted).toBe('2026-10-08');
  });

  it('calculates date offsets accurately', () => {
    expect(getDateWithOffset('2026-10-08', -1)).toBe('2026-10-07');
    expect(getDateWithOffset('2026-10-08', 1)).toBe('2026-10-09');
    expect(getDateWithOffset('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('returns 0 streak for empty completion history', () => {
    expect(calculateConsecutiveStreak([])).toBe(0);
  });

  it('calculates active streak when completed today', () => {
    const completed = [MOCK_TODAY, MOCK_YESTERDAY, MOCK_TWO_DAYS_AGO];
    expect(calculateConsecutiveStreak(completed)).toBe(3);
  });

  it('preserves streak if completed yesterday but not yet today', () => {
    const completed = [MOCK_YESTERDAY, MOCK_TWO_DAYS_AGO, MOCK_THREE_DAYS_AGO];
    expect(calculateConsecutiveStreak(completed)).toBe(3);
  });

  it('returns 0 if missed both today and yesterday', () => {
    const completed = [MOCK_TWO_DAYS_AGO, MOCK_THREE_DAYS_AGO];
    expect(calculateConsecutiveStreak(completed)).toBe(0);
  });

  it('bridges 1 missed day using freeze shield', () => {
    // Completed today and 2 days ago, missed yesterday
    const completed = [MOCK_TODAY, MOCK_TWO_DAYS_AGO];
    expect(calculateConsecutiveStreak(completed, 1)).toBe(2);
  });

  it('stops counting when missed days exceed available freeze shields', () => {
    // Completed today and 3 days ago (gap of 2 days: yesterday and 2 days ago)
    const completed = [MOCK_TODAY, MOCK_THREE_DAYS_AGO];
    // With 1 shield, it cannot bridge a 2-day gap, so streak is just today (1)
    expect(calculateConsecutiveStreak(completed, 1)).toBe(1);
    // With 2 shields, both gap days are bridged
    expect(calculateConsecutiveStreak(completed, 2)).toBe(2);
  });

  it('normalizes ISO datetime strings correctly to date components', () => {
    const isoCompleted = [
      '2026-10-08T14:30:00.000Z',
      '2026-10-07T08:15:22.000Z',
      '2026-10-06T19:00:00.000Z',
    ];
    expect(calculateConsecutiveStreak(isoCompleted)).toBe(3);
  });

  it('calculates global unified streak across habits, focus, and tasks', () => {
    const habitDates = [MOCK_TODAY];
    const focusDates = [MOCK_YESTERDAY];
    const taskDates = [MOCK_TWO_DAYS_AGO];

    const globalStreak = calculateGlobalActivityStreak(habitDates, focusDates, taskDates);
    expect(globalStreak).toBe(3);
  });
});

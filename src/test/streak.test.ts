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
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats local date string correctly', () => {
    const formatted = getLocalDateString(new Date('2026-10-08T00:00:00'));
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
    // Completed today and 3 days ago, but missed 2 days ago and yesterday
    // With 1 freeze shield, bridging 1 day:
    const completed = [MOCK_TODAY, MOCK_TWO_DAYS_AGO];
    // Missed yesterday -> 1 shield can bridge yesterday
    expect(calculateConsecutiveStreak(completed, 1)).toBe(2);
  });

  it('calculates global unified streak across habits, focus, and tasks', () => {
    const habitDates = [MOCK_TODAY];
    const focusDates = [MOCK_YESTERDAY];
    const taskDates = [MOCK_TWO_DAYS_AGO];

    const globalStreak = calculateGlobalActivityStreak(habitDates, focusDates, taskDates);
    expect(globalStreak).toBe(3);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseQuickTaskInput } from '../components/layout/Sidebar';

describe('parseQuickTaskInput (Natural Language & Slash Commands)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Wednesday Oct 8, 2026, 9:30 AM (Morning block)
    vi.setSystemTime(new Date(2026, 9, 8, 9, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses standard task title with default fallback values in the morning', () => {
    const result = parseQuickTaskInput('Draft weekly team update');
    expect(result).toEqual({
      title: 'Draft weekly team update',
      dueDate: '2026-10-08',
      isTodayFocus: false,
      timeBlock: 'morning',
      priority: 'medium',
      estimatedMinutes: 25,
      tags: ['Quick Capture'],
    });
  });

  it('infers timeBlock from the current system hour when not specified', () => {
    // 2:30 PM -> afternoon
    vi.setSystemTime(new Date(2026, 9, 8, 14, 30, 0));
    const afternoonRes = parseQuickTaskInput('Check code reviews');
    expect(afternoonRes.timeBlock).toBe('afternoon');

    // 8:00 PM -> evening
    vi.setSystemTime(new Date(2026, 9, 8, 20, 0, 0));
    const eveningRes = parseQuickTaskInput('Read chapter 4');
    expect(eveningRes.timeBlock).toBe('evening');
  });

  it('extracts slash tokens for priority, duration, timeblock, and focus status', () => {
    const result = parseQuickTaskInput('Write Q4 architecture RFC /urgent /50m /afternoon /focus');
    expect(result).toEqual({
      title: 'Write Q4 architecture RFC',
      dueDate: '2026-10-08',
      isTodayFocus: true,
      timeBlock: 'afternoon',
      priority: 'high',
      estimatedMinutes: 50,
      tags: ['Quick Capture'],
    });
  });

  it('schedules for tomorrow and clears isTodayFocus when /tomorrow is used', () => {
    const result = parseQuickTaskInput('Deploy backend release /focus /tomorrow');
    expect(result.title).toBe('Deploy backend release');
    expect(result.dueDate).toBe('2026-10-09');
    expect(result.isTodayFocus).toBe(false);
  });

  it('calculates the upcoming Monday date for /next-week', () => {
    // Oct 8, 2026 is a Thursday (getDay() = 4). Next Monday is Oct 12, 2026.
    const result = parseQuickTaskInput('Plan sprint retros /next-week');
    expect(result.dueDate).toBe('2026-10-12');
    expect(result.isTodayFocus).toBe(false);
  });

  it('supports natural words like "urgent", "tonight", and minutes pattern "45 mins"', () => {
    const result = parseQuickTaskInput('Fix critical auth bug urgent tonight 45 mins');
    expect(result.title).toBe('Fix critical auth bug');
    expect(result.priority).toBe('high');
    expect(result.timeBlock).toBe('evening');
    expect(result.estimatedMinutes).toBe(45);
  });

  it('handles /low priority and custom sprint duration cleanly', () => {
    const result = parseQuickTaskInput('Clean download folder /low /15m');
    expect(result.title).toBe('Clean download folder');
    expect(result.priority).toBe('low');
    expect(result.estimatedMinutes).toBe(15);
  });
});

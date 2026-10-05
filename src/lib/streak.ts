/**
 * Utilities for calculating authentic habit and user activity streaks.
 */

/**
 * Returns the local date formatted as YYYY-MM-DD
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Given a date string YYYY-MM-DD, returns the date string for `offsetDays` relative to it.
 * e.g. getDateWithOffset('2026-10-05', -1) -> '2026-10-04'
 */
export function getDateWithOffset(baseDateStr: string, offsetDays: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateString(date);
}

/**
 * Calculates the current consecutive active streak from a list of completion date strings (YYYY-MM-DD).
 * 
 * Rules:
 * - If completed today: streak starts at 1 and counts backwards continuously through yesterday, 2 days ago, etc.
 * - If not completed today, but completed yesterday: streak starts at 1 (yesterday) and counts backwards.
 *   (The user has the rest of today to extend the streak without losing it).
 * - If neither today nor yesterday was completed: streak is 0.
 */
export function calculateConsecutiveStreak(completedDates: string[], freezeShieldsRemaining = 0): number {
  if (!completedDates || completedDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(
    completedDates.map((d) => (d ? d.split('T')[0] : '')).filter(Boolean)
  );

  const todayStr = getLocalDateString();
  const yesterdayStr = getDateWithOffset(todayStr, -1);

  let currentStreak = 0;
  let cursorDateStr: string;

  if (dateSet.has(todayStr)) {
    currentStreak = 1;
    cursorDateStr = yesterdayStr;
  } else if (dateSet.has(yesterdayStr)) {
    currentStreak = 1;
    cursorDateStr = getDateWithOffset(yesterdayStr, -1);
  } else {
    // Neither today nor yesterday was completed -> streak broken
    return 0;
  }

  // Count backwards from cursor
  let shieldsUsed = 0;
  while (true) {
    if (dateSet.has(cursorDateStr)) {
      currentStreak++;
      cursorDateStr = getDateWithOffset(cursorDateStr, -1);
    } else if (freezeShieldsRemaining > shieldsUsed) {
      // Consume a freeze shield to bridge 1 missed day
      shieldsUsed++;
      cursorDateStr = getDateWithOffset(cursorDateStr, -1);
    } else {
      break;
    }
  }

  return currentStreak;
}

/**
 * Calculates the global user streak across all core productivity activities
 * (habits, focus sessions, and completed tasks).
 */
export function calculateGlobalActivityStreak(
  habitDates: string[] = [],
  focusSessionDates: string[] = [],
  taskCompletedDates: string[] = []
): number {
  const allActiveDates = new Set<string>();

  for (const d of habitDates) {
    if (d) allActiveDates.add(d.split('T')[0]);
  }
  for (const d of focusSessionDates) {
    if (d) allActiveDates.add(d.split('T')[0]);
  }
  for (const d of taskCompletedDates) {
    if (d) allActiveDates.add(d.split('T')[0]);
  }

  return calculateConsecutiveStreak(Array.from(allActiveDates));
}

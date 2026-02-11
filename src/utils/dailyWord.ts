import { getCurrentDate, getTodayString } from './fakeDate';

const START_DATE = new Date(2026, 1, 15); // Feb 15, 2026 (month is 0-indexed)

const DAILY_WORDS = ['LMFAO', 'GUCCI', 'SLEEP', 'YANNO', 'WANGE'];
const PUZZLE_NUMBERS = [321, 819, 902, 918, 1002];

export const TOTAL_ORIGINAL_DAYS = DAILY_WORDS.length; // 5 days

export type DailyWordInfo = {
  word: string;
  puzzleNumber: number;
  date: Date;
  dayIndex: number;
};

export function getDailyWord(playCount: number): DailyWordInfo | null {
  // If beyond the original 5 days, we don't return a standard word automatically
  // The system should use findFirstIncompleteDate instead
  if (playCount >= TOTAL_ORIGINAL_DAYS) {
    return null;
  }

  // Calculate which day in the cycle
  const dayIndex = playCount;

  // Get the word and puzzle number for this day
  const word = DAILY_WORDS[dayIndex];
  const puzzleNumber = PUZZLE_NUMBERS[dayIndex];

  // Calculate the date: start from Feb 15, 2026 and add playCount days
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + playCount);

  return {
    word,
    puzzleNumber,
    date,
    dayIndex
  };
}

/**
 * Get the date string for a specific play count (0-indexed offset from START_DATE)
 */
export function getDateStrFromOffset(offset: number): string {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the display date string for a given play count
 */
export function getDisplayDate(playCount: number): string {
  const info = getDailyWord(playCount);
  if (!info) {
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + playCount);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return info.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get the puzzle number string formatted as "No. 0321"
 */
export function getPuzzleNumberString(playCount: number): string {
  const info = getDailyWord(playCount);
  const puzzleNumber = info ? info.puzzleNumber : 1000 + playCount; // Use a fallback for replay days if needed
  return `No. ${String(puzzleNumber).padStart(4, '0')}`;
}

/**
 * Calculate the play count from a date string
 * Returns the number of days between START_DATE and the given date
 * Handles timezone issues by parsing string as local date
 */
export function getPlayCountFromDate(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const targetDate = new Date(year, month, day);

  // Create a clean version of START_DATE at midnight local
  const start = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());

  const timeDiff = targetDate.getTime() - start.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
}

/**
 * Get the daily word and puzzle info for a specific date
 */
export function getDailyWordForDate(dateStr: string): DailyWordInfo | null {
  const playCount = getPlayCountFromDate(dateStr);
  return getDailyWord(playCount);
}

/**
 * Get today's date as a YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  return getTodayString();
}

/**
 * Get today's daily word info
 */
export function getTodayDailyWord(): DailyWordInfo {
  const todayStr = getTodayDateString();
  const info = getDailyWordForDate(todayStr);
  if (!info) {
    // This shouldn't happen if called correctly, but we need to satisfy TS
    return {
      word: '',
      puzzleNumber: 0,
      date: getCurrentDate(),
      dayIndex: -1
    };
  }
  return info;
}

/**
 * Check if a date is playable (not in the future and not before start date)
 */
export function isDatePlayable(dateStr: string): boolean {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const startDate = new Date(START_DATE);
  startDate.setHours(0, 0, 0, 0);

  return date >= startDate && date <= today;
}

/**
 * Check if the game has started (current date is on or after Feb 15, 2026)
 */
export function hasGameStarted(): boolean {
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(START_DATE);
  startDate.setHours(0, 0, 0, 0);

  return today >= startDate;
}


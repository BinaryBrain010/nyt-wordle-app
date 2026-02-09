const START_DATE = new Date(2026, 1, 15); // Feb 15, 2026 (month is 0-indexed)

const DAILY_WORDS = ['LMFAO', 'GUCCI', 'SLEEP', 'YANNO', 'WANGE'];
const PUZZLE_NUMBERS = [321, 819, 902, 918, 1002];

export type DailyWordInfo = {
  word: string;
  puzzleNumber: number;
  date: Date;
  dayIndex: number;
};

/**
 * Get the daily word and puzzle number based on play count
 * Play count 0 = first day (Feb 15), play count 1 = second day (Feb 16), etc.
 * The cycle loops every 5 days
 */
export function getDailyWord(playCount: number): DailyWordInfo {
  // Calculate which day in the cycle (0-4, then loops)
  const dayIndex = playCount % DAILY_WORDS.length;

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
 * Get the display date string for a given play count
 */
export function getDisplayDate(playCount: number): string {
  const { date } = getDailyWord(playCount);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get the puzzle number string formatted as "No. 0321"
 */
export function getPuzzleNumberString(playCount: number): string {
  const { puzzleNumber } = getDailyWord(playCount);
  return `No. ${String(puzzleNumber).padStart(4, '0')}`;
}

/**
 * Calculate the play count from a date string
 * Returns the number of days between START_DATE and the given date
 */
export function getPlayCountFromDate(dateStr: string): number {
  const targetDate = new Date(dateStr);
  const timeDiff = targetDate.getTime() - START_DATE.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
}

/**
 * Get the daily word and puzzle info for a specific date
 */
export function getDailyWordForDate(dateStr: string): DailyWordInfo {
  const playCount = getPlayCountFromDate(dateStr);
  return getDailyWord(playCount);
}

/**
 * Get today's date as a YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get today's daily word info
 */
export function getTodayDailyWord(): DailyWordInfo {
  const todayStr = getTodayDateString();
  return getDailyWordForDate(todayStr);
}

/**
 * Check if a date is playable (not in the future and not before start date)
 */
export function isDatePlayable(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(START_DATE);
  startDate.setHours(0, 0, 0, 0);

  return today >= startDate;
}

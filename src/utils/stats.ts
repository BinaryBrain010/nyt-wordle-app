import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './users';
import { getCurrentDate, getCurrentTimestamp, getTodayString } from './fakeDate';

export type GameStats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
};

export type GameResult = 'win' | 'lose';

export type CalendarHistory = {
  [date: string]: GameResult; // date format: 'YYYY-MM-DD'
};

export type CompetitionStatus = {
  isCompleted: boolean;
  incompleteIndices: number[]; // Index 0-4
  firstIncompleteOffset: number | null;
};

/**
 * Get storage keys for the current user
 * Throws error if no user is set
 */
async function getStorageKeys(): Promise<{ playCountKey: string; statsKey: string; historyKey: string }> {
  const username = await getCurrentUser();
  if (!username) {
    throw new Error('No user is set. Please enter a username first.');
  }
  return {
    playCountKey: `@wordle/playCount_${username}`,
    statsKey: `@wordle/stats_${username}`,
    historyKey: `@wordle/history_${username}`
  };
}

export async function getPlayCount(): Promise<number> {
  const { playCountKey } = await getStorageKeys();
  const raw = await AsyncStorage.getItem(playCountKey);
  return parseInt(raw ?? '0', 10) || 0;
}

export async function incrementPlayCount(): Promise<number> {
  const count = await getPlayCount();
  const next = count + 1;
  const { playCountKey } = await getStorageKeys();
  await AsyncStorage.setItem(playCountKey, String(next));
  return next;
}

export async function getStats(): Promise<Omit<GameStats, 'played'>> {
  try {
    const { statsKey } = await getStorageKeys();
    const raw = await AsyncStorage.getItem(statsKey);
    if (!raw) return { wins: 0, currentStreak: 0, maxStreak: 0 };
    const parsed = JSON.parse(raw) as Omit<GameStats, 'played'>;
    return {
      wins: parsed.wins ?? 0,
      currentStreak: parsed.currentStreak ?? 0,
      maxStreak: parsed.maxStreak ?? 0
    };
  } catch {
    return { wins: 0, currentStreak: 0, maxStreak: 0 };
  }
}

export async function saveStats(stats: Omit<GameStats, 'played'>): Promise<void> {
  const { statsKey } = await getStorageKeys();
  await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
}

export async function getFullStats(): Promise<GameStats> {
  const [played, rest] = await Promise.all([getPlayCount(), getStats()]);
  return { played, ...rest };
}

export async function updateStatsAfterGame(
  outcome: 'win' | 'lose',
  playedCount: number,
  gameDate?: string // Optional date in 'YYYY-MM-DD' format
): Promise<GameStats> {
  const stats = await getStats();
  const wins = stats.wins + (outcome === 'win' ? 1 : 0);
  const currentStreak = outcome === 'win' ? stats.currentStreak + 1 : 0;
  const maxStreak = Math.max(stats.maxStreak, currentStreak);
  await saveStats({ wins, currentStreak, maxStreak });

  // Save to calendar history
  const date = gameDate || getTodayString();
  await saveGameToHistory(date, outcome);

  // Requirement 2b: Ensure synchronization between replay dates and original dates
  const todayStr = getTodayString();

  // 1. If we are playing a replay date (e.g. Feb 20), update the original date (e.g. Feb 15)
  const linkedOriginalDate = await getReplayLink(date);
  if (linkedOriginalDate) {
    if (outcome === 'win') {
      await saveGameToHistory(linkedOriginalDate, 'win');
    } else {
      await saveLostGameTimestamp(date);
    }
  }

  // 2. If we are playing an original date (e.g. Feb 15) using the calendar, 
  // and today (e.g. Feb 20) is supposed to be replaying that date, update today too
  if (date !== todayStr) {
    const todayTargetDate = await getReplayLink(todayStr);
    if (todayTargetDate === date) {
      if (outcome === 'win') {
        await saveGameToHistory(todayStr, 'win');
      } else {
        await saveLostGameTimestamp(todayStr);
      }
    }
  }

  return {
    played: playedCount,
    wins,
    currentStreak,
    maxStreak
  };
}

/**
 * Get calendar history for the current user
 */
export async function getCalendarHistory(): Promise<CalendarHistory> {
  try {
    const { historyKey } = await getStorageKeys();
    const raw = await AsyncStorage.getItem(historyKey);
    if (!raw) return {};
    return JSON.parse(raw) as CalendarHistory;
  } catch {
    return {};
  }
}

/**
 * Save a game result to calendar history
 */
export async function saveGameToHistory(date: string, result: GameResult): Promise<void> {
  const { historyKey } = await getStorageKeys();
  const history = await getCalendarHistory();
  history[date] = result;
  await AsyncStorage.setItem(historyKey, JSON.stringify(history));
}

/**
 * Check if today's puzzle has been played
 * Returns true if the user has already played the puzzle for today's date
 */
export async function hasPlayedCurrentPuzzle(): Promise<boolean> {
  try {
    const history = await getCalendarHistory();

    // Get today's date
    const todayStr = getTodayString();

    // Check if today's date exists in history
    return todayStr in history;
  } catch {
    return false;
  }
}

/**
 * Save guesses for a specific date
 */
export async function saveGuessesForDate(date: string, guesses: string[]): Promise<void> {
  const username = await getCurrentUser();
  if (!username) throw new Error('No user is set');

  const key = `@wordle/guesses_${username}_${date}`;
  await AsyncStorage.setItem(key, JSON.stringify(guesses));
}

/**
 * Get guesses for a specific date
 */
export async function getGuessesForDate(date: string): Promise<string[] | null> {
  try {
    const username = await getCurrentUser();
    if (!username) return null;

    const key = `@wordle/guesses_${username}_${date}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

/**
 * Get the result for a specific date
 */
export async function getResultForDate(date: string): Promise<GameResult | null> {
  try {
    const history = await getCalendarHistory();
    return history[date] || null;
  } catch {
    return null;
  }
}

/**
 * Save the timestamp when a game was played for a specific date
 */
export async function saveLostGameTimestamp(date: string): Promise<void> {
  try {
    const username = await getCurrentUser();
    if (!username) return;

    const key = `@wordle/lost_timestamp_${username}_${date}`;
    const timestamp = getCurrentTimestamp().toString();
    await AsyncStorage.setItem(key, timestamp);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if a lost game can be replayed (must wait until next day/midnight)
 */
export async function isDateAlreadyPlayed(date: string): Promise<boolean> {
  try {
    const history = await getCalendarHistory();
    return date in history;
  } catch {
    return false;
  }
}

/**
 * Update only the game result for a replay (no stats change)
 * This is used when replaying a lost game - we only update the result in history
 * without incrementing play count or changing other stats
 */
export async function updateReplayResult(
  date: string,
  outcome: 'win' | 'lose',
  guesses: string[]
): Promise<GameStats> {
  // Save the new guesses
  await saveGuessesForDate(date, guesses);

  // Update the history with new result
  await saveGameToHistory(date, outcome);

  // If still losing, save the timestamp for lock mechanism
  if (outcome === 'lose') {
    await saveLostGameTimestamp(date);
  }

  // Return current stats without modification
  return await getFullStats();
}

export async function canReplayLostGame(date: string): Promise<{ canReplay: boolean; timeRemaining?: number }> {
  try {
    const username = await getCurrentUser();
    if (!username) return { canReplay: true };

    const key = `@wordle/lost_timestamp_${username}_${date}`;
    const timestampStr = await AsyncStorage.getItem(key);

    if (!timestampStr) {
      // No timestamp found, allow replay
      return { canReplay: true };
    }

    // Get today's date
    const now = getCurrentDate();

    // Create 'today' at 00:00:00 in current game time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Parse the timestamp of the last loss
    const lastAttemptTime = parseInt(timestampStr, 10);
    const lastAttempt = new Date(lastAttemptTime);

    // Create 'lastAttemptDay' at 00:00:00
    const lastAttemptDay = new Date(lastAttempt.getFullYear(), lastAttempt.getMonth(), lastAttempt.getDate(), 0, 0, 0, 0);

    // Check if today is at least one day after the last attempt
    const diffMs = today.getTime() - lastAttemptDay.getTime();

    if (diffMs >= 86400000) {
      // It's at least the next day since the last attempt, allow replay
      return { canReplay: true };
    } else {
      // Still the same day as the last attempt, calculate time until midnight
      const nextMidnight = new Date(today);
      nextMidnight.setDate(today.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);

      const timeRemaining = nextMidnight.getTime() - now.getTime();

      // If timeRemaining is exactly 24 hours (86400000 ms), it means now is exactly at 00:00:00
      // but the rounding or comparison logic hasn't flipped the day yet.
      // We return a slightly positive value to avoid showing "24h 0m"
      return { canReplay: false, timeRemaining: timeRemaining >= 86400000 ? 86399999 : Math.max(0, timeRemaining) };
    }
  } catch {
    return { canReplay: true };
  }
}
export async function getCompetitionStatus(): Promise<CompetitionStatus> {
  const history = await getCalendarHistory();
  const incompleteIndices: number[] = [];

  const { TOTAL_ORIGINAL_DAYS, getDateStrFromOffset } = require('./dailyWord');

  for (let i = 0; i < TOTAL_ORIGINAL_DAYS; i++) {
    const dateStr = getDateStrFromOffset(i);
    if (history[dateStr] !== 'win') {
      incompleteIndices.push(i);
    }
  }

  return {
    isCompleted: incompleteIndices.length === 0,
    incompleteIndices,
    firstIncompleteOffset: incompleteIndices.length > 0 ? incompleteIndices[0] : null
  };
}

/**
 * Save a link between a replay date (e.g. Feb 20) and the original date (e.g. Feb 15)
 */
export async function saveReplayLink(replayDate: string, originalDate: string): Promise<void> {
  const username = await getCurrentUser();
  if (!username) return;
  const key = `@wordle/replay_link_${username}_${replayDate}`;
  await AsyncStorage.setItem(key, originalDate);
}

/**
 * Get the original date associated with a replay date
 */
export async function getReplayLink(replayDate: string): Promise<string | null> {
  const username = await getCurrentUser();
  if (!username) return null;
  const key = `@wordle/replay_link_${username}_${replayDate}`;
  return await AsyncStorage.getItem(key);
}

/**
 * Check if a date is within the original 5 days (Feb 15 - Feb 19)
 */
export function isOriginalDate(dateStr: string): boolean {
  const { getPlayCountFromDate } = require('./dailyWord');
  const playCount = getPlayCountFromDate(dateStr);
  return playCount >= 0 && playCount < 5;
}

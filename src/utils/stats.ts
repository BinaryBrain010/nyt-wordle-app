import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './users';

export type GameStats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
};

/**
 * Get storage keys for the current user
 * Throws error if no user is set
 */
async function getStorageKeys(): Promise<{ playCountKey: string; statsKey: string }> {
  const username = await getCurrentUser();
  if (!username) {
    throw new Error('No user is set. Please enter a username first.');
  }
  return {
    playCountKey: `@wordle/playCount_${username}`,
    statsKey: `@wordle/stats_${username}`
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
  playedCount: number
): Promise<GameStats> {
  const stats = await getStats();
  const wins = stats.wins + (outcome === 'win' ? 1 : 0);
  const currentStreak = outcome === 'win' ? stats.currentStreak + 1 : 0;
  const maxStreak = Math.max(stats.maxStreak, currentStreak);
  await saveStats({ wins, currentStreak, maxStreak });
  return {
    played: playedCount,
    wins,
    currentStreak,
    maxStreak
  };
}

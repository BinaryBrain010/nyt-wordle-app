import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_COUNT_KEY = '@wordle/playCount';
const STATS_KEY = '@wordle/stats';

export type GameStats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
};

export async function getPlayCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(PLAY_COUNT_KEY);
  return parseInt(raw ?? '0', 10) || 0;
}

export async function incrementPlayCount(): Promise<number> {
  const count = await getPlayCount();
  const next = count + 1;
  await AsyncStorage.setItem(PLAY_COUNT_KEY, String(next));
  return next;
}

export async function getStats(): Promise<Omit<GameStats, 'played'>> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
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
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
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

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import {
  getFullStats,
  getPlayCount,
  incrementPlayCount,
  updateStatsAfterGame,
  saveGuessesForDate,
  saveLostGameTimestamp,
  isDateAlreadyPlayed,
  updateReplayResult,
  type GameStats
} from '../utils/stats';
import { getDailyWord } from '../utils/dailyWord';
import { Confetti } from '../components/Confetti';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
    paddingVertical: 8
  },
  backText: { fontWeight: '600', color: colors.text },
  backX: { fontSize: 18, fontWeight: '700', color: colors.text },
  iconWrap: { alignItems: 'center', marginBottom: 12 },
  starBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center'
  },
  star: { fontSize: 32, color: '#FFFFFF' },
  crossBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.loseCross,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cross: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '700',
    marginBottom: 20
  },
  statsSection: { marginTop: 8 },
  statsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedText,
    textAlign: 'center'
  },
  backButton: {
    marginTop: 28,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.tileBorder,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  backButtonText: { color: colors.text, fontWeight: '600' }
});


export function ResultScreen({ navigation, route }: Props) {
  const { outcome, guessesUsed, guesses, solution, fromFinishedPuzzle, gameDate: routeGameDate } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState<GameStats | null>(null);
  const updated = useRef(false);

  useEffect(() => {
    if (fromFinishedPuzzle) {
      getFullStats().then(setStats);
      return;
    }
    if (updated.current) return;
    updated.current = true;
    (async () => {
      // Use gameDate from route if provided, otherwise calculate from current play count
      let gameDate: string;
      if (routeGameDate) {
        gameDate = routeGameDate;
      } else {
        const currentPlayCount = await getPlayCount();
        const dailyWord = getDailyWord(currentPlayCount);
        if (!dailyWord) return;
        const d = dailyWord.date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        gameDate = `${year}-${month}-${day}`;
      }

      // Check if this is a replay (date already exists in history)
      const isReplay = await isDateAlreadyPlayed(gameDate);

      if (isReplay) {
        // This is a REPLAY - only update the result, not stats
        // This prevents play count and win stats from being inflated
        const currentStats = await updateReplayResult(gameDate, outcome, guesses ?? []);
        setStats(currentStats);
      } else {
        // This is a FIRST-TIME play - update everything normally
        // Save the guesses for this date
        await saveGuessesForDate(gameDate, guesses ?? []);

        // If the user lost, save the timestamp for replay lock
        if (outcome === 'lose') {
          await saveLostGameTimestamp(gameDate);
        }

        const playedCount = await incrementPlayCount();
        const fullStats = await updateStatsAfterGame(outcome, playedCount, gameDate);
        setStats(fullStats);
      }
    })();
  }, [outcome, fromFinishedPuzzle, guesses, routeGameDate]);

  const title = useMemo(() => {
    if (outcome === 'win') return 'Congratulations!';
    return 'Thanks for playing!';
  }, [outcome]);

  const subtitle = useMemo(() => {
    if (outcome === 'win') return `You solved it in ${guessesUsed} guesses.`;
    return "You're out of guesses.";
  }, [outcome, guessesUsed]);

  const winPct =
    stats && stats.played > 0 ? Math.round((100 * stats.wins) / stats.played) : 0;

  const topPad = insets.top + 10;
  const horPad = Math.max(16, Math.min(28, width * 0.065));

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPad,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: horPad
        }
      ]}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {outcome === 'win' && !fromFinishedPuzzle && <Confetti />}

        <Pressable
          style={styles.backRow}
          onPress={() => {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
          accessibilityLabel="Back to home"
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { fontSize: width < 360 ? 14 : 16 }]}>
            Back to home
          </Text>
          <Text style={styles.backX}>✕</Text>
        </Pressable>

        <View style={styles.iconWrap}>
          {outcome === 'win' ? (
            <View style={styles.starBg}>
              <Text style={styles.star}>★</Text>
            </View>
          ) : (
            <View style={styles.crossBg}>
              <Text style={styles.cross}>✕</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, { fontSize: width < 360 ? 22 : 26 }]}>{title}</Text>
        <Text style={[styles.subtitle, { fontSize: width < 360 ? 14 : 16 }]}>{subtitle}</Text>

        {outcome === 'lose' && (
          <Text style={[styles.note, { fontSize: width < 360 ? 12 : 14 }]}>Game will reset in 24 hours.</Text>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.statsHeader}>STATISTICS</Text>
          <View style={[styles.statsRow, { gap: width < 360 ? 4 : 8 }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: width < 360 ? 18 : 20 }]}>{stats?.played ?? '—'}</Text>
              <Text style={styles.statLabel}>Played</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: width < 360 ? 18 : 20 }]}>{stats ? winPct : '—'}</Text>
              <Text style={styles.statLabel}>Win %</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: width < 360 ? 18 : 20 }]}>{stats?.currentStreak ?? '—'}</Text>
              <Text style={styles.statLabel}>Current{`\n`}Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { fontSize: width < 360 ? 18 : 20 }]}>{stats?.maxStreak ?? '—'}</Text>
              <Text style={styles.statLabel}>Max{`\n`}Streak</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          <Text style={[styles.backButtonText, { fontSize: width < 360 ? 14 : 16 }]}>
            Back to home
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

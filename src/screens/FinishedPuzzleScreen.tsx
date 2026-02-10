import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FinishedPuzzle'>;

type TileState = 'correct' | 'present' | 'absent' | 'empty';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const TILE_MIN = 44;
const TILE_MAX = 64;

function evaluateGuess(guess: string, solution: string): TileState[] {
  const g = guess.toUpperCase();
  const s = solution.toUpperCase();
  const result: TileState[] = Array.from({ length: WORD_LENGTH }, () => 'absent');
  const sChars = s.split('');
  const used = Array.from({ length: WORD_LENGTH }, () => false);
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === sChars[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const idx = sChars.findIndex((ch, j) => !used[j] && ch === g[i]);
    if (idx >= 0) {
      used[idx] = true;
      result[i] = 'present';
    }
  }
  return result;
}

export function FinishedPuzzleScreen({ navigation, route }: Props) {
  const { outcome, guessesUsed, guesses = [], solution = '' } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const paddingH = Math.max(16, Math.min(24, width * 0.06));
  const tileSize = useMemo(
    () =>
      Math.min(
        TILE_MAX,
        Math.max(TILE_MIN, (width - 2 * paddingH - 4 * 5) / 5)
      ),
    [width, paddingH]
  );
  const tileFontSize = useMemo(
    () => Math.min(24, Math.max(16, Math.round(tileSize * 0.42))),
    [tileSize]
  );

  const evaluations = useMemo(() => {
    return guesses.map((g) => evaluateGuess(g, solution));
  }, [guesses, solution]);

  const allRows = useMemo(() => {
    const rows: string[] = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      rows.push(guesses[i] ?? '');
    }
    return rows;
  }, [guesses]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: paddingH
        }
      ]}
    >
      <View style={styles.grid}>
        {allRows.map((row, r) => {
          const letters = row.padEnd(WORD_LENGTH, ' ').slice(0, WORD_LENGTH).split('');
          const rowEval = evaluations[r];
          return (
            <View key={r} style={styles.row}>
              {letters.map((ch, c) => {
                const tileState: TileState = rowEval ? rowEval[c] : 'empty';
                const isFilled = tileState !== 'empty';
                return (
                  <View
                    key={c}
                    style={[
                      styles.tile,
                      { width: tileSize, height: tileSize, margin: 2 },
                      tileState === 'correct'
                        ? styles.tileCorrect
                        : tileState === 'present'
                          ? styles.tilePresent
                          : tileState === 'absent'
                            ? styles.tileAbsent
                            : undefined
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileText,
                        { fontSize: tileFontSize },
                        isFilled && styles.tileTextFilled
                      ]}
                    >
                      {ch === ' ' ? '' : ch}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.replace('Result', {
            outcome,
            guessesUsed,
            guesses,
            solution,
            fromFinishedPuzzle: true
          })
        }
      >
        <Text style={styles.buttonText}>See results</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center'
  },
  grid: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tile: {
    borderWidth: 2,
    borderColor: colors.tileBorder,
    backgroundColor: colors.tileEmpty,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tileText: {
    fontWeight: '700',
    color: colors.text
  },
  tileTextFilled: {
    color: '#FFFFFF'
  },
  tileCorrect: {
    backgroundColor: colors.correct,
    borderColor: colors.correct
  },
  tilePresent: {
    backgroundColor: colors.present,
    borderColor: colors.present
  },
  tileAbsent: {
    backgroundColor: colors.absent,
    borderColor: colors.absent
  },
  button: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12
  },
  buttonText: { color: colors.text, fontWeight: '600' }
});

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type KeyState = 'correct' | 'present' | 'absent' | 'unused';

type TileState = 'correct' | 'present' | 'absent' | 'empty';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
] as const;

export function GameScreen({ navigation }: Props) {
  const solution = 'CLIFF';

  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');

  const activeGuessIndex = guesses.length;

  const allRows = useMemo(() => {
    const rows: string[] = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      if (i < guesses.length) rows.push(guesses[i]);
      else if (i === activeGuessIndex) rows.push(current);
      else rows.push('');
    }
    return rows;
  }, [activeGuessIndex, current, guesses]);

  const evaluateGuess = useCallback(
    (guess: string): TileState[] => {
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
    },
    [solution]
  );

  const evaluations = useMemo(() => {
    return guesses.map((g: string) => evaluateGuess(g));
  }, [evaluateGuess, guesses]);

  const keyStates = useMemo(() => {
    const map: Record<string, KeyState> = {};

    const rank = (state: KeyState) => {
      if (state === 'correct') return 3;
      if (state === 'present') return 2;
      if (state === 'absent') return 1;
      return 0;
    };

    const upgrade = (key: string, next: KeyState) => {
      const prev = map[key] ?? 'unused';
      map[key] = rank(next) > rank(prev) ? next : prev;
    };

    guesses.forEach((g: string, rowIdx: number) => {
      const evalRow = evaluations[rowIdx];
      g.split('').forEach((ch: string, i: number) => {
        const state = evalRow[i];
        upgrade(
          ch,
          state === 'correct' ? 'correct' : state === 'present' ? 'present' : 'absent'
        );
      });
    });

    return map;
  }, [evaluations, guesses]);

  const onKeyPress = useCallback(
    (key: string) => {
      if (guesses.length >= MAX_GUESSES) return;

      if (key === 'ENTER') {
        if (current.length !== WORD_LENGTH) return;

        const nextGuesses = [...guesses, current.toUpperCase()];
        setGuesses(nextGuesses);
        setCurrent('');

        const won = current.toUpperCase() === solution.toUpperCase();
        if (won) {
          navigation.replace('Result', { outcome: 'win', guessesUsed: nextGuesses.length });
          return;
        }

        if (nextGuesses.length >= MAX_GUESSES) {
          navigation.replace('Result', { outcome: 'lose', guessesUsed: MAX_GUESSES });
          return;
        }

        return;
      }

      if (key === '⌫') {
        setCurrent((prev: string) => prev.slice(0, -1));
        return;
      }

      if (current.length >= WORD_LENGTH) return;
      if (!/^[A-Z]$/.test(key)) return;

      setCurrent((prev: string) => (prev + key).toUpperCase());
    },
    [current, guesses, navigation, solution]
  );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {allRows.map((row: string, r: number) => {
          const rowLetters = row.padEnd(WORD_LENGTH, ' ').slice(0, WORD_LENGTH).split('');
          const rowEval = r < guesses.length ? evaluations[r] : undefined;

          return (
            <View key={r} style={styles.row}>
              {rowLetters.map((ch: string, c: number) => {
                const tileState: TileState = rowEval ? rowEval[c] : ch === ' ' ? 'empty' : 'empty';
                return (
                  <View
                    key={c}
                    style={[
                      styles.tile,
                      tileState === 'correct'
                        ? styles.tileCorrect
                        : tileState === 'present'
                          ? styles.tilePresent
                          : tileState === 'absent'
                            ? styles.tileAbsent
                            : styles.tileEmpty
                    ]}
                  >
                    <Text style={styles.tileText}>{ch === ' ' ? '' : ch}</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={styles.keyboard}>
        {KEYBOARD_ROWS.map((row, i) => (
          <View key={i} style={styles.keyboardRow}>
            {row.map((key) => {
              const state = keyStates[key] ?? 'unused';
              const isWide = key === 'ENTER' || key === '⌫';
              return (
                <Pressable
                  key={key}
                  onPress={() => onKeyPress(key)}
                  style={[
                    styles.key,
                    isWide ? styles.keyWide : undefined,
                    state === 'correct'
                      ? styles.keyCorrect
                      : state === 'present'
                        ? styles.keyPresent
                        : state === 'absent'
                          ? styles.keyAbsent
                          : styles.keyUnused
                  ]}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const TILE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 14,
    paddingHorizontal: 12
  },
  grid: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row'
  },
  tile: {
    width: TILE,
    height: TILE,
    margin: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tileEmpty: {
    borderColor: colors.tileBorder,
    backgroundColor: colors.tileEmpty
  },
  tileCorrect: {
    borderColor: colors.correct,
    backgroundColor: colors.correct
  },
  tilePresent: {
    borderColor: colors.present,
    backgroundColor: colors.present
  },
  tileAbsent: {
    borderColor: colors.absent,
    backgroundColor: colors.absent
  },
  tileText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text
  },
  keyboard: {
    marginTop: 'auto',
    paddingBottom: 12
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8
  },
  key: {
    height: 44,
    minWidth: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyWide: {
    minWidth: 64
  },
  keyUnused: {
    backgroundColor: '#D1D5DB'
  },
  keyAbsent: {
    backgroundColor: colors.absent
  },
  keyPresent: {
    backgroundColor: colors.present
  },
  keyCorrect: {
    backgroundColor: colors.correct
  },
  keyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827'
  }
});

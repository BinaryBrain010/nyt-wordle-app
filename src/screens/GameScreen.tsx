import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
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
import { getPlayCount, saveGuessesForDate, getReplayLink } from '../utils/stats';
import { getDailyWord, getDailyWordForDate, getPlayCountFromDate, getTodayDateString } from '../utils/dailyWord';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type KeyState = 'correct' | 'present' | 'absent' | 'unused';

type TileState = 'correct' | 'present' | 'absent' | 'empty';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
] as const;

const TILE_GAP = 5;
const TILE_MIN = 48;
const TILE_MAX = 68;
const KEY_GAP = 5;
const KEY_HEIGHT = 48;
const KEY_MIN = 28;
const KEY_WIDE_MIN = 44;

export function GameScreen({ navigation, route }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [playCount, setPlayCount] = useState(0);
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameDate, setGameDate] = useState<string>('');

  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLoseOverlay, setShowLoseOverlay] = useState(false);
  const [showWinDelay, setShowWinDelay] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Load play count and set solution word
  useEffect(() => {
    const loadGameData = async () => {
      const dateToPlay = route.params?.dateToPlay || getTodayDateString();

      // Check for replay mapping (Requirement 2b)
      const linkedOriginalDate = await getReplayLink(dateToPlay);
      const effectiveDate = linkedOriginalDate || dateToPlay;

      const dailyWord = getDailyWordForDate(effectiveDate);
      const calculatedPlayCount = getPlayCountFromDate(dateToPlay);

      setPlayCount(calculatedPlayCount);
      if (dailyWord) {
        setSolution(dailyWord.word);
      }
      setGameDate(dateToPlay);
      setIsLoading(false);
    };

    loadGameData();
  }, [route.params?.dateToPlay]);

  const paddingH = Math.max(16, Math.min(24, width * 0.05));
  const tileSize = Math.min(
    TILE_MAX,
    Math.max(TILE_MIN, (width - 2 * paddingH - 4 * TILE_GAP) / 5)
  );
  const keyMinWidth = Math.max(KEY_MIN, (width - 2 * paddingH - 9 * KEY_GAP) / 10);
  const keyWideMinWidth = Math.max(KEY_WIDE_MIN, keyMinWidth * 1.6);

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
      if (!solution) return Array.from({ length: WORD_LENGTH }, () => 'absent');
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
      if (guesses.length >= MAX_GUESSES || showWinDelay) return;

      if (key === 'ENTER') {
        if (current.length !== WORD_LENGTH) return;

        const nextGuesses = [...guesses, current.toUpperCase()];
        setGuesses(nextGuesses);
        setCurrent('');

        if (!solution) return;
        const won = current.toUpperCase() === solution.toUpperCase();
        if (won) {
          setShowWinDelay(true);
          return;
        }

        if (nextGuesses.length >= MAX_GUESSES) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setShowLoseOverlay(true);
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
    [current, guesses, navigation, solution, showWinDelay]
  );

  const tileStyle = useMemo(
    () => ({
      width: tileSize,
      height: tileSize,
      margin: TILE_GAP / 2
    }),
    [tileSize]
  );

  const tileFontSize = useMemo(() => Math.min(24, Math.max(16, Math.round(tileSize * 0.42))), [tileSize]);

  const keyStyle = useMemo(
    () => ({
      height: KEY_HEIGHT,
      minWidth: keyMinWidth,
      borderRadius: 6
    }),
    [keyMinWidth]
  );

  const keyWideStyle = useMemo(() => ({ minWidth: keyWideMinWidth }), [keyWideMinWidth]);

  const keyFontSize = useMemo(() => (width < 360 ? 11 : width < 400 ? 12 : 13), [width]);

  useEffect(() => {
    if (!showLoseOverlay) return;
    const seq = Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 2, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true })
    ]);
    shakeAnim.setValue(0);
    seq.start();
    const t = setTimeout(() => {
      navigation.replace('Result', {
        outcome: 'lose',
        guessesUsed: MAX_GUESSES,
        guesses,
        solution: solution ?? undefined,
        gameDate
      });
    }, 1600);
    return () => clearTimeout(t);
  }, [showLoseOverlay, navigation, shakeAnim, guesses, solution, gameDate]);

  // Handle win delay - show correct word in green for 5 seconds
  useEffect(() => {
    if (!showWinDelay) return;
    const t = setTimeout(() => {
      navigation.replace('Result', {
        outcome: 'win',
        guessesUsed: guesses.length,
        guesses,
        solution: solution ?? undefined,
        gameDate
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [showWinDelay, navigation, guesses, solution, gameDate]);

  const shakeX = shakeAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [0, -10, 10, -10, 0]
  });

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) return;
    onKeyPress('ENTER');
  }, [current, onKeyPress]);

  // Don't render game until solution is loaded
  if (isLoading || !solution) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showLoseOverlay && (
        <View style={[styles.loseOverlay, { paddingTop: insets.top + 10 }]} pointerEvents="none">
          <Text style={styles.loseOverlayText}>Oops! Out of guesses</Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            paddingBottom: 10,
            paddingHorizontal: Math.max(insets.left, 10),
            transform: showLoseOverlay ? [{ translateX: shakeX }] : []
          }
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('Home')}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          hitSlop={12}
          accessibilityLabel="Home"
          accessibilityRole="button"
        >
          <Text style={styles.headerIcon}>⌂</Text>
        </Pressable>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={() => setShowInstructions(true)}
          style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}
          hitSlop={12}
          accessibilityLabel="Instructions"
          accessibilityRole="button"
        >
          <Text style={styles.headerIcon}>?</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            paddingHorizontal: paddingH,
            paddingBottom: insets.bottom + 16,
            transform: showLoseOverlay ? [{ translateX: shakeX }] : []
          }
        ]}
      >
        <View style={styles.grid}>
          {allRows.map((row: string, r: number) => {
            const rowLetters = row.padEnd(WORD_LENGTH, ' ').slice(0, WORD_LENGTH).split('');
            const rowEval = r < guesses.length ? evaluations[r] : undefined;

            return (
              <View key={r} style={styles.row}>
                {rowLetters.map((ch: string, c: number) => {
                  const tileState: TileState = rowEval ? rowEval[c] : ch === ' ' ? 'empty' : 'empty';
                  const isFilled = tileState === 'correct' || tileState === 'present' || tileState === 'absent';
                  return (
                    <View
                      key={c}
                      style={[
                        styles.tileBase,
                        tileStyle,
                        tileState === 'correct'
                          ? styles.tileCorrect
                          : tileState === 'present'
                            ? styles.tilePresent
                            : tileState === 'absent'
                              ? styles.tileAbsent
                              : styles.tileEmpty
                      ]}
                    >
                      <Text style={[styles.tileText, { fontSize: tileFontSize }, isFilled && styles.tileTextFilled]}>{ch === ' ' ? '' : ch}</Text>
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
                const isWide = key === '⌫';
                const isSpecial = state === 'correct' || state === 'present' || state === 'absent';
                return (
                  <Pressable
                    key={key}
                    onPress={() => onKeyPress(key)}
                    style={({ pressed }) => [
                      styles.keyBase,
                      keyStyle,
                      isWide && keyWideStyle,
                      state === 'correct'
                        ? styles.keyCorrect
                        : state === 'present'
                          ? styles.keyPresent
                          : state === 'absent'
                            ? styles.keyAbsent
                            : styles.keyUnused,
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <Text style={[styles.keyText, { fontSize: keyFontSize }, isSpecial && styles.keyTextSpecial]}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Pressable
          onPress={submitGuess}
          style={({ pressed }) => [
            styles.submitButton,
            (current.length !== WORD_LENGTH || guesses.length >= MAX_GUESSES) && styles.submitButtonDisabled,
            pressed && current.length === WORD_LENGTH && styles.submitButtonPressed
          ]}
          disabled={current.length !== WORD_LENGTH || guesses.length >= MAX_GUESSES}
          accessibilityLabel="Submit word"
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>SUBMIT WORD</Text>
        </Pressable>
      </Animated.View>

      <Modal
        visible={showInstructions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { padding: width < 360 ? 16 : 24 }]}
          onPress={() => setShowInstructions(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <Text style={styles.modalTitle}>HOW TO PLAY</Text>
              <Text style={styles.modalBody}>Guess the mystery 5 letter word!</Text>
              <Text style={[styles.modalBody, styles.modalBodyLast]}>
                After each guess, the letters will change colour to show how close you were to the correct word:
              </Text>
              <View style={styles.exampleGrid}>
                {[
                  { word: 'CRISP', states: ['absent', 'present', 'absent', 'absent', 'absent'] },
                  { word: 'SHIRT', states: ['absent', 'present', 'absent', 'absent', 'absent'] },
                  { word: 'HAIRS', states: ['correct', 'correct', 'correct', 'correct', 'correct'] }
                ].map((row, r) => (
                  <View key={r} style={styles.exampleRow}>
                    {row.word.split('').map((ch, c) => (
                      <View
                        key={c}
                        style={[
                          styles.exampleCell,
                          { width: Math.min(36, width * 0.09), height: Math.min(36, width * 0.09) },
                          row.states[c] === 'correct'
                            ? styles.exampleCorrect
                            : row.states[c] === 'present'
                              ? styles.examplePresent
                              : styles.exampleAbsent
                        ]}
                      >
                        <Text style={[styles.exampleCellText, { fontSize: width < 360 ? 14 : 18 }]}>{ch}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <Text style={styles.legendItem}>Grey - the letter is not in the word</Text>
              <Text style={styles.legendItem}>Orange - the letter is in the word but in the wrong place</Text>
              <Text style={styles.legendItem}>Green - the letter is correct</Text>
              <Pressable
                onPress={() => setShowInstructions(false)}
                style={({ pressed }) => [styles.tryItButton, pressed && styles.tryItButtonPressed]}
              >
                <Text style={styles.tryItButtonText}>Try It!</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10
  },
  loseOverlayText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.absent,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.tileBorder
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.keyUnused,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonPressed: { opacity: 0.7 },
  headerIcon: { fontSize: 22, fontWeight: '600', color: colors.text },
  headerSpacer: { width: 44 },
  content: {
    flex: 1,
    paddingTop: 12
  },
  grid: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tileBase: {
    borderWidth: 2,
    borderRadius: 6,
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
    fontWeight: '700',
    color: colors.text
  },
  tileTextFilled: {
    color: '#FFFFFF'
  },
  keyboard: {
    marginTop: 'auto',
    paddingHorizontal: 4,
    paddingBottom: 12
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: KEY_GAP,
    marginBottom: 8
  },
  keyBase: {
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyUnused: {
    backgroundColor: colors.keyUnused
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
    fontWeight: '700',
    color: colors.text
  },
  keyTextSpecial: {
    color: '#FFFFFF'
  },
  submitButton: {
    backgroundColor: colors.submitButton,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonPressed: { opacity: 0.9 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '90%'
  },
  modalScroll: {
    padding: 24,
    paddingBottom: 32
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16
  },
  modalBody: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8
  },
  modalBodyLast: { marginBottom: 16 },
  exampleGrid: { alignItems: 'center', marginBottom: 16 },
  exampleRow: { flexDirection: 'row', marginBottom: 4 },
  exampleCell: {
    width: 36,
    height: 36,
    margin: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exampleCorrect: { backgroundColor: colors.correct },
  examplePresent: { backgroundColor: colors.present },
  exampleAbsent: { backgroundColor: colors.absent },
  exampleCellText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  legendItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    lineHeight: 20
  },
  tryItButton: {
    backgroundColor: colors.tileEmpty,
    borderWidth: 2,
    borderColor: colors.tileBorder,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  tryItButtonPressed: { opacity: 0.8 },
  tryItButtonText: { fontSize: 16, fontWeight: '700', color: colors.text }
});

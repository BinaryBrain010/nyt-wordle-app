import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

const PLAY_COUNT_KEY = '@wordle/playCount';
const PUZZLE_NUMBERS = [321, 819, 902, 918, 1002];
const START_DATE = new Date(2026, 1, 15);

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function WordleIcon() {
  const grid = [
    [colors.present, colors.tileEmpty, colors.tileEmpty],
    [colors.correct, colors.correct, colors.correct],
    [colors.tileEmpty, colors.tileEmpty, colors.tileEmpty]
  ];
  return (
    <View style={iconStyles.wrapper}>
      <View style={iconStyles.container}>
        {grid.map((row, r) => (
          <View key={r} style={iconStyles.row}>
            {row.map((bg, c) => (
              <View key={c} style={[iconStyles.cell, { backgroundColor: bg, borderColor: bg === colors.tileEmpty ? colors.tileBorder : bg }]} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8
      },
      android: { elevation: 3 }
    })
  },
  container: { marginBottom: 0 },
  row: { flexDirection: 'row' },
  cell: { width: 22, height: 22, margin: 2, borderWidth: 2, borderRadius: 3 }
});

export function HomeScreen({ navigation }: Props) {
  const [playCount, setPlayCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PLAY_COUNT_KEY).then((raw) => {
        setPlayCount(Math.min(parseInt(raw ?? '0', 10), PUZZLE_NUMBERS.length - 1));
      });
    }, [])
  );

  const displayDate = (() => {
    const d = new Date(START_DATE);
    d.setDate(d.getDate() + playCount);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();
  const puzzleNum = PUZZLE_NUMBERS[playCount] ?? PUZZLE_NUMBERS[PUZZLE_NUMBERS.length - 1];
  const puzzleNumStr = `No. ${String(puzzleNum).padStart(4, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <WordleIcon />
        <View style={styles.accentLine} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Wordle</Text>
        </View>
        <Text style={styles.subtitle}>Get 6 chances to guess a 5-letter word.</Text>

        <Pressable
          style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>

        <View style={styles.meta}>
          <Text style={styles.metaPrimary}>{displayDate}</Text>
          <Text style={styles.metaNumber}>{puzzleNumStr}</Text>
          <Text style={styles.metaEditor}>Edited by pg</Text>
        </View>

        <Pressable style={styles.gamesLink} onPress={() => navigation.navigate('Games')}>
          <Text style={styles.gamesLinkText}>Games</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 32
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  accentLine: {
    width: 32,
    height: 3,
    backgroundColor: colors.correct,
    borderRadius: 2,
    marginBottom: 16,
    opacity: 0.9
  },
  titleRow: {
    marginBottom: 10
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
    ...(Platform.OS === 'ios' && { fontVariant: ['tabular-nums'] })
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.2,
    opacity: 0.92,
    maxWidth: 280
  },
  playButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 24,
    minWidth: 140,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12
      },
      android: { elevation: 4 }
    })
  },
  playButtonPressed: {
    opacity: 0.88
  },
  playButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  meta: {
    alignItems: 'center',
    paddingTop: 4
  },
  metaPrimary: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.3,
    fontWeight: '500'
  },
  metaNumber: {
    color: colors.text,
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.8,
    fontWeight: '600'
  },
  metaEditor: {
    color: colors.mutedText,
    fontSize: 12,
    letterSpacing: 0.2,
    fontWeight: '400'
  },
  gamesLink: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  gamesLinkText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3
  }
});

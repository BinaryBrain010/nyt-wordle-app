import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    <View style={iconStyles.container}>
      {grid.map((row, r) => (
        <View key={r} style={iconStyles.row}>
          {row.map((bg, c) => (
            <View key={c} style={[iconStyles.cell, { backgroundColor: bg, borderColor: bg === colors.tileEmpty ? colors.tileBorder : bg }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  cell: { width: 18, height: 18, margin: 1.5, borderWidth: 2, borderRadius: 2 }
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
        <Text style={styles.title}>Wordle</Text>
        <Text style={styles.subtitle}>Get 6 chances to guess a 5-letter word.</Text>

        <Pressable style={styles.playButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>

        <View style={styles.meta}>
          <Text style={styles.metaPrimary}>{displayDate}</Text>
          <Text style={styles.metaSecondary}>{puzzleNumStr}</Text>
          <Text style={styles.metaSecondary}>Edited by pg</Text>
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
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 18
  },
  playButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 34,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 18
  },
  playButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600'
  },
  meta: {
    alignItems: 'center'
  },
  metaPrimary: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 2
  },
  metaSecondary: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 2
  },
  gamesLink: {
    marginTop: 18,
    padding: 8
  },
  gamesLinkText: {
    color: colors.mutedText,
    fontSize: 14,
    textDecorationLine: 'underline'
  }
});

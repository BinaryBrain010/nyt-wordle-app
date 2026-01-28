import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { outcome, guessesUsed } = route.params;

  const title = useMemo(() => {
    if (outcome === 'win') return 'Congratulations!';
    return 'Thanks for playing!';
  }, [outcome]);

  const subtitle = useMemo(() => {
    if (outcome === 'win') return `You solved it in ${guessesUsed} guesses.`;
    return "You're out of guesses.";
  }, [outcome, guessesUsed]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {outcome === 'lose' ? (
        <Text style={styles.note}>Game will reset in 24 hours.</Text>
      ) : null}

      <View style={styles.statsSection}>
        <Text style={styles.statsHeader}>STATISTICS</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>86</Text>
            <Text style={styles.statLabel}>Win %</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Current{`\n`}Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Max{`\n`}Streak</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => navigation.replace('FinishedPuzzle', { outcome, guessesUsed })}
      >
        <Text style={styles.backButtonText}>Back to puzzle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 36
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.mutedText,
    marginBottom: 18
  },
  statsSection: {
    marginTop: 12
  },
  statsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statBox: {
    width: 70,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    paddingVertical: 10,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2
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
  backButtonText: {
    color: colors.text,
    fontWeight: '600'
  }
});

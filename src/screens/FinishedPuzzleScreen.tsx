import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FinishedPuzzle'>;

export function FinishedPuzzleScreen({ navigation, route }: Props) {
  const { outcome, guessesUsed } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: 5 }).map((__, c) => (
              <View
                key={c}
                style={[
                  styles.tile,
                  outcome === 'win' && r < guessesUsed
                    ? styles.tileCorrect
                    : outcome === 'lose' && r < 6
                      ? (c === 1 ? styles.tilePresent : styles.tileAbsent)
                      : undefined
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Result', { outcome, guessesUsed })}
      >
        <Text style={styles.buttonText}>See results</Text>
      </Pressable>
    </View>
  );
}

const TILE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 24,
    alignItems: 'center'
  },
  grid: {
    marginTop: 12
  },
  row: {
    flexDirection: 'row'
  },
  tile: {
    width: TILE,
    height: TILE,
    borderWidth: 2,
    borderColor: colors.tileBorder,
    backgroundColor: colors.tileEmpty,
    margin: 3
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
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600'
  }
});

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Wordle</Text>
        <Text style={styles.subtitle}>Get 6 chances to guess a{`\n`}5-letter word.</Text>

        <Pressable style={styles.playButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>

        <View style={styles.meta}>
          <Text style={styles.metaPrimary}>January 24, 2026</Text>
          <Text style={styles.metaSecondary}>No. 1680</Text>
          <Text style={styles.metaSecondary}>Edited by Tracy Bennett</Text>
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
    color: colors.mutedText,
    fontSize: 12
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

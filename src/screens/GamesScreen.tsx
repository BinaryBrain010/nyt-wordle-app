import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

export function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const paddingH = Math.max(18, Math.min(24, width * 0.05));
  const paddingBottom = insets.bottom + 24;

  return (
    <View style={[styles.container, { paddingHorizontal: paddingH, paddingBottom }]}>
      <Text style={[styles.title, { fontSize: width < 360 ? 20 : 22 }]}>Games</Text>
      <View style={styles.tilesRow}>
        <View style={styles.gameTile}>
          <View style={styles.icon} />
          <Text style={styles.tileText}>SOLVED IN 5</Text>
          <Text style={styles.tileSub}>Friday</Text>
        </View>
        <View style={styles.gameTile}>
          <View style={styles.icon} />
          <Text style={styles.tileText}>SOLVED IN 3</Text>
          <Text style={styles.tileSub}>Thursday</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center'
  },
  gameTile: {
    width: 120,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.correct,
    marginBottom: 8
  },
  tileText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827'
  },
  tileSub: {
    fontSize: 10,
    color: '#111827',
    opacity: 0.8
  }
});

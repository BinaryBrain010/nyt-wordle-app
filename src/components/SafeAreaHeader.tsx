import { useNavigation } from '@react-navigation/native';
import React from 'react';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

const HEADER_TOP = 10;
const HEADER_BOTTOM = 12;

type SafeAreaHeaderProps = {
  title?: string;
  showBack?: boolean;
};

export function SafeAreaHeader({ title = '', showBack = true }: SafeAreaHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const paddingTop = insets.top + HEADER_TOP;
  const paddingHorizontal = Math.max(insets.left, 12);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop,
          paddingBottom: HEADER_BOTTOM,
          paddingLeft: paddingHorizontal,
          paddingRight: paddingHorizontal
        }
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={12}
          accessibilityLabel="Back to home"
          accessibilityRole="button"
        >
          <Text style={[styles.backArrow, { fontSize: width < 360 ? 24 : 28 }]}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { fontSize: width < 360 ? 18 : 20 }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.tileBorder
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
    minHeight: 44,
    justifyContent: 'center'
  },
  backButtonPressed: { opacity: 0.7 },
  backArrow: { fontWeight: '600', color: colors.text },
  backPlaceholder: { width: 44 },
  titleWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', color: colors.text }
});

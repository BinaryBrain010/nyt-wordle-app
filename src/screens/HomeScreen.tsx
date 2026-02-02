import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { getCurrentUser, clearCurrentUser } from '../utils/users';
import { getPlayCount } from '../utils/stats';
import { getDisplayDate, getPuzzleNumberString } from '../utils/dailyWord';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function WordleIcon({ cellSize = 22 }: { cellSize?: number }) {
  const grid = [
    [colors.present, colors.tileEmpty, colors.tileEmpty],
    [colors.correct, colors.correct, colors.correct],
    [colors.tileEmpty, colors.tileEmpty, colors.tileEmpty]
  ];
  const cellStyle = useMemo(
    () => ({ width: cellSize, height: cellSize, margin: cellSize * 0.09, borderWidth: 2, borderRadius: 3 }),
    [cellSize]
  );
  return (
    <View style={iconStyles.wrapper}>
      <View style={iconStyles.container}>
        {grid.map((row, r) => (
          <View key={r} style={iconStyles.row}>
            {row.map((bg, c) => (
              <View key={c} style={[iconStyles.cell, cellStyle, { backgroundColor: bg, borderColor: bg === colors.tileEmpty ? colors.tileBorder : bg }]} />
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
  cell: {}
});

export function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [playCount, setPlayCount] = useState(0);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const responsive = useMemo(() => {
    const isNarrow = width < 380;
    const isShort = height < 600;
    return {
      paddingH: Math.max(20, Math.min(32, width * 0.08)),
      paddingTop: insets.top + (isShort ? 24 : 48),
      paddingBottom: insets.bottom + 24,
      titleSize: Math.min(52, Math.max(36, width * 0.14)),
      subtitleSize: isNarrow ? 16 : 18,
      subtitleLineHeight: isNarrow ? 22 : 26,
      subtitleMaxWidth: width * 0.82,
      iconCellSize: Math.min(26, Math.max(18, width * 0.06)),
      playPaddingV: isShort ? 14 : 16,
      playPaddingH: Math.min(44, width * 0.12),
      metaSize: isNarrow ? 12 : 13,
      usernameSize: isNarrow ? 12 : 13,
      profileButtonSize: Math.min(48, Math.max(40, width * 0.12)),
      profileIconSize: Math.min(22, Math.max(18, width * 0.055)),
      profileButtonTop: insets.top + (isShort ? 20 : 32)
    };
  }, [width, height, insets.top, insets.bottom]);

  useFocusEffect(
    useCallback(() => {
      getCurrentUser().then(setCurrentUsername);
      getPlayCount().then((count) => {
        setPlayCount(count);
      });
    }, [])
  );

  const handleSwitchUser = async () => {
    await clearCurrentUser();
    navigation.reset({ index: 0, routes: [{ name: 'Username' }] });
  };

  const displayDate = getDisplayDate(playCount);
  const puzzleNumStr = getPuzzleNumberString(playCount);

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: responsive.paddingH,
          paddingTop: responsive.paddingTop,
          paddingBottom: responsive.paddingBottom
        }
      ]}
    >
      {/* Profile Button at Top Right */}
      <Pressable
        style={[
          styles.profileButton,
          {
            top: responsive.profileButtonTop,
            right: responsive.paddingH,
            width: responsive.profileButtonSize,
            height: responsive.profileButtonSize,
            borderRadius: responsive.profileButtonSize / 2
          }
        ]}
        onPress={() => setShowProfileModal(true)}
        hitSlop={8}
      >
        <Text style={[styles.profileIcon, { fontSize: responsive.profileIconSize }]}>👤</Text>
      </Pressable>

      <View style={styles.center}>
        <WordleIcon cellSize={responsive.iconCellSize} />
        <View style={styles.accentLine} />
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: responsive.titleSize }]}>Wordle</Text>
        </View>
        <Text
          style={[
            styles.subtitle,
            {
              fontSize: responsive.subtitleSize,
              lineHeight: responsive.subtitleLineHeight,
              maxWidth: responsive.subtitleMaxWidth
            }
          ]}
        >
          Get 6 chances to guess a 5-letter word.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            { paddingVertical: responsive.playPaddingV, paddingHorizontal: responsive.playPaddingH },
            pressed && styles.playButtonPressed
          ]}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </Pressable>

        <View style={styles.meta}>
          <Text style={[styles.metaPrimary, { fontSize: responsive.metaSize }]}>{displayDate}</Text>
          <Text style={[styles.metaNumber, { fontSize: responsive.metaSize }]}>{puzzleNumStr}</Text>
          <Text style={[styles.metaEditor, { fontSize: responsive.metaSize - 1 }]}>Edited by pg</Text>
        </View>
      </View>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowProfileModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Profile</Text>
            {currentUsername && (
              <View style={styles.usernameInfo}>
                <Text style={styles.usernameLabel}>Playing as:</Text>
                <Text style={styles.usernameValue}>{currentUsername}</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
              onPress={async () => {
                setShowProfileModal(false);
                await handleSwitchUser();
              }}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed
              ]}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  profileButton: {
    position: 'absolute',
    backgroundColor: colors.tileEmpty,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.tileBorder,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: { elevation: 3 }
    })
  },
  profileIcon: {
    textAlign: 'center'
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
    width: '100%',
    maxWidth: 320,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12
      },
      android: { elevation: 8 }
    })
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20
  },
  usernameInfo: {
    marginBottom: 24,
    alignItems: 'center'
  },
  usernameLabel: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 8,
    fontWeight: '500'
  },
  usernameValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700'
  },
  logoutButton: {
    backgroundColor: colors.button,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logoutButtonPressed: {
    opacity: 0.88
  },
  logoutButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonPressed: {
    opacity: 0.7
  },
  closeButtonText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '500'
  }
});

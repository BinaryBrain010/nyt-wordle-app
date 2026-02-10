import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import { getPlayCount, getFullStats, hasPlayedCurrentPuzzle, getGuessesForDate, getResultForDate, canReplayLostGame, isDateAlreadyPlayed, type GameStats } from '../utils/stats';
import { getDisplayDate, getPuzzleNumberString, getDailyWordForDate, getTodayDateString, hasGameStarted, getPlayCountFromDate } from '../utils/dailyWord';
import { GameCalendar } from '../components/GameCalendar';
import { isFakeDateEnabled, getFakeDateValue } from '../utils/fakeDate';

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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [statsOpenedFrom, setStatsOpenedFrom] = useState<'profile' | 'calendar'>('profile');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [todayDateStr, setTodayDateStr] = useState('');
  const [todayPlayCount, setTodayPlayCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedTimeRemaining, setLockedTimeRemaining] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-fetch in dev mode
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isReplay, setIsReplay] = useState(false);

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
      console.log('[HOME] Refreshing game state... Key:', refreshKey);
      getCurrentUser().then(setCurrentUsername);
      getPlayCount().then((count) => {
        setPlayCount(count);
      });
      const realTodayStr = getTodayDateString();
      const activeDateStr = selectedDateStr || realTodayStr;

      setTodayDateStr(activeDateStr);

      const checkPlayState = async () => {
        const alreadyPlayed = await isDateAlreadyPlayed(activeDateStr);
        const result = await getResultForDate(activeDateStr);
        let treatAsUnplayed = !alreadyPlayed;
        let replaying = false;

        if (alreadyPlayed && result === 'lose') {
          const { canReplay } = await canReplayLostGame(activeDateStr);
          if (replaying = canReplay) {
            treatAsUnplayed = true; // Allow Play button to show
          }
        }

        setHasPlayed(!treatAsUnplayed);
        setIsReplay(replaying);
      };

      checkPlayState();

      // Check if game has started for the active date
      setGameStarted(hasGameStarted());

      const playCountNum = getPlayCountFromDate(activeDateStr);
      setTodayPlayCount(playCountNum);
    }, [refreshKey, selectedDateStr])
  );

  const handleSwitchUser = async () => {
    await clearCurrentUser();
    navigation.reset({ index: 0, routes: [{ name: 'Username' }] });
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleDatePress = async (dateStr: string, hasPlayed: boolean) => {
    setShowCalendarModal(false);

    if (hasPlayed) {
      // User has played this puzzle - check if they won or lost
      const result = await getResultForDate(dateStr);

      if (result === 'lose') {
        // Lost game - check if it can be replayed
        const { canReplay, timeRemaining } = await canReplayLostGame(dateStr);

        if (canReplay) {
          // Allow replay on HomeScreen
          setSelectedDateStr(dateStr);
        } else {
          // Show locked message with time remaining
          setLockedTimeRemaining(timeRemaining || 0);
          setShowLockedModal(true);
        }
      } else {
        // Won game - show the finished puzzle (locked)
        const guesses = await getGuessesForDate(dateStr);
        const dailyWord = getDailyWordForDate(dateStr);

        if (guesses) {
          navigation.navigate('FinishedPuzzle', {
            outcome: 'win',
            guessesUsed: guesses.length,
            guesses,
            solution: dailyWord.word
          });
        }
      }
    } else {
      // User hasn't played this puzzle - let them play it on HomeScreen
      setSelectedDateStr(dateStr);
    }
  };

  // Display today's puzzle info
  const displayDate = todayDateStr ? getDisplayDate(todayPlayCount) : '';
  const puzzleNumStr = todayDateStr ? getPuzzleNumberString(todayPlayCount) : '';

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
      {/* Top Left - Calendar Button */}
      <Pressable
        style={[
          styles.iconButton,
          {
            position: 'absolute',
            top: responsive.profileButtonTop,
            left: responsive.paddingH,
            width: responsive.profileButtonSize,
            height: responsive.profileButtonSize,
            borderRadius: responsive.profileButtonSize / 2,
            zIndex: 10
          }
        ]}
        onPress={() => setShowCalendarModal(true)}
        hitSlop={8}
      >
        <Text style={[styles.profileIcon, { fontSize: responsive.profileIconSize }]}>📅</Text>
      </Pressable>

      {/* Top Right - Profile Button */}
      <Pressable
        style={[
          styles.iconButton,
          {
            position: 'absolute',
            top: responsive.profileButtonTop,
            right: responsive.paddingH,
            width: responsive.profileButtonSize,
            height: responsive.profileButtonSize,
            borderRadius: responsive.profileButtonSize / 2,
            zIndex: 10
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
            (!gameStarted || hasPlayed) && styles.playButtonDisabled,
            pressed && gameStarted && !hasPlayed && styles.playButtonPressed
          ]}
          onPress={() => gameStarted && !hasPlayed && navigation.navigate('Game', { dateToPlay: todayDateStr })}
          disabled={!gameStarted || hasPlayed}
        >
          <Text style={[styles.playButtonText, (!gameStarted || hasPlayed) && styles.playButtonTextDisabled]}>
            {!gameStarted ? 'Coming Feb 15' : isReplay ? 'Replay' : hasPlayed ? 'Already Played' : 'Play'}
          </Text>
        </Pressable>

        {selectedDateStr && (
          <Pressable
            style={styles.backToTodayButton}
            onPress={() => setSelectedDateStr(null)}
          >
            <Text style={styles.backToTodayText}>↩ Back to Today</Text>
          </Pressable>
        )}

        <View style={styles.meta}>
          <Text style={[styles.metaPrimary, { fontSize: responsive.metaSize }]}>{displayDate}</Text>
          <Text style={[styles.metaNumber, { fontSize: responsive.metaSize }]}>{puzzleNumStr}</Text>
          <Text style={[styles.metaEditor, { fontSize: responsive.metaSize - 1 }]}>Edited by pg</Text>
        </View>

        {/* Dev Mode: Fake Date Indicator */}
        {isFakeDateEnabled() && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>🧪 DEV MODE: Fake Date</Text>
            <Text style={styles.devBannerDate}>{getFakeDateValue()}</Text>
            <Text style={styles.devBannerHint}>Edit src/utils/fakeDate.ts to change</Text>

            <Pressable
              style={styles.refreshButton}
              onPress={() => setRefreshKey(prev => prev + 1)}
            >
              <Text style={styles.refreshButtonText}>🔄 Force Refresh</Text>
            </Pressable>
          </View>
        )}
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
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                <Text style={styles.profileIconLarge}>👤</Text>
              </View>
              <Text style={styles.modalTitle}>Profile</Text>
            </View>
            {currentUsername && (
              <View style={styles.usernameInfo}>
                <Text style={styles.usernameLabel}>Playing as</Text>
                <View style={styles.usernameBadge}>
                  <Text style={styles.usernameValue}>{currentUsername}</Text>
                </View>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.statsButton,
                pressed && styles.statsButtonPressed
              ]}
              onPress={async () => {
                const fullStats = await getFullStats();
                setStats(fullStats);
                setStatsOpenedFrom('profile');
                setShowProfileModal(false);
                setShowStatsModal(true);
              }}
            >
              <Text style={styles.statsButtonText}>Stats</Text>
            </Pressable>
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

      {/* Stats Modal */}
      <Modal
        visible={showStatsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.statsModalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.statsHeader}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed
                ]}
                onPress={() => {
                  setShowStatsModal(false);
                  if (statsOpenedFrom === 'profile') {
                    setShowProfileModal(true);
                  } else {
                    setShowCalendarModal(true);
                  }
                }}
              >
                <Text style={styles.backButtonText}>←</Text>
              </Pressable>
              <View style={styles.statsTitleContainer}>
                <Text style={styles.modalTitle}>Statistics</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.closeIconButton,
                  pressed && styles.backButtonPressed
                ]}
                onPress={() => setShowStatsModal(false)}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.statsScrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Calendar Section */}
              <GameCalendar onDatePress={handleDatePress} />

              {/* Stats Grid */}
              {stats && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsGridTitle}>📊 Your Stats</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.played}</Text>
                      <Text style={styles.statLabel}>Played</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {stats.played > 0 ? Math.round((100 * stats.wins) / stats.played) : 0}
                      </Text>
                      <Text style={styles.statLabel}>Win %</Text>
                    </View>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.currentStreak}</Text>
                      <Text style={styles.statLabel}>Current{'\n'}Streak</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{stats.maxStreak}</Text>
                      <Text style={styles.statLabel}>Max{'\n'}Streak</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.statsModalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <Text style={styles.modalTitle}>Game Calendar</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeIconButton,
                  pressed && styles.backButtonPressed
                ]}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.closeIconText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.statsScrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <GameCalendar onDatePress={handleDatePress} />

              <Pressable
                style={({ pressed }) => [
                  styles.statsLinkButton,
                  pressed && styles.statsButtonPressed
                ]}
                onPress={async () => {
                  const fullStats = await getFullStats();
                  setStats(fullStats);
                  setStatsOpenedFrom('calendar');
                  setShowCalendarModal(false);
                  setShowStatsModal(true);
                }}
              >
                <Text style={styles.statsLinkText}>Stats →</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Locked Puzzle Modal */}
      <Modal
        visible={showLockedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLockedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lockedModalContent}>
            <Text style={styles.lockedModalTitle}>🔒 Puzzle Locked</Text>
            <Text style={styles.lockedModalMessage}>
              You can retry this puzzle after midnight.
            </Text>
            {lockedTimeRemaining !== null && (
              <Text style={styles.lockedModalTime}>
                Time remaining: {formatTimeRemaining(lockedTimeRemaining)}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.lockedModalButton,
                pressed && styles.closeButtonPressed
              ]}
              onPress={() => setShowLockedModal(false)}
            >
              <Text style={styles.lockedModalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
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
  playButtonDisabled: {
    backgroundColor: colors.tileBorder,
    opacity: 0.6
  },
  playButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  playButtonTextDisabled: {
    color: colors.mutedText
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
  iconButton: {
    backgroundColor: colors.tileEmpty,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.tileBorder,
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
  statsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  statsModalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16
      },
      android: { elevation: 12 }
    })
  },
  statsScrollView: {
    flexGrow: 0
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tileEmpty,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedText
  },
  statsGridTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  profileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tileEmpty,
    borderWidth: 2,
    borderColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  profileIconLarge: {
    fontSize: 32
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center'
  },
  usernameInfo: {
    marginBottom: 24,
    alignItems: 'center'
  },
  usernameLabel: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  usernameBadge: {
    backgroundColor: colors.correct,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4
      },
      android: { elevation: 3 }
    })
  },
  usernameValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  statsTitleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tileEmpty,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonPressed: {
    opacity: 0.7
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: -2
  },
  backButtonPlaceholder: {
    width: 36
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
  },
  statsButton: {
    backgroundColor: colors.correct,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  statsButtonPressed: {
    opacity: 0.88
  },
  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  statsContainer: {
    marginBottom: 24,
    gap: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.tileEmpty
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 14
  },
  calendarModalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16
      },
      android: { elevation: 12 }
    })
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statsLinkButton: {
    backgroundColor: colors.correct,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8
      },
      android: { elevation: 3 }
    })
  },
  statsLinkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  lockedModalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16
      },
      android: { elevation: 12 }
    })
  },
  lockedModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  lockedModalMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.8
  },
  lockedModalTime: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.absent,
    textAlign: 'center',
    marginBottom: 24
  },
  lockedModalButton: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8
      },
      android: { elevation: 3 }
    })
  },
  lockedModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  devBanner: {
    marginTop: 24,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFECB5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  devBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4
  },
  devBannerDate: {
    fontSize: 16,
    fontWeight: '800',
    color: '#664D03',
    marginBottom: 4
  },
  devBannerHint: {
    fontSize: 10,
    color: '#997404',
    fontStyle: 'italic'
  },
  refreshButton: {
    marginTop: 10,
    backgroundColor: colors.present,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.correct
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  backToTodayButton: {
    marginTop: -8,
    marginBottom: 20,
    backgroundColor: colors.tileEmpty,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.tileBorder,
  },
  backToTodayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  }
});

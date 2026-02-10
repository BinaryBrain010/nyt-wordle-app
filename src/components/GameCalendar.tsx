import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CalendarHistory, getCalendarHistory, canReplayLostGame, getReplayLink } from '../utils/stats';
import { getPlayCountFromDate, getDailyWordForDate } from '../utils/dailyWord';
import { getCurrentDate } from '../utils/fakeDate';

const START_DATE = new Date(2026, 1, 15); // Feb 15, 2026 (month is 0-indexed)

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type GameCalendarProps = {
  onDatePress?: (dateStr: string, hasPlayed: boolean) => void;
};

export function GameCalendar({ onDatePress }: GameCalendarProps = {}) {
  const [history, setHistory] = useState<CalendarHistory>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [replayableDates, setReplayableDates] = useState<Set<string>>(new Set());
  const [replayLinks, setReplayLinks] = useState<Record<string, string>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getCalendarHistory();
    setHistory(data);

    // Check which lost games are replayable
    const replayable = new Set<string>();
    const links: Record<string, string> = {};

    // Get today's info to check range
    const today = getCurrentDate();

    for (const [date, result] of Object.entries(data)) {
      if (result === 'lose') {
        const { canReplay } = await canReplayLostGame(date);
        if (canReplay) {
          replayable.add(date);
        }
      }

      // Also check if this date has a replay link
      const link = await getReplayLink(date);
      if (link) links[date] = link;
    }

    // Proactively check upcoming dates for links too (in case they haven't been in history yet)
    // Or we can just rely on them being in history once they are 'assigned'

    setReplayableDates(replayable);
    setReplayLinks(links);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const today = getCurrentDate();
    const nextMonth = new Date(year, month + 1, 1);
    // Don't go beyond current month
    if (nextMonth <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
      setCurrentDate(nextMonth);
    }
  };

  const today = getCurrentDate();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining days in the last week
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Game History</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.winDay, styles.legendDotShadow]}>
              <Text style={styles.legendMark}>✓</Text>
            </View>
            <Text style={styles.legendText}>Win</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.loseDay, styles.legendDotShadow]}>
              <Text style={styles.legendMark}>✗</Text>
            </View>
            <Text style={styles.legendText}>Loss</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.replayableDay, styles.legendDotShadow]}>
              <Text style={[styles.legendMark, { fontSize: 9 }]}>🔄</Text>
            </View>
            <Text style={styles.legendText}>Retry</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.missedDay, { backgroundColor: '#FAFAFA' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </View>

      <View style={styles.calendarWrapper}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            onPress={goToPrevMonth}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
              isCurrentMonth && styles.navButtonDisabled
            ]}
            onPress={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <Text style={[styles.navButtonText, isCurrentMonth && styles.navButtonTextDisabled]}>›</Text>
          </Pressable>
        </View>

        {/* Day Headers */}
        <View style={styles.weekRow}>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.dayCell} />;
              }

              const dateStr = formatDate(year, month, day);
              const result = history[dateStr];
              const isToday = dateStr === todayStr;
              const currentDate = new Date(year, month, day);
              currentDate.setHours(0, 0, 0, 0);
              const isFuture = currentDate > today;
              const startDateNormalized = new Date(START_DATE);
              startDateNormalized.setHours(0, 0, 0, 0);
              const isBeforeStart = currentDate < startDateNormalized;
              const playCount = getPlayCountFromDate(dateStr);
              const originalDate = replayLinks[dateStr];
              const isPastOrToday = !isFuture && !isBeforeStart;
              const hasPlayed = !!result;

              let isReplayable = result === 'lose' && replayableDates.has(dateStr);

              // Logic for showing replay status on 20th+ (Requirement 2b)
              if (playCount >= 5 && originalDate) {
                const originalResult = history[originalDate];
                if (!hasPlayed && originalResult === 'lose') {
                  isReplayable = true;
                }
              }

              const isLocked = result === 'lose' && (playCount < 5 ? !replayableDates.has(dateStr) : (isToday ? !replayableDates.has(dateStr) : true));
              const isMissed = !isFuture && !isBeforeStart && !isToday && !hasPlayed && playCount < 5;

              return (
                <Pressable
                  key={dayIndex}
                  style={styles.dayCell}
                  onPress={() => isPastOrToday && onDatePress && onDatePress(dateStr, hasPlayed)}
                  disabled={isFuture || isBeforeStart || !onDatePress}
                >
                  <View
                    style={[
                      styles.dayContent,
                      result === 'win' && styles.winDay,
                      isLocked && styles.loseDay,
                      isReplayable && styles.replayableDay,
                      isMissed && styles.missedDay,
                      isToday && !result && styles.todayDay,
                      isPastOrToday && onDatePress && styles.clickableDay
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        result === 'win' && styles.winDayText,
                        isLocked && styles.loseDayText,
                        isReplayable && styles.replayableDayText,
                        (isFuture || isBeforeStart) && styles.futureText,
                        isToday && !result && styles.todayText
                      ]}
                    >
                      {day}
                    </Text>
                    {result === 'win' && (
                      <Text style={styles.resultMark}>✓</Text>
                    )}
                    {isLocked && (
                      <Text style={[styles.resultMark, styles.loseMarkText]}>🔒</Text>
                    )}
                    {isReplayable && (
                      <Text style={[styles.resultMark, styles.replayableMarkText]}>🔄</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    rowGap: 12,
    columnGap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  legendMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  legendText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  legendDotShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
      },
      android: { elevation: 1 }
    })
  },
  calendarWrapper: {
    backgroundColor: colors.tileEmpty,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8
      },
      android: { elevation: 2 }
    })
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tileEmpty,
    borderWidth: 1,
    borderColor: colors.tileBorder
  },
  navButtonPressed: {
    opacity: 0.7
  },
  navButtonDisabled: {
    opacity: 0.3
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.text,
    marginTop: -2
  },
  navButtonTextDisabled: {
    color: colors.mutedText
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3
  },
  weekRow: {
    flexDirection: 'row'
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    textTransform: 'uppercase'
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  clickableDay: {
    opacity: 0.9
  },
  winDay: {
    backgroundColor: colors.correct
  },
  loseDay: {
    backgroundColor: colors.loseCross
  },
  missedDay: {
    borderWidth: 2,
    borderColor: colors.tileBorder,
    backgroundColor: '#FAFAFA'
  },
  replayableDay: {
    backgroundColor: colors.present,
    borderWidth: 2,
    borderColor: colors.correct,
    borderStyle: 'dashed'
  },
  replayableDot: {
    backgroundColor: colors.present,
    borderWidth: 1,
    borderColor: colors.correct
  },
  todayDay: {
    borderWidth: 2,
    borderColor: colors.correct
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text
  },
  winDayText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: -2,
    fontWeight: '700'
  },
  loseDayText: {
    color: '#000000',
    fontSize: 11,
    marginTop: -2,
    fontWeight: '700'
  },
  futureText: {
    color: colors.mutedText,
    opacity: 0.5
  },
  todayText: {
    color: colors.correct,
    fontWeight: '700'
  },
  resultMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2
  },
  loseMarkText: {
    color: '#000000'
  },
  replayableDayText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: -2,
    fontWeight: '700'
  },
  replayableMarkText: {
    fontSize: 8,
    marginTop: -1
  }
});

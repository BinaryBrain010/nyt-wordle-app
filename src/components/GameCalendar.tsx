import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CalendarHistory, getCalendarHistory } from '../utils/stats';

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

export function GameCalendar() {
  const [history, setHistory] = useState<CalendarHistory>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getCalendarHistory();
    setHistory(data);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(year, month + 1, 1);
    // Don't go beyond current month
    if (nextMonth <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
      setCurrentDate(nextMonth);
    }
  };

  const today = new Date();
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
            <View style={[styles.legendDot, { backgroundColor: colors.correct }]}>
              <Text style={styles.legendMark}>✓</Text>
            </View>
            <Text style={styles.legendText}>Win</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.loseCross }]}>
              <Text style={[styles.legendMark, { color: colors.text }]}>✗</Text>
            </View>
            <Text style={styles.legendText}>Loss</Text>
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
              const isFuture = new Date(year, month, day) > today;

              return (
                <View key={dayIndex} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayContent,
                      result === 'win' && styles.winDay,
                      result === 'lose' && styles.loseDay,
                      isToday && !result && styles.todayDay
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        result === 'win' && styles.winDayText,
                        result === 'lose' && styles.loseDayText,
                        isFuture && styles.futureText,
                        isToday && !result && styles.todayText
                      ]}
                    >
                      {day}
                    </Text>
                    {result && (
                      <Text style={[
                        styles.resultMark,
                        result === 'lose' && styles.loseMarkText
                      ]}>
                        {result === 'win' ? '✓' : '✗'}
                      </Text>
                    )}
                  </View>
                </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
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
    fontSize: 12,
    fontWeight: '700'
  },
  legendText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500'
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
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
  winDay: {
    backgroundColor: colors.correct
  },
  loseDay: {
    backgroundColor: colors.loseCross
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
  }
});

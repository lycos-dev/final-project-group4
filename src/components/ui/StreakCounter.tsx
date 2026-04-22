import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useWorkout } from '../../context/WorkoutContext';

interface Props {
  currentMonth?: number; // 0-11
  currentYear?: number;
}

export const StreakCounter = ({
  currentMonth = new Date().getMonth(),
  currentYear = new Date().getFullYear(),
}: Props) => {
  const { getCompletedDatesThisMonth, completedWorkouts } = useWorkout();
  const workoutDays = useMemo(() => getCompletedDatesThisMonth(), [completedWorkouts]);
  const currentDay = new Date().getDate();

  const monthData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { daysInMonth, firstDay, monthName };
  }, [currentMonth, currentYear]);

  const weeks = useMemo(() => {
    const { daysInMonth, firstDay } = monthData;
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [monthData]);

  const calendarContent = (
    <View style={styles.calendarContainer}>
      <Text style={styles.monthTitle}>{monthData.monthName}</Text>
      
      {/* Day headers */}
      <View style={styles.daysHeaderRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <Text key={day} style={styles.dayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <View
              key={`${weekIndex}-${dayIndex}`}
              style={[
                styles.dayCell,
                day && workoutDays.includes(day) && styles.dayCellCompleted,
                day && day === currentDay && styles.dayCellCurrent,
              ]}
            >
              {day ? (
                <>
                  <Text
                    style={[
                      styles.dayNumber,
                      workoutDays.includes(day) && styles.dayNumberCompleted,
                    ]}
                  >
                    {day}
                  </Text>
                  {workoutDays.includes(day) && (
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color={theme.colors.accentText}
                      style={styles.checkmark}
                    />
                  )}
                </>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      {calendarContent}
    </View>
  );
};

const styles = StyleSheet.create({
  // Card variant styles
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },

  // Calendar styles
  calendarContainer: {
    width: '100%',
  },
  monthTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dayHeader: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightBold,
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayCellCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  dayCellCurrent: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  dayNumber: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
  },
  dayNumberCompleted: {
    color: theme.colors.accentText,
    fontWeight: theme.font.weightBold,
  },
  checkmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
});
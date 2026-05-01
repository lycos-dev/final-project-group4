import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface Props {
  currentMonth?: number; // 0-11
  currentYear?: number;
}

export const StreakCounter = ({
  currentMonth = new Date().getMonth(),
  currentYear = new Date().getFullYear(),
}: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const { completedWorkouts } = useWorkout();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const workoutsByDay = useMemo(() => {
    const byDay: Record<number, string[]> = {};
    completedWorkouts.forEach((workout) => {
      const completedDate = new Date(workout.completedAt);
      if (
        completedDate.getMonth() === month &&
        completedDate.getFullYear() === year
      ) {
        const day = completedDate.getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(workout.routineName);
      }
    });
    return byDay;
  }, [completedWorkouts, month, year]);
  const workoutDays = useMemo(
    () => Object.keys(workoutsByDay).map((d) => Number(d)),
    [workoutsByDay],
  );
  const today = new Date();
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
  const currentDay = isCurrentMonth ? today.getDate() : -1;

  const monthData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { daysInMonth, firstDay, monthName };
  }, [month, year]);

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
      {/* Month navigation */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity 
          style={styles.monthNavBtn} 
          onPress={() => {
            if (month === 0) {
              setMonth(11);
              setYear(year - 1);
            } else {
              setMonth(month - 1);
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={appTheme.colors.accent} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{monthData.monthName}</Text>
        
        <TouchableOpacity 
          style={styles.monthNavBtn} 
          onPress={() => {
            if (month === 11) {
              setMonth(0);
              setYear(year + 1);
            } else {
              setMonth(month + 1);
            }
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-right" size={20} color={appTheme.colors.accent} />
        </TouchableOpacity>
      </View>
      
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
          {week.map((day, dayIndex) => {
            const dayWorkouts = day ? workoutsByDay[day] ?? [] : [];
            const firstWorkout = dayWorkouts[0];
            const workoutTag = firstWorkout
              ? firstWorkout.length > 8
                ? `${firstWorkout.slice(0, 8)}…`
                : firstWorkout
              : null;

            const onPress = () => {
              if (!day) return;
              setSelectedDay(day);
              navigation.navigate('WorkoutHistory', {
                dateMs: new Date(year, month, day).getTime(),
              });
              // Clear transient selection so highlight doesn't persist after navigation
              setTimeout(() => setSelectedDay(null), 120);
            };

            return (
            <TouchableOpacity
              key={`${weekIndex}-${dayIndex}`}
              style={[
                styles.dayCell,
                day !== null && workoutDays.includes(day) ? styles.dayCellCompleted : undefined,
                day !== null && day === currentDay ? styles.dayCellCurrent : undefined,
                day !== null && day === selectedDay ? styles.dayCellSelected : undefined,
              ]}
              activeOpacity={day ? 0.8 : 1}
              disabled={!day}
              onPress={onPress}
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
                      color={appTheme.colors.accentText}
                      style={styles.checkmark}
                    />
                  )}
                  {workoutTag ? (
                    <Text style={styles.workoutTag} numberOfLines={1}>
                      {dayWorkouts.length > 1 ? `${workoutTag} +${dayWorkouts.length - 1}` : workoutTag}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </TouchableOpacity>
            );
          })}
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

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    // Card variant styles
    cardContainer: {
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      padding: appTheme.spacing.lg,
    },

    // Calendar styles
    calendarContainer: {
      width: '100%',
    },
    monthTitle: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
      flex: 1,
      textAlign: 'center',
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: appTheme.spacing.md,
    },
    monthNavBtn: {
      padding: appTheme.spacing.sm,
      borderRadius: appTheme.radius.sm,
      backgroundColor: appTheme.colors.surfaceAlt,
    },
    daysHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: appTheme.spacing.sm,
    },
    dayHeader: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
      fontWeight: appTheme.font.weightBold,
      flex: 1,
      textAlign: 'center',
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: appTheme.spacing.xs,
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      backgroundColor: appTheme.colors.surfaceAlt,
      borderRadius: appTheme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
    },
    dayCellCompleted: {
      backgroundColor: appTheme.colors.success,
      borderColor: appTheme.colors.success,
    },
    dayCellCurrent: {
      borderColor: appTheme.colors.accent,
      borderWidth: 2,
      shadowColor: appTheme.colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
      elevation: 6,
    },
    dayCellSelected: {
      borderColor: appTheme.colors.accent,
      borderWidth: 2,
    },
    dayNumber: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      fontWeight: appTheme.font.weightMedium,
    },
    dayNumberCompleted: {
      color: appTheme.colors.accentText,
      fontWeight: appTheme.font.weightBold,
    },
    checkmark: {
      position: 'absolute',
      bottom: 2,
      right: 2,
    },
    workoutTag: {
      color: appTheme.colors.accentText,
      fontSize: 8,
      fontWeight: appTheme.font.weightBold,
      maxWidth: '90%',
    },
  });
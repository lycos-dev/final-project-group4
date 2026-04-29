import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkoutCompletionCard } from '../../components/ui/WorkoutCompletionCard';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Route = RouteProp<RootStackParamList, 'WorkoutHistory'>;

const formatDateTitle = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export const WorkoutHistoryScreen = () => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const { profile } = useProfile();
  const { getCompletedWorkoutsByDate } = useWorkout();
  const { params } = useRoute<Route>();

  const selectedDate = useMemo(() => new Date(params.dateMs), [params.dateMs]);
  const completedWorkouts = useMemo(
    () => getCompletedWorkoutsByDate(selectedDate).sort((a, b) => b.completedAt - a.completedAt),
    [getCompletedWorkoutsByDate, selectedDate],
  );

  const workoutCards = completedWorkouts.map((workout) => ({
    id: workout.id,
    username: profile.name,
    routineName: workout.routineName,
    timeMinutes: workout.durationMinutes,
    volumeKg: workout.totalVolumeKg,
    timestamp: new Date(workout.completedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.filter((set) => set.completed).length || exercise.sets.length,
      reps: exercise.sets.length > 0 ? `${exercise.sets.length} sets` : undefined,
      image: exercise.imageUrl,
    })),
  }));

  return (
    <Screen scroll>
      <Text style={styles.title}>{formatDateTitle(selectedDate)}</Text>
      <Text style={styles.subtitle}>
        {completedWorkouts.length} completed workout{completedWorkouts.length !== 1 ? 's' : ''}
      </Text>

      {completedWorkouts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="calendar-outline"
            title="No workouts on this date"
            subtitle="Pick another day from the calendar to review its workout history."
          />
        </View>
      ) : (
        <View style={styles.list}>
          {workoutCards.map((workout) => (
            <WorkoutCompletionCard key={workout.id} {...workout} />
          ))}
        </View>
      )}
    </Screen>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    title: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeXl,
      fontWeight: appTheme.font.weightBlack,
      marginBottom: appTheme.spacing.xs,
    },
    subtitle: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      marginBottom: appTheme.spacing.lg,
    },
    list: {
      gap: appTheme.spacing.md,
      paddingBottom: appTheme.spacing.lg,
    },
    emptyWrap: {
      marginTop: appTheme.spacing.lg,
    },
  });
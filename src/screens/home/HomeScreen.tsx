import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { StreakCounter } from '../../components/ui/StreakCounter';
import { WorkoutCompletionCard } from '../../components/ui/WorkoutCompletionCard';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';
import { useWorkout } from '../../context/WorkoutContext';

const formatTimestamp = (completedAt: number): string => {
  const now = Date.now();
  const diffMs = now - completedAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export const HomeScreen = () => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const { profile } = useProfile();
  const { completedWorkouts } = useWorkout();
  const recentWorkouts = useMemo(
    () => [...completedWorkouts].sort((a, b) => b.completedAt - a.completedAt),
    [completedWorkouts]
  );

  return (
    <Screen scroll>
      <Text style={styles.greet}>Welcome back,</Text>
      <Text style={styles.name}>{profile.name.split(' ')[0]} 👋</Text>

      {/* Streak Counter Section */}
      <View style={styles.section}>
        <StreakCounter />
      </View>

      {/* Recent Workouts Section */}
      {recentWorkouts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {recentWorkouts.map((workout) => {
            const exerciseDetails = workout.exercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets.filter((s) => s.completed).length || ex.sets.length,
              image: (ex as any).image,
            }));

            return (
              <View key={workout.id} style={styles.workoutCardSpacing}>
                <WorkoutCompletionCard
                  username={profile.name}
                  routineName={workout.routineName}
                  timeMinutes={workout.durationMinutes}
                  volumeKg={workout.totalVolumeKg}
                  exercises={exerciseDetails}
                  timestamp={formatTimestamp(workout.completedAt)}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <View style={styles.emptyWorkout}>
            <Text style={styles.emptyWorkoutText}>No workouts yet. Finish a workout to see it here!</Text>
          </View>
        </View>
      )}
    </Screen>
  );
};

const createStyles = (appTheme: typeof theme) => {
  const theme = appTheme;
  return StyleSheet.create({
    greet: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
    name: { color: theme.colors.text, fontSize: theme.font.sizeDisplay, fontWeight: theme.font.weightBlack, marginBottom: theme.spacing.lg },
    section: { marginBottom: theme.spacing.lg },
    sectionTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.md },
    workoutCardSpacing: { marginBottom: theme.spacing.md },
    emptyWorkout: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      alignItems: 'center' as const,
    },
    emptyWorkoutText: {
      color: theme.colors.muted,
      fontSize: theme.font.sizeMd,
      textAlign: 'center' as const,
    },
  });
};
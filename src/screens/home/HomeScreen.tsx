import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { StreakCounter } from '../../components/ui/StreakCounter';
import { WorkoutCompletionCard } from '../../components/ui/WorkoutCompletionCard';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../context/ProfileContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Theme } from '../../theme/theme';

  const formatTimestamp = (completedAt: number): string => {
  const now = Date.now();
  const diffSec = Math.floor((now - completedAt) / 1000);
  const diffMins = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export const HomeScreen = () => {
  const { theme: appTheme } = useTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
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
                  id={workout.id}
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

const createStyles = (appTheme: Theme) =>
  StyleSheet.create({
    greet: { color: appTheme.colors.muted, fontSize: appTheme.font.sizeMd },
    name: { color: appTheme.colors.text, fontSize: appTheme.font.sizeDisplay, fontWeight: appTheme.font.weightBlack, marginBottom: appTheme.spacing.lg },
    section: { marginBottom: appTheme.spacing.lg },
    sectionTitle: { color: appTheme.colors.text, fontSize: appTheme.font.sizeLg, fontWeight: appTheme.font.weightBold, marginBottom: appTheme.spacing.md },
    workoutCardSpacing: { marginBottom: appTheme.spacing.md },
    emptyWorkout: {
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      padding: appTheme.spacing.xl,
      alignItems: 'center' as const,
    },
    emptyWorkoutText: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeMd,
      textAlign: 'center' as const,
    },
  });
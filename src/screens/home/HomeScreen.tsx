import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { StreakCounter } from '../../components/ui/StreakCounter';
import { WorkoutCompletionCard } from '../../components/ui/WorkoutCompletionCard';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';
import { useWorkout } from '../../context/WorkoutContext';

const formatTimestamp = (completedAt: number): string => {
  const now = Date.now();
  const diffMs = now - completedAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export const HomeScreen = () => {
  const { profile } = useProfile();
  const { getRecentWorkout } = useWorkout();
  const recentWorkout = getRecentWorkout();

  const exerciseDetails = useMemo(() => {
    if (!recentWorkout) return [];
    return recentWorkout.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.filter((s) => s.completed).length || ex.sets.length,
      image: (ex as any).image,
    }));
  }, [recentWorkout]);

  return (
    <Screen scroll>
      <Text style={styles.greet}>Welcome back,</Text>
      <Text style={styles.name}>{profile.name.split(' ')[0]} 👋</Text>

      {/* Streak Counter Section */}
      <View style={styles.section}>
        <StreakCounter />
      </View>

      {/* Recent Workout Section */}
      {recentWorkout ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workout</Text>
          <WorkoutCompletionCard
            username={profile.name}
            routineName={recentWorkout.routineName}
            timeMinutes={recentWorkout.durationMinutes}
            volumeKg={recentWorkout.totalVolumeKg}
            exercises={exerciseDetails}
            timestamp={formatTimestamp(recentWorkout.completedAt)}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workout</Text>
          <View style={styles.emptyWorkout}>
            <Text style={styles.emptyWorkoutText}>No workouts yet. Finish a workout to see it here!</Text>
          </View>
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  greet: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
  name: { color: theme.colors.text, fontSize: theme.font.sizeDisplay, fontWeight: theme.font.weightBlack, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.md },
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
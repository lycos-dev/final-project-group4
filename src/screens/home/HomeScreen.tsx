import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { StreakCounter } from '../../components/ui/StreakCounter';
import { WorkoutCompletionCard } from '../../components/ui/WorkoutCompletionCard';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';

export const HomeScreen = () => {
  const { profile } = useProfile();

  return (
    <Screen scroll>
      <Text style={styles.greet}>Welcome back,</Text>
      <Text style={styles.name}>{profile.name.split(' ')[0]} 👋</Text>

      {/* Streak Counter Section */}
      <View style={styles.section}>
        <StreakCounter count={12} variant="card" />
      </View>

      {/* Recent Workout Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Workout</Text>
        <WorkoutCompletionCard
          username={profile.name}
          routineName="Biceps + Chest + abs"
          timeMinutes={5}
          volumeKg={21025}
          exercises={[
            {
              name: 'Bench Press (Dumbbell)',
              sets: 3,
              image: undefined,
            },
            {
              name: 'Bicep Curl',
              sets: 1,
              reps: '21s',
              image: undefined,
            },
            {
              name: 'Ab Scissors',
              sets: 1,
              image: undefined,
            },
          ]}
          timestamp="8 minutes ago"
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  greet: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
  name: { color: theme.colors.text, fontSize: theme.font.sizeDisplay, fontWeight: theme.font.weightBlack, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.md },
});

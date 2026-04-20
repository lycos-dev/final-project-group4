import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';
import { useExercises } from '../../context/ExerciseContext';

export const HomeScreen = () => {
  const { profile } = useProfile();
  const { exercises } = useExercises();

  return (
    <Screen scroll>
      <Text style={styles.greet}>Welcome back,</Text>
      <Text style={styles.name}>{profile.name.split(' ')[0]} 👋</Text>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>PRs</Text>
        </Card>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.cardTitle}>Today's Goal</Text>
        <Text style={styles.cardBody}>{profile.goal}</Text>
      </Card>

      <Card style={{ marginTop: theme.spacing.md }}>
        <Text style={styles.cardTitle}>Quick Tip</Text>
        <Text style={styles.cardBody}>
          Build your exercise library, then create routines to start tracking progress.
        </Text>
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  greet: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
  name: { color: theme.colors.text, fontSize: theme.font.sizeDisplay, fontWeight: theme.font.weightBlack, marginBottom: theme.spacing.lg },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  stat: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  statValue: { color: theme.colors.accent, fontSize: theme.font.sizeXxl, fontWeight: theme.font.weightBlack },
  statLabel: { color: theme.colors.muted, fontSize: theme.font.sizeXs, marginTop: 2 },
  cardTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.xs },
  cardBody: { color: theme.colors.muted, fontSize: theme.font.sizeSm, lineHeight: 20 },
});

import React, { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { EmptyPlaceholder } from '../../components/profile/EmptyPlaceholder';
import { AchievementCard } from '../../components/profile/AchievementCard';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { useWorkout } from '../../context/WorkoutContext';
import { buildExerciseAchievements } from '../../utils/achievements';

export const AchievementsScreen = () => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const { completedWorkouts, settings } = useWorkout();

  const achievements = useMemo(
    () => buildExerciseAchievements(completedWorkouts, settings.weightUnit),
    [completedWorkouts, settings.weightUnit],
  );

  return (
    <Screen scroll>
      <Text style={styles.title}>All Achievements</Text>
      <Text style={styles.subtitle}>Max PRs across every logged workout.</Text>

      {achievements.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyPlaceholder
            icon="trophy-outline"
            title="No achievements yet"
            message={'Complete workouts to start building your PR history.'}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              title={achievement.title}
              detail={achievement.detail}
            />
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
      gap: appTheme.spacing.sm,
      paddingBottom: appTheme.spacing.lg,
    },
    emptyWrap: {
      marginTop: appTheme.spacing.lg,
    },
  });
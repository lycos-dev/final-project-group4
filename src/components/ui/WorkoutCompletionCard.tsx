import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { theme } from '../../theme/theme';

interface ExerciseDetail {
  name: string;
  sets: number;
  reps?: string;
  image?: string;
}

interface Props {
  username: string;
  routineName: string;
  timeMinutes: number;
  volumeKg: number;
  exercises: ExerciseDetail[];
  timestamp?: string;
}

export const WorkoutCompletionCard = ({
  username,
  routineName,
  timeMinutes,
  volumeKg,
  exercises,
  timestamp = 'just now',
}: Props) => {
  return (
    <Card>
      {/* Header with avatar and metadata */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>{timestamp}</Text>
              <MaterialCommunityIcons
                name="lock"
                size={12}
                color={theme.colors.muted}
              />
              <Text style={styles.privacy}>Only you</Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons
          name="dots-vertical"
          size={20}
          color={theme.colors.muted}
        />
      </View>

      {/* Routine title */}
      <Text style={styles.routineTitle}>{routineName}</Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{timeMinutes}min</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{volumeKg.toLocaleString()} kg</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Exercises list */}
      <View style={styles.exercisesContainer}>
        {exercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseRow}>
            {exercise.image && (
              <Image
                source={{ uri: exercise.image }}
                style={styles.exerciseImage}
              />
            )}
            {!exercise.image && (
              <View style={styles.exercisePlaceholder}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={32}
                  color={theme.colors.muted}
                />
              </View>
            )}
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>
                {exercise.sets} set{exercise.sets !== 1 ? 's' : ''}{' '}
                {exercise.name}
              </Text>
              {exercise.reps && (
                <Text style={styles.exerciseReps}>{exercise.reps}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBlack,
  },
  username: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timestamp: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
  },
  privacy: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
  },
  routineTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeDisplay,
    fontWeight: theme.font.weightBlack,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  statColumn: {
    gap: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBlack,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  exercisesContainer: {
    gap: theme.spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  exercisePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  exerciseName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  exerciseReps: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },
});

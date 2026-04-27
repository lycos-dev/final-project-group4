import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { useTheme } from '../../context/ThemeContext';
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
  timestamp,
}: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

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
            {timestamp ? (
              <View style={styles.metaRow}>
                <Text style={styles.timestamp}>{timestamp}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <MaterialCommunityIcons
          name="dots-vertical"
          size={20}
          color={appTheme.colors.muted}
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
                  color={appTheme.colors.muted}
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

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: appTheme.spacing.md,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: appTheme.spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: appTheme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: appTheme.colors.accentText,
      fontSize: appTheme.font.sizeXl,
      fontWeight: appTheme.font.weightBlack,
    },
    username: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    timestamp: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
    },
    privacy: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
    },
    routineTitle: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeDisplay,
      fontWeight: appTheme.font.weightBlack,
      marginBottom: appTheme.spacing.md,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: appTheme.spacing.xl,
      marginBottom: appTheme.spacing.md,
    },
    statColumn: {
      gap: appTheme.spacing.xs,
    },
    statLabel: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
    },
    statValue: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeLg,
      fontWeight: appTheme.font.weightBlack,
    },
    divider: {
      height: 1,
      backgroundColor: appTheme.colors.border,
      marginVertical: appTheme.spacing.md,
    },
    exercisesContainer: {
      gap: appTheme.spacing.md,
    },
    exerciseRow: {
      flexDirection: 'row',
      gap: appTheme.spacing.md,
      alignItems: 'center',
    },
    exerciseImage: {
      width: 60,
      height: 60,
      borderRadius: appTheme.radius.md,
      backgroundColor: appTheme.colors.surfaceAlt,
    },
    exercisePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: appTheme.radius.md,
      backgroundColor: appTheme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseInfo: {
      flex: 1,
      gap: appTheme.spacing.xs,
    },
    exerciseName: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightMedium,
    },
    exerciseReps: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
    },
  });
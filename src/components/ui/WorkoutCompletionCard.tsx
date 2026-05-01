import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoutine } from '../../context/RoutineContext';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface ExerciseDetail {
  name: string;
  sets: number;
  reps?: string;
  image?: string;
}

interface Props {
  id?: string;
  username: string;
  routineName: string;
  timeMinutes: number;
  volumeKg: number;
  exercises: ExerciseDetail[];
  timestamp?: string;
}

export const WorkoutCompletionCard = ({
  id,
  username,
  routineName,
  timeMinutes,
  volumeKg,
  exercises,
  timestamp,
}: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setCurrentRoutine, addRoutine } = useRoutine();
  const { deleteCompletedWorkout } = useWorkout();

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
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={20}
            color={appTheme.colors.muted}
          />
        </TouchableOpacity>
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
      {/* Menu modal for Save as Routine */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                // Build a temporary routine from this workout and navigate to CreateRoutine
                const tempRoutine = {
                  id: `temp-routine-${Date.now()}`,
                  name: routineName || 'New Routine',
                  createdAt: Date.now(),
                  exercises: exercises.map((ex, i) => ({
                    id: `temp-ex-${i}-${Date.now()}`,
                    name: ex.name,
                    muscleGroup: 'Full Body',
                    equipment: 'Bodyweight',
                    steps: [],
                    imageUrl: ex.image,
                    defaultSets: ex.sets || 3,
                    defaultReps: 10,
                  })),
                } as any;

                setCurrentRoutine(tempRoutine);
                setMenuOpen(false);
                nav.navigate('CreateRoutine' as any);
              }}
            >
              <Text style={styles.menuItemText}>Save as Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (!id) return;
                Alert.alert(
                  'Delete workout?','This will remove the workout from your history. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { deleteCompletedWorkout(id); setMenuOpen(false); } },
                  ]
                );
              }}
            >
              <Text style={[styles.menuItemText, { color: '#E02424' }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuCancel]} onPress={() => setMenuOpen(false)}>
              <Text style={[styles.menuItemText, styles.menuCancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: appTheme.spacing.lg,
    },
    menuSheet: {
      width: '100%',
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      paddingVertical: appTheme.spacing.md,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
    },
    menuItem: {
      paddingVertical: appTheme.spacing.md,
      paddingHorizontal: appTheme.spacing.lg,
    },
    menuItemText: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightMedium,
    },
    menuCancel: {
      borderTopWidth: 1,
      borderTopColor: appTheme.colors.border,
    },
    menuCancelText: {
      color: appTheme.colors.muted,
    },
  });
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { Exercise } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWorkout'>;

interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
}

interface LogExercise extends Exercise {
  notes: string;
  restTimer: boolean;
  sets: WorkoutSet[];
}

export const LogWorkoutScreen = ({ navigation, route }: Props) => {
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<LogExercise[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Initialize exercises from route params
  useEffect(() => {
    if (route.params?.exercisesToAdd) {
      const newExercises = route.params.exercisesToAdd.map((ex) => ({
        ...ex,
        notes: '',
        restTimer: false,
        sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
          id: `${ex.id}-set-${i}`,
          reps: String(ex.defaultReps),
          weight: '0',
          completed: false,
        })),
      }));
      setExercises((prev) => [...prev, ...newExercises]);
    }
  }, [route.params?.exercisesToAdd]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Calculate stats
  useEffect(() => {
    let volume = 0;
    let completedSets = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed) {
          completedSets++;
          volume += Number(set.weight) * Number(set.reps);
        }
      });
    });
    setTotalVolume(volume);
    setTotalSets(completedSets);
  }, [exercises]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      )
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: `${exerciseId}-set-${ex.sets.length}`,
                  reps: String(ex.defaultReps),
                  weight: '0',
                  completed: false,
                },
              ],
            }
          : ex
      )
    );
  };

  const handleAddExercise = () => {
    navigation.navigate('AddExercise');
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{totalVolume} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{totalSets}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="human-male" size={24} color={theme.colors.accent} />
          <MaterialCommunityIcons
            name="human-male"
            size={24}
            color={theme.colors.accent}
            style={{ marginLeft: theme.spacing.xs }}
          />
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <EmptyState
            icon="dumbbell"
            title="Get started"
            subtitle="Add an exercise to start your workout"
          />
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderContent}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="barbell" size={32} color={theme.colors.accent} />
                    </View>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  </View>
                  <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                <TextInput
                  placeholder="Add notes here..."
                  style={styles.notesInput}
                  placeholderTextColor={theme.colors.muted}
                />

                {/* Rest Timer Toggle */}
                <TouchableOpacity style={styles.restTimerButton}>
                  <Ionicons name="timer" size={20} color={theme.colors.accent} />
                  <Text style={styles.restTimerText}>Rest Timer: OFF</Text>
                </TouchableOpacity>

                {/* Sets Grid */}
                <View style={styles.setsContainer}>
                  {/* Header Row */}
                  <View style={styles.setsHeaderRow}>
                    <Text style={[styles.setGridCell, styles.setLabel]}>SET</Text>
                    <Text style={[styles.setGridCell, styles.previousLabel]}>PREVIOUS</Text>
                    <Text style={[styles.setGridCell, styles.weightLabel]}>KG</Text>
                    <Text style={[styles.setGridCell, styles.repsLabel]}>REPS</Text>
                    <View style={styles.setCheckbox} />
                  </View>

                  {/* Set Rows */}
                  {exercise.sets.map((set, index) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={[styles.setGridCell, styles.setNumber]}>{index + 1}</Text>
                      <Text style={[styles.setGridCell, styles.previousValue]}>-</Text>
                      <TextInput
                        style={[styles.setGridCell, styles.setInput]}
                        value={set.weight}
                        onChangeText={(val) => updateSet(exercise.id, set.id, 'weight', val)}
                        keyboardType="decimal-pad"
                        placeholderTextColor={theme.colors.muted}
                      />
                      <TextInput
                        style={[styles.setGridCell, styles.setInput]}
                        value={set.reps}
                        onChangeText={(val) => updateSet(exercise.id, set.id, 'reps', val)}
                        keyboardType="number-pad"
                        placeholderTextColor={theme.colors.muted}
                      />
                      <TouchableOpacity
                        style={[styles.setCheckbox, set.completed && styles.setCheckboxChecked]}
                        onPress={() => toggleSetCompletion(exercise.id, set.id)}
                      >
                        {set.completed && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exercise.id)}
                >
                  <Text style={styles.addSetButtonText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Button
          title="+ Add Exercise"
          onPress={handleAddExercise}
          fullWidth
          style={styles.addButton}
        />

        <View style={styles.bottomButtons}>
          <Button
            title="Settings"
            onPress={() => {}}
            style={styles.halfButton}
            variant="secondary"
          />
          <Button
            title="Discard Workout"
            onPress={handleDiscard}
            style={styles.halfButton}
            variant="destructive"
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  finishButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  finishButtonText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  exercisesList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  exerciseHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  exerciseTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    marginBottom: theme.spacing.md,
  },
  restTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  restTimerText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    marginLeft: theme.spacing.sm,
  },
  setsContainer: {
    marginBottom: theme.spacing.md,
  },
  setsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  setGridCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.font.sizeSm,
    color: theme.colors.text,
  },
  setLabel: {
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  previousLabel: {
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  weightLabel: {
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  repsLabel: {
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  setNumber: {
    fontWeight: theme.font.weightBold,
  },
  previousValue: {
    color: theme.colors.muted,
  },
  setInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.xs,
    color: theme.colors.text,
    textAlign: 'center',
  },
  setCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCheckboxChecked: {
    backgroundColor: theme.colors.accent,
  },
  addSetButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  addSetButtonText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  addButton: {
    marginBottom: theme.spacing.md,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfButton: {
    flex: 1,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { Exercise } from '../../types';
import { useWorkout, LogExercise, WorkoutSet } from '../../context/WorkoutContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWorkout'>;

interface ActiveRestTimer {
  exerciseId: string;
  setId: string;
  remainingTime: number;
  duration: number;
}

const REST_TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

export const LogWorkoutScreen = ({ navigation, route }: Props) => {
  const { exercises, setExercises, addExercises, clearWorkout } = useWorkout();
  const [startTime] = useState(Date.now());

  // Seed exercises from route param (e.g. when launched from ExploreRoutines).
  // ExploreRoutinesScreen already calls addExercises() + clearWorkout() before
  // navigating here, so this effect only fires when the caller passes exercises
  // directly through the param instead (legacy path kept for compatibility).
  useEffect(() => {
    const toAdd = route.params?.exercisesToAdd;
    if (toAdd && toAdd.length > 0) {
      addExercises(toAdd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [elapsed, setElapsed] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [showRestTimerModal, setShowRestTimerModal] = useState<string | null>(null);
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);

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

  // Rest timer countdown effect
  useEffect(() => {
    if (!activeRestTimer) return;

    const interval = setInterval(() => {
      setActiveRestTimer((prev) => {
        if (!prev) return null;
        if (prev.remainingTime <= 1) {
          return null; // Timer finished
        }
        return { ...prev, remainingTime: prev.remainingTime - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestTimer]);

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
    setExercises((prev: LogExercise[]) =>
      prev.map((ex: LogExercise) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s: WorkoutSet) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    const exercise = exercises.find((ex: LogExercise) => ex.id === exerciseId);
    const set = exercise?.sets.find((s: WorkoutSet) => s.id === setId);
    
    setExercises((prev: LogExercise[]) =>
      prev.map((ex: LogExercise) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s: WorkoutSet) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      )
    );

    // Start rest timer if marking set as complete and timer is enabled
    if (set && !set.completed && exercise && exercise.restTimerDuration > 0) {
      setActiveRestTimer({
        exerciseId,
        setId,
        remainingTime: exercise.restTimerDuration,
        duration: exercise.restTimerDuration,
      });
    }
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex: LogExercise) =>
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

  const updateRestTimerDuration = (exerciseId: string, duration: number) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex: LogExercise) =>
        ex.id === exerciseId ? { ...ex, restTimerDuration: duration } : ex
      )
    );
    setShowRestTimerModal(null);
  };

  const skipRestTimer = () => {
    setActiveRestTimer(null);
  };

  const adjustRestTimer = (adjustment: number) => {
    setActiveRestTimer((prev) => {
      if (!prev) return null;
      const newTime = Math.max(0, prev.remainingTime + adjustment);
      return { ...prev, remainingTime: newTime };
    });
  };

  const handleAddExercise = () => {
    navigation.navigate('AddExercise');
  };

  const handleFinish = () => {
    clearWorkout(route.params?.routineName);
    navigation.goBack();
  };

  const handleDiscard = () => {
    clearWorkout();
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
            icon="fitness"
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
                  <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setShowExerciseMenu(exercise.id)}
                  >
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
                <TouchableOpacity 
                  style={styles.restTimerButton}
                  onPress={() => setShowRestTimerModal(exercise.id)}
                >
                  <Ionicons name="timer" size={20} color={theme.colors.accent} />
                  <Text style={styles.restTimerText}>
                    Rest Timer: {exercise.restTimerDuration > 0 ? `${exercise.restTimerDuration}s` : 'OFF'}
                  </Text>
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

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimerModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestTimerModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            {showRestTimerModal && exercises.find(ex => ex.id === showRestTimerModal)?.name && (
              <Text style={styles.modalSubtitle}>
                {exercises.find(ex => ex.id === showRestTimerModal)?.name}
              </Text>
            )}

            {REST_TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timerOption,
                  showRestTimerModal &&
                    exercises.find(ex => ex.id === showRestTimerModal)?.restTimerDuration === option.value &&
                    styles.timerOptionSelected,
                ]}
                onPress={() =>
                  showRestTimerModal &&
                  updateRestTimerDuration(showRestTimerModal, option.value)
                }
              >
                <Text style={styles.timerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <Button
              title="Done"
              onPress={() => setShowRestTimerModal(null)}
              fullWidth
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Rest Timer Display */}
      {activeRestTimer && (
        <View style={styles.restTimerOverlay}>
          <View style={styles.restTimerDisplay}>
            <Text style={styles.restTimerDisplayTitle}>Rest Timer</Text>
            {exercises.find(ex => ex.id === activeRestTimer.exerciseId)?.name && (
              <Text style={styles.restTimerDisplayExercise}>
                {exercises.find(ex => ex.id === activeRestTimer.exerciseId)?.name}
              </Text>
            )}

            <View style={styles.restTimerContent}>
              <TouchableOpacity
                style={styles.timerAdjustButton}
                onPress={() => adjustRestTimer(-15)}
              >
                <Text style={styles.timerAdjustText}>-15</Text>
              </TouchableOpacity>

              <Text style={styles.timerDisplay}>
                {String(Math.floor(activeRestTimer.remainingTime / 60)).padStart(2, '0')}:
                {String(activeRestTimer.remainingTime % 60).padStart(2, '0')}
              </Text>

              <TouchableOpacity
                style={styles.timerAdjustButton}
                onPress={() => adjustRestTimer(15)}
              >
                <Text style={styles.timerAdjustText}>+15</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Skip"
              onPress={skipRestTimer}
              fullWidth
              style={styles.skipButton}
            />
          </View>
        </View>
      )}

      {/* Exercise Menu Modal */}
      <Modal
        visible={showExerciseMenu !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowExerciseMenu(null)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowExerciseMenu(null);
                // Handle reorder
              }}
            >
              <Ionicons name="swap-vertical" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Reorder Exercises</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowExerciseMenu(null);
                // Handle replace
              }}
            >
              <MaterialCommunityIcons name="sync" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Replace Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowExerciseMenu(null);
                // Handle superset
              }}
            >
              <Ionicons name="add-circle" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Add To Superset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                if (showExerciseMenu) {
                  setExercises((prev) =>
                    prev.filter((ex) => ex.id !== showExerciseMenu)
                  );
                }
                setShowExerciseMenu(null);
              }}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
              <Text style={[styles.menuItemText, { color: '#ff6b6b' }]}>Remove Exercise</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Rest Timer Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    gap: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  timerOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  timerOptionSelected: {
    backgroundColor: theme.colors.accent,
  },
  timerOptionText: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.text,
  },
  modalButton: {
    marginTop: theme.spacing.md,
  },
  // Rest Timer Display Styles
  restTimerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTimerDisplay: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    width: '85%',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  restTimerDisplayTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  restTimerDisplayExercise: {
    fontSize: theme.font.sizeMd,
    color: theme.colors.accent,
    fontWeight: theme.font.weightMedium,
  },
  restTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    justifyContent: 'center',
    width: '100%',
  },
  timerAdjustButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerAdjustText: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
    fontFamily: 'Courier New',
    minWidth: 100,
    textAlign: 'center',
  },
  skipButton: {
    width: '100%',
  },
  // Exercise Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    overflow: 'hidden',
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.text,
  },
});
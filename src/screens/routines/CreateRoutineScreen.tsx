import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { Routine, RoutineExercise } from '../../types';
import { useRoutine } from '../../context/RoutineContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoutine'>;

interface ExerciseRowSet {
  id: string;
  reps: string;
  weight: string;
}

interface ExerciseState {
  notes: string;
  restTimerDuration: number;
  sets: ExerciseRowSet[];
}

const REST_TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

export const CreateRoutineScreen = ({ navigation, route }: Props) => {
  const { routines, addRoutine, updateRoutine, setCurrentRoutine, currentRoutine } = useRoutine();
  const params = route.params;
  const editing = params?.routineId ? routines.find((r) => r.id === params.routineId) : undefined;

  const [title, setTitle] = useState(editing?.name ?? '');
  const [exercises, setExercises] = useState<RoutineExercise[]>(editing?.exercises ?? []);
  const [exerciseStates, setExerciseStates] = useState<Map<string, ExerciseState>>(new Map());
  const [showRestTimerModal, setShowRestTimerModal] = useState<string | null>(null);
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      // Sync exercises from context when screen comes into focus
      let sourcedExercises: RoutineExercise[] = exercises;

      if (editing?.id) {
        // For editing, get from routines array
        const updated = routines.find((r) => r.id === editing.id);
        if (updated) {
          sourcedExercises = updated.exercises;
        }
      } else if (currentRoutine?.id?.startsWith('temp-routine')) {
        // For new routines, get from currentRoutine
        sourcedExercises = currentRoutine.exercises;
      }

      // Update if exercises changed
      if (
        sourcedExercises.length !== exercises.length ||
        sourcedExercises.some((ex) => !exercises.some((sel) => sel.id === ex.id))
      ) {
        setExercises(sourcedExercises);

        // Update exercise states
        const newStates = new Map<string, ExerciseState>();
        sourcedExercises.forEach((ex) => {
          if (exerciseStates.has(ex.id)) {
            newStates.set(ex.id, exerciseStates.get(ex.id)!);
          } else {
            newStates.set(ex.id, {
              notes: ex.notes ?? '',
              restTimerDuration: 0,
              sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
                id: `${ex.id}-set-${i}`,
                reps: String(ex.defaultReps),
                weight: '0',
              })),
            });
          }
        });
        setExerciseStates(newStates);
      }
    }, [editing, routines, currentRoutine])
  );

  const handleAddExercise = () => {
    // For new routines, create a temporary routine to hold exercises
    if (!editing) {
      const tempRoutine: Routine = {
        id: `temp-routine-${Date.now()}`,
        name: title || 'New Routine',
        createdAt: Date.now(),
        exercises,
      };
      setCurrentRoutine(tempRoutine);
    }
    navigation.navigate('SelectExerciseForRoutine');
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a routine title');
      return;
    }

    const routine: Routine = {
      id: editing?.id ?? `routine-${Date.now()}`,
      name: title.trim(),
      createdAt: editing?.createdAt ?? Date.now(),
      exercises: exercises.map((ex) => ({
        ...ex,
        notes: exerciseStates.get(ex.id)?.notes ?? '',
      })),
    };

    if (editing) {
      updateRoutine(routine);
    } else {
      addRoutine(routine);
    }

    setCurrentRoutine(routine);
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    setExerciseStates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(exerciseId);
      return newMap;
    });
  };

  const updateExerciseNote = (exerciseId: string, note: string) => {
    setExerciseStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(exerciseId);
      if (state) {
        newMap.set(exerciseId, { ...state, notes: note });
      }
      return newMap;
    });
  };

  const updateRestTimer = (exerciseId: string, duration: number) => {
    setExerciseStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(exerciseId);
      if (state) {
        newMap.set(exerciseId, { ...state, restTimerDuration: duration });
      }
      return newMap;
    });
    setShowRestTimerModal(null);
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setExerciseStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(exerciseId);
      if (state) {
        newMap.set(exerciseId, {
          ...state,
          sets: state.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        });
      }
      return newMap;
    });
  };

  const addSet = (exerciseId: string) => {
    setExerciseStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(exerciseId);
      if (state) {
        const exercise = exercises.find((ex) => ex.id === exerciseId);
        newMap.set(exerciseId, {
          ...state,
          sets: [
            ...state.sets,
            {
              id: `${exerciseId}-set-${state.sets.length}`,
              reps: String(exercise?.defaultReps ?? 10),
              weight: '0',
            },
          ],
        });
      }
      return newMap;
    });
  };

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Routine Title Input */}
      <View style={styles.titleSection}>
        <TextInput
          placeholder="Routine title"
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell" size={56} color={theme.colors.muted} style={{ marginBottom: theme.spacing.lg }} />
            <Text style={styles.emptyTitle}>Get started by adding an exercise to your routine.</Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => {
              const state = exerciseStates.get(exercise.id) || {
                notes: '',
                restTimerDuration: 0,
                sets: [],
              };

              return (
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
                    placeholder="Add routine notes here"
                    value={state.notes}
                    onChangeText={(text) => updateExerciseNote(exercise.id, text)}
                    style={styles.notesInput}
                    placeholderTextColor={theme.colors.muted}
                  />

                  {/* Rest Timer */}
                  <TouchableOpacity
                    style={styles.restTimerButton}
                    onPress={() => setShowRestTimerModal(exercise.id)}
                  >
                    <Ionicons
                      name="timer"
                      size={20}
                      color={state.restTimerDuration > 0 ? theme.colors.accent : theme.colors.muted}
                    />
                    <Text
                      style={[
                        styles.restTimerText,
                        { color: state.restTimerDuration > 0 ? theme.colors.accent : theme.colors.muted },
                      ]}
                    >
                      Rest Timer: {state.restTimerDuration > 0 ? `${state.restTimerDuration}s` : 'OFF'}
                    </Text>
                  </TouchableOpacity>

                  {/* Sets Grid */}
                  <View style={styles.setsContainer}>
                    {/* Header Row */}
                    <View style={styles.setsHeaderRow}>
                      <Text style={[styles.setGridCell, styles.setLabel]}>SET</Text>
                      <Text style={[styles.setGridCell, styles.weightLabel]}>KG</Text>
                      <Text style={[styles.setGridCell, styles.repsLabel]}>REPS</Text>
                    </View>

                    {/* Set Rows */}
                    {state.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setGridCell, styles.setNumber]}>{index + 1}</Text>
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
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Exercise Button */}
      <View style={styles.actionsSection}>
        <Button title="+ Add exercise" onPress={handleAddExercise} fullWidth />
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
            {showRestTimerModal && exercises.find((ex) => ex.id === showRestTimerModal)?.name && (
              <Text style={styles.modalSubtitle}>
                {exercises.find((ex) => ex.id === showRestTimerModal)?.name}
              </Text>
            )}

            {REST_TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timerOption,
                  showRestTimerModal &&
                    exerciseStates.get(showRestTimerModal)?.restTimerDuration === option.value &&
                    styles.timerOptionSelected,
                ]}
                onPress={() => showRestTimerModal && updateRestTimer(showRestTimerModal, option.value)}
              >
                <Text style={styles.timerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <Button title="Done" onPress={() => setShowRestTimerModal(null)} fullWidth style={styles.modalButton} />
          </View>
        </View>
      </Modal>

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
              <Ionicons name="sync" size={20} color={theme.colors.accent} />
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
                  removeExercise(showExerciseMenu);
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
  cancelText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  headerTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  saveButtonText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleInput: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    textAlign: 'center',
    maxWidth: 200,
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
  setInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.xs,
    color: theme.colors.text,
    textAlign: 'center',
  },
  addSetButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addSetButtonText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
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

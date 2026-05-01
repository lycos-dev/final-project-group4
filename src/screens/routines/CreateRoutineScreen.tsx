import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../context/ThemeContext';
import { Routine, RoutineExercise, RoutineFolder } from '../../types';
import { useRoutine } from '../../context/RoutineContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  { label: 'Off',  value: 0  },
  { label: '5s',   value: 5  },
  { label: '10s',  value: 10 },
  { label: '15s',  value: 15 },
  { label: '30s',  value: 30 },
  { label: '60s',  value: 60 },
];

// ── Modal type union ────────────────────────────────────────────────────────
type ActiveModal =
  | { type: 'restTimer'; exerciseId: string }
  | { type: 'exerciseMenu'; exerciseId: string }
  | { type: 'confirmSave' }
  | { type: 'confirmCancel' }
  | { type: 'confirmRemoveExercise'; exerciseId: string }
  | { type: 'folderPicker' }
  | { type: 'createFolder' };

// Styles factory (created at runtime with the active theme)
const createStyles = (theme: any) =>
  StyleSheet.create({
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
    headerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
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
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
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

    folderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    folderRowText: {
      flex: 1,
      fontSize: theme.font.sizeSm,
      color: theme.colors.muted,
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
    menuButton: { padding: theme.spacing.sm },
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
    setsContainer: { marginBottom: theme.spacing.md },
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
    setLabel: { fontWeight: theme.font.weightBold, color: theme.colors.muted },
    weightLabel: { fontWeight: theme.font.weightBold, color: theme.colors.muted },
    repsLabel: { fontWeight: theme.font.weightBold, color: theme.colors.muted },
    setNumber: { fontWeight: theme.font.weightBold },
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
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.xl,
      width: '100%',
      alignItems: 'center',
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalIconWrap: {
      marginBottom: theme.spacing.sm,
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
      lineHeight: 20,
    },
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
      width: '100%',
    },
    modalBtnSecondary: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalBtnSecondaryText: {
      color: theme.colors.text,
      fontWeight: theme.font.weightBold,
      fontSize: theme.font.sizeMd,
    },
    modalBtnPrimary: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
    },
    modalBtnPrimaryText: {
      color: theme.colors.accentText,
      fontWeight: theme.font.weightBold,
      fontSize: theme.font.sizeMd,
    },
    modalButton: { marginTop: theme.spacing.md },

    folderNameInput: {
      width: '100%',
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.font.sizeMd,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    sheetOverlay: {
      flex: 1,
      backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.28)',
      justifyContent: 'flex-end',
    },
    sheetContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
    },
    sheetTitle: {
      fontSize: theme.font.sizeLg,
      fontWeight: theme.font.weightBold,
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },

    folderOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    folderOptionText: {
      flex: 1,
      fontSize: theme.font.sizeMd,
      color: theme.colors.text,
    },
    newFolderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    newFolderBtnText: {
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightBold,
      color: theme.colors.accent,
    },

    timerOption: {
      width: '100%',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    timerOptionSelected: { backgroundColor: theme.colors.accent },
    timerOptionText: {
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      color: theme.colors.text,
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
    menuItemDanger: { borderBottomWidth: 0 },
    menuItemText: {
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      color: theme.colors.text,
    },
  });

export const CreateRoutineScreen = ({ navigation, route }: Props) => {
  const {
    routines,
    addRoutine,
    updateRoutine,
    setCurrentRoutine,
    currentRoutine,
    folders,
    addFolder,
    assignRoutineToFolder,
  } = useRoutine();

  const params = route.params;
  const editing = params?.routineId
    ? routines.find((r) => r.id === params.routineId)
    : undefined;

  // If the user tapped "Create a Routine" inside a specific folder, we get
  // targetFolderId. In that case the routine is pre-assigned to that folder
  // and the folder picker row is hidden entirely.
  const targetFolderId = params?.targetFolderId;
  const isLockedToFolder = !!targetFolderId && !editing;

  const [title, setTitle]             = useState(editing?.name ?? '');
  const [exercises, setExercises]     = useState<RoutineExercise[]>(editing?.exercises ?? []);
  const [exerciseStates, setExerciseStates] = useState<Map<string, ExerciseState>>(new Map());
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    editing?.folderId ?? targetFolderId
  );
  const [newFolderName, setNewFolderName] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  // ── Fix #3: Track dirty state properly — start as false, only mark dirty on actual user changes ──
  const [isDirty, setIsDirty] = useState(false);

  // Snapshot of original values so we can detect real changes
  const originalTitle = useRef(editing?.name ?? '');
  const originalExerciseCount = useRef(editing?.exercises?.length ?? 0);

  const closeModal = () => setActiveModal(null);

  // Use the app theme from context so styles adapt to light/dark modes
  const { theme: selectedTheme, isDark } = useTheme();
  const theme = { ...selectedTheme, isDark } as any;
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  // BottomSheetModal defined inside component so it can access dynamic styles
  const BottomSheetModal = ({
    visible,
    onClose,
    children,
  }: {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) => {
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }} onStartShouldSetResponder={() => true}>
            {children}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ── Fix #1: Clear temp routine on initial mount so back-navigation doesn't restore stale exercises ──
  useEffect(() => {
    if (!editing) {
      // Only clear temp routine when we first enter a NEW routine screen
      setCurrentRoutine(null);
    }
  }, []);

  // ── Sync exercises from context on focus ──────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      let sourcedExercises: RoutineExercise[] = exercises;

      if (editing?.id) {
        const updated = routines.find((r) => r.id === editing.id);
        if (updated) sourcedExercises = updated.exercises;
      } else if (currentRoutine?.id?.startsWith('temp-routine')) {
        sourcedExercises = currentRoutine.exercises;
      }

      const changed =
        sourcedExercises.length !== exercises.length ||
        sourcedExercises.some((ex) => !exercises.some((sel) => sel.id === ex.id));

      if (changed) {
        setExercises(sourcedExercises);
        // ── Fix #3: Adding exercises IS a real change, so mark dirty ──
        if (sourcedExercises.length !== originalExerciseCount.current) {
          setIsDirty(true);
        }

        const newStates = new Map<string, ExerciseState>();
        sourcedExercises.forEach((ex) => {
          const key = ex.instanceId || ex.id;
          if (exerciseStates.has(key)) {
            newStates.set(key, exerciseStates.get(key)!);
          } else {
            newStates.set(key, {
              notes: ex.notes ?? '',
              restTimerDuration: ex.restTimerDuration ?? 0,
              sets: (ex.routineSets && ex.routineSets.length > 0) 
                ? ex.routineSets 
                : Array.from({ length: ex.defaultSets }, (_, i) => ({
                    id: `${key}-set-${i}`,
                    reps: '',
                    weight: '',
                  })),
            });
          }
        });
        setExerciseStates(newStates);
      }
    }, [editing, routines, currentRoutine])
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddExercise = () => {
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

  // Called after the user confirms in the Save modal
  const commitSave = () => {
    const routine: Routine = {
      id: editing?.id ?? `routine-${Date.now()}`,
      name: title.trim(),
      createdAt: editing?.createdAt ?? Date.now(),
      exercises: exercises.map((ex) => ({
        ...ex,
        notes: exerciseStates.get(ex.id)?.notes ?? '',
      })),
      folderId: selectedFolderId,
    };

    if (editing) {
      updateRoutine(routine);
    } else {
      addRoutine(routine);
    }

    if (selectedFolderId) {
      assignRoutineToFolder(routine.id, selectedFolderId);
    }

    setCurrentRoutine(routine);
    closeModal();
    navigation.goBack();
  };

  const handleSavePress = () => {
    if (!title.trim()) {
      setActiveModal(null);
      setTimeout(() => alert('Please enter a routine title before saving.'), 100);
      return;
    }
    if (exercises.length === 0) {
      setTimeout(() => alert('Add at least one exercise before saving.'), 100);
      return;
    }
    setActiveModal({ type: 'confirmSave' });
  };

  // ── Fix #3: Only show discard confirmation when user actually made changes ──
  const handleCancelPress = () => {
    const titleChanged = title.trim() !== originalTitle.current.trim();
    const exercisesChanged = exercises.length !== originalExerciseCount.current;
    const hasRealChanges = isDirty || titleChanged || exercisesChanged;

    if (hasRealChanges) {
      setActiveModal({ type: 'confirmCancel' });
    } else {
      navigation.goBack();
    }
  };

  const removeExercise = (exerciseInstanceId: string) => {
    setExercises((prev) => prev.filter((e) => (e.instanceId || e.id) !== exerciseInstanceId));
    setExerciseStates((prev) => {
      const m = new Map(prev);
      m.delete(exerciseInstanceId);
      return m;
    });
    setIsDirty(true);
  };

  const updateExerciseNote = (exerciseInstanceId: string, note: string) => {
    setExerciseStates((prev) => {
      const m = new Map(prev);
      const s = m.get(exerciseInstanceId);
      if (s) m.set(exerciseInstanceId, { ...s, notes: note });
      return m;
    });
    setIsDirty(true);
  };

  const updateRestTimer = (exerciseInstanceId: string, duration: number) => {
    setExerciseStates((prev) => {
      const m = new Map(prev);
      const s = m.get(exerciseInstanceId);
      if (s) m.set(exerciseInstanceId, { ...s, restTimerDuration: duration });
      return m;
    });
    closeModal();
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight',
    value: string
  ) => {
    setExerciseStates((prev) => {
      const m = new Map(prev);
      const s = m.get(exerciseId);
      if (s)
        m.set(exerciseId, {
          ...s,
          sets: s.sets.map((st) => (st.id === setId ? { ...st, [field]: value } : st)),
        });
      return m;
    });
    setIsDirty(true);
  };

  const addSet = (exerciseInstanceId: string) => {
    setExerciseStates((prev) => {
      const m = new Map(prev);
      const s = m.get(exerciseInstanceId);
      if (s) {
        const ex = exercises.find((e) => e.id === exerciseInstanceId);
        m.set(exerciseInstanceId, {
          ...s,
          sets: [
            ...s.sets,
            {
              id: `${exerciseInstanceId}-set-${s.sets.length}-${Date.now()}`,
              reps: '10',
              weight: '0',
            },
          ],
        });
      }
      return m;
    });
    setIsDirty(true);
  };

  // ── Folder helpers ────────────────────────────────────────────────────────

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folder = addFolder(newFolderName.trim());
    setSelectedFolderId(folder.id);
    setNewFolderName('');
    closeModal();
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Screen padded={false} forceTopSafe>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelPress}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editing ? 'Edit Routine' : 'Create Routine'}
        </Text>
        <TouchableOpacity onPress={handleSavePress} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ── Routine Title Input ────────────────────────────────────────── */}
      <View style={styles.titleSection}>
        <TextInput
          placeholder="Routine title"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            // Only mark dirty if the title actually differs from original
            if (t.trim() !== originalTitle.current.trim()) setIsDirty(true);
          }}
          style={styles.titleInput}
          placeholderTextColor={theme.colors.muted}
        />
      </View>

      {/* ── Folder Picker Row — hidden when created from inside a folder ── */}
      {isLockedToFolder ? (
        // Read-only label showing which folder this will be saved to
        <View style={styles.folderRow}>
          <Ionicons name="folder-open-outline" size={18} color={theme.colors.accent} />
          <Text style={[styles.folderRowText, { color: theme.colors.accent }]}>
            {selectedFolder ? selectedFolder.name : 'Assigned folder'}
          </Text>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.muted} />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.folderRow}
          onPress={() => setActiveModal({ type: 'folderPicker' })}
          activeOpacity={0.75}
        >
          <Ionicons
            name="folder-open-outline"
            size={18}
            color={selectedFolder ? theme.colors.accent : theme.colors.muted}
          />
          <Text
            style={[
              styles.folderRowText,
              selectedFolder && { color: theme.colors.accent },
            ]}
          >
            {selectedFolder ? selectedFolder.name : 'No folder — tap to assign'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
        </TouchableOpacity>
      )}

      {/* ── Exercises List ─────────────────────────────────────────────── */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="barbell"
              size={56}
              color={theme.colors.muted}
              style={{ marginBottom: theme.spacing.lg }}
            />
            <Text style={styles.emptyTitle}>
              Get started by adding an exercise to your routine.
            </Text>
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => {
              const exerciseKey = exercise.instanceId || exercise.id;
              const state = exerciseStates.get(exerciseKey) ?? {
                notes: '',
                restTimerDuration: 0,
                sets: [],
              };

              return (
                <View key={exerciseKey} style={styles.exerciseCard}>
                  {/* ── Fix #5: Exercise header — title is NOT touchable, only the 3-dot button ── */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseHeaderContent}>
                      <View style={styles.exerciseIcon}>
                        <Ionicons name="barbell" size={32} color={theme.colors.accent} />
                      </View>
                      {/* Title is plain View, not TouchableOpacity */}
                      <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() =>
                        setActiveModal({ type: 'exerciseMenu', exerciseId: exerciseKey })
                      }
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color={theme.colors.muted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Notes */}
                  <TextInput
                    placeholder="Add routine notes here"
                    value={state.notes}
                    onChangeText={(text) => updateExerciseNote(exerciseKey, text)}
                    style={styles.notesInput}
                    placeholderTextColor={theme.colors.muted}
                  />

                  {/* Rest Timer */}
                  <TouchableOpacity
                    style={styles.restTimerButton}
                    onPress={() =>
                      setActiveModal({ type: 'restTimer', exerciseId: exerciseKey })
                    }
                  >
                    <Ionicons
                      name="timer"
                      size={20}
                      color={
                        state.restTimerDuration > 0
                          ? theme.colors.accent
                          : theme.colors.muted
                      }
                    />
                    <Text
                      style={[
                        styles.restTimerText,
                        {
                          color:
                            state.restTimerDuration > 0
                              ? theme.colors.accent
                              : theme.colors.muted,
                        },
                      ]}
                    >
                      Rest Timer:{' '}
                      {state.restTimerDuration > 0
                        ? `${state.restTimerDuration}s`
                        : 'OFF'}
                    </Text>
                  </TouchableOpacity>

                  {/* Sets Grid */}
                  <View style={styles.setsContainer}>
                    <View style={styles.setsHeaderRow}>
                      <Text style={[styles.setGridCell, styles.setLabel]}>SET</Text>
                      <Text style={[styles.setGridCell, styles.weightLabel]}>KG</Text>
                      <Text style={[styles.setGridCell, styles.repsLabel]}>REPS</Text>
                    </View>

                    {state.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setGridCell, styles.setNumber]}>
                          {index + 1}
                        </Text>
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.weight}
                          onChangeText={(val) =>
                            updateSet(exerciseKey, set.id, 'weight', val)
                          }
                          keyboardType="decimal-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.reps}
                          onChangeText={(val) =>
                            updateSet(exerciseKey, set.id, 'reps', val)
                          }
                          keyboardType="number-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => addSet(exerciseKey)}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Add Exercise Button ────────────────────────────────────────── */}
      <View style={[
        styles.actionsSection,
        { paddingBottom: theme.spacing.lg + (insets.bottom ?? 0) },
      ]}>
        <Button title="+ Add exercise" onPress={handleAddExercise} fullWidth />
      </View>

      {/* ════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════ */}

      {/* ── Fix #4: Confirm Save — improved description text ────────────── */}
      <Modal
        visible={activeModal?.type === 'confirmSave'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle-outline" size={40} color={theme.colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Save Routine?</Text>
            {/* Fix #4: Clearer description */}
            <Text style={styles.modalSubtitle}>
              {editing
                ? `Your changes to "${title.trim()}" will be saved${selectedFolder ? ` in "${selectedFolder.name}"` : ''}.`
                : `"${title.trim()}" will be added to your routines${selectedFolder ? ` under "${selectedFolder.name}"` : ''}.`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Not Yet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={commitSave}>
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fix #3: Confirm Cancel / Discard — only shown when isDirty ────── */}
      <Modal
        visible={activeModal?.type === 'confirmCancel'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={40} color={theme.colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Discard Changes?</Text>
            <Text style={styles.modalSubtitle}>
              Any unsaved changes to this routine will be lost.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { backgroundColor: theme.colors.danger }]}
                onPress={() => {
                  closeModal();
                  // Fix #1: Clear any temp routine state so it won't be restored on re-entry
                  if (!editing) setCurrentRoutine(null);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Remove Exercise ──────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'confirmRemoveExercise'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-outline" size={40} color={theme.colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Remove Exercise?</Text>
            <Text style={styles.modalSubtitle}>
              {activeModal?.type === 'confirmRemoveExercise'
                ? `"${exercises.find((e) => e.id === activeModal.exerciseId)?.name ?? 'This exercise'}" will be removed from this routine.`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { backgroundColor: theme.colors.danger }]}
                onPress={() => {
                  if (activeModal?.type === 'confirmRemoveExercise') {
                    removeExercise(activeModal.exerciseId);
                  }
                  closeModal();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fix #6: Folder Picker — overlay appears instantly, sheet slides up ── */}
      <BottomSheetModal
        visible={activeModal?.type === 'folderPicker'}
        onClose={closeModal}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Assign to Folder</Text>

          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {/* No folder option */}
            <TouchableOpacity
              style={styles.folderOption}
              onPress={() => { setSelectedFolderId(undefined); closeModal(); }}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={!selectedFolderId ? theme.colors.accent : theme.colors.muted}
              />
              <Text
                style={[
                  styles.folderOptionText,
                  !selectedFolderId && { color: theme.colors.accent },
                ]}
              >
                No Folder
              </Text>
              {!selectedFolderId && (
                <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
              )}
            </TouchableOpacity>

            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderOption}
                onPress={() => { setSelectedFolderId(folder.id); closeModal(); }}
              >
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={
                    selectedFolderId === folder.id
                      ? theme.colors.accent
                      : theme.colors.muted
                  }
                />
                <Text
                  style={[
                    styles.folderOptionText,
                    selectedFolderId === folder.id && { color: theme.colors.accent },
                  ]}
                >
                  {folder.name}
                </Text>
                {selectedFolderId === folder.id && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Create new folder */}
          <TouchableOpacity
            style={styles.newFolderBtn}
            onPress={() => {
              closeModal();
              setTimeout(() => setActiveModal({ type: 'createFolder' }), 300);
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.newFolderBtnText}>Create New Folder</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      {/* ── Create Folder ────────────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'createFolder'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="folder-open-outline" size={40} color={theme.colors.accent} />
            </View>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              placeholder="Folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              style={styles.folderNameInput}
              placeholderTextColor={theme.colors.muted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setNewFolderName(''); closeModal(); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnPrimary,
                  !newFolderName.trim() && { opacity: 0.4 },
                ]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.modalBtnPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Rest Timer ───────────────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'restTimer'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            {activeModal?.type === 'restTimer' && (
              <Text style={styles.modalSubtitle}>
                {exercises.find((ex) => ex.id === activeModal.exerciseId)?.name}
              </Text>
            )}
            {REST_TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timerOption,
                  activeModal?.type === 'restTimer' &&
                    exerciseStates.get(activeModal.exerciseId)?.restTimerDuration ===
                      option.value &&
                    styles.timerOptionSelected,
                ]}
                onPress={() =>
                  activeModal?.type === 'restTimer' &&
                  updateRestTimer(activeModal.exerciseId, option.value)
                }
              >
                <Text style={styles.timerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Done" onPress={closeModal} fullWidth style={styles.modalButton} />
          </View>
        </View>
      </Modal>

      {/* ── Fix #6: Exercise Menu (bottom sheet) — overlay instant, sheet animates ── */}
      <BottomSheetModal
        visible={activeModal?.type === 'exerciseMenu'}
        onClose={closeModal}
      >
        <View style={styles.sheetContent}>
          <TouchableOpacity style={styles.menuItem} onPress={closeModal}>
            <Ionicons name="swap-vertical" size={20} color={theme.colors.accent} />
            <Text style={styles.menuItemText}>Reorder Exercises</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={closeModal}>
            <Ionicons name="sync" size={20} color={theme.colors.accent} />
            <Text style={styles.menuItemText}>Replace Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={closeModal}>
            <Ionicons name="add-circle" size={20} color={theme.colors.accent} />
            <Text style={styles.menuItemText}>Add To Superset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => {
              const id =
                activeModal?.type === 'exerciseMenu' ? activeModal.exerciseId : null;
              closeModal();
              if (id)
                setTimeout(
                  () => setActiveModal({ type: 'confirmRemoveExercise', exerciseId: id }),
                  300
                );
            }}
          >
            <Ionicons name="trash" size={20} color={theme.colors.danger} />
            <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>
              Remove Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    </Screen>
  );
};


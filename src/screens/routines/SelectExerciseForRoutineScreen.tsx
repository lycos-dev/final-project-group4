import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { useExercises } from '../../context/ExerciseContext';
import { useRoutine } from '../../context/RoutineContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useTheme } from '../../context/ThemeContext';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectExerciseForRoutine'>;

const EQUIPMENT_TYPES = [
  'All Equipment',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Bodyweight',
  'Cable',
  'Treadmill',
];

const EXERCISE_VIEW_TYPES = ['All Exercise', 'Favorite Exercise'] as const;
type ExerciseViewType = (typeof EXERCISE_VIEW_TYPES)[number];

// runtime styles factory
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
    cancelButton: {
      color: theme.colors.accent,
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
    },
    title: {
      fontSize: theme.font.sizeLg,
      fontWeight: theme.font.weightBold,
      color: theme.colors.text,
    },
    createButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    createButtonText: {
      color: theme.colors.accent,
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightBold,
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.bg,
    },
    searchIcon: {
      marginRight: theme.spacing.md,
    },
    inputWrapper: { flex: 1 },
    searchInput: { marginBottom: 0 },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
      alignItems: 'center',
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonText: {
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      color: theme.colors.text,
    },
    clearButton: { padding: theme.spacing.sm },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      maxHeight: '80%',
      paddingTop: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: theme.font.sizeLg,
      fontWeight: theme.font.weightBold,
      color: theme.colors.text,
    },
    modalListContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalItemIcon: { marginRight: theme.spacing.md },
    modalItemText: {
      flex: 1,
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      color: theme.colors.text,
    },
    sectionHeader: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
    sectionTitleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
    sectionTitle: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold, color: theme.colors.text },
    listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 90 },
    exerciseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginVertical: theme.spacing.xs,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    exerciseItemSelected: { backgroundColor: theme.colors.bg, borderLeftColor: theme.colors.accent },
    exerciseContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    exerciseActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
    floatingButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 0,
      paddingBottom: 25,
    },
    addExercisesButton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, paddingVertical: theme.spacing.md, alignItems: 'center', justifyContent: 'center' },
    addExercisesButtonDisabled: { opacity: 0.5 },
    addExercisesButtonText: { color: theme.colors.accentText, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
    exerciseImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
    exerciseInfo: { flex: 1 },
    exerciseName: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightMedium, color: theme.colors.text, marginBottom: theme.spacing.xs },
    exerciseMuscle: { fontSize: theme.font.sizeSm, color: theme.colors.muted },
  });
export const SelectExerciseForRoutineScreen = ({ navigation }: Props) => {
  const { theme: selectedTheme, isDark } = useTheme();
  const theme = { ...selectedTheme, isDark } as any;
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const { exercises } = useExercises();
  const { currentRoutine, setCurrentRoutine, updateRoutine } = useRoutine();
  const { favoriteExerciseIds, toggleFavoriteExercise } = useWorkout();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All Muscles'>('All Muscles');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipment');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [selectedExerciseView, setSelectedExerciseView] = useState<ExerciseViewType>('All Exercise');
  const [showExerciseViewModal, setShowExerciseViewModal] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesSearch = search === '' || e.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All Muscles' || e.muscleGroup === selectedMuscle;
      const matchesEquipment = selectedEquipment === 'All Equipment' || e.equipment === selectedEquipment;
      const matchesFavorite = selectedExerciseView === 'All Exercise' || favoriteExerciseIds.has(e.id);
      return matchesSearch && matchesMuscle && matchesEquipment && matchesFavorite;
    });
  }, [exercises, search, selectedMuscle, selectedEquipment, selectedExerciseView, favoriteExerciseIds]);

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const handleAddExercises = () => {
    const toAdd = filtered.filter((ex) => selectedExercises.has(ex.id));
    console.log('Adding exercises to routine:', toAdd.map(e => e.name));
    console.log('Current routine before add:', currentRoutine);
    
    if (!currentRoutine) {
      console.error('No current routine set');
      return;
    }

    const newExercises = [
      ...currentRoutine.exercises,
      ...toAdd.map((ex) => ({
        ...ex,
        instanceId: `${ex.id}-${Date.now()}-${Math.random()}`, // Unique ID for each instance
        notes: '',
      })),
    ];

    const updated = {
      ...currentRoutine,
      exercises: newExercises,
    };

    console.log('Updated routine exercises:', updated.exercises.map(e => e.name));

    // Update using updateRoutine if editing, otherwise just set current
    if (updated.id && !updated.id.startsWith('temp-routine')) {
      updateRoutine(updated);
    } else {
      setCurrentRoutine(updated);
    }

    navigation.goBack();
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Exercise</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExerciseForm', {})} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Ionicons
          name="search"
          size={20}
          color={theme.colors.muted}
          style={styles.searchIcon}
        />
        <View style={styles.inputWrapper}>
          <Input
            placeholder="Search exercise"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text style={styles.filterButtonText}>{selectedEquipment}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowMuscleModal(true)}
        >
          <Text style={styles.filterButtonText}>{selectedMuscle}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
        </TouchableOpacity>

        {(selectedEquipment !== 'All Equipment' || selectedMuscle !== 'All Muscles') && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedEquipment('All Equipment');
              setSelectedMuscle('All Muscles');
            }}
          >
            <Ionicons name="close" size={16} color={theme.colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <TouchableOpacity
          style={styles.sectionTitleButton}
          onPress={() => setShowExerciseViewModal(true)}
        >
          <Text style={styles.sectionTitle}>{selectedExerciseView}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Screen padded={false}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.exerciseItem,
              selectedExercises.has(item.id) && styles.exerciseItemSelected
            ]} 
            activeOpacity={0.7}
            onPress={() => toggleExerciseSelection(item.id)}
          >
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseImage}>
                <Ionicons
                  name="barbell"
                  size={40}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMuscle}>{item.muscleGroup}</Text>
              </View>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavoriteExercise(item.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={favoriteExerciseIds.has(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favoriteExerciseIds.has(item.id) ? theme.colors.accent : theme.colors.muted}
                />
              </TouchableOpacity>
              {selectedExercises.has(item.id) && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <View style={[
        styles.floatingButtonContainer,
        { paddingBottom: theme.spacing.lg + (insets.bottom ?? 0) },
      ]}>
        <TouchableOpacity 
          style={[
            styles.addExercisesButton,
            selectedExercises.size === 0 && styles.addExercisesButtonDisabled
          ]}
          onPress={handleAddExercises}
          disabled={selectedExercises.size === 0}
        >
          <Text style={styles.addExercisesButtonText}>
            + Add {selectedExercises.size || 0} exercise{selectedExercises.size !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Equipment Modal */}
      <Modal
        visible={showEquipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Equipment</Text>
              <TouchableOpacity onPress={() => setShowEquipmentModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={['All Equipment', ...EQUIPMENT_TYPES.slice(1)]}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedEquipment(item);
                    setShowEquipmentModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedEquipment === item && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Muscle Modal */}
      <Modal
        visible={showMuscleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMuscleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Muscle Group</Text>
              <TouchableOpacity onPress={() => setShowMuscleModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={['All Muscles', ...MUSCLE_GROUPS]}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedMuscle(item as MuscleGroup | 'All Muscles');
                    setShowMuscleModal(false);
                  }}
                >
                  <View style={styles.modalItemIcon}>
                    <Ionicons name="body" size={24} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedMuscle === item && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExerciseViewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exercise View</Text>
              <TouchableOpacity onPress={() => setShowExerciseViewModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={EXERCISE_VIEW_TYPES}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedExerciseView(item);
                    setShowExerciseViewModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedExerciseView === item && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};



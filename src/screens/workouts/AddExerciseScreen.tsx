import React, { useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { useExercises } from '../../context/ExerciseContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout, LogExercise, SetType } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Theme } from '../../theme/theme';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExercise'>;

const EQUIPMENT_TYPES = [
  'Choose Equipment',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
  'Smith Machine',
  'EZ Bar',
  'Medicine Ball',
  'Stability Ball',
  'Other',
];

const EXERCISE_VIEW_TYPES = ['All Exercise', 'Favorite Exercise'] as const;
type ExerciseViewType = (typeof EXERCISE_VIEW_TYPES)[number];

export const AddExerciseScreen = ({ navigation, route }: Props) => {
  const { theme: appTheme } = useTheme();
  const theme = appTheme;
  const styles = createStyles(appTheme);
  const { exercises } = useExercises();
  const { addExercises, setExercises, settings, favoriteExerciseIds, toggleFavoriteExercise } = useWorkout();
  const exerciseHistory = useWorkout().exerciseHistory as Record<string, { setCount: number; reps: string; weight: string }>;

  // Header is now rendered within the Screen component
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All Muscles'>('All Muscles');
  const [selectedEquipment, setSelectedEquipment] = useState('Choose Equipment');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);
  const [selectedExerciseView, setSelectedExerciseView] = useState<ExerciseViewType>('All Exercise');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All Muscles' || e.muscleGroup === selectedMuscle;
      const matchesEquipment = selectedEquipment === 'Choose Equipment' || e.equipment === selectedEquipment;
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
    const replaceExerciseId = route.params?.replaceExerciseId;

    if (replaceExerciseId) {
      if (toAdd.length === 0) return;
      if (toAdd.length > 1) {
        Alert.alert('Choose one exercise', 'Select exactly one exercise when replacing.');
        return;
      }

      const selected = toAdd[0];
      const uniqueInstanceId = `${selected.id}-${Date.now()}-${Math.random()}`;
      const history = exerciseHistory[selected.id];
      
      // Determine sets based on history or default
      const sets = history
        ? Array.from({ length: history.setCount }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: history.reps,
              weight: history.weight,
              completed: false,
              type: 'normal' as SetType,
            }))
        : Array.from({ length: selected.defaultSets ?? 3 }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: '',
              weight: '',
              completed: false,
              type: 'normal' as SetType,
            }));

      const replacement: LogExercise = {
        ...selected,
        id: uniqueInstanceId,
        originalExerciseId: selected.id,
        notes: '',
        restTimerDuration: ((selected as any).restTimerDuration ?? settings.defaultRestSeconds),
        sets, // Override the sets from selected
      };

      setExercises((prev) =>
        prev.map((exercise) => (exercise.id === replaceExerciseId ? replacement : exercise)),
      );
      navigation.goBack();
      return;
    }

    addExercises(toAdd);
    navigation.goBack();
  };

  // No renderHeader needed - using navigation.setOptions instead

  return (
    <Screen forceTopSafe padded={false}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.bg} />
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={[styles.cancelButtonText, { color: theme.colors.accent }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Exercise</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExerciseForm', {})} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Ionicons name="search" size={20} color={theme.colors.muted} style={styles.searchIcon} />
        <View style={styles.inputWrapper}>
          <Input
            placeholder="Search exercises..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowMuscleModal(true)}
        >
          <Text style={styles.filterButtonText}>{selectedMuscle === 'All Muscles' ? 'All Muscles' : selectedMuscle}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
        </TouchableOpacity>

  <TouchableOpacity
           style={styles.filterButton}
           onPress={() => setShowEquipmentModal(true)}
         >
           <Text style={styles.filterButtonText}>{selectedEquipment === 'All Equipment' ? 'Choose Equipment' : selectedEquipment}</Text>
           <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
         </TouchableOpacity>

        {selectedMuscle !== 'All Muscles' || selectedEquipment !== 'All Equipment' ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedMuscle('All Muscles');
              setSelectedEquipment('All Equipment');
            }}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Exercise View Toggle */}
      <View style={styles.viewToggleContainer}>
        {EXERCISE_VIEW_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.viewToggleButton,
              selectedExerciseView === type && styles.viewToggleActive,
            ]}
            onPress={() => setSelectedExerciseView(type)}
          >
            <Text style={[
              styles.viewToggleText,
              selectedExerciseView === type && styles.viewToggleTextActive,
            ]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.exerciseItem,
              selectedExercises.has(item.id) && styles.exerciseItemSelected,
            ]}
            onPress={() => toggleExerciseSelection(item.id)}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseDetail}>{item.muscleGroup} • {item.equipment}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavoriteExercise(item.id);
                }}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={favoriteExerciseIds.has(item.id) ? "star" : "star-outline"} 
                  size={20} 
                  color={favoriteExerciseIds.has(item.id) ? theme.colors.accent : theme.colors.muted} 
                />
              </TouchableOpacity>
              {selectedExercises.has(item.id) ? (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
              ) : (
                <View style={styles.checkbox} />
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Equipment Modal */}
      <Modal
        visible={showEquipmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEquipmentModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEquipmentModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Equipment</Text>
            {EQUIPMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalItem,
                  selectedEquipment === type && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedEquipment(type);
                  setShowEquipmentModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedEquipment === type && styles.modalItemTextActive,
                ]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Muscle Group Modal */}
      <Modal
        visible={showMuscleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMuscleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMuscleModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Muscle Group</Text>
            {MUSCLE_GROUPS.map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.modalItem,
                  selectedMuscle === group && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedMuscle(group);
                  setShowMuscleModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedMuscle === group && styles.modalItemTextActive,
                ]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddExercises}
        >
          <Text style={styles.addButtonText}>
            Add {selectedExercises.size} Exercise{selectedExercises.size !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const createStyles = (appTheme: Theme) => {
  const theme = appTheme;

  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    cancelButton: {
      color: theme.colors.accent,
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      paddingVertical: 4,
      minWidth: 60,
    },
    title: {
      fontSize: theme.font.sizeLg,
      fontWeight: theme.font.weightBold,
      color: theme.colors.text,
      textAlign: 'center',
      flex: 1,
    },
    createButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      minWidth: 60,
      alignItems: 'flex-end',
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
    inputWrapper: {
      flex: 1,
    },
    searchInput: {
      marginBottom: 0,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    filterButtonText: {
      fontSize: theme.font.sizeSm,
      color: theme.colors.text,
    },
    clearButton: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.sm,
    },
    viewToggleContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    viewToggleButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    viewToggleActive: {
      borderBottomColor: theme.colors.accent,
    },
    viewToggleText: {
      fontSize: theme.font.sizeSm,
      color: theme.colors.muted,
    },
    viewToggleTextActive: {
      color: theme.colors.accent,
      fontWeight: theme.font.weightBold,
    },
    exerciseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    exerciseItemSelected: {
      backgroundColor: `${theme.colors.accent}20`,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightMedium,
      color: theme.colors.text,
    },
    exerciseDetail: {
      fontSize: theme.font.sizeSm,
      color: theme.colors.muted,
      marginTop: 2,
    },
    favoriteButton: {
      padding: 4,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    listContent: {
      paddingBottom: 80,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.bg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    addButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    addButtonText: {
      color: theme.colors.accentText,
      fontSize: theme.font.sizeMd,
      fontWeight: theme.font.weightBold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: theme.font.sizeLg,
      fontWeight: theme.font.weightBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    modalItem: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalItemSelected: {
      backgroundColor: `${theme.colors.accent}20`,
    },
    modalItemText: {
      fontSize: theme.font.sizeMd,
      color: theme.colors.text,
    },
    modalItemTextActive: {
      color: theme.colors.accent,
      fontWeight: theme.font.weightBold,
    },
  });
};

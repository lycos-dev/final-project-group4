import React, { useLayoutEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { useRoutine } from '../../context/RoutineContext';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export const RoutinesScreen = () => {
  const nav = useNavigation<Nav>();
  const { routines, setCurrentRoutine } = useRoutine();
  const { exercises: activeExercises, addExercises, clearWorkout } = useWorkout();

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <IconButton
          name="add"
          onPress={() => {
            setCurrentRoutine(null);
            nav.navigate('CreateRoutine' as any);
          }}
          color={theme.colors.accent}
          size={24}
        />
      ),
    });
  }, [nav]);

  const onSelectRoutine = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      setCurrentRoutine(routine);
      nav.navigate('CreateRoutine' as any, { routineId });
    }
  };

  const handleStartRoutine = (routine: typeof routines[0]) => {
    const doStart = () => {
      clearWorkout();
      // Convert RoutineExercise to Exercise type for addExercises
      const exercisesToAdd = routine.exercises.map((ex) => ({
        ...ex,
        routineSets: ex.routineSets || [],
      }));
      addExercises(exercisesToAdd);
      nav.navigate('LogWorkout', {
        exercisesToAdd: [],
        routineName: routine.name,
        sourceScreen: 'ExploreRoutines', // Reuse same navigation logic
      });
    };

    // Warn if a workout is already in progress
    if (activeExercises.length > 0) {
      Alert.alert(
        'Replace Active Workout?',
        `You have a workout in progress. Starting "${routine.name}" will discard it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Anyway', style: 'destructive', onPress: doStart },
        ],
      );
    } else {
      doStart();
    }
  };

  const renderRoutineItem = ({ item }: { item: typeof routines[0] }) => (
    <View style={styles.routineCardWrapper}>
      <TouchableOpacity
        onPress={() => onSelectRoutine(item.id)}
        activeOpacity={0.7}
        style={{ flex: 1 }}
      >
        <Card style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineName}>{item.name}</Text>
              <Text style={styles.exerciseCount}>
                {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={theme.colors.muted}
            />
          </View>
        </Card>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => handleStartRoutine(item)}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={16} color={theme.colors.accentText} />
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );

  if (routines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="barbell"
          title="Routine Builder"
          subtitle="Create custom routines to organize your workouts."
          ctaLabel="Create Routine"
          onCtaPress={() => {
            setCurrentRoutine(null);
            nav.navigate('CreateRoutine' as any);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={routines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  routineCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  routineCard: {
    flex: 1,
    padding: theme.spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.xs,
  },
  exerciseCount: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    gap: 4,
  },
  startButtonText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },
});

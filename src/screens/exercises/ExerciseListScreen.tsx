import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExerciseListItem } from '../../components/exercises/ExerciseListItem';
import { MuscleGroupFilter } from '../../components/exercises/MuscleGroupFilter';
import { useExercises } from '../../context/ExerciseContext';
import { MuscleGroup } from '../../types';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ExerciseListScreen = () => {
  const nav = useNavigation<Nav>();
  const { exercises } = useExercises();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesQ = e.name.toLowerCase().includes(query.toLowerCase());
      const matchesG = filter === 'All' || e.muscleGroup === filter;
      return matchesQ && matchesG;
    });
  }, [exercises, query, filter]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Input
          placeholder="Search exercises..."
          value={query}
          onChangeText={setQuery}
          style={{ marginBottom: 0 }}
        />
        <MuscleGroupFilter selected={filter} onSelect={setFilter} />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No exercises found"
          subtitle="Try changing filters or add a new exercise."
          ctaLabel="Add Exercise"
          onCtaPress={() => nav.navigate('ExerciseForm', {})}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ExerciseListItem
              exercise={item}
              onPress={() => nav.navigate('ExerciseDetail', { exerciseId: item.id })}
            />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('ExerciseForm', {})} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={theme.colors.accentText} />
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  list: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: 96 },
  fab: {
    position: 'absolute', bottom: theme.spacing.xl, right: theme.spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

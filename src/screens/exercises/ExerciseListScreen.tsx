import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.topSection}>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Exercises</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            title="Start New Workout"
            onPress={() => nav.navigate('LogWorkout', { exercisesToAdd: [] })}
            fullWidth
            style={styles.primaryButton}
          />

          {/* Quick Action Cards */}
          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => nav.navigate('ExerciseForm', {})}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil-box-outline" size={40} color={theme.colors.accent} />
              <Text style={styles.cardTitle}>New Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={40} color={theme.colors.accent} />
              <Text style={styles.cardTitle}>Explore</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filter Section */}
        <View style={styles.header}>
          <Input
            placeholder="Search exercises..."
            value={query}
            onChangeText={setQuery}
            style={{ marginBottom: 0 }}
          />
          <MuscleGroupFilter selected={filter} onSelect={setFilter} />
        </View>

        {/* Exercise List */}
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
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ExerciseListItem
                exercise={item}
                onPress={() => nav.navigate('ExerciseDetail', { exerciseId: item.id })}
              />
            )}
          />
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('ExerciseForm', {})} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={theme.colors.accentText} />
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  proBadgeText: {
    color: '#000',
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  primaryButton: {
    marginBottom: theme.spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 96,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

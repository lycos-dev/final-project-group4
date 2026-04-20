import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useExercises } from '../../context/ExerciseContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
type R = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreen = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, removeExercise } = useExercises();
  const exercise = getById(params.exerciseId);

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () =>
        exercise ? (
          <IconButton name="create-outline" onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })} />
        ) : null,
    });
  }, [nav, exercise]);

  if (!exercise) {
    return (
      <Screen>
        <Text style={styles.muted}>Exercise not found.</Text>
      </Screen>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete exercise?', `Remove "${exercise.name}" from your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeExercise(exercise.id);
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>{exercise.name}</Text>
      <Text style={styles.subtitle}>{exercise.muscleGroup} • {exercise.equipment}</Text>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{exercise.defaultSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{exercise.defaultReps}</Text>
          <Text style={styles.statLabel}>Reps</Text>
        </Card>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.body}>{exercise.instructions}</Text>
      </Card>

      <Button
        title="Edit Exercise"
        onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
        style={{ marginTop: theme.spacing.lg }}
      />
      <Button title="Delete" variant="destructive" onPress={handleDelete} style={{ marginTop: theme.spacing.md }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: theme.font.sizeDisplay, fontWeight: theme.font.weightBlack },
  subtitle: { color: theme.colors.muted, fontSize: theme.font.sizeMd, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md },
  stat: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  statValue: { color: theme.colors.accent, fontSize: theme.font.sizeXxl, fontWeight: theme.font.weightBlack },
  statLabel: { color: theme.colors.muted, fontSize: theme.font.sizeXs, marginTop: 2 },
  sectionTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.sm },
  body: { color: theme.colors.muted, fontSize: theme.font.sizeMd, lineHeight: 22 },
  muted: { color: theme.colors.muted },
});

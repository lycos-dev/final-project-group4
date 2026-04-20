import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useExercises } from '../../context/ExerciseContext';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';
import { required, numberInRange, maxLength } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseForm'>;
type R = RouteProp<RootStackParamList, 'ExerciseForm'>;

export const ExerciseFormScreen = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, addExercise, updateExercise } = useExercises();

  const editing = params?.exerciseId ? getById(params.exerciseId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(editing?.muscleGroup ?? 'Chest');
  const [equipment, setEquipment] = useState(editing?.equipment ?? '');
  const [instructions, setInstructions] = useState(editing?.instructions ?? '');
  const [sets, setSets] = useState(String(editing?.defaultSets ?? 3));
  const [reps, setReps] = useState(String(editing?.defaultReps ?? 10));
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useLayoutEffect(() => {
    nav.setOptions({ title: editing ? 'Edit Exercise' : 'New Exercise' });
  }, [nav, editing]);

  const validate = () => {
    const e: Record<string, string | null> = {
      name: required(name) || maxLength(name, 60),
      equipment: required(equipment) || maxLength(equipment, 40),
      instructions: maxLength(instructions, 500),
      sets: numberInRange(sets, 1, 20, 'Sets'),
      reps: numberInRange(reps, 1, 200, 'Reps'),
    };
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  const onSave = () => {
    if (!validate()) return;
    const payload = {
      name: name.trim(),
      muscleGroup,
      equipment: equipment.trim(),
      instructions: instructions.trim(),
      defaultSets: Number(sets),
      defaultReps: Number(reps),
    };
    if (editing) {
      updateExercise({ ...editing, ...payload });
    } else {
      addExercise(payload);
    }
    nav.goBack();
  };

  return (
    <Screen scroll>
      <Input label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="e.g. Bench Press" />

      <Text style={styles.label}>Muscle Group</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row' }}>
          {MUSCLE_GROUPS.map((g) => (
            <Chip key={g} label={g} active={muscleGroup === g} onPress={() => setMuscleGroup(g)} />
          ))}
        </View>
      </ScrollView>

      <Input label="Equipment" value={equipment} onChangeText={setEquipment} error={errors.equipment} placeholder="e.g. Barbell" />
      <Input
        label="Instructions"
        value={instructions}
        onChangeText={setInstructions}
        error={errors.instructions}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        placeholder="How to perform this exercise..."
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <Input label="Sets" value={sets} onChangeText={setSets} keyboardType="numeric" error={errors.sets} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
          <Input label="Reps" value={reps} onChangeText={setReps} keyboardType="numeric" error={errors.reps} />
        </View>
      </View>

      <Button title={editing ? 'Save Changes' : 'Add Exercise'} onPress={onSave} style={{ marginTop: theme.spacing.md }} />
      <Button title="Cancel" variant="ghost" onPress={() => nav.goBack()} style={{ marginTop: theme.spacing.sm }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  label: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginBottom: theme.spacing.xs, fontWeight: theme.font.weightMedium },
  row: { flexDirection: 'row' },
});

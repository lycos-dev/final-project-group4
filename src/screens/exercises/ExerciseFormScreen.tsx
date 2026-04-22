import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { useExercises } from '../../context/ExerciseContext';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';
import { required, numberInRange, maxLength } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseForm'>;
type R = RouteProp<RootStackParamList, 'ExerciseForm'>;

/**
 * Convert a steps array → single textarea string (one step per line).
 * Empty array → empty string.
 */
const stepsToText = (steps: string[]): string => steps.join('\n');

/**
 * Split a textarea string by newlines → trimmed, non-empty steps array.
 */
const textToSteps = (text: string): string[] =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

// ─── Component ────────────────────────────────────────────────────────────────

export const ExerciseFormScreen = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, addExercise, updateExercise } = useExercises();

  const editing = params?.exerciseId ? getById(params.exerciseId) : undefined;

  const [name, setName]             = useState(editing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(editing?.muscleGroup ?? 'Chest');
  const [equipment, setEquipment]   = useState(editing?.equipment ?? '');
  const [imageUrl, setImageUrl]     = useState(editing?.imageUrl ?? '');
  /** Steps displayed as a single multiline block; split on save. */
  const [stepsText, setStepsText]   = useState(stepsToText(editing?.steps ?? []));
  const [sets, setSets]             = useState(String(editing?.defaultSets ?? 3));
  const [reps, setReps]             = useState(String(editing?.defaultReps ?? 10));

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useLayoutEffect(() => {
    nav.setOptions({ title: editing ? 'Edit Exercise' : 'New Exercise' });
  }, [nav, editing]);

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string | null> = {
      name:      required(name) ?? maxLength(name, 60, 'Name'),
      equipment: required(equipment) ?? maxLength(equipment, 40, 'Equipment'),
      imageUrl:  imageUrl ? maxLength(imageUrl, 500, 'Image URL') : null,
      stepsText: stepsText ? maxLength(stepsText, 1000, 'Steps') : null,
      sets:      numberInRange(sets, 1, 20, 'Sets'),
      reps:      numberInRange(reps, 1, 200, 'Reps'),
    };
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  // ── Save ─────────────────────────────────────────────────────────────
  const onSave = () => {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      muscleGroup,
      equipment: equipment.trim(),
      imageUrl: imageUrl.trim() || undefined,
      steps: textToSteps(stepsText),
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
      {/* ── Basic Info ───────────────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>EXERCISE INFO</Text>
      <Card style={styles.card}>
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="e.g. Bench Press"
          autoCapitalize="words"
        />
        <Input
          label="Equipment"
          value={equipment}
          onChangeText={setEquipment}
          error={errors.equipment}
          placeholder="e.g. Barbell"
          autoCapitalize="words"
        />
      </Card>

      {/* ── Muscle Group Picker ──────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>MUSCLE GROUP</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g} label={g} active={muscleGroup === g} onPress={() => setMuscleGroup(g)} />
        ))}
      </ScrollView>

      {/* ── Media ────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>MEDIA</Text>
      <Card style={styles.card}>
        <Input
          label="Image / GIF URL"
          value={imageUrl}
          onChangeText={setImageUrl}
          error={errors.imageUrl}
          placeholder="https://example.com/bench-press.gif"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          hint="Paste a direct link to a photo or animated GIF"
        />
      </Card>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>INSTRUCTIONS</Text>
      <Card style={styles.card}>
        <Input
          label="Steps"
          value={stepsText}
          onChangeText={setStepsText}
          error={errors.stepsText}
          multiline
          numberOfLines={6}
          style={styles.stepsInput}
          placeholder={'Type each step on a new line, e.g.:\nGrip bar just outside shoulders.\nLower bar to mid-chest.\nDrive up explosively.'}
          hint="One coaching cue per line — each line becomes a numbered step"
        />
        {/* Live step preview */}
        {stepsText.trim().length > 0 && (
          <View style={styles.previewWrap}>
            <Text style={styles.previewLabel}>Preview · {textToSteps(stepsText).length} step(s)</Text>
            {textToSteps(stepsText).map((step, i) => (
              <View key={i} style={styles.previewRow}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.previewText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* ── Default Volume ───────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>DEFAULT VOLUME</Text>
      <Card style={styles.card}>
        <View style={styles.volumeRow}>
          <View style={styles.volumeField}>
            <Input
              label="Sets"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              error={errors.sets}
              placeholder="3"
            />
          </View>
          <View style={styles.volumeDivider} />
          <View style={styles.volumeField}>
            <Input
              label="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              error={errors.reps}
              placeholder="10"
            />
          </View>
        </View>
      </Card>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <Button
        title={editing ? 'Save Changes' : 'Add Exercise'}
        onPress={onSave}
        fullWidth
        style={{ marginTop: theme.spacing.xl }}
      />
      <Button
        title="Cancel"
        variant="ghost"
        onPress={() => nav.goBack()}
        fullWidth
        style={{ marginTop: theme.spacing.sm }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  sectionGap: { marginTop: theme.spacing.xl },

  card: { padding: theme.spacing.lg },

  chipScroll: { marginBottom: 0 },
  chipRow: { flexDirection: 'row', paddingBottom: theme.spacing.xs },

  stepsInput: {
    minHeight: 130,
    textAlignVertical: 'top',
    fontFamily: undefined, // keep system font
    lineHeight: 22,
  },

  // Step preview inside the card
  previewWrap: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  previewLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  previewBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${theme.colors.accent}22`,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewBadgeText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: theme.font.weightBlack,
  },
  previewText: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
  },

  // Volume row
  volumeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  volumeField: { flex: 1 },
  volumeDivider: { width: theme.spacing.md },
});
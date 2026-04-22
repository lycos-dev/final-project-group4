import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useProfile } from '../../context/ProfileContext';
import {
  validateName,
  validateAge,
  validateHeight,
  validateWeight,
  validateGoal,
  validateProfileForm,
  hasErrors,
  ProfileFormErrors,
} from '../../utils/validation';
import { theme } from '../../theme/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  age: string;
  height: string;
  weight: string;
  goal: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the initial form state from the stored profile, respecting current units. */
const formFromProfile = (
  profile: ReturnType<typeof useProfile>['profile'],
  isImperial: boolean,
): FormState => ({
  name: profile.name,
  age: String(profile.age),
  height: isImperial
    ? String(Math.round(profile.heightCm / 2.54))
    : String(profile.heightCm),
  weight: isImperial
    ? String(Math.round(profile.weightKg * 2.20462))
    : String(profile.weightKg),
  goal: profile.goal,
});

/** Returns true if any field differs from the snapshot taken at mount. */
const isDirty = (current: FormState, original: FormState): boolean =>
  (Object.keys(current) as (keyof FormState)[]).some(
    (k) => current[k].trim() !== original[k].trim(),
  );

// ─── Component ────────────────────────────────────────────────────────────────

export const EditProfileScreen = () => {
  const { profile, settings, updateProfile } = useProfile();
  const nav = useNavigation();
  const isImperial = settings.units === 'imperial';

  // Snapshot of values at mount — used to detect dirty state
  const [original] = useState<FormState>(() => formFromProfile(profile, isImperial));
  const [form, setForm] = useState<FormState>(original);
  const [errors, setErrors] = useState<ProfileFormErrors>({
    name: null, age: null, height: null, weight: null, goal: null,
  });

  const formIsDirty = isDirty(form, original);

  // ── Real-time single-field validation ────────────────────────────────
  const handleChange = useCallback(
    (field: keyof FormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      let error: string | null = null;
      switch (field) {
        case 'name':   error = validateName(value); break;
        case 'age':    error = validateAge(value); break;
        case 'height': error = validateHeight(value, isImperial); break;
        case 'weight': error = validateWeight(value, isImperial); break;
        case 'goal':   error = validateGoal(value); break;
      }
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [isImperial],
  );

  // ── Persist to context ───────────────────────────────────────────────
  const doSave = useCallback((): boolean => {
    const finalErrors = validateProfileForm(form, isImperial);
    setErrors(finalErrors);
    if (hasErrors(finalErrors)) return false;

    const heightCm = isImperial
      ? Math.round(Number(form.height) * 2.54)
      : Number(form.height);
    const weightKg = isImperial
      ? Number(form.weight) * 0.453592
      : Number(form.weight);

    updateProfile({
      name: form.name.trim(),
      age: Number(form.age),
      heightCm,
      weightKg,
      goal: form.goal.trim(),
    });
    return true;
  }, [form, isImperial, updateProfile]);

  const onSave = () => {
    if (doSave()) nav.goBack();
  };

  // ── Unsaved-changes guard ────────────────────────────────────────────
  // The `beforeRemove` event fires for ALL removal actions:
  //   • Cancel button (goBack)
  //   • iOS swipe-back gesture
  //   • Android hardware back button
  //   • Header back chevron
  useEffect(() => {
    const unsubscribe = (nav as any).addListener('beforeRemove', (e: any) => {
      if (!formIsDirty) return; // clean — let it through

      e.preventDefault(); // block navigation

      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => (nav as any).dispatch(e.data.action),
          },
          {
            text: 'Save',
            onPress: () => {
              const saved = doSave();
              // Only navigate away if validation passed
              if (saved) (nav as any).dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [nav, formIsDirty, doSave]);

  // ── Unit display labels ──────────────────────────────────────────────
  const heightUnit = isImperial ? 'in' : 'cm';
  const weightUnit = isImperial ? 'lb' : 'kg';

  return (
    <Screen scroll>
      {/* ── Section: Identity ──────────────────────────────────────────── */}
      <Text style={styles.sectionLabel}>IDENTITY</Text>
      <Card style={styles.group}>
        <Input
          label="Full Name"
          value={form.name}
          onChangeText={handleChange('name')}
          error={errors.name}
          placeholder="e.g. Alex Rivera"
          autoCapitalize="words"
          autoCorrect={false}
          hint="At least 2 characters"
        />
        <Input
          label="Age"
          value={form.age}
          onChangeText={handleChange('age')}
          keyboardType="numeric"
          error={errors.age}
          placeholder="e.g. 27"
          hint="Must be between 10 and 120"
        />
      </Card>

      {/* ── Section: Body Stats ────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>
        BODY STATS · {isImperial ? 'IMPERIAL' : 'METRIC'}
      </Text>
      <Card style={styles.group}>
        <Input
          label="Height"
          value={form.height}
          onChangeText={handleChange('height')}
          keyboardType="numeric"
          error={errors.height}
          placeholder={isImperial ? 'e.g. 70' : 'e.g. 178'}
          unit={heightUnit}
          hint={isImperial ? '20–107 in' : '50–272 cm'}
        />
        <Input
          label="Weight"
          value={form.weight}
          onChangeText={handleChange('weight')}
          keyboardType="numeric"
          error={errors.weight}
          placeholder={isImperial ? 'e.g. 168' : 'e.g. 76'}
          unit={weightUnit}
          hint={isImperial ? '2–1,100 lb' : '1–500 kg'}
        />
      </Card>

      {/* ── Section: Goal ──────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>FITNESS GOAL</Text>
      <Card style={styles.group}>
        <Input
          label="Goal"
          value={form.goal}
          onChangeText={handleChange('goal')}
          error={errors.goal}
          multiline
          numberOfLines={3}
          placeholder="e.g. Build lean muscle and improve endurance"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
          hint="Optional · max 200 characters"
        />
      </Card>

      {/* ── Unit hint ──────────────────────────────────────────────────── */}
      <View style={styles.unitHint}>
        <Text style={styles.unitHintText}>
          Unit system is controlled in{' '}
          <Text style={styles.unitHintLink}>Settings → Units</Text>.
        </Text>
      </View>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <Button
        title="Save Changes"
        onPress={onSave}
        fullWidth
        style={{ marginTop: theme.spacing.xl }}
      />
      {/* Triggers the beforeRemove listener above when dirty */}
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
  group: {
    gap: 0,
    padding: theme.spacing.lg,
  },
  unitHint: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  unitHintText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    lineHeight: 18,
  },
  unitHintLink: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightMedium,
  },
});
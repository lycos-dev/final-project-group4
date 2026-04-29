import React, { useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useExercises } from '../../context/ExerciseContext';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';
import { required, numberInRange, maxLength } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseForm'>;
type R = RouteProp<RootStackParamList, 'ExerciseForm'>;

const stepsToText = (steps: string[]): string => steps.join('\n');
const textToSteps = (text: string): string[] =>
  text.split('\n').map((s) => s.trim()).filter(Boolean);

export const ExerciseFormScreen = () => {
  const { theme: appTheme } = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, addExercise, updateExercise } = useExercises();

  const editing = params?.exerciseId ? getById(params.exerciseId) : undefined;

  const [name, setName]               = useState(editing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(editing?.muscleGroup ?? 'Chest');
  const [equipment, setEquipment]     = useState(editing?.equipment ?? '');
  const [imageUrl, setImageUrl]       = useState(editing?.imageUrl ?? '');
  const [stepsText, setStepsText]     = useState(stepsToText(editing?.steps ?? []));
  const [sets, setSets]               = useState(String(editing?.defaultSets ?? 3));
  const [reps, setReps]               = useState(String(editing?.defaultReps ?? 10));

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [muscleOpen, setMuscleOpen] = useState(false);

  useLayoutEffect(() => {
    nav.setOptions({ title: editing ? 'Edit Exercise' : 'New Exercise' });
  }, [nav, editing]);

  const validate = () => {
    const e: Record<string, string | null> = {
      name:      required(name) ?? maxLength(name, 60, 'Name'),
      equipment: required(equipment) ?? maxLength(equipment, 40, 'Equipment'),
      imageUrl:  imageUrl ? maxLength(imageUrl, 1000, 'Image') : null,
      stepsText: stepsText ? maxLength(stepsText, 1000, 'Steps') : null,
      sets:      numberInRange(sets, 1, 20, 'Sets'),
      reps:      numberInRange(reps, 1, 200, 'Reps'),
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
      imageUrl: imageUrl.trim() || undefined,
      steps: textToSteps(stepsText),
      defaultSets: Number(sets),
      defaultReps: Number(reps),
    };
    if (editing) updateExercise({ ...editing, ...payload });
    else addExercise(payload);
    nav.goBack();
  };

  const pickImageFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow access to your photo library to upload an image.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Could not open photos', String(err));
    }
  };

  const clearImage = () => setImageUrl('');

  return (
    <Screen scroll>
      {/* ── Basic Info ─────────────────────────────────────────────────── */}
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
          placeholder="e.g. Barbell, Dumbbell, Bodyweight…"
          autoCapitalize="words"
          hint="Type whatever you use — your choice"
        />
      </Card>

      {/* ── Muscle Group dropdown ──────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, styles.sectionGap]}>MUSCLE GROUP</Text>
      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            backgroundColor: appTheme.colors.surface,
            borderColor: appTheme.colors.border,
          },
        ]}
        onPress={() => setMuscleOpen(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dropdownValue, { color: appTheme.colors.text }]}>{muscleGroup}</Text>
        <Ionicons name="chevron-down" size={18} color={appTheme.colors.muted} />
      </TouchableOpacity>

      <Modal
        visible={muscleOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMuscleOpen(false)}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          onPress={() => setMuscleOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: appTheme.colors.text }]}>Choose muscle group</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {MUSCLE_GROUPS.map((g) => {
                const active = g === muscleGroup;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.option,
                      active && { backgroundColor: `${appTheme.colors.accent}14` },
                    ]}
                    onPress={() => {
                      setMuscleGroup(g);
                      setMuscleOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: appTheme.colors.text },
                        active && { color: appTheme.colors.accent, fontWeight: appTheme.font.weightBold },
                      ]}
                    >
                      {g}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={18} color={appTheme.colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Media — URL or upload from library ─────────────────────────── */}
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
          hint="Paste a link, or upload from your photos below"
        />

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={pickImageFromLibrary}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={18} color={theme.colors.accent} />
          <Text style={styles.uploadBtnText}>Upload from Photos</Text>
        </TouchableOpacity>

        {imageUrl ? (
          <View style={styles.previewImageWrap}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={clearImage}>
              <Ionicons name="close" size={14} color={theme.colors.text} />
              <Text style={styles.removeImageText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>

      {/* ── Steps ──────────────────────────────────────────────────────── */}
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

      {/* ── Default Volume ─────────────────────────────────────────────── */}
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

  /* Dropdown */
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48,
  },
  dropdownValue: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalSheet: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  optionText: { fontSize: theme.font.sizeMd },

  /* Upload + preview */
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.25)',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  uploadBtnText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    letterSpacing: 0.3,
  },
  previewImageWrap: { marginTop: theme.spacing.md, alignItems: 'flex-start' },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeImageText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightMedium,
  },

  /* Steps */
  stepsInput: { minHeight: 130, textAlignVertical: 'top', lineHeight: 22 },
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
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
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

  volumeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  volumeField: { flex: 1 },
  volumeDivider: { width: theme.spacing.md },
});
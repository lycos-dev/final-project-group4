import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useExercises } from '../../context/ExerciseContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
type R = RouteProp<RootStackParamList, 'ExerciseDetail'>;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Hero image with gradient fade at the bottom so text floats cleanly over it. */
const ExerciseHeroImage = ({ uri, name }: { uri: string; name: string }) => (
  <View style={heroStyles.container}>
    <ImageBackground
      source={{ uri }}
      style={heroStyles.image}
      imageStyle={{ borderRadius: theme.radius.lg }}
      resizeMode="cover"
      accessibilityLabel={`Demonstration of ${name}`}
    >
      <LinearGradient
        colors={['transparent', 'rgba(11,11,15,0.92)']}
        style={heroStyles.gradient}
      />
    </ImageBackground>
  </View>
);

const heroStyles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    // Accent glow
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 220,
    justifyContent: 'flex-end',
  },
  gradient: {
    height: 80,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
});

/** Single numbered step row — large enough to read mid-workout. */
const StepRow = ({ index, text }: { index: number; text: string }) => (
  <View style={stepStyles.row}>
    <View style={stepStyles.badge}>
      <Text style={stepStyles.badgeText}>{index + 1}</Text>
    </View>
    <Text style={stepStyles.text}>{text}</Text>
  </View>
);

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1, // optical alignment with first line of text
  },
  badgeText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBlack,
  },
  text: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    lineHeight: 24,
    fontWeight: theme.font.weightMedium,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ExerciseDetailScreen = () => {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, removeExercise } = useExercises();
  const exercise = getById(params.exerciseId);

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () =>
        exercise ? (
          <IconButton
            name="create-outline"
            onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
          />
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
      {/* ── Hero Image ─────────────────────────────────────────────────── */}
      {exercise.imageUrl ? (
        <ExerciseHeroImage uri={exercise.imageUrl} name={exercise.name} />
      ) : (
        /* Fallback placeholder when no image is set */
        <View style={styles.imageFallback}>
          <Ionicons name="image-outline" size={40} color={theme.colors.border} />
          <Text style={styles.imageFallbackText}>No image added yet</Text>
        </View>
      )}

      {/* ── Title & Meta ───────────────────────────────────────────────── */}
      <Text style={styles.title}>{exercise.name}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="body-outline" size={13} color={theme.colors.accent} />
          <Text style={styles.metaChipText}>{exercise.muscleGroup}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="barbell-outline" size={13} color={theme.colors.accent} />
          <Text style={styles.metaChipText}>{exercise.equipment}</Text>
        </View>
      </View>

      {/* ── Default Volume ─────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{exercise.defaultSets}</Text>
          <Text style={styles.statLabel}>SETS</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{exercise.defaultReps}</Text>
          <Text style={styles.statLabel}>REPS</Text>
        </Card>
      </View>

      {/* ── Step-by-Step Instructions ──────────────────────────────────── */}
      {exercise.steps.length > 0 && (
        <View style={styles.stepsSection}>
          <View style={styles.stepsHeader}>
            <Text style={styles.sectionTitle}>How to perform</Text>
            <Text style={styles.stepCount}>{exercise.steps.length} steps</Text>
          </View>
          <Card style={styles.stepsCard}>
            {exercise.steps.map((step, i) => (
              <StepRow key={i} index={i} text={step} />
            ))}
          </Card>
        </View>
      )}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <Button
        title="Edit Exercise"
        onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
        fullWidth
        style={{ marginTop: theme.spacing.xl }}
      />
      <Button
        title="Delete Exercise"
        variant="destructive"
        onPress={handleDelete}
        fullWidth
        style={{ marginTop: theme.spacing.md }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  // Fallback image box
  imageFallback: {
    height: 160,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  imageFallbackText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },

  // Title / meta
  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeDisplay,
    fontWeight: theme.font.weightBlack,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  metaChipText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statValue: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBlack,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  // Steps section
  stepsSection: {
    gap: theme.spacing.sm,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
  },
  stepCount: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightMedium,
  },
  stepsCard: {
    paddingBottom: theme.spacing.xs, // last StepRow has its own bottom margin
  },

  muted: { color: theme.colors.muted },
});
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme/theme';
import { PRESET_ROUTINES } from '../../data/presetRoutines';
import { PresetRoutine } from '../../types';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LEVEL_COLORS: Record<PresetRoutine['level'], string> = {
  Beginner:     'rgba(100, 220, 130, 0.15)',
  Intermediate: 'rgba(198, 255, 61,  0.12)',
  Advanced:     'rgba(255, 120,  80, 0.15)',
};

const LEVEL_TEXT_COLORS: Record<PresetRoutine['level'], string> = {
  Beginner:     '#64DC82',
  Intermediate: '#C6FF3D',
  Advanced:     '#FF7850',
};

const LEVEL_ICONS: Record<PresetRoutine['level'], keyof typeof Ionicons.glyphMap> = {
  Beginner:     'leaf-outline',
  Intermediate: 'flash-outline',
  Advanced:     'flame-outline',
};

export const ExploreRoutinesScreen = () => {
  const nav = useNavigation<Nav>();
  const { exercises: activeExercises, addExercises, clearWorkout } = useWorkout();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStartRoutine = (routine: PresetRoutine) => {
    const doStart = () => {
      clearWorkout();
      addExercises(routine.exercises);
      nav.navigate('LogWorkout', { exercisesToAdd: [], routineName: routine.name });
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Routines</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>
          Pick a preset plan that matches your level and goals. Tap to preview, then start.
        </Text>

        {PRESET_ROUTINES.map((routine) => {
          const isOpen = expandedId === routine.id;

          return (
            <View key={routine.id} style={styles.card}>
              {/* ── Routine Header Row ─────────────────────────────── */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggle(routine.id)}
                activeOpacity={0.75}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.levelBadge,
                      { backgroundColor: LEVEL_COLORS[routine.level] },
                    ]}
                  >
                    <Ionicons
                      name={LEVEL_ICONS[routine.level]}
                      size={12}
                      color={LEVEL_TEXT_COLORS[routine.level]}
                    />
                    <Text
                      style={[
                        styles.levelText,
                        { color: LEVEL_TEXT_COLORS[routine.level] },
                      ]}
                    >
                      {routine.level}
                    </Text>
                  </View>

                  <Text style={styles.routineName}>{routine.name}</Text>

                  <Text style={styles.routineMeta}>
                    {routine.exercises.length} exercises · {routine.category}
                  </Text>
                </View>

                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>

              {/* ── Expandable Exercise List + Start Button ────────── */}
              {isOpen && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />

                  {routine.exercises.map((ex, index) => (
                    <View key={ex.id} style={styles.exerciseRow}>
                      <View style={styles.exerciseIndex}>
                        <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseDetail}>
                          {ex.defaultSets} sets · {ex.defaultReps} reps · {ex.muscleGroup}
                        </Text>
                      </View>
                      <View style={styles.equipmentTag}>
                        <Text style={styles.equipmentText}>{ex.equipment}</Text>
                      </View>
                    </View>
                  ))}

                  {/* ── Start Routine CTA ──────────────────────────── */}
                  <View style={styles.startButtonWrap}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() => handleStartRoutine(routine)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="play" size={16} color={theme.colors.accentText} />
                      <Text style={styles.startButtonText}>Start Routine</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  subtitle: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },

  /* ── Card ────────────────────────────────────────────────────────────── */
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    gap: 4,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 0.4,
  },
  routineName: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  routineMeta: {
    fontSize: 12,
    color: theme.colors.muted,
  },

  /* ── Expanded ────────────────────────────────────────────────────────── */
  expandedContent: {
    paddingBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(198, 255, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  exerciseDetail: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  equipmentTag: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  equipmentText: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: theme.font.weightBold,
  },

  /* ── Start Button ────────────────────────────────────────────────────── */
  startButtonWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  startButtonText: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accentText,
  },
});
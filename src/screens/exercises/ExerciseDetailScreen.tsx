import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useExercises } from '../../context/ExerciseContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { type Theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
type R   = RouteProp<RootStackParamList, 'ExerciseDetail'>;

// ─── Hero image ───────────────────────────────────────────────────────────────
const ExerciseHeroImage = ({
  uri,
  name,
  heroStyles,
  gradientColors,
}: {
  uri: string;
  name: string;
  heroStyles: ReturnType<typeof createHeroStyles>;
  gradientColors: readonly [string, string];
}) => (
  <View style={heroStyles.container}>
      <ImageBackground
        source={{ uri }}
        style={heroStyles.image}
        imageStyle={heroStyles.imageBorder}
        resizeMode="cover"
        accessibilityLabel={`Demonstration of ${name}`}
      >
      <LinearGradient
        colors={gradientColors}
        style={heroStyles.gradient}
      />
    </ImageBackground>
  </View>
);
const createHeroStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: { width: '100%', height: 220, justifyContent: 'flex-end' },
  imageBorder: { borderRadius: theme.radius.lg },
  gradient: {
    height: 80,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
});

// ─── Step row ─────────────────────────────────────────────────────────────────
const StepRow = ({
  index,
  text,
  stepStyles,
}: {
  index: number;
  text: string;
  stepStyles: ReturnType<typeof createStepStyles>;
}) => (
  <View style={stepStyles.row}>
    <View style={stepStyles.badge}>
      <Text style={stepStyles.badgeText}>{index + 1}</Text>
    </View>
    <Text style={stepStyles.text}>{text}</Text>
  </View>
);
const createStepStyles = (theme: Theme) => StyleSheet.create({
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
    marginTop: 1,
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'How To', 'History'] as const;
type TabName = typeof TABS[number];

interface TabBarProps {
  activeTab: TabName;
  onSelect: (t: TabName) => void;
  appTheme: Theme;
}
const TabBar = ({ activeTab, onSelect, appTheme }: TabBarProps) => {
  const tabBarStyles = useMemo(() => createTabBarStyles(appTheme), [appTheme]);
  return (
    <View style={tabBarStyles.bar}>
      {TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            style={[tabBarStyles.tab, active && tabBarStyles.tabActive]}
            onPress={() => onSelect(tab)}
            activeOpacity={0.7}
          >
            <Text style={[tabBarStyles.label, active && tabBarStyles.labelActive, 
              { color: active ? appTheme.colors.accent : appTheme.colors.muted }
            ]}>
              {tab}
            </Text>
            {active && <View style={[tabBarStyles.underline, { backgroundColor: appTheme.colors.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
const createTabBarStyles = (theme: Theme) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    position: 'relative',
  },
  tabActive: {},
  label: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.muted,
  },
  labelActive: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightBold,
  },
  underline: {
    position: 'absolute',
    bottom: -1,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ExerciseDetailScreen = () => {
  const { theme: appTheme, isDark } = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, removeExercise } = useExercises();
  const { completedWorkouts } = useWorkout();
  const exercise = getById(params.exerciseId);
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const heroStyles = useMemo(() => createHeroStyles(appTheme), [appTheme]);
  const stepStyles = useMemo(() => createStepStyles(appTheme), [appTheme]);

  const [activeTab, setActiveTab] = useState<TabName>('Overview');

  useLayoutEffect(() => {
    nav.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBackBtn} activeOpacity={0.75}>
          <Text style={styles.headerBackText}>&lt; Go back</Text>
        </TouchableOpacity>
      ),
      headerRight: () =>
        exercise ? (
          <IconButton
            name="create-outline"
            onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
          />
        ) : null,
    });
  }, [nav, exercise, styles]);

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
        onPress: () => { removeExercise(exercise.id); nav.goBack(); },
      },
    ]);
  };

  // Dynamic gradient colors for light/dark mode - darker overlay for text readability
  const gradientColors: readonly [string, string] = [
    'transparent',
    isDark ? 'rgba(11,11,15,0.92)' : 'rgba(0,0,0,0.35)',
  ];

  // Get completed workouts that include this exercise
  const exerciseHistory = completedWorkouts
    .filter(workout => 
      workout.exercises.some(ex => ex.originalExerciseId === exercise.id)
    )
    .sort((a, b) => b.completedAt - a.completedAt);

  return (
    <Screen scroll>
      {/* ── Hero Image ───────────────────────────────────────────────── */}
      {exercise.imageUrl ? (
        <ExerciseHeroImage
          uri={exercise.imageUrl}
          name={exercise.name}
          heroStyles={heroStyles}
          gradientColors={gradientColors}
        />
      ) : (
        <View style={[styles.imageFallback, { borderColor: appTheme.colors.border, backgroundColor: appTheme.colors.surface }]}>
          <Ionicons name="image-outline" size={40} color={appTheme.colors.border} />
          <Text style={[styles.imageFallbackText, { color: appTheme.colors.muted }]}>No image added yet</Text>
        </View>
      )}

      {/* ── Title & Meta ─────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: appTheme.colors.text }]}>{exercise.name}</Text>
      <View style={[styles.metaRow]}>
        <View style={[styles.metaChip, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}>
          <Ionicons name="body-outline" size={13} color={appTheme.colors.accent} />
          <Text style={[styles.metaChipText, { color: appTheme.colors.muted }]}>{exercise.muscleGroup}</Text>
        </View>
        <View style={[styles.metaChip, { backgroundColor: appTheme.colors.surface, borderColor: appTheme.colors.border }]}>
          <Ionicons name="barbell-outline" size={13} color={appTheme.colors.accent} />
          <Text style={[styles.metaChipText, { color: appTheme.colors.muted }]}>{exercise.equipment}</Text>
        </View>
      </View>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <TabBar activeTab={activeTab} onSelect={setActiveTab} appTheme={appTheme} />

      {/* ── Overview tab ─────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <View>
          {/* Exercise Info */}
          <Card style={styles.overviewCard}>
            <Text style={[styles.overviewSectionTitle, { color: appTheme.colors.text }]}>Exercise Info</Text>
            <View style={styles.overviewInfoRow}>
              <View style={styles.overviewInfoItem}>
                <Ionicons name="body-outline" size={16} color={appTheme.colors.accent} />
                <Text style={[styles.overviewInfoLabel, { color: appTheme.colors.muted }]}>MUSCLE GROUP</Text>
                <Text style={[styles.overviewInfoValue, { color: appTheme.colors.text }]}>{exercise.muscleGroup}</Text>
              </View>
              <View style={styles.overviewInfoItem}>
                <Ionicons name="barbell-outline" size={16} color={appTheme.colors.accent} />
                <Text style={[styles.overviewInfoLabel, { color: appTheme.colors.muted }]}>EQUIPMENT</Text>
                <Text style={[styles.overviewInfoValue, { color: appTheme.colors.text }]}>{exercise.equipment}</Text>
              </View>
            </View>
          </Card>

          {/* Last Performed */}
          {exerciseHistory.length > 0 && (
            <Card style={[styles.overviewCard, { marginTop: appTheme.spacing.md }]}>
              <Text style={[styles.overviewSectionTitle, { color: appTheme.colors.text }]}>Last Performed</Text>
              <View style={styles.overviewHistoryRow}>
                <Ionicons name="calendar-outline" size={16} color={appTheme.colors.accent} />
                <Text style={[styles.overviewText, { color: appTheme.colors.muted }]}>
                  {new Date(exerciseHistory[0].completedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </Card>
          )}

          {/* Quick Summary from steps */}
          {exercise.steps.length > 0 && (
            <Card style={[styles.overviewCard, { marginTop: appTheme.spacing.md }]}>
              <Text style={[styles.overviewSectionTitle, { color: appTheme.colors.text }]}>Quick Summary</Text>
              <Text style={[styles.overviewPreviewText, { color: appTheme.colors.muted }]} numberOfLines={3}>
                {exercise.steps[0]}
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('How To')} style={styles.overviewPreviewLink}>
                <Text style={[styles.overviewPreviewLinkText, { color: appTheme.colors.accent }]}>See all {exercise.steps.length} steps →</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Actions */}
          <Button
            title="Edit Exercise"
            onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
            fullWidth
            style={{ marginTop: appTheme.spacing.xl }}
          />
          <Button
            title="Delete Exercise"
            variant="destructive"
            onPress={handleDelete}
            fullWidth
            style={{ marginTop: appTheme.spacing.md }}
          />
        </View>
      )}

      {/* ── How To tab ───────────────────────────────────────────────── */}
      {activeTab === 'How To' && (
        <View>
          {exercise.steps.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="list-outline" size={44} color={appTheme.colors.border} />
              <Text style={[styles.emptyTabTitle, { color: appTheme.colors.muted }]}>No instructions yet</Text>
              <Text style={[styles.emptyTabSub, { color: appTheme.colors.muted }]}>
                Edit this exercise to add step-by-step instructions.
              </Text>
              <Button
                title="Add Instructions"
                onPress={() => nav.navigate('ExerciseForm', { exerciseId: exercise.id })}
                style={{ marginTop: appTheme.spacing.lg }}
              />
            </View>
          ) : (
            <View>
              <View style={styles.stepsHeader}>
                <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Step-by-step</Text>
                <Text style={[styles.stepCount, { color: appTheme.colors.muted }]}>{exercise.steps.length} steps</Text>
              </View>
              <Card style={styles.stepsCard}>
                {exercise.steps.map((step, i) => (
                  <StepRow key={i} index={i} text={step} stepStyles={stepStyles} />
                ))}
              </Card>
            </View>
          )}
        </View>
      )}

      {/* ── History tab ──────────────────────────────────────────────── */}
      {activeTab === 'History' && (
        <View>
          {exerciseHistory.length === 0 ? (
            <View style={styles.emptyTab}>
              <MaterialCommunityIcons
                name="chart-timeline-variant"
                size={44}
                color={appTheme.colors.border}
              />
              <Text style={[styles.emptyTabTitle, { color: appTheme.colors.muted }]}>No history yet</Text>
              <Text style={[styles.emptyTabSub, { color: appTheme.colors.muted }]}>
                Completed workouts that include this exercise will appear here.
              </Text>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              <View style={styles.stepsHeader}>
                <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Exercise History</Text>
                <Text style={[styles.stepCount, { color: appTheme.colors.muted }]}>{exerciseHistory.length} sessions</Text>
              </View>
              {exerciseHistory.map((workout, idx) => {
                const workoutExercise = workout.exercises.find(ex => ex.originalExerciseId === exercise.id);
                if (!workoutExercise) return null;
                
                const date = new Date(workout.completedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                
                const duration = workout.durationSeconds >= 60 
                  ? `${Math.floor(workout.durationSeconds / 60)}m ${workout.durationSeconds % 60}s`
                  : `${workout.durationSeconds}s`;
                
                return (
                  <Card key={idx} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyWorkoutName, { color: appTheme.colors.text }]}>{workout.routineName}</Text>
                        <Text style={[styles.historyDate, { color: appTheme.colors.muted }]}>{date}</Text>
                      </View>
                      <View style={styles.historyDuration}>
                        <Ionicons name="time-outline" size={14} color={appTheme.colors.accent} />
                        <Text style={[styles.historyDurationText, { color: appTheme.colors.accent }]}>
                          {duration}
                        </Text>
                      </View>
                    </View>
                   
                    {/* Only show completed sets for this exercise */}
                    {workoutExercise.sets
                      .filter(set => set.completed)
                      .map((set, setIdx) => (
                      <View 
                        key={setIdx} 
                        style={[styles.setRow, { borderBottomColor: appTheme.colors.border }]}
                      >
                        <View style={styles.setNumberBadge}>
                          <Text style={[styles.setNumberText, { color: appTheme.colors.accent }]}>{setIdx + 1}</Text>
                        </View>
                        <View style={styles.setDetails}>
                          <View style={styles.setDetailMain}>
                            <Text style={[styles.setDetailValue, { color: appTheme.colors.text }]}>
                              {set.weight}kg × {set.reps}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
  imageFallbackText: { color: theme.colors.muted, fontSize: theme.font.sizeSm },

  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeDisplay,
    fontWeight: theme.font.weightBlack,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sm,
  },
  headerBackBtn: {
    paddingVertical: 6,
    paddingRight: theme.spacing.sm,
  },
  headerBackText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
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

  // Overview tab
  overviewCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  overviewSectionTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.sm,
  },
  overviewInfoRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  overviewInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  overviewInfoLabel: {
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
  },
  overviewInfoValue: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  overviewHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  overviewText: {
    fontSize: theme.font.sizeSm,
  },
  overviewPreviewText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
  },
  overviewPreviewLink: { marginTop: theme.spacing.sm },
  overviewPreviewLinkText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },

  // How To tab
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
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
  stepsCard: { paddingBottom: theme.spacing.xs },

  // Empty state (shared by How To & History when empty)
  emptyTab: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  emptyTabTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  emptyTabSub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.xl,
  },

  muted: { color: theme.colors.muted },

  // History styles
  historyCard: { marginBottom: theme.spacing.md },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  historyWorkoutName: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: theme.font.sizeSm,
  },
  historyDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.accent}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  historyDurationText: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
  },
  historyStats: {
    flexDirection: 'row',
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  historyStat: {
    flex: 1,
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBold,
  },
  historyStatLabel: {
    fontSize: theme.font.sizeSm,
    marginTop: 4,
  },
  historyStatDivider: {
    width: 1,
    height: 24,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    gap: theme.spacing.md,
  },
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${theme.colors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightBold,
  },
  setDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  setDetailMain: {
    flex: 1,
  },
  setDetailItem: {
    alignItems: 'center',
  },
  setDetailLabel: {
    fontSize: 10,
    fontWeight: theme.font.weightMedium,
    marginBottom: 2,
  },
  setDetailValue: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  setArrow: {
    marginLeft: 'auto',
  },
});
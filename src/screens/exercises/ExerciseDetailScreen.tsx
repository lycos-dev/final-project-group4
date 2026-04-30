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
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExerciseDetail'>;
type R   = RouteProp<RootStackParamList, 'ExerciseDetail'>;

// ─── Hero image ───────────────────────────────────────────────────────────────
const ExerciseHeroImage = ({
  uri,
  name,
  heroStyles,
}: {
  uri: string;
  name: string;
  heroStyles: ReturnType<typeof createHeroStyles>;
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
        colors={['transparent', 'rgba(11,11,15,0.92)']}
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
  tabBarStyles: ReturnType<typeof createTabBarStyles>;
}
const TabBar = ({ activeTab, onSelect, tabBarStyles }: TabBarProps) => (
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
          <Text style={[tabBarStyles.label, active && tabBarStyles.labelActive]}>
            {tab}
          </Text>
          {active && <View style={tabBarStyles.underline} />}
        </TouchableOpacity>
      );
    })}
  </View>
);
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
  const { theme: appTheme } = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { getById, removeExercise } = useExercises();
  const exercise = getById(params.exerciseId);
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const heroStyles = useMemo(() => createHeroStyles(appTheme), [appTheme]);
  const stepStyles = useMemo(() => createStepStyles(appTheme), [appTheme]);
  const tabBarStyles = useMemo(() => createTabBarStyles(appTheme), [appTheme]);

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

  return (
    <Screen scroll>
      {/* ── Hero Image ───────────────────────────────────────────────── */}
      {exercise.imageUrl ? (
        <ExerciseHeroImage uri={exercise.imageUrl} name={exercise.name} heroStyles={heroStyles} />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons name="image-outline" size={40} color={appTheme.colors.border} />
          <Text style={styles.imageFallbackText}>No image added yet</Text>
        </View>
      )}

      {/* ── Title & Meta ─────────────────────────────────────────────── */}
      <Text style={styles.title}>{exercise.name}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="body-outline" size={13} color={appTheme.colors.accent} />
          <Text style={styles.metaChipText}>{exercise.muscleGroup}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="barbell-outline" size={13} color={appTheme.colors.accent} />
          <Text style={styles.metaChipText}>{exercise.equipment}</Text>
        </View>
      </View>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <TabBar activeTab={activeTab} onSelect={setActiveTab} tabBarStyles={tabBarStyles} />

      {/* ── Overview tab ─────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <View>
          {/* Default Volume */}
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

          {/* Quick description if no image */}
          {exercise.steps.length > 0 && (
            <Card style={styles.overviewPreview}>
              <Text style={styles.overviewPreviewTitle}>Quick Summary</Text>
              <Text style={styles.overviewPreviewText} numberOfLines={3}>
                {exercise.steps[0]}
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('How To')} style={styles.overviewPreviewLink}>
                <Text style={styles.overviewPreviewLinkText}>See all {exercise.steps.length} steps →</Text>
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
              <Text style={styles.emptyTabTitle}>No instructions yet</Text>
              <Text style={styles.emptyTabSub}>
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
                <Text style={styles.sectionTitle}>Step-by-step</Text>
                <Text style={styles.stepCount}>{exercise.steps.length} steps</Text>
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
        <View style={styles.emptyTab}>
          <MaterialCommunityIcons
            name="chart-timeline-variant"
            size={44}
            color={appTheme.colors.border}
          />
          <Text style={styles.emptyTabTitle}>No history yet</Text>
          <Text style={styles.emptyTabSub}>
            Completed workouts that include this exercise will appear here.
          </Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg },
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
  overviewPreview: {
    gap: theme.spacing.sm,
  },
  overviewPreviewTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  overviewPreviewText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
  },
  overviewPreviewLink: { marginTop: 2 },
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
});

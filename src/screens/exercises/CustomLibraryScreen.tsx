import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExercises } from '../../context/ExerciseContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const CustomLibraryScreen = () => {
  const nav = useNavigation<Nav>();
  const { exercises } = useExercises();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1C2A00', '#182200', '#0e1500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.heroOrb} />

        {/* Back button — uses nav.goBack(), same pattern as other screens */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="bookshelf"
              size={28}
              color={theme.colors.accent}
            />
          </View>
          <Text style={styles.heroTitle}>My Custom Library</Text>
          <Text style={styles.heroSub}>
            Your personal collection of exercises
          </Text>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{exercises.length}</Text>
            <Text style={styles.heroStatLabel}>Exercises</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>0</Text>
            <Text style={styles.heroStatLabel}>Workouts</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>0</Text>
            <Text style={styles.heroStatLabel}>PRs Set</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── "Create New Exercise" — visually separated from the list ──── */}
      <View style={styles.createSection}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => nav.navigate('ExerciseForm', {})}
          activeOpacity={0.75}
        >
          <View style={styles.createBtnIcon}>
            <Ionicons name="add" size={22} color={theme.colors.accentText} />
          </View>
          <Text style={styles.createBtnLabel}>Create New Exercise</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.accentText} />
        </TouchableOpacity>
      </View>

      {/* ── Divider label ──────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>MY EXERCISES</Text>
        <Text style={styles.sectionHeaderCount}>{exercises.length}</Text>
      </View>

      {/* ── Scrollable Exercise List ───────────────────────────────────── */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="dumbbell"
              size={48}
              color={theme.colors.border}
            />
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptySub}>
              Use the button above to create your first custom exercise.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              nav.navigate('ExerciseDetail', { exerciseId: item.id })
            }
            activeOpacity={0.72}
          >
            <View style={styles.listIconWrap}>
              <Ionicons
                name="barbell-outline"
                size={18}
                color={theme.colors.accent}
              />
            </View>
            <View style={styles.listBody}>
              <Text style={styles.listName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.listMeta}>
                {item.muscleGroup} · {item.equipment}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={theme.colors.muted}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },

  /* ── Header ────────────────────────────────────────────────────────── */
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(198, 255, 61, 0.05)',
    right: -50,
    top: -60,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroContent: {
    marginBottom: theme.spacing.lg,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(198, 255, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.2)',
  },
  heroTitle: {
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: {
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  heroStatLabel: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: theme.colors.border },

  /* ── Create New Exercise — solid accent button, clearly separate ──── */
  createSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  createBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnLabel: {
    flex: 1,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accentText,
  },

  /* ── Section header divider ────────────────────────────────────────── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
    letterSpacing: 1.2,
  },
  sectionHeaderCount: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: theme.font.weightMedium,
  },

  /* ── Exercise List ─────────────────────────────────────────────────── */
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xxl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.15)',
  },
  listBody: { flex: 1 },
  listName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: 2,
  },
  listMeta: { color: theme.colors.muted, fontSize: 12 },

  /* ── Empty State ───────────────────────────────────────────────────── */
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  emptySub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

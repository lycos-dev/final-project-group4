import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useExercises } from '../../context/ExerciseContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const CustomLibraryScreen = () => {
  const { theme: appTheme } = useTheme();
  const theme = appTheme;
  const styles = createStyles(appTheme);
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { exercises } = useExercises();

  const onBack = () => {
    if (nav.canGoBack()) nav.goBack();
    else nav.navigate('Tabs');
  };

  // Everything that used to be sticky now lives inside the list header so it
  // scrolls with the content. Only the floating back button stays pinned.
  const ListHeader = (
    <>
      <View
        style={[styles.header, { paddingTop: insets.top + 56 }]}
      >
        <View style={styles.heroOrb} />

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
      </View>

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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>MY EXERCISES</Text>
        <Text style={styles.sectionHeaderCount}>{exercises.length}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.safe}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[
          `${theme.colors.accent}33`,
          theme.colors.surfaceAlt,
          theme.colors.surface,
          theme.colors.bg,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bgGradient}
      />

      {/* Sticky back button — sits above everything, always tappable */}
      <SafeAreaView edges={['top']} style={styles.backWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Single scrollable list — header + create button + list rows scroll together */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
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
    </View>
  );
};

const createStyles = (appTheme: typeof theme) => {
  const theme = appTheme;
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  /* ── Sticky back button ────────────────────────────────────────────── */
  backWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    paddingHorizontal: theme.spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: Platform.OS === 'android' ? 8 : 4,
  },

  /* ── Header (now scrolls) ──────────────────────────────────────────── */
  header: {
    paddingHorizontal: theme.spacing.lg,
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
  heroContent: { marginBottom: theme.spacing.lg },
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
  heroSub: { fontSize: theme.font.sizeSm, color: theme.colors.muted },

  /* ── Create button ─────────────────────────────────────────────────── */
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

  /* ── Section header ────────────────────────────────────────────────── */
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

  /* ── List rows ─────────────────────────────────────────────────────── */
  listContent: { paddingBottom: theme.spacing.xxl },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
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

  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
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
};
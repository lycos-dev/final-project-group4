import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TIPS: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
}[] = [
  {
    id: '1',
    icon: 'barbell-outline',
    title: 'Build your library',
    sub: 'Add custom exercises to your personal library for quick access during workouts.',
  },
  {
    id: '2',
    icon: 'repeat-outline',
    title: 'Create routines',
    sub: 'Group exercises into routines to stay consistent and track your progress.',
  },
  {
    id: '3',
    icon: 'trending-up-outline',
    title: 'Log every session',
    sub: 'Logging workouts helps you spot trends and keep pushing past plateaus.',
  },
];

export const ExerciseListScreen = () => {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Exercises</Text>

          {/* Primary Action */}
          <Button
            title="Start New Workout"
            onPress={() => nav.navigate('LogWorkout', { exercisesToAdd: [] })}
            fullWidth
            style={styles.primaryButton}
          />

          {/* ── Custom Library Banner ─────────────────────────────────── */}
          <TouchableOpacity
            style={styles.libraryBanner}
            onPress={() => nav.navigate('CustomLibrary')}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={['#1C2A00', '#243600', '#1A2900']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.libraryGradient}
            >
              <View style={styles.libraryAccentDot} />
              <View style={styles.libraryLeft}>
                <View style={styles.libraryIconWrap}>
                  <MaterialCommunityIcons
                    name="bookshelf"
                    size={26}
                    color={theme.colors.accent}
                  />
                </View>
                <View style={styles.libraryText}>
                  <Text style={styles.libraryTitle}>My Custom Library</Text>
                  <Text style={styles.librarySub}>
                    Browse &amp; manage all your exercises
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.accent}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Quick Action Cards ────────────────────────────────────── */}
          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => nav.navigate('CreateRoutine', {})}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardIcon}>
                <MaterialCommunityIcons
                  name="pencil-box-outline"
                  size={26}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={styles.cardTitle}>New Routine</Text>
              <Text style={styles.cardSub}>Build a custom plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => nav.navigate('ExerciseForm', {})}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardIcon}>
                <Ionicons
                  name="add-circle-outline"
                  size={26}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={styles.cardTitle}>Add Exercise</Text>
              <Text style={styles.cardSub}>Create a custom move</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Tips ───────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>QUICK TIPS</Text>
        </View>

        <View style={styles.tipsContainer}>
          {TIPS.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Ionicons
                  name={tip.icon}
                  size={18}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipSub}>{tip.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },

  /* ── Header ────────────────────────────────────────────────────────── */
  topSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    marginBottom: theme.spacing.lg,
  },

  /* ── Library Banner ────────────────────────────────────────────────── */
  libraryBanner: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.25)',
  },
  libraryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  libraryAccentDot: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(198, 255, 61, 0.07)',
    right: -20,
    top: -30,
  },
  libraryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  libraryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryText: { flex: 1 },
  libraryTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  librarySub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
  },

  /* ── Action Cards ──────────────────────────────────────────────────── */
  cardsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    minHeight: 130,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  actionCardIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: theme.colors.muted,
  },

  /* ── Tips ──────────────────────────────────────────────────────────── */
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
  },
  tipsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipBody: { flex: 1 },
  tipTitle: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 3,
  },
  tipSub: {
    fontSize: 12,
    color: theme.colors.muted,
    lineHeight: 18,
  },
});
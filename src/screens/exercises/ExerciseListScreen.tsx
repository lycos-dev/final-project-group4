import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExerciseListItem } from '../../components/exercises/ExerciseListItem';
import { useExercises } from '../../context/ExerciseContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ExerciseListScreen = () => {
  const nav = useNavigation<Nav>();
  const { exercises } = useExercises();

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Exercises</Text>

          {/* Primary Action Button */}
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
              {/* Decorative accent dot */}
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
                    Your personal exercises & saved routines
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
              onPress={() => nav.navigate('CustomLibrary')}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardIcon}>
                <Ionicons
                  name="search-outline"
                  size={26}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={styles.cardTitle}>Explore</Text>
              <Text style={styles.cardSub}>Browse all exercises</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section Header ───────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ALL EXERCISES</Text>
          <TouchableOpacity
            onPress={() => nav.navigate('ExerciseForm', {})}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color={theme.colors.accentText} />
              <Text style={styles.addButtonText}>Add</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Exercise List ─────────────────────────────────────────────── */}
        {exercises.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="No exercises found"
            subtitle="Try changing filters or add a new exercise."
            ctaLabel="Add Exercise"
            onCtaPress={() => nav.navigate('ExerciseForm', {})}
          />
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ExerciseListItem
                exercise={item}
                onPress={() =>
                  nav.navigate('ExerciseDetail', { exerciseId: item.id })
                }
              />
            )}
          />
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
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

  /* ── Custom Library Banner ─────────────────────────────────────────── */
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
  libraryText: {
    flex: 1,
  },
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

  /* ── Section Header ────────────────────────────────────────────────── */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    gap: 3,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accentText,
  },

  /* ── List ──────────────────────────────────────────────────────────── */
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});
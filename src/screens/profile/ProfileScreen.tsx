import React, { useRef, useCallback } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { StatCard } from '../../components/profile/StatCard';
import { EmptyPlaceholder } from '../../components/profile/EmptyPlaceholder';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const { profile, settings } = useProfile();
  const nav = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const isImperial = settings.units === 'imperial';

  // ── Scroll to top every time this tab gains focus ───────────────────
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // ── Display values ───────────────────────────────────────────────────
  const heightLabel = isImperial
    ? `${Math.round(profile.heightCm / 2.54)}`
    : `${profile.heightCm}`;
  const heightUnit = isImperial ? 'in' : 'cm';

  const weightLabel = isImperial
    ? `${Math.round(profile.weightKg * 2.20462)}`
    : `${profile.weightKg}`;
  const weightUnit = isImperial ? 'lb' : 'kg';

  const subtitle = `${profile.age} yrs · ${weightLabel} ${weightUnit} · ${heightLabel} ${heightUnit}`;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Premium Avatar Header ──────────────────────────────────── */}
        <ProfileHeader profile={profile} subtitle={subtitle} />

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard icon="resize-outline"   value={heightLabel} label={heightUnit} accent />
          <StatCard icon="barbell-outline"  value={weightLabel} label={weightUnit} />
          <StatCard icon="calendar-outline" value={`${profile.age}`} label="Age" />
        </View>

        {/* ── Fitness Goal ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FITNESS GOAL</Text>
          <Card>
            <Text style={styles.goalText}>
              {profile.goal || 'No goal set yet. Tap Edit Profile to add one.'}
            </Text>
          </Card>
        </View>

        {/* ── Goals Navigation Button ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY GOALS</Text>
          <TouchableOpacity
            style={styles.goalsCard}
            onPress={() => nav.navigate('Goals')}
            activeOpacity={0.75}
          >
            <View style={styles.goalsIconWrap}>
              <Ionicons name="trophy-outline" size={22} color={theme.colors.accent} />
            </View>
            <View style={styles.goalsText}>
              <Text style={styles.goalsTitle}>View &amp; Manage Goals</Text>
              <Text style={styles.goalsSub}>
                Track weekly targets, weight goals &amp; PRs
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Achievements ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
          <EmptyPlaceholder
            icon="trophy-outline"
            title="No achievements yet"
            message={'Complete your first workout to start\nearning badges and milestones.'}
          />
        </View>

        {/* ── Workout Activity ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WORKOUT ACTIVITY</Text>
          <EmptyPlaceholder
            icon="stats-chart-outline"
            title="No workouts logged"
            message={'Your weekly activity chart will appear\nhere once you log a session.'}
          />
        </View>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <Button
            title="Edit Profile"
            onPress={() => nav.navigate('EditProfile')}
            fullWidth
          />
          <Button
            title="Settings"
            variant="secondary"
            onPress={() => nav.navigate('Settings')}
            fullWidth
            style={{ marginTop: theme.spacing.sm }}
          />
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
  scroll: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
  },
  goalText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeMd,
    lineHeight: 22,
  },

  /* ── Goals Card ────────────────────────────────────────────────────── */
  goalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.2)',
    gap: theme.spacing.md,
  },
  goalsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsText: { flex: 1 },
  goalsTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  goalsSub: {
    fontSize: 12,
    color: theme.colors.muted,
  },

  /* ── Bottom Actions ────────────────────────────────────────────────── */
  actions: {
    marginTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
});
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
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
  const isImperial = settings.units === 'imperial';

  // ── Display values ───────────────────────────────────────────────────────
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
    <Screen scroll>
      {/* ── Premium Avatar Header ───────────────────────────────────────── */}
      <ProfileHeader profile={profile} subtitle={subtitle} />

      {/* ── Integrated Stats Row ─────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatCard
          icon="resize-outline"
          value={`${heightLabel}`}
          label={heightUnit}
          accent
        />
        <StatCard
          icon="barbell-outline"
          value={`${weightLabel}`}
          label={weightUnit}
        />
        <StatCard
          icon="calendar-outline"
          value={`${profile.age}`}
          label="Age"
        />
      </View>

      {/* ── Fitness Goal ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FITNESS GOAL</Text>
        <Card>
          <Text style={styles.goalText}>
            {profile.goal || 'No goal set yet. Tap Edit Profile to add one.'}
          </Text>
        </Card>
      </View>

      {/* ── Recent Achievements — empty placeholder ───────────────────────  */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        <EmptyPlaceholder
          icon="trophy-outline"
          title="No achievements yet"
          message={"Complete your first workout to start\nearning badges and milestones."}
        />
      </View>

      {/* ── Workout Activity — empty placeholder ─────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WORKOUT ACTIVITY</Text>
        <EmptyPlaceholder
          icon="stats-chart-outline"
          title="No workouts logged"
          message={"Your weekly activity chart will appear\nhere once you log a session."}
        />
      </View>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
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
    </Screen>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  section: {
    marginTop: theme.spacing.xl,
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
  actions: {
    marginTop: theme.spacing.xxl,
  },
});
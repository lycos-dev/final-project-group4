import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { theme } from '../../theme/theme';
import { useProfile } from '../../context/ProfileContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const { profile, settings } = useProfile();
  const nav = useNavigation<Nav>();
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const heightLabel = settings.units === 'metric'
    ? `${profile.heightCm} cm`
    : `${Math.round(profile.heightCm / 2.54)} in`;
  const weightLabel = settings.units === 'metric'
    ? `${profile.weightKg} kg`
    : `${Math.round(profile.weightKg * 2.20462)} lb`;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.muted}>{profile.age} years old</Text>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{heightLabel}</Text>
          <Text style={styles.statLabel}>Height</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{weightLabel}</Text>
          <Text style={styles.statLabel}>Weight</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{profile.age}</Text>
          <Text style={styles.statLabel}>Age</Text>
        </Card>
      </View>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text style={styles.sectionTitle}>Fitness Goal</Text>
        <Text style={styles.goalText}>{profile.goal}</Text>
      </Card>

      <Button title="Edit Profile" onPress={() => nav.navigate('EditProfile')} style={{ marginTop: theme.spacing.lg }} />
      <Button
        title="Settings"
        variant="secondary"
        onPress={() => nav.navigate('Settings')}
        style={{ marginTop: theme.spacing.md }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: { fontSize: 36, fontWeight: theme.font.weightBlack, color: theme.colors.accentText },
  name: { color: theme.colors.text, fontSize: theme.font.sizeXxl, fontWeight: theme.font.weightBold },
  muted: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md },
  stat: { flex: 1, alignItems: 'center', padding: theme.spacing.md },
  statValue: { color: theme.colors.accent, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold },
  statLabel: { color: theme.colors.muted, fontSize: theme.font.sizeXs, marginTop: 2 },
  sectionTitle: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginBottom: theme.spacing.sm },
  goalText: { color: theme.colors.muted, fontSize: theme.font.sizeMd, lineHeight: 22 },
});

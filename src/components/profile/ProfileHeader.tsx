import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Profile } from '../../types';

interface Props {
  profile: Profile;
}

export const ProfileHeader = ({ profile }: Props) => {
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>
    </View>
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
  email: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginTop: 4 },
});
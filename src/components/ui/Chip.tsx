import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export const Chip = ({ label, active, onPress }: Props) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.chip, active && styles.active]}
  >
    <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  active: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  label: { color: theme.colors.text, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightMedium },
  activeLabel: { color: theme.colors.accentText, fontWeight: theme.font.weightBold },
});

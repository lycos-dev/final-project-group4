import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export const Chip = ({ label, active, onPress }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: appTheme.spacing.lg,
      paddingVertical: appTheme.spacing.sm,
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.pill,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      marginRight: appTheme.spacing.sm,
    },
    active: { backgroundColor: appTheme.colors.accent, borderColor: appTheme.colors.accent },
    label: { color: appTheme.colors.text, fontSize: appTheme.font.sizeSm, fontWeight: appTheme.font.weightMedium },
    activeLabel: { color: appTheme.colors.accentText, fontWeight: appTheme.font.weightBold },
  });

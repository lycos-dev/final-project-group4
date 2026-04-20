import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', loading, disabled, style, fullWidth }: Props) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.accentText : theme.colors.text} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as const]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: theme.colors.danger },
  label: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
  primaryLabel: { color: theme.colors.accentText },
  secondaryLabel: { color: theme.colors.text },
  ghostLabel: { color: theme.colors.muted },
  destructiveLabel: { color: '#fff' },
});

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
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
        <ActivityIndicator color={variant === 'primary' ? appTheme.colors.accentText : appTheme.colors.text} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as const]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    base: {
      paddingVertical: appTheme.spacing.md,
      paddingHorizontal: appTheme.spacing.lg,
      borderRadius: appTheme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    fullWidth: { alignSelf: 'stretch' },
    disabled: { opacity: 0.5 },
    primary: { backgroundColor: appTheme.colors.accent },
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: appTheme.colors.border },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: appTheme.colors.danger },
    label: { fontSize: appTheme.font.sizeMd, fontWeight: appTheme.font.weightBold },
    primaryLabel: { color: appTheme.colors.accentText },
    secondaryLabel: { color: appTheme.colors.text },
    ghostLabel: { color: appTheme.colors.muted },
    destructiveLabel: { color: '#fff' },
  });

import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../../theme/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const Input = ({ label, error, style, ...rest }: Props) => (
  <View style={styles.wrap}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      placeholderTextColor={theme.colors.muted}
      style={[styles.input, error ? styles.inputError : null, style]}
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginBottom: theme.spacing.xs, fontWeight: theme.font.weightMedium },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
  },
  inputError: { borderColor: theme.colors.danger },
  error: { color: theme.colors.danger, fontSize: theme.font.sizeXs, marginTop: theme.spacing.xs },
});

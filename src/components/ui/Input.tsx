import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Inline unit badge shown on the right edge (e.g. "cm", "kg", "lb", "in") */
  unit?: string;
  /** Optional helper text shown below the input when there is no error */
  hint?: string;
}

export const Input = ({ label, error, style, unit, hint, ...rest }: Props) => {
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake the input when an error first appears
  const prevError = useRef<string | null | undefined>(null);
  if (error && error !== prevError.current) {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }
  prevError.current = error;

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.accent
    : theme.colors.border;

  return (
    <View style={styles.wrap}>
      {label && (
        <Text
          style={[
            styles.label,
            focused && styles.labelFocused,
            !!error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputRow,
          { borderColor },
          focused && styles.inputRowFocused,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <TextInput
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </Animated.View>

      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={13} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.lg },

  label: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.2,
  },
  labelFocused: { color: theme.colors.accent },
  labelError: { color: theme.colors.danger },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  inputRowFocused: {
    backgroundColor: theme.colors.surfaceAlt,
  },

  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    minHeight: 48,
  },

  unit: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
    paddingRight: theme.spacing.md,
    paddingLeft: theme.spacing.xs,
  },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.font.sizeXs,
    flexShrink: 1,
  },
  hint: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    marginTop: 5,
  },
});
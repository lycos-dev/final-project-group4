import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
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
    ? appTheme.colors.danger
    : focused
    ? appTheme.colors.accent
    : appTheme.colors.border;

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
          placeholderTextColor={appTheme.colors.muted}
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
          <Ionicons name="alert-circle-outline" size={13} color={appTheme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    wrap: { marginBottom: appTheme.spacing.lg },

    label: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      fontWeight: appTheme.font.weightMedium,
      marginBottom: appTheme.spacing.xs,
      letterSpacing: 0.2,
    },
    labelFocused: { color: appTheme.colors.accent },
    labelError: { color: appTheme.colors.danger },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: appTheme.colors.surface,
      borderWidth: 1.5,
      borderColor: appTheme.colors.border,
      borderRadius: appTheme.radius.md,
      overflow: 'hidden',
    },
    inputRowFocused: {
      backgroundColor: appTheme.colors.surfaceAlt,
    },

    input: {
      flex: 1,
      paddingHorizontal: appTheme.spacing.lg,
      paddingVertical: appTheme.spacing.md,
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      minHeight: 48,
    },

    unit: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      fontWeight: appTheme.font.weightMedium,
      paddingRight: appTheme.spacing.md,
      paddingLeft: appTheme.spacing.xs,
    },

    feedbackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 5,
    },
    errorText: {
      color: appTheme.colors.danger,
      fontSize: appTheme.font.sizeXs,
      flexShrink: 1,
    },
    hint: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
      marginTop: 5,
    },
  });
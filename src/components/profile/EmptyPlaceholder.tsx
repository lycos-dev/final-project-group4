import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  style?: ViewStyle;
}

/**
 * A visually rich placeholder card for sections that have no data yet.
 * Uses a dashed border + muted icon to signal "coming soon / empty" state
 * without feeling broken.
 */
export const EmptyPlaceholder = ({ icon, title, message, style }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={appTheme.colors.accent} style={{ opacity: 0.55 }} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderColor: appTheme.colors.border,
      borderStyle: 'dashed',
      borderRadius: appTheme.radius.lg,
      alignItems: 'center',
      paddingVertical: appTheme.spacing.xxl,
      paddingHorizontal: appTheme.spacing.xl,
      backgroundColor: `${appTheme.colors.surface}80`,
      gap: appTheme.spacing.sm,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${appTheme.colors.accent}12`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: appTheme.spacing.xs,
    },
    title: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
      letterSpacing: 0.2,
    },
    message: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
export const EmptyPlaceholder = ({ icon, title, message, style }: Props) => (
  <View style={[styles.card, style]}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={28} color={theme.colors.accent} style={{ opacity: 0.55 }} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: `${theme.colors.surface}80`,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.accent}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    letterSpacing: 0.2,
  },
  message: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  style?: ViewStyle;
  /** Highlight the card with an accent tint */
  accent?: boolean;
}

export const StatCard = ({ icon, value, label, style, accent = false }: Props) => (
  <View style={[styles.card, accent && styles.cardAccent, style]}>
    <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
      <Ionicons
        name={icon}
        size={16}
        color={accent ? theme.colors.accentText : theme.colors.accent}
      />
    </View>
    <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    gap: 4,
  },
  cardAccent: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.accent}1A`, // 10% opacity accent
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapAccent: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBlack,
    letterSpacing: -0.3,
  },
  valueAccent: { color: theme.colors.accentText },
  label: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
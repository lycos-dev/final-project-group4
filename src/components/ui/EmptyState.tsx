import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export const EmptyState = ({ icon = 'sparkles-outline', title, subtitle, ctaLabel, onCtaPress }: Props) => (
  <View style={styles.wrap}>
    <Ionicons name={icon} size={48} color={theme.colors.muted} />
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {ctaLabel && onCtaPress ? <Button title={ctaLabel} onPress={onCtaPress} style={{ marginTop: theme.spacing.lg }} /> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  title: { color: theme.colors.text, fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, marginTop: theme.spacing.md, textAlign: 'center' },
  subtitle: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginTop: theme.spacing.xs, textAlign: 'center' },
});

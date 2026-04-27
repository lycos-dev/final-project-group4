import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export const EmptyState = ({ icon = 'sparkles-outline', title, subtitle, ctaLabel, onCtaPress }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={appTheme.colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCtaPress ? <Button title={ctaLabel} onPress={onCtaPress} style={{ marginTop: appTheme.spacing.lg }} /> : null}
    </View>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', padding: appTheme.spacing.xl },
    title: { color: appTheme.colors.text, fontSize: appTheme.font.sizeLg, fontWeight: appTheme.font.weightBold, marginTop: appTheme.spacing.md, textAlign: 'center' },
    subtitle: { color: appTheme.colors.muted, fontSize: appTheme.font.sizeSm, marginTop: appTheme.spacing.xs, textAlign: 'center' },
  });

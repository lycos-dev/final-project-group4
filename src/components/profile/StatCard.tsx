import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  style?: ViewStyle;
  /** Highlight the card with an accent tint */
  accent?: boolean;
}

export const StatCard = ({ icon, value, label, style, accent = false }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <View style={[styles.card, accent && styles.cardAccent, style]}>
      <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
        <Ionicons
          name={icon}
          size={16}
          color={accent ? appTheme.colors.accentText : appTheme.colors.accent}
        />
      </View>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      alignItems: 'center',
      paddingVertical: appTheme.spacing.lg,
      paddingHorizontal: appTheme.spacing.sm,
      gap: 4,
    },
    cardAccent: {
      backgroundColor: appTheme.colors.accent,
      borderColor: appTheme.colors.accent,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${appTheme.colors.accent}1A`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    iconWrapAccent: {
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    value: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeLg,
      fontWeight: appTheme.font.weightBlack,
      letterSpacing: -0.3,
    },
    valueAccent: { color: appTheme.colors.accentText },
    label: {
      color: appTheme.colors.muted,
      fontSize: 11,
      fontWeight: appTheme.font.weightMedium,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
  });
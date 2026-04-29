import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  title: string;
  detail: string;
}

export const AchievementCard = ({ title, detail }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="trophy-outline" size={18} color={appTheme.colors.accent} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      </View>
    </Card>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    card: {
      padding: appTheme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: appTheme.spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: appTheme.radius.md,
      backgroundColor: `${appTheme.colors.accent}14`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
      marginBottom: 2,
    },
    detail: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
    },
  });
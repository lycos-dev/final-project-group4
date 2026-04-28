import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';
import { Exercise } from '../../types';

interface Props {
  exercise: Exercise;
  onPress: () => void;
}

export const ExerciseListItem = ({ exercise, onPress }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.72}
    >
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="barbell-outline" size={20} color={appTheme.colors.accent} />
      </View>

      {/* Text body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{exercise.muscleGroup}</Text>
          </View>
          <View style={styles.chipAlt}>
            <Text style={styles.chipAltText}>{exercise.equipment}</Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={appTheme.colors.muted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      padding: appTheme.spacing.md,
      marginBottom: appTheme.spacing.sm,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: appTheme.radius.md,
      backgroundColor: `${appTheme.colors.accent}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: appTheme.spacing.md,
      borderWidth: 1,
      borderColor: `${appTheme.colors.accent}2A`,
    },
    body: {
      flex: 1,
      gap: 6,
    },
    name: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 6,
    },
    chip: {
      backgroundColor: appTheme.colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: appTheme.radius.pill,
    },
    chipText: {
      color: appTheme.colors.accent,
      fontSize: 11,
      fontWeight: appTheme.font.weightMedium,
    },
    chipAlt: {
      backgroundColor: appTheme.colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: appTheme.radius.pill,
    },
    chipAltText: {
      color: appTheme.colors.muted,
      fontSize: 11,
      fontWeight: appTheme.font.weightMedium,
    },
    chevron: {
      marginLeft: appTheme.spacing.sm,
    },
  });
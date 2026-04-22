import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Exercise } from '../../types';

interface Props {
  exercise: Exercise;
  onPress: () => void;
}

export const ExerciseListItem = ({ exercise, onPress }: Props) => (
  <TouchableOpacity
    style={styles.container}
    onPress={onPress}
    activeOpacity={0.72}
  >
    {/* Icon */}
    <View style={styles.iconWrap}>
      <Ionicons name="barbell-outline" size={20} color={theme.colors.accent} />
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
      color={theme.colors.muted}
      style={styles.chevron}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.15)',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  chipText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: theme.font.weightMedium,
  },
  chipAlt: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  chipAltText: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightMedium,
  },
  chevron: {
    marginLeft: theme.spacing.sm,
  },
});
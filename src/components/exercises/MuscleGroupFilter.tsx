import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../ui/Chip';
import { MUSCLE_GROUPS, MuscleGroup } from '../../types';
import { theme } from '../../theme/theme';

interface Props {
  selected: MuscleGroup | 'All';
  onSelect: (g: MuscleGroup | 'All') => void;
}

export const MuscleGroupFilter = ({ selected, onSelect }: Props) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    <Chip label="All" active={selected === 'All'} onPress={() => onSelect('All')} />
    {MUSCLE_GROUPS.map((g) => (
      <Chip key={g} label={g} active={selected === g} onPress={() => onSelect(g)} />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.lg },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { theme } from '../../theme/theme';
import { Exercise } from '../../types';

interface Props {
  exercise: Exercise;
  onPress: () => void;
}

export const ExerciseListItem = ({ exercise, onPress }: Props) => (
  <Card onPress={onPress} style={styles.card}>
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="barbell-outline" size={22} color={theme.colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.meta}>
          {exercise.muscleGroup} • {exercise.equipment}
        </Text>
      </View>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.md, padding: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44, height: 44, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  body: { flex: 1 },
  name: { color: theme.colors.text, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
  meta: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginTop: 2 },
});

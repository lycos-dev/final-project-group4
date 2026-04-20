import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const IconButton = ({ name, onPress, color = theme.colors.text, size = 22 }: Props) => (
  <TouchableOpacity onPress={onPress} style={styles.btn} hitSlop={10}>
    <Ionicons name={name} size={size} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: { padding: theme.spacing.sm },
});

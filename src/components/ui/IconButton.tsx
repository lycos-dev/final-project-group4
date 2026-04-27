import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const IconButton = ({ name, onPress, color, size = 22 }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <TouchableOpacity onPress={onPress} style={styles.btn} hitSlop={10}>
      <Ionicons name={name} size={size} color={color ?? appTheme.colors.text} />
    </TouchableOpacity>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    btn: { padding: appTheme.spacing.sm },
  });

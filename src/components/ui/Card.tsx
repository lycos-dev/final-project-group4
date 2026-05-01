import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card = ({ children, style, onPress }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      padding: appTheme.spacing.lg,
    },
  });

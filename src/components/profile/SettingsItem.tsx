import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subLabel?: string;
  rightElement?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

export const SettingsItem = ({ icon, label, subLabel, rightElement, onPress, danger }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const color = danger ? appTheme.colors.danger : appTheme.colors.text;
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </Wrapper>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: appTheme.spacing.md,
    },
    iconContainer: {
      width: 36,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    label: {
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightMedium,
    },
    subLabel: {
      fontSize: appTheme.font.sizeSm,
      color: appTheme.colors.muted,
      marginTop: 2,
    },
  });
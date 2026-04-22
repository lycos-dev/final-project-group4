import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const color = danger ? theme.colors.danger : theme.colors.text;
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
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
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  subLabel: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    marginTop: 2,
  }
});
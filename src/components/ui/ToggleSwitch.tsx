import React from 'react';
import { Switch, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ToggleSwitch = ({ value, onValueChange }: Props) => {
  const { theme } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
      thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#fff' : '#f4f3f4'}
    />
  );
};
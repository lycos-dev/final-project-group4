import React from 'react';
import { Switch, Platform } from 'react-native';
import { theme } from '../../theme/theme';

interface Props {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ToggleSwitch = ({ value, onValueChange }: Props) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
      thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#fff' : '#f4f3f4'}
    />
  );
};
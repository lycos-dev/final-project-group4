import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const CustomToggle = ({ value, onValueChange }: Props) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.container,
        { backgroundColor: value ? theme.colors.accent : theme.colors.border }
      ]}
      activeOpacity={0.8}
    >
      <View style={[
        styles.knob,
        value ? styles.knobActive : styles.knobInactive
      ]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  knob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  knobActive: {
    alignSelf: 'flex-end',
  },
  knobInactive: {
    alignSelf: 'flex-start',
  },
});

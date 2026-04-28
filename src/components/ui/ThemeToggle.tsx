import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const ThemeToggle = ({ value, onValueChange }: Props) => {
  const { theme } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value, progress]);

  const knobTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 30],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          borderColor: theme.colors.border,
          backgroundColor: value ? theme.colors.surfaceAlt : theme.colors.surface,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="sunny" size={16} color={value ? theme.colors.muted : '#2E9E58'} />
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name="moon" size={15} color={value ? '#8FB7FF' : theme.colors.muted} />
      </View>

      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? '#8FB7FF' : '#2E9E58',
            transform: [{ translateX: knobTranslateX }],
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 62,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});

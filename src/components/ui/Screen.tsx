import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  forceTopSafe?: boolean;
}

export const Screen = ({ children, scroll = false, padded = true, style, forceTopSafe = false }: Props) => {
  const { theme: appTheme } = useTheme();
  const inner = padded ? styles.padded : undefined;
  return (
    <SafeAreaView 
      style={[styles.safe, { backgroundColor: appTheme.colors.bg }]} 
      edges={forceTopSafe ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scroll, inner, style]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: theme.spacing.xxl },
  padded: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
});

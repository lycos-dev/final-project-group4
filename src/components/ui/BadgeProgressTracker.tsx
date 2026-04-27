import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme/theme';

interface Props {
  name: string;
  currentValue: number;
  goalValue: number;
  icon?: string;
  description?: string;
}

export const BadgeProgressTracker = ({
  name,
  currentValue,
  goalValue,
  icon = 'medal',
  description,
}: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  const progress = useMemo(() => {
    const percent = (currentValue / goalValue) * 100;
    return Math.min(percent, 100);
  }, [currentValue, goalValue]);

  const isUnlocked = currentValue >= goalValue;
  const badgeOpacity = isUnlocked ? 1 : 0.5;
  const badgeColor = isUnlocked ? appTheme.colors.accent : appTheme.colors.muted;

  return (
    <View style={styles.container}>
      {/* Badge Icon */}
      <View style={styles.badgeContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={40}
          color={badgeColor}
          style={{ opacity: badgeOpacity }}
        />
        {isUnlocked && (
          <View style={styles.checkmarkBadge}>
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={appTheme.colors.accentText}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {description && <Text style={styles.description}>{description}</Text>}

        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { 
                width: `${progress}%`,
                backgroundColor: isUnlocked ? appTheme.colors.success : appTheme.colors.accent,
              },
            ]}
          />
        </View>

        {/* Progress Text */}
        <Text style={styles.progressText}>
          {currentValue}/{goalValue}
        </Text>
      </View>

      {/* Unlock Status */}
      {isUnlocked && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.unlockedText}>Unlocked</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      padding: appTheme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: appTheme.spacing.lg,
    },
    badgeContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: appTheme.colors.success,
      borderRadius: appTheme.radius.pill,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: appTheme.colors.surface,
    },
    content: {
      flex: 1,
    },
    name: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
      marginBottom: appTheme.spacing.xs,
    },
    description: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      marginBottom: appTheme.spacing.sm,
    },
    progressBarBackground: {
      width: '100%',
      height: 6,
      backgroundColor: appTheme.colors.surfaceAlt,
      borderRadius: appTheme.radius.sm,
      overflow: 'hidden',
      marginBottom: appTheme.spacing.xs,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: appTheme.radius.sm,
    },
    progressText: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
      fontWeight: appTheme.font.weightMedium,
    },
    unlockedBadge: {
      backgroundColor: appTheme.colors.success,
      paddingHorizontal: appTheme.spacing.sm,
      paddingVertical: 4,
      borderRadius: appTheme.radius.sm,
    },
    unlockedText: {
      color: appTheme.colors.accentText,
      fontSize: appTheme.font.sizeXs,
      fontWeight: appTheme.font.weightBold,
    },
  });

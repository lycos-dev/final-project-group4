import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const progress = useMemo(() => {
    const percent = (currentValue / goalValue) * 100;
    return Math.min(percent, 100);
  }, [currentValue, goalValue]);

  const isUnlocked = currentValue >= goalValue;
  const badgeOpacity = isUnlocked ? 1 : 0.5;
  const badgeColor = isUnlocked ? theme.colors.accent : theme.colors.muted;

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
              color={theme.colors.accentText}
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
                backgroundColor: isUnlocked ? theme.colors.success : theme.colors.accent,
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
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
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.pill,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.xs,
  },
  description: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    marginBottom: theme.spacing.sm,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.radius.sm,
  },
  progressText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightMedium,
  },
  unlockedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  unlockedText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeXs,
    fontWeight: theme.font.weightBold,
  },
});

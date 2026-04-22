import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { Profile } from '../../types';

interface Props {
  profile: Profile;
  /** Subtitle shown beneath the name – pass age string or any label */
  subtitle?: string;
}

export const ProfileHeader = ({ profile, subtitle }: Props) => {
  const initials = profile.name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Subtle pulse on mount
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
    >
      {/* Outer glow ring */}
      <View style={styles.ringOuter}>
        <LinearGradient
          colors={[theme.colors.accent, '#7EE800', '#3DD68C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ring}
        >
          {/* Inner cutout */}
          <View style={styles.ringCutout}>
            {/* Avatar background */}
            <LinearGradient
              colors={['#1E2510', theme.colors.surfaceAlt]}
              style={styles.avatarBg}
            >
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>

      {/* NEXA badge */}
      <View style={styles.badge}>
        <LinearGradient
          colors={[theme.colors.accent, '#7EE800']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badgeGradient}
        >
          <Text style={styles.badgeText}>NEXA PRO</Text>
        </LinearGradient>
      </View>

      <Text style={styles.name}>{profile.name}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
};

const AVATAR_SIZE = 100;
const RING_PADDING = 3;

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: theme.spacing.xl },

  ringOuter: {
    // Accent glow shadow (iOS)
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderRadius: (AVATAR_SIZE + RING_PADDING * 2 + 4) / 2,
    marginBottom: theme.spacing.md,
  },
  ring: {
    borderRadius: (AVATAR_SIZE + RING_PADDING * 2 + 4) / 2,
    padding: RING_PADDING,
  },
  ringCutout: {
    borderRadius: (AVATAR_SIZE + 2) / 2,
    padding: 2,
    backgroundColor: theme.colors.bg,
  },
  avatarBg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 36,
    fontWeight: theme.font.weightBlack,
    color: theme.colors.accent,
    letterSpacing: 2,
  },

  badge: {
    position: 'absolute',
    top: AVATAR_SIZE + RING_PADDING * 2 + theme.spacing.xl - 4,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    // subtle shadow
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  badgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    color: theme.colors.accentText,
    fontSize: 9,
    fontWeight: theme.font.weightBlack,
    letterSpacing: 1.5,
  },

  name: {
    color: theme.colors.text,
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBlack,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    marginTop: 3,
  },
});
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../theme/theme';
import { useWorkout } from '../context/WorkoutContext';
import type { RootStackParamList } from './RootNavigator';

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { name: 'Home',    label: 'Home',      icon: 'home',    iconOutline: 'home-outline'    },
  { name: 'Library', label: 'Exercises', icon: 'barbell', iconOutline: 'barbell-outline' },
  { name: 'Profile', label: 'Profile',   icon: 'person',  iconOutline: 'person-outline'  },
] as const;

const TAB_COUNT  = TABS.length;
const TAB_WIDTH  = SCREEN_WIDTH / TAB_COUNT;
const BAR_HEIGHT = 64;
const ICON_SIZE  = 22;

interface TabButtonProps {
  tab: typeof TABS[number];
  isActive: boolean;
  onPress: () => void;
}

const TabButton = ({ tab, isActive, onPress }: TabButtonProps) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const iconScale    = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;
  const pressScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: isActive ? 1.1 : 1, useNativeDriver: true, tension: 220, friction: 10 }),
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0.6, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(pressScale, { toValue: 0.92, useNativeDriver: true, tension: 300, friction: 10 }).start()}
      onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start()}
      activeOpacity={1}
      style={[styles.tabBtn, { width: TAB_WIDTH }]}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: pressScale }] }]}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
          <Ionicons
            name={(isActive ? tab.icon : tab.iconOutline) as any}
            size={ICON_SIZE}
            color={isActive ? appTheme.colors.accent : appTheme.colors.muted}
          />
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            { color: isActive ? appTheme.colors.accent : appTheme.colors.muted, opacity: labelOpacity },
          ]}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Floating pill shown ABOVE the tab bar when a workout is minimized.
 * Visible on every tab — the user shouldn't lose track of it.
 */
const WorkoutMiniBar = () => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isActive, isMinimized, setMinimized, discardWorkout, getElapsedSeconds, isPaused } = useWorkout();
  const [, force] = useState(0);

  // Slide-in animation when the bar becomes visible
  const slideY = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (isActive && isMinimized) {
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 180,
        friction: 18,
      }).start();
    } else {
      // Reset so next appearance animates again
      slideY.setValue(80);
    }
  }, [isActive, isMinimized]);

  // Tick every second to keep the elapsed display live
  useEffect(() => {
    if (!isActive || isPaused) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isActive, isPaused]);

  if (!isActive || !isMinimized) return null;

  const elapsed = getElapsedSeconds();
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  // Format: "1h 02m" when ≥ 1 hour, "MM:SS" otherwise
  const timeText = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const expand = () => {
    setMinimized(false);
    nav.navigate('LogWorkout', {});
  };

  const askDiscard = () => {
    Alert.alert(
      'Discard workout?',
      'Your in-progress workout will be permanently lost. This cannot be undone.',
      [
        { text: 'Keep workout', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: discardWorkout },
      ],
    );
  };

  return (
    <Animated.View
      style={[styles.miniBarWrap, { transform: [{ translateY: slideY }] }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity activeOpacity={0.85} onPress={expand} style={styles.miniBar}>
        <View style={styles.miniDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.miniTitle}>Workout in progress</Text>
          <Text style={styles.miniSub}>
            {isPaused ? 'Paused · ' : ''}{timeText}
          </Text>
        </View>
        <TouchableOpacity
          onPress={expand}
          style={styles.miniIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-up" size={20} color={appTheme.colors.accentText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={askDiscard}
          style={[styles.miniIconBtn, styles.miniIconBtnGhost]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={appTheme.colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CustomTabBarProps { state: any; descriptors: any; navigation: any; }

const CustomTabBar = ({ state, navigation }: CustomTabBarProps) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const insets = useSafeAreaInsets();
  const activeIdx = state.index;

  const bottomPad = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 0;

  const indicatorX = useRef(new Animated.Value(TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16)).current;
  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16,
      useNativeDriver: true,
      tension: 200,
      friction: 16,
    }).start();
  }, [activeIdx]);

  return (
    <View>
      {/* Mini-bar appears on ALL tabs, not just Home/Library */}
      <WorkoutMiniBar />
      <View style={[styles.barWrapper, { minHeight: BAR_HEIGHT + bottomPad, paddingBottom: bottomPad }]}>
        <View style={styles.topDivider} />
        <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]} />
        <View style={styles.tabsRow}>
          {TABS.map((tab, i) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={activeIdx === i}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[i].key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) navigation.navigate(state.routes[i].name);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default function BottomTabs() {
  const { theme: appTheme } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: appTheme.colors.bg },
        headerTintColor: appTheme.colors.text,
        headerTitleStyle: { fontWeight: appTheme.font.weightBold, fontSize: appTheme.font.sizeLg },
      }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}         options={{ title: 'NEXA' }} />
      <Tab.Screen name="Library" component={ExerciseListScreen} options={{ title: 'Exercises', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen}      options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    barWrapper: {
      backgroundColor: appTheme.colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -3 },
      elevation: 12,
    },
    topDivider: { height: 1, backgroundColor: appTheme.colors.border, opacity: 0.4 },
    indicator: {
      position: 'absolute',
      top: 0,
      width: 32,
      height: 3,
      borderRadius: 2,
      backgroundColor: appTheme.colors.accent,
    },
    tabsRow: { flexDirection: 'row', alignItems: 'center', height: BAR_HEIGHT },
    tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: BAR_HEIGHT },
    tabInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 10 },
    iconWrap: { marginBottom: 3 },
    tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },

    /* ── Floating mini-bar ─────────────────────────────────────────────── */
    miniBarWrap: {
      paddingHorizontal: appTheme.spacing.md,
      paddingBottom: appTheme.spacing.sm,
    },
    miniBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: appTheme.colors.accent,
      borderRadius: appTheme.radius.lg,
      paddingHorizontal: appTheme.spacing.md,
      paddingVertical: appTheme.spacing.sm,
      gap: appTheme.spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    miniDot: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: appTheme.colors.danger,
    },
    miniTitle: {
      color: appTheme.colors.accentText,
      fontSize: appTheme.font.sizeSm,
      fontWeight: appTheme.font.weightBold,
    },
    miniSub: {
      color: appTheme.colors.accentText,
      fontSize: 11,
      opacity: 0.8,
      marginTop: 1,
    },
    miniIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    miniIconBtnGhost: { backgroundColor: 'rgba(0,0,0,0.10)' },
  });

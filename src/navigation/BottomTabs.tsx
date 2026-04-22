import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { theme } from '../theme/theme';

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

const TAB_COUNT = TABS.length;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const BAR_HEIGHT = 64;

// ── Single tab button ──────────────────────────────────────────────────────────
interface TabButtonProps {
  tab:      typeof TABS[number];
  isActive: boolean;
  onPress:  () => void;
}

const TabButton = ({ tab, isActive, onPress }: TabButtonProps) => {
  // Pill background
  const pillScale   = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;
  const pillOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  // Icon
  const iconBounce  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  // Label — always partially visible; fully lit when active
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.45)).current;
  const labelSlide   = useRef(new Animated.Value(isActive ? 0 : 3)).current;
  // Press feedback
  const pressScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale,    { toValue: isActive ? 1 : 0.7,  useNativeDriver: true, tension: 200, friction: 14 }),
      Animated.timing(pillOpacity,  { toValue: isActive ? 1 : 0,    duration: 180,         useNativeDriver: true }),
      Animated.spring(iconBounce,   { toValue: isActive ? 1 : 0,    useNativeDriver: true, tension: 220, friction: 10 }),
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0.45, duration: 180,         useNativeDriver: true }),
      Animated.spring(labelSlide,   { toValue: isActive ? 0 : 3,    useNativeDriver: true, tension: 200, friction: 14 }),
    ]).start();
  }, [isActive]);

  const iconTranslateY = iconBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const iconScale      = iconBounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 8  }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={[styles.tabBtn, { width: TAB_WIDTH }]}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: pressScale }] }]}>

        {/* Pill highlight */}
        <Animated.View
          style={[
            styles.pill,
            { opacity: pillOpacity, transform: [{ scaleX: pillScale }] },
          ]}
        />

        {/* Icon */}
        <Animated.View style={{ transform: [{ translateY: iconTranslateY }, { scale: iconScale }], marginBottom: 3 }}>
          <Ionicons
            name={(isActive ? tab.icon : tab.iconOutline) as any}
            size={22}
            color={isActive ? theme.colors.accent : theme.colors.muted}
          />
        </Animated.View>

        {/* Label — ALWAYS rendered, just dimmed when inactive */}
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              color:     isActive ? theme.colors.accent : theme.colors.muted,
              opacity:   labelOpacity,
              transform: [{ translateY: labelSlide }],
            },
          ]}
        >
          {tab.label}
        </Animated.Text>

      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Custom tab bar ─────────────────────────────────────────────────────────────
interface CustomTabBarProps {
  state:       any;
  descriptors: any;
  navigation:  any;
}

const CustomTabBar = ({ state, navigation }: CustomTabBarProps) => {
  const insets    = useSafeAreaInsets();
  const activeIdx = state.index;

  // Dynamic safe-area padding:
  // iOS  → insets.bottom = home indicator height (typically 34px)
  // Android gesture nav → insets.bottom is set by the system
  // Android 3-button nav → insets.bottom = 0, keep minimum 8px
  const bottomPad = insets.bottom > 0
    ? insets.bottom
    : Platform.OS === 'android' ? 8 : 0;

  // Sliding top-indicator
  const indicatorX = useRef(
    new Animated.Value(TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16)
  ).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue:      TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16,
      useNativeDriver: true,
      tension:      200,
      friction:     16,
    }).start();
  }, [activeIdx]);

  return (
    <View
      style={[
        styles.barWrapper,
        {
          // Grows with safe-area inset; never smaller than designed height
          minHeight:     BAR_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
        },
      ]}
    >
      {/* Top divider */}
      <View style={styles.topDivider} />

      {/* Sliding accent indicator */}
      <Animated.View
        style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]}
      />

      {/* Tab row */}
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeIdx === i}
            onPress={() => {
              const event = navigation.emit({
                type:              'tabPress',
                target:            state.routes[i].key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(state.routes[i].name);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ── Navigator ──────────────────────────────────────────────────────────────────
export default function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle:      { backgroundColor: theme.colors.bg },
        headerTintColor:  theme.colors.text,
        headerTitleStyle: {
          fontWeight: theme.font.weightBold,
          fontSize:   theme.font.sizeLg,
        },
      }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}         options={{ title: 'NEXA' }} />
      <Tab.Screen name="Library" component={ExerciseListScreen} options={{ title: 'Exercises', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen}      options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  barWrapper: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: theme.colors.surface,
    shadowColor:     '#000',
    shadowOpacity:   0.12,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: -3 },
    elevation:       12,
  },
  topDivider: {
    height:          1,
    backgroundColor: theme.colors.border,
    opacity:         0.4,
  },
  indicator: {
    position:        'absolute',
    top:             0,
    width:           32,
    height:          3,
    borderRadius:    2,
    backgroundColor: theme.colors.accent,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    height:        BAR_HEIGHT,
  },
  tabBtn: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    height:         BAR_HEIGHT,
  },
  tabInner: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  pill: {
    position:        'absolute',
    width:           72,
    height:          36,
    borderRadius:    18,
    backgroundColor: theme.colors.accent,
    opacity:         0.14,
    top:             -4,
  },
  tabLabel: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 0.3,
    textAlign:     'center',
  },
});
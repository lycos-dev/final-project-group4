import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'Home',    label: 'Home',      icon: 'home',    iconOutline: 'home-outline'    },
  { name: 'Library', label: 'Exercises', icon: 'barbell', iconOutline: 'barbell-outline' },
  { name: 'Profile', label: 'Profile',   icon: 'person',  iconOutline: 'person-outline'  },
] as const;

const TAB_COUNT   = TABS.length;
const TAB_WIDTH   = SCREEN_WIDTH / TAB_COUNT;
// How tall the flat base of the bar is
const BAR_HEIGHT  = 62;
// How high the active "bump" rises above the bar
const BUMP_HEIGHT = 28;
// Total component height = bar + bump overhang
const TOTAL_HEIGHT = BAR_HEIGHT + BUMP_HEIGHT;
// Radius of the floating active icon circle
const PILL_R = 26;

// ── SVG curve path for the bumped bar background ──────────────────────────────
// The curve is centered on the active tab's midpoint (cx).
// It uses a smooth cubic bezier to dip below the surface and create the
// signature "notch" shape, then fills the rest of the bar.
function buildBarPath(cx: number): string {
  const W  = SCREEN_WIDTH;
  const H  = TOTAL_HEIGHT;
  const bh = BAR_HEIGHT;      // y-level of the flat bar top
  const bump = BUMP_HEIGHT;   // how high bump rises above bh
  const notchW = 90;          // total width of the notch opening
  const curveCtrl = 28;       // bezier control handle spread

  const lx = cx - notchW / 2; // left edge of notch
  const rx = cx + notchW / 2; // right edge of notch
  const ty = bh - bump;       // top of the bump circle clearance

  return [
    `M 0 ${H}`,                                           // bottom-left
    `L 0 ${bh}`,                                          // up left wall
    `L ${lx - curveCtrl} ${bh}`,                          // flat left
    `C ${lx} ${bh} ${lx} ${ty} ${cx} ${ty}`,             // left curve into bump
    `C ${rx} ${ty} ${rx} ${bh} ${rx + curveCtrl} ${bh}`, // right curve out of bump
    `L ${W} ${bh}`,                                       // flat right
    `L ${W} ${H}`,                                        // down right wall
    `Z`,                                                  // close
  ].join(' ');
}

// ── Single tab button ─────────────────────────────────────────────────────────
interface TabButtonProps {
  tab:      typeof TABS[number];
  isActive: boolean;
  onPress:  () => void;
  centerX:  number; // absolute x center of this tab
}

const TabButton = ({ tab, isActive, onPress, centerX }: TabButtonProps) => {
  const rise   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const scale  = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const fade   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelFade = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rise,  { toValue: isActive ? 1 : 0, useNativeDriver: true, tension: 160, friction: 10 }),
      Animated.spring(scale, { toValue: isActive ? 1 : 0, useNativeDriver: true, tension: 200, friction: 12 }),
      Animated.timing(fade,  { toValue: isActive ? 1 : 0, duration: 180, useNativeDriver: true }),
      Animated.timing(labelFade, { toValue: isActive ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  // Active icon floats up above the bar surface into the bump
  const translateY = rise.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, -(BUMP_HEIGHT + 8)],
  });
  const iconScale = scale.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tabBtn, { width: TAB_WIDTH }]}
    >
      {/* Active floating pill */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: fade,
            transform: [{ translateY }, { scale: iconScale }],
          },
        ]}
      >
        <Ionicons
          name={tab.icon as any}
          size={22}
          color={theme.colors.accentText}
        />
      </Animated.View>

      {/* Inactive icon (sits in bar, fades out when active) */}
      <Animated.View
        style={[
          styles.inactiveIcon,
          { opacity: Animated.subtract(1, fade) },
        ]}
      >
        <Ionicons
          name={tab.iconOutline as any}
          size={22}
          color={theme.colors.muted}
        />
      </Animated.View>

      {/* Label — visible when active, hidden otherwise */}
      <Animated.Text
        style={[
          styles.tabLabel,
          { opacity: labelFade, color: theme.colors.accent },
        ]}
      >
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ── Custom tab bar ─────────────────────────────────────────────────────────────
interface CustomTabBarProps {
  state:       any;
  descriptors: any;
  navigation:  any;
}

const CustomTabBar = ({ state, descriptors, navigation }: CustomTabBarProps) => {
  const insets   = useSafeAreaInsets();
  const activeIdx = state.index;

  // Animated cx: horizontal center of the active tab
  const animCx = useRef(new Animated.Value(TAB_WIDTH * activeIdx + TAB_WIDTH / 2)).current;

  // We need a JS-driven value to recalculate the SVG path on each frame
  const [cx, setCx] = React.useState(TAB_WIDTH * activeIdx + TAB_WIDTH / 2);

  useEffect(() => {
    const targetCx = TAB_WIDTH * activeIdx + TAB_WIDTH / 2;
    Animated.spring(animCx, {
      toValue: targetCx,
      useNativeDriver: false, // needs to drive SVG — can't use native driver
      tension: 180,
      friction: 14,
    }).start();
  }, [activeIdx]);

  useEffect(() => {
    const id = animCx.addListener(({ value }) => setCx(value));
    return () => animCx.removeListener(id);
  }, []);

  const barPath = buildBarPath(cx);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <View
      style={[
        styles.barWrapper,
        { height: TOTAL_HEIGHT + bottomPad, paddingBottom: bottomPad },
      ]}
    >
      {/* SVG curved background */}
      <Svg
        width={SCREEN_WIDTH}
        height={TOTAL_HEIGHT}
        style={StyleSheet.absoluteFill}
      >
        <Path d={barPath} fill={theme.colors.surface} />
      </Svg>

      {/* Subtle top border line — only on flat parts */}
      <View style={[styles.borderLine, { width: SCREEN_WIDTH }]} />

      {/* Accent glow dot behind active pill */}
      <Animated.View
        style={[
          styles.glowDot,
          {
            transform: [
              {
                translateX: animCx.interpolate({
                  inputRange:  [0, SCREEN_WIDTH],
                  outputRange: [-PILL_R, SCREEN_WIDTH - PILL_R],
                }),
              },
              { translateY: -(BUMP_HEIGHT + 8 + PILL_R) },
            ],
          },
        ]}
      />

      {/* Tab buttons row */}
      <View style={[styles.tabsRow, { marginTop: BUMP_HEIGHT }]}>
        {TABS.map((tab, i) => (
          <TabButton
            key={tab.name}
            tab={tab}
            isActive={activeIdx === i}
            centerX={TAB_WIDTH * i + TAB_WIDTH / 2}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: state.routes[i].key, canPreventDefault: true });
              if (!event.defaultPrevented) navigation.navigate(state.routes[i].name);
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function BottomTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: theme.font.weightBold, fontSize: theme.font.sizeLg },
      }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}         options={{ title: 'NEXA' }} />
      <Tab.Screen name="Library" component={ExerciseListScreen} options={{ title: 'Exercises', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen}      options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  borderLine: {
    position: 'absolute',
    top: BUMP_HEIGHT,
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.6,
  },
  glowDot: {
    position: 'absolute',
    width: PILL_R * 2,
    height: PILL_R * 2,
    borderRadius: PILL_R,
    backgroundColor: theme.colors.accent,
    opacity: 0.18,
    // slightly larger blur effect via shadow
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: BAR_HEIGHT,
    paddingTop: 10,
  },
  activePill: {
    position: 'absolute',
    width: PILL_R * 2,
    height: PILL_R * 2,
    borderRadius: PILL_R,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    // Drop shadow under the pill
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    top: -8, // sits relative to tabBtn paddingTop baseline before animation
  },
  inactiveIcon: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
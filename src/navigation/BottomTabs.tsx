import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
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

interface TabButtonProps {
  tab:      typeof TABS[number];
  isActive: boolean;
  onPress:  () => void;
}

const TabButton = ({ tab, isActive, onPress }: TabButtonProps) => {
  const iconScale    = useRef(new Animated.Value(isActive ? 1.12 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.45)).current;
  const labelSlide   = useRef(new Animated.Value(isActive ? 0 : 3)).current;
  const pressScale   = useRef(new Animated.Value(1)).current;
  const pillOpacity  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale,    { toValue: isActive ? 1.12 : 1,  useNativeDriver: true, tension: 220, friction: 10 }),
      Animated.timing(pillOpacity,  { toValue: isActive ? 1 : 0,     duration: 180,          useNativeDriver: true }),
      Animated.timing(labelOpacity, { toValue: isActive ? 1 : 0.45,  duration: 180,          useNativeDriver: true }),
      Animated.spring(labelSlide,   { toValue: isActive ? 0 : 3,     useNativeDriver: true, tension: 200, friction: 14 }),
    ]).start();
  }, [isActive]);

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
        {/* Pill rendered first = behind everything */}
        <Animated.View style={[styles.pill, { opacity: pillOpacity }]} />

        {/* Icon on top of pill */}
        <Animated.View style={{ transform: [{ scale: iconScale }], marginBottom: 3 }}>
          <Ionicons
            name={(isActive ? tab.icon : tab.iconOutline) as any}
            size={22}
            color={isActive ? theme.colors.accent : theme.colors.muted}
          />
        </Animated.View>

        {/* Label on top of pill */}
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

interface CustomTabBarProps {
  state:       any;
  descriptors: any;
  navigation:  any;
}

const CustomTabBar = ({ state, navigation }: CustomTabBarProps) => {
  const insets    = useSafeAreaInsets();
  const activeIdx = state.index;

  const bottomPad = insets.bottom > 0
    ? insets.bottom
    : Platform.OS === 'android' ? 8 : 0;

  const indicatorX = useRef(
    new Animated.Value(TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16)
  ).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue:         TAB_WIDTH * activeIdx + TAB_WIDTH / 2 - 16,
      useNativeDriver: true,
      tension:         200,
      friction:        16,
    }).start();
  }, [activeIdx]);

  return (
    <View
      style={[
        styles.barWrapper,
        { minHeight: BAR_HEIGHT + bottomPad, paddingBottom: bottomPad },
      ]}
    >
      <View style={styles.topDivider} />

      <Animated.View
        style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]}
      />

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

const styles = StyleSheet.create({
  barWrapper: {
    // NOT position:absolute — navigator handles layout so content is NOT hidden behind bar
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
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   4,
    paddingHorizontal: 10,
  },
  // Pill is absolutely positioned BEHIND; it doesn't push icon or label
  pill: {
    position:        'absolute',
    width:           72,
    height:          46,
    borderRadius:    23,
    backgroundColor: theme.colors.accent,
    opacity:         0.14,
    alignSelf:       'center',
  },
  tabLabel: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 0.3,
    textAlign:     'center',
  },
});

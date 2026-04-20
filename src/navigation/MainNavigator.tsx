// src/navigation/MainNavigator.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Colors, FontSize, Radius } from '../utils/theme';
import { useStore } from '../store';
import { TabName } from '../types';

const TABS: { name: TabName; icon: string; label: string }[] = [
  { name: 'dashboard', icon: '📊', label: 'Home' },
  { name: 'workout', icon: '💪', label: 'Workout' },
  { name: 'library', icon: '📚', label: 'Library' },
  { name: 'goals', icon: '🎯', label: 'Goals' },
  { name: 'profile', icon: '👤', label: 'Profile' },
];

export function MainNavigator() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const { activeSession } = useStore();

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'workout': return <WorkoutScreen />;
      case 'library': return <LibraryScreen />;
      case 'goals': return <GoalsScreen />;
      case 'profile': return <ProfileScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>{renderScreen()}</View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          const hasLiveWorkout = tab.name === 'workout' && !!activeSession;

          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
                {hasLiveWorkout && <View style={styles.liveDot} />}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18,18,26,0.97)',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4,
    borderRadius: Radius.md,
  },
  tabItemActive: { backgroundColor: 'rgba(200,241,53,0.06)' },
  tabIconWrap: { position: 'relative', marginBottom: 3 },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1, transform: [{ translateY: -1 }] },
  liveDot: {
    position: 'absolute', top: 0, right: -2,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  tabLabel: { fontSize: FontSize.xs, color: Colors.txtDim, fontWeight: '700', letterSpacing: 0.3 },
  tabLabelActive: { color: Colors.accent },
});

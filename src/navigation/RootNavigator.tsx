import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ExerciseFormScreen } from '../screens/exercises/ExerciseFormScreen';
import { ExerciseDetailScreen } from '../screens/exercises/ExerciseDetailScreen';
import { CustomLibraryScreen } from '../screens/exercises/CustomLibraryScreen';
import { ExploreRoutinesScreen } from '../screens/exercises/ExploreRoutinesScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { GoalsScreen } from '../screens/goals/GoalsScreen';
import { LogWorkoutScreen } from '../screens/workouts/LogWorkoutScreen';
import { AddExerciseScreen } from '../screens/workouts/AddExerciseScreen';
import { SaveWorkoutScreen } from '../screens/workouts/SaveWorkoutScreen';
import { WorkoutHistoryScreen } from '../screens/records/WorkoutHistoryScreen';
import { CreateRoutineScreen } from '../screens/routines/CreateRoutineScreen';
import { SelectExerciseForRoutineScreen } from '../screens/routines/SelectExerciseForRoutineScreen';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { Exercise } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  /**
   * Always pass the LIBRARY exercise id here (the original id from ExerciseContext /
   * mockExercises), NOT the unique workout-instance id that LogWorkout assigns.
   * LogExercise.originalExerciseId holds the right value.
   */
  ExerciseDetail: { exerciseId: string };
  ExerciseForm: { exerciseId?: string };
  CustomLibrary: undefined;
  ExploreRoutines: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Goals: undefined;
  Achievements: undefined;
  WorkoutHistory: { dateMs: number };
  LogWorkout: { exercisesToAdd?: Exercise[]; routineName?: string; sourceScreen?: 'ExploreRoutines'; prefillSet?: { reps: number; weight: number }; exerciseId?: string };
  SaveWorkout: {
    routineName?: string;
    durationSeconds: number;
    totalVolumeKg: number;
    totalSets: number;
    completedAt: number;
  };
  AddExercise: { replaceExerciseId?: string } | undefined;
  CreateRoutine: { routineId?: string; targetFolderId?: string };
  SelectExerciseForRoutine: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme: appTheme } = useTheme();
  const { isLoggedIn } = useAuth();

  const stackScreenOptions = {
    headerStyle: { backgroundColor: appTheme.colors.bg },
    headerTintColor: appTheme.colors.text,
    headerTitleStyle: { fontWeight: appTheme.font.weightBold as 'bold' },
  } as const;

  if (isLoggedIn === null) {
    return (
      <View style={[styles.splash, { backgroundColor: appTheme.colors.bg }]}>
        <ActivityIndicator size="large" color={appTheme.colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs"           component={BottomTabs}                    options={{ headerShown: false }} />
          <Stack.Screen
            name="ExerciseDetail"
            component={ExerciseDetailScreen}
            options={{
              title: 'Exercise',
              gestureEnabled: false,
              headerBackVisible: false,
            }}
          />
          <Stack.Screen name="ExerciseForm"   component={ExerciseFormScreen}            options={{ presentation: 'modal', title: 'Exercise' }} />
          <Stack.Screen
            name="CustomLibrary"
            component={CustomLibraryScreen}
            options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen name="ExploreRoutines" component={ExploreRoutinesScreen}        options={{ headerShown: false }} />
          <Stack.Screen name="Goals"           component={GoalsScreen}                  options={{ title: 'Goals' }} />
          <Stack.Screen name="Achievements"    component={AchievementsScreen}          options={{ title: 'Achievements' }} />
          <Stack.Screen name="WorkoutHistory"  component={WorkoutHistoryScreen}         options={{ title: 'Workout History' }} />
          <Stack.Screen name="EditProfile"     component={EditProfileScreen}            options={{ presentation: 'modal', title: 'Edit Profile' }} />
          <Stack.Screen name="Settings"        component={SettingsScreen}               options={{ title: 'Settings' }} />
          <Stack.Screen name="LogWorkout"      component={LogWorkoutScreen}             options={{ headerShown: false }} />
          <Stack.Screen name="SaveWorkout"     component={SaveWorkoutScreen}            options={{ headerShown: false }} />
          <Stack.Screen name="AddExercise"     component={AddExerciseScreen}            options={{ headerShown: false }} />
          <Stack.Screen
            name="CreateRoutine"
            component={CreateRoutineScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="SelectExerciseForRoutine"
            component={SelectExerciseForRoutineScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

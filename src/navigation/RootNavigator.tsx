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
import { GoalsScreen } from '../screens/goals/GoalsScreen';
import { LogWorkoutScreen } from '../screens/workouts/LogWorkoutScreen';
import { AddExerciseScreen } from '../screens/workouts/AddExerciseScreen';
import { CreateRoutineScreen } from '../screens/routines/CreateRoutineScreen';
import { SelectExerciseForRoutineScreen } from '../screens/routines/SelectExerciseForRoutineScreen';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { Exercise } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  ExerciseDetail: { exerciseId: string };
  ExerciseForm: { exerciseId?: string };
  CustomLibrary: undefined;
  ExploreRoutines: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Goals: undefined;
  LogWorkout: { exercisesToAdd?: Exercise[]; routineName?: string };
  AddExercise: undefined;
  // targetFolderId — when set, the routine is pre-assigned to that folder
  // and the folder picker is hidden (user came from inside a folder)
  CreateRoutine: { routineId?: string; targetFolderId?: string };
  SelectExerciseForRoutine: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.bg },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: theme.font.weightBold as 'bold' },
  contentStyle: { backgroundColor: theme.colors.bg },
} as const;

export default function RootNavigator() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn === null) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
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
          <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen}          options={{ title: 'Exercise' }} />
          <Stack.Screen name="ExerciseForm"   component={ExerciseFormScreen}            options={{ presentation: 'modal', title: 'Exercise' }} />
          <Stack.Screen name="CustomLibrary"  component={CustomLibraryScreen}           options={{ headerShown: false }} />
          <Stack.Screen name="ExploreRoutines" component={ExploreRoutinesScreen}        options={{ headerShown: false }} />
          <Stack.Screen name="Goals"          component={GoalsScreen}                   options={{ title: 'Goals' }} />
          <Stack.Screen name="EditProfile"    component={EditProfileScreen}             options={{ presentation: 'modal', title: 'Edit Profile' }} />
          <Stack.Screen name="Settings"       component={SettingsScreen}                options={{ title: 'Settings' }} />
          <Stack.Screen name="LogWorkout"     component={LogWorkoutScreen}              options={{ headerShown: false }} />
          <Stack.Screen name="AddExercise"    component={AddExerciseScreen}             options={{ headerShown: false }} />
          <Stack.Screen name="CreateRoutine"  component={CreateRoutineScreen}           options={{ presentation: 'modal' }} />
          <Stack.Screen name="SelectExerciseForRoutine" component={SelectExerciseForRoutineScreen} options={{ title: 'Select Exercise' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
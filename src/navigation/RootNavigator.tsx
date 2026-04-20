import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ExerciseFormScreen } from '../screens/exercises/ExerciseFormScreen';
import { ExerciseDetailScreen } from '../screens/exercises/ExerciseDetailScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { LogWorkoutScreen } from '../screens/workouts/LogWorkoutScreen';
import { AddExerciseScreen } from '../screens/workouts/AddExerciseScreen';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Tabs: undefined;
  ExerciseDetail: { exerciseId: string };
  ExerciseForm: { exerciseId?: string };
  EditProfile: undefined;
  Settings: undefined;
  LogWorkout: undefined;
  AddExercise: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: theme.font.weightBold },
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise' }} />
          <Stack.Screen name="ExerciseForm" component={ExerciseFormScreen} options={{ presentation: 'modal', title: 'Exercise' }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal', title: 'Edit Profile' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          <Stack.Screen name="LogWorkout" component={LogWorkoutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddExercise" component={AddExerciseScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

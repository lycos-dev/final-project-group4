import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { ExerciseProvider } from './src/context/ExerciseContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { theme } from './src/theme/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <ExerciseProvider>
            <WorkoutProvider>
              <NavigationContainer theme={navTheme}>
                <StatusBar style="light" />
                <RootNavigator />
              </NavigationContainer>
            </WorkoutProvider>
          </ExerciseProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

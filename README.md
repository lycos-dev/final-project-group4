# NEXA – Fitness Tracker App 🏋️

A full-featured React Native / Expo SDK 54 fitness tracker built in TypeScript, based on the Group 4 NEXA project spec.

## Tech Stack

- **Expo SDK 54** (bare/managed workflow)
- **React Native 0.76** with **TypeScript**
- **Zustand** – lightweight global state management
- **React Native Reanimated 3** – animations
- **React Native Gesture Handler** – gestures
- **React Native Safe Area Context** – safe areas
- **date-fns** – date utilities
- **Expo Linear Gradient** – gradient backgrounds

---

## Features Implemented

| Feature | Status |
|---|---|
| Dashboard with weekly chart & stats | ✅ |
| Workout session logging (sets/reps/weight) | ✅ |
| Exercise library with CRUD + search/filter | ✅ |
| Favourite exercises | ✅ |
| Goals management (CRUD + progress bars) | ✅ |
| Personal Records tracker (auto-updates) | ✅ |
| Body measurement logging | ✅ |
| Profile & settings (unit toggle, notifications) | ✅ |
| Workout history | ✅ |
| Live workout timer | ✅ |
| Custom tab navigator | ✅ |
| Dark theme throughout | ✅ |
| kg / lbs unit converter | ✅ |
| BMI calculator | ✅ |
| Workout streak tracker | ✅ |

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone **or** Android Studio / Xcode

### Install & Run

```bash
# 1. Extract this folder and cd into it
cd nexa-app

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start

# 4. Scan QR code with Expo Go (iOS/Android)
#    or press 'a' for Android emulator, 'i' for iOS simulator
```

### Building for Android APK

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Build APK (development)
eas build -p android --profile preview
```

---

## Project Structure

```
nexa-app/
├── App.tsx                      # Entry point
├── app.json                     # Expo config
├── babel.config.js
├── tsconfig.json
└── src/
    ├── types/
    │   └── index.ts             # All TypeScript interfaces
    ├── utils/
    │   └── theme.ts             # Colors, spacing, radius constants
    ├── store/
    │   └── index.ts             # Zustand global store + actions
    ├── components/
    │   ├── ui.tsx               # Shared: Card, Button, Badge, ProgressBar, Input...
    │   └── MiniChart.tsx        # Bar chart + ring chart components
    ├── screens/
    │   ├── DashboardScreen.tsx  # Home with analytics
    │   ├── WorkoutScreen.tsx    # Session logging + history
    │   ├── LibraryScreen.tsx    # Exercise library CRUD
    │   ├── GoalsScreen.tsx      # Goals CRUD
    │   └── ProfileScreen.tsx    # Profile, settings, measurements
    └── navigation/
        └── MainNavigator.tsx    # Custom bottom tab navigator
```

---

## Design Notes

- **Color palette**: Deep navy `#0a0a0f` background with lime `#c8f135` accent, purple `#7c6af7` secondary
- **Typography**: Uses system fonts with heavy weights for headers
- **State**: All data is in-memory via Zustand (no AsyncStorage in this version — easy to add)
- **No native modules**: Works fully with Expo Go without ejecting

---

## Adding AsyncStorage Persistence (Optional)

In `src/store/index.ts`, wrap the store with `persist`:

```ts
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'nexa-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Group 4 – Blanza, Lycos B. & Medrano, Francis L. | Section C3A

# NEXA — Fitness Tracker (Expo SDK 54 + TypeScript)

Frontend-only fitness tracker mobile app, built with React Native and Expo SDK 54.

## Run locally

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go on your phone.

> Requires Node 20+, and Expo Go app (SDK 54) on a physical device, or Xcode/Android Studio for simulators.

## What's included (Round 1)

✅ **Profile & Settings** — view profile, edit profile (with validation), settings (units toggle, notifications)
✅ **Exercise Library** — full CRUD: search, filter by muscle group, add/edit/delete exercises with mock data
✅ **Reusable UI primitives** — `Screen`, `Card`, `Button`, `Input`, `Chip`, `EmptyState`, `IconButton`
✅ **Navigation** — typed React Navigation v7 (bottom tabs + native stack with modal forms)
✅ **State management** — `ProfileContext` (useState) + `ExerciseContext` (useReducer) with mock data
✅ **Modern dark fitness theme** — lime accent on near-black surfaces

## Folder structure

```
src/
├── navigation/         # RootNavigator (stack), BottomTabs
├── screens/
│   ├── home/           # HomeScreen (dashboard)
│   ├── profile/        # ProfileScreen, EditProfileScreen, SettingsScreen
│   ├── exercises/      # ExerciseListScreen, ExerciseDetailScreen, ExerciseFormScreen
│   ├── goals/          # placeholder for next round
│   ├── routines/       # placeholder
│   ├── measurements/   # placeholder
│   └── records/        # placeholder
├── components/
│   ├── ui/             # shared primitives
│   └── exercises/      # ExerciseListItem, MuscleGroupFilter
├── context/            # ProfileContext, ExerciseContext
├── data/               # mockExercises.ts (10 seeded exercises)
├── theme/              # theme.ts (colors, spacing, radii, font sizes)
├── types/              # Exercise, Profile, MuscleGroup, etc.
└── utils/              # validation helpers
```

## Coming next round

- **Goals Management** (CRUD UI) — wire `GoalsScreen` into `GoalsContext`
- **Routine Builder** — compose routines from exercise library; navigate from a new tab
- **Body Measurements Tracker** — time-series log with simple charts
- **Personal Records** — auto-tracked PRs per exercise

## Notes for plugging in the remaining features

1. Add a new context per feature (mirror `ExerciseContext` pattern).
2. Replace the `EmptyState` in each placeholder screen with real screens.
3. Add new stack screens (forms / detail) to `RootNavigator.tsx`.
4. Reuse `Screen`, `Card`, `Button`, `Input` for consistency.
5. Add validation in `src/utils/validation.ts`.

## Design tokens

All colors / spacing / radii live in `src/theme/theme.ts`. Never hardcode colors in components — import from theme.

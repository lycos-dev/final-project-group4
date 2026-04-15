# NEXA Fitness Tracker (React Native + TypeScript)

Cross-platform mobile fitness tracker app built with Expo React Native and TypeScript.

## Architecture

- `src/components`: reusable UI pieces
- `src/screens`: feature screens
- `src/models`: typed data models
- `src/services`: storage, analytics, unit conversion, validation, notifications
- `src/context`: global app state provider
- `src/navigation`: tab + stack navigation setup

## Core Systems (CRUD)

- User Account Management
- Workout Logging
- Fitness Goals
- Exercise Library

## Main + Additional Features

- Dashboard with weekly summary, goal progress, and chart analytics
- Workout Plan / Routine Builder
- Guided Workout with timer controls
- Workout History with search/filter
- Profile & Settings (dark mode, notification toggle, unit preference)
- Local notifications/reminders (expo-notifications)
- Body Measurement Tracker
- Personal Records Tracker
- Weight unit converter (kg/lbs)
- Favourite Exercises
- Workout Gallery (local image URIs)

## Data Storage

- Offline/local only via AsyncStorage
- No backend API dependency

## Validation

- Non-empty string validation
- Non-negative numeric validation
- Email format validation

## Run

```bash
npm install
npm run start
```

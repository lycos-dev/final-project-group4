// ─────────────────────────────────────────────────────────────────────────────
// NEXA — Global Types
// All domain models and navigation types live here.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums ────────────────────────────────────────────────────────────────────

export type WeightUnit = 'kg' | 'lbs';

export type GoalType = 'weight_loss' | 'weight_gain' | 'endurance' | 'strength' | 'custom';

export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'balance';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full_body'
  | 'other';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;           // firstName + lastName concatenated
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  age: number;
  weight: number;         // always stored in kg internally
  height: number;         // always in cm
  weightUnit: WeightUnit; // display preference
  createdAt: string;      // ISO date string
  updatedAt: string;
}

// Shape used for registration form (pre-hash)
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;           // string from TextInput, parsed before save
  weight: string;
  height: string;
  weightUnit: WeightUnit;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// Public-safe user (no password hash exposed to UI)
export type SafeUser = Omit<User, 'passwordHash'>;

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: SafeUser | null;
  isLoading: boolean;
  isInitialized: boolean; // DB is ready, session check complete
}

export interface AuthContextValue extends AuthState {
  login: (data: LoginFormData) => Promise<AuthResult>;
  register: (data: RegisterFormData) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

// ─── Navigation ───────────────────────────────────────────────────────────────

// Root: toggles between Auth and Main based on session
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth stack
export type AuthStackParamList = {
  SignIn: undefined;
  Register: undefined;
};

// Main bottom-tab navigator
export type MainTabParamList = {
  DashboardTab: undefined;
  WorkoutTab: undefined;
  LibraryTab: undefined;
  GoalsTab: undefined;
  ProfileTab: undefined;
};

// ─── Workout ──────────────────────────────────────────────────────────────────

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  instructions: string;
  isPreset: boolean;       // true = seeded, false = user-created
  isFavourite: boolean;
  createdAt: string;
}

export interface WorkoutSet {
  id: number;
  sessionId: number;
  exerciseId: number;
  exerciseName: string;  // denormalized for history display
  setNumber: number;
  reps: number;
  weight: number;        // in kg
  duration?: number;     // seconds, for cardio
  createdAt: string;
}

export interface WorkoutSession {
  id: number;
  userId: number;
  name: string;
  date: string;          // ISO date
  durationSeconds: number;
  caloriesBurned: number;
  notes?: string;
  sets: WorkoutSet[];
  photoUris?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface FitnessGoal {
  id: number;
  userId: number;
  type: GoalType;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;       // ISO date
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Body Measurements ────────────────────────────────────────────────────────

export interface BodyMeasurement {
  id: number;
  userId: number;
  date: string;
  weight?: number;        // kg
  bodyFatPercent?: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  thighsCm?: number;
  createdAt: string;
}

// ─── Routine ──────────────────────────────────────────────────────────────────

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface RoutineExercise {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number;
}

export interface WorkoutRoutine {
  id: number;
  userId: number;
  name: string;
  schedule: Record<DayOfWeek, RoutineExercise[]>;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Personal Records ────────────────────────────────────────────────────────

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  maxWeight: number;       // kg
  maxReps: number;
  achievedAt: string;
}
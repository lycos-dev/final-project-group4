export type ID = string;

export type WeightUnit = 'kg' | 'lbs';

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  password: string;
  age: number;
  weight: number;
  height: number;
  unit: WeightUnit;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface WorkoutLog {
  id: ID;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  date: string;
}

export interface FitnessGoal {
  id: ID;
  goalType: string;
  targetValue: number;
  deadline: string;
  progress: number;
}

export interface Exercise {
  id: ID;
  name: string;
  category: string;
  targetMuscles: string;
  instructions: string;
  favorite: boolean;
}

export interface RoutineDay {
  day: string;
  exerciseIds: ID[];
}

export interface BodyMeasurement {
  id: ID;
  date: string;
  weight: number;
  bodyFat: number;
}

export interface GalleryImage {
  id: ID;
  uri: string;
  createdAt: string;
}

export interface AppData {
  user: UserProfile;
  workouts: WorkoutLog[];
  goals: FitnessGoal[];
  exercises: Exercise[];
  routine: RoutineDay[];
  measurements: BodyMeasurement[];
  gallery: GalleryImage[];
}


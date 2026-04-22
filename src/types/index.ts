export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Cardio' | 'Full Body';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Full Body',
];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  instructions: string;
  defaultSets: number;
  defaultReps: number;
}

export type Units = 'metric' | 'imperial';

export interface Profile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  avatar?: string;
}

export interface Settings {
  units: Units;
  notifications: boolean;
}

export interface RoutineExercise extends Exercise {
  instanceId?: string; // Unique ID for this exercise instance in the routine (for handling duplicates)
  notes?: string;
  customSets?: number;
  customReps?: number;
  restTimerDuration?: number;
  routineSets?: Array<{
    id: string;
    reps: string;
    weight: string;
  }>;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: number;
  exercises: RoutineExercise[];
}

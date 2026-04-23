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
  /** Brief, ordered coaching cues — one action per step. */
  steps: string[];
  /** URL to a demonstration photo or GIF. */
  imageUrl?: string;
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
  /** Optional folder this routine belongs to. */
  folderId?: string;
}

/** A user-created folder that groups routines together. */
export interface RoutineFolder {
  id: string;
  name: string;
  createdAt: number;
}

/** Difficulty level for a preset routine. */
export type RoutineLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** A read-only curated routine shown on the Explore screen. */
export interface PresetRoutine {
  id: string;
  name: string;
  level: RoutineLevel;
  /** Broad category label shown as metadata (e.g. "Push", "Full Body"). */
  category: string;
  exercises: Exercise[];
}
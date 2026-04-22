import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Exercise } from '../types';

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
}

export interface LogExercise extends Exercise {
  notes: string;
  restTimerDuration: number;
  sets: WorkoutSet[];
}

interface WorkoutContextType {
  exercises: LogExercise[];
  setExercises: (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => void;
  addExercises: (exercisesToAdd: Exercise[]) => void;
  clearWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);

  const setExercises = (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => {
    if (typeof value === 'function') {
      setExercisesState(value);
    } else {
      setExercisesState(value);
    }
  };

  const addExercises = (exercisesToAdd: Exercise[]) => {
    const newExercises = exercisesToAdd.map((ex: any) => {
      // Generate a unique ID for each exercise instance (so duplicate exercises have different IDs)
      const uniqueInstanceId = `${ex.id}-${Date.now()}-${Math.random()}`;
      
      // Check if this is a routine exercise with saved sets and rest timer
      const hasSavedRoutineData = ex.routineSets && ex.routineSets.length > 0;
      const routineRestTimer = ex.restTimerDuration ?? 0;
      
      return {
        ...ex,
        id: uniqueInstanceId, // Override the exercise ID with a unique instance ID
        notes: '',
        restTimerDuration: routineRestTimer,
        sets: hasSavedRoutineData
          ? // Use saved routine sets, but add completed flag
            ex.routineSets.map((s: any) => ({
              ...s,
              completed: false,
            }))
          : // Create default sets
            Array.from({ length: ex.defaultSets }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: '',
              weight: '',
              completed: false,
            })),
      };
    });
    
    setExercisesState((prev) => [...prev, ...newExercises]);
  };

  const clearWorkout = () => {
    setExercisesState([]);
  };

  return (
    <WorkoutContext.Provider value={{ exercises, setExercises, addExercises, clearWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

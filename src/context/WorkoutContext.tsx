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
    const newExercises = exercisesToAdd.map((ex) => ({
      ...ex,
      notes: '',
      restTimerDuration: 0,
      sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
        id: `${ex.id}-set-${i}-${Date.now()}-${Math.random()}`,
        reps: String(ex.defaultReps),
        weight: '0',
        completed: false,
      })),
    }));
    
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

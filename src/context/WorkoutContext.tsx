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

export interface CompletedWorkout {
  id: string;
  routineName: string;
  exercises: LogExercise[];
  completedAt: number; // timestamp
  durationMinutes: number;
  totalVolumeKg: number;
}

interface WorkoutContextType {
  exercises: LogExercise[];
  setExercises: (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => void;
  addExercises: (exercisesToAdd: Exercise[]) => void;
  clearWorkout: (routineName?: string) => void;
  completedWorkouts: CompletedWorkout[];
  getCompletedWorkoutsByDate: (date: Date) => CompletedWorkout[];
  getCompletedDatesThisMonth: () => number[];
  getRecentWorkout: () => CompletedWorkout | null;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

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

  const calculateWorkoutStats = (exs: LogExercise[]) => {
    let totalVolume = 0;
    exs.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.weight && set.reps) {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          totalVolume += weight * reps;
        }
      });
    });
    return totalVolume;
  };

  const clearWorkout = (routineName: string = 'Custom Workout') => {
    // Save completed workout before clearing
    if (exercises.length > 0) {
      const now = new Date();
      const completedWorkout: CompletedWorkout = {
        id: `${Date.now()}-${Math.random()}`,
        routineName,
        exercises,
        completedAt: now.getTime(),
        durationMinutes: Math.round((Date.now() - (exercises[0]?.startTime || now.getTime())) / 60000),
        totalVolumeKg: calculateWorkoutStats(exercises),
      };
      setCompletedWorkouts((prev) => [...prev, completedWorkout]);
    }
    setExercisesState([]);
  };

  const getCompletedWorkoutsByDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return completedWorkouts.filter((w) => {
      const workoutDate = new Date(w.completedAt);
      return workoutDate >= targetDate && workoutDate < nextDate;
    });
  };

  const getCompletedDatesThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const completedDates = new Set<number>();
    completedWorkouts.forEach((w) => {
      const workoutDate = new Date(w.completedAt);
      if (
        workoutDate.getMonth() === currentMonth &&
        workoutDate.getFullYear() === currentYear
      ) {
        completedDates.add(workoutDate.getDate());
      }
    });

    return Array.from(completedDates).sort((a, b) => a - b);
  };

  const getRecentWorkout = (): CompletedWorkout | null => {
    if (completedWorkouts.length === 0) return null;
    return completedWorkouts[completedWorkouts.length - 1];
  };

  return (
    <WorkoutContext.Provider
      value={{
        exercises,
        setExercises,
        addExercises,
        clearWorkout,
        completedWorkouts,
        getCompletedWorkoutsByDate,
        getCompletedDatesThisMonth,
        getRecentWorkout,
      }}
    >
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

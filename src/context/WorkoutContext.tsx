import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import { Exercise } from '../types';

export type SetType = 'normal' | 'warmup' | 'failure';

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
  type: SetType;
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
  // Timer
  startTime: number | null;
  setStartTime: (t: number) => void;
  isPaused: boolean;
  togglePause: () => void;
  ensureStarted: () => void;
  getElapsedSeconds: () => number;
  setMinimized: (v: boolean) => void;
  isMinimized: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // ── Timer state ──────────────────────────────────────────────────────
  const [startTime, setStartTimeState] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedAccumMs, setPausedAccumMs] = useState(0);
  const [isMinimized, setMinimized] = useState(false);

  const isPaused = pausedAt !== null;

  const setStartTime = (t: number) => setStartTimeState(t);

  const ensureStarted = useCallback(() => {
    if (startTime === null) {
      setStartTimeState(Date.now());
      setPausedAt(null);
      setPausedAccumMs(0);
    }
  }, [startTime]);

  const togglePause = useCallback(() => {
    if (pausedAt !== null) {
      // Resume: accumulate paused duration
      setPausedAccumMs((prev) => prev + (Date.now() - pausedAt));
      setPausedAt(null);
    } else {
      setPausedAt(Date.now());
    }
  }, [pausedAt]);

  const getElapsedSeconds = useCallback(() => {
    if (startTime === null) return 0;
    const now = isPaused && pausedAt !== null ? pausedAt : Date.now();
    return Math.floor((now - startTime - pausedAccumMs) / 1000);
  }, [startTime, isPaused, pausedAt, pausedAccumMs]);

  // ── Exercise helpers ─────────────────────────────────────────────────
  const setExercises = (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => {
    setExercisesState(value as any);
  };

  const addExercises = (exercisesToAdd: Exercise[]) => {
    const newExercises = exercisesToAdd.map((ex: any) => {
      const uniqueInstanceId = `${ex.id}-${Date.now()}-${Math.random()}`;
      const hasSavedRoutineData = ex.routineSets && ex.routineSets.length > 0;
      const routineRestTimer = ex.restTimerDuration ?? 0;

      return {
        ...ex,
        id: uniqueInstanceId,
        notes: '',
        restTimerDuration: routineRestTimer,
        sets: hasSavedRoutineData
          ? ex.routineSets.map((s: any) => ({ ...s, completed: false }))
          : Array.from({ length: ex.defaultSets }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: '',
              weight: '',
              completed: false,
              type: 'normal' as SetType,
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
    if (exercises.length > 0) {
      const now = new Date();
      const elapsedMs = startTime ? Date.now() - startTime - pausedAccumMs : 0;
      const completedWorkout: CompletedWorkout = {
        id: `${Date.now()}-${Math.random()}`,
        routineName,
        exercises,
        completedAt: now.getTime(),
        durationMinutes: Math.round(elapsedMs / 60000),
        totalVolumeKg: calculateWorkoutStats(exercises),
      };
      setCompletedWorkouts((prev) => [...prev, completedWorkout]);
    }
    setExercisesState([]);
    setStartTimeState(null);
    setPausedAt(null);
    setPausedAccumMs(0);
    setMinimized(false);
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
        startTime,
        setStartTime,
        isPaused,
        togglePause,
        ensureStarted,
        getElapsedSeconds,
        setMinimized,
        isMinimized,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within a WorkoutProvider');
  return ctx;
};
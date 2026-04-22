import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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

interface WorkoutContextType {
  exercises: LogExercise[];
  setExercises: (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => void;
  addExercises: (exercisesToAdd: Exercise[]) => void;
  clearWorkout: () => void;

  /** True when there is an in-progress workout (used by the floating mini-bar). */
  isActive: boolean;

  // ── Timing ─────────────────────────────────────────────────────────────
  startTime: number | null;
  setStartTime: (ts: number) => void;
  pausedAt: number | null;
  pausedAccumMs: number;
  isPaused: boolean;
  togglePause: () => void;
  /** Make sure a workout has a startTime — call when entering the log screen. */
  ensureStarted: () => void;
  /** Current elapsed seconds based on startTime + pause accounting. */
  getElapsedSeconds: () => number;

  // ── Minimized (floating bar) ──────────────────────────────────────────
  isMinimized: boolean;
  setMinimized: (b: boolean) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [startTime, setStartTimeState] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [pausedAccumMs, setPausedAccumMs] = useState(0);
  const [isMinimized, setMinimized] = useState(false);

  const setExercises = (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => {
    setExercisesState(value as any);
  };

  const addExercises = (exercisesToAdd: Exercise[]) => {
    const newExercises: LogExercise[] = exercisesToAdd.map((ex) => ({
      ...ex,
      notes: '',
      restTimerDuration: 0,
      sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
        id: `${ex.id}-set-${i}-${Date.now()}-${Math.random()}`,
        reps: String(ex.defaultReps),
        weight: '0',
        completed: false,
        type: 'normal' as SetType,
      })),
    }));
    setExercisesState((prev) => [...prev, ...newExercises]);
  };

  const clearWorkout = () => {
    setExercisesState([]);
    setStartTimeState(null);
    setPausedAt(null);
    setPausedAccumMs(0);
    setMinimized(false);
  };

  const ensureStarted = useCallback(() => {
    setStartTimeState((t) => (t == null ? Date.now() : t));
  }, []);

  const setStartTime = (ts: number) => {
    setStartTimeState(ts);
    setPausedAccumMs(0);
    setPausedAt(null);
  };

  const togglePause = () => {
    if (pausedAt == null) {
      setPausedAt(Date.now());
    } else {
      setPausedAccumMs((acc) => acc + (Date.now() - pausedAt));
      setPausedAt(null);
    }
  };

  const getElapsedSeconds = () => {
    if (startTime == null) return 0;
    const end = pausedAt ?? Date.now();
    return Math.max(0, Math.floor((end - startTime - pausedAccumMs) / 1000));
  };

  const isActive = exercises.length > 0 || startTime != null;
  const isPaused = pausedAt != null;

  return (
    <WorkoutContext.Provider
      value={{
        exercises,
        setExercises,
        addExercises,
        clearWorkout,
        isActive,
        startTime,
        setStartTime,
        pausedAt,
        pausedAccumMs,
        isPaused,
        togglePause,
        ensureStarted,
        getElapsedSeconds,
        isMinimized,
        setMinimized,
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
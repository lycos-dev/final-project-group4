import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Exercise } from '../types';

export type SetType = 'normal' | 'warmup' | 'failure';
export type WeightUnit = 'kg' | 'lb';

export interface WorkoutSet {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
  type: SetType;
}

export interface LogExercise extends Exercise {
  /** The original library exercise id (before a unique instance id is applied). */
  originalExerciseId: string;
  notes: string;
  restTimerDuration: number;
  sets: WorkoutSet[];
}

export interface CompletedWorkout {
  id: string;
  routineName: string;
  exercises: LogExercise[];
  completedAt: number;
  durationSeconds: number;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  description?: string;
  photoUri?: string;
}

export interface SaveWorkoutPayload {
  routineName: string;
  completedAt: number;
  durationSeconds: number;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  description?: string;
  photoUri?: string;
}

export interface WorkoutSettings {
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  autoStartRestTimer: boolean;
  countWarmupInVolume: boolean;
  confirmBeforeDiscard: boolean;
  vibrateOnSetComplete: boolean;
  showFinishSummary: boolean;
}

interface WorkoutContextType {
  // ── active workout exercises ──────────────────────────────────────────────
  exercises: LogExercise[];
  setExercises: (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => void;
  addExercises: (exercisesToAdd: Exercise[]) => void;
  saveWorkout: (payload: SaveWorkoutPayload) => void;
  /** Save the workout to history then reset all state. */
  clearWorkout: (routineName?: string) => void;
  /** Reset all state WITHOUT saving to history (discard). */
  discardWorkout: () => void;

  // ── completed history ─────────────────────────────────────────────────────
  completedWorkouts: CompletedWorkout[];
  getCompletedWorkoutsByDate: (date: Date) => CompletedWorkout[];
  getCompletedDatesThisMonth: () => number[];
  getRecentWorkout: () => CompletedWorkout | null;

  // ── timer / session state ─────────────────────────────────────────────────
  isActive: boolean;
  isMinimized: boolean;
  setMinimized: (v: boolean) => void;
  isPaused: boolean;
  togglePause: () => void;
  startTime: number | null;
  setStartTime: (ms: number) => void;
  getElapsedSeconds: () => number;
  /** Override elapsed seconds (adjusts internal state accordingly). */
  setElapsedSeconds: (seconds: number) => void;
  /** Start the timer if it hasn't started yet. */
  ensureStarted: () => void;

  // ── settings ──────────────────────────────────────────────────────────────
  settings: WorkoutSettings;
  updateSettings: (patch: Partial<WorkoutSettings>) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const DEFAULT_SETTINGS: WorkoutSettings = {
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  autoStartRestTimer: true,
  countWarmupInVolume: false,
  confirmBeforeDiscard: true,
  vibrateOnSetComplete: true,
  showFinishSummary: true,
};

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);

  // ── timer internals ───────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimizedState] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTimeState] = useState<number | null>(null);

  /**
   * Total seconds accumulated from all completed (non-paused) segments.
   * Updated each time we pause.
   */
  const accumulatedRef = useRef(0);
  /**
   * Timestamp (ms) when the current running segment began.
   * null while paused or not yet started.
   */
  const segmentStartRef = useRef<number | null>(null);

  // ── timer helpers ─────────────────────────────────────────────────────────

  const ensureStarted = () => {
    if (!isActive) {
      const now = Date.now();
      accumulatedRef.current = 0;
      segmentStartRef.current = now;
      setStartTimeState(now);
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    const now = Date.now();
    if (isPaused) {
      // Resuming — begin a new segment
      segmentStartRef.current = now;
      setIsPaused(false);
    } else {
      // Pausing — bank elapsed time from the current segment
      if (segmentStartRef.current !== null) {
        accumulatedRef.current += Math.floor((now - segmentStartRef.current) / 1000);
      }
      segmentStartRef.current = null;
      setIsPaused(true);
    }
  };

  const getElapsedSeconds = useCallback((): number => {
    if (!isActive) return 0;
    let total = accumulatedRef.current;
    if (!isPaused && segmentStartRef.current !== null) {
      total += Math.floor((Date.now() - segmentStartRef.current) / 1000);
    }
    return Math.max(0, total);
  }, [isActive, isPaused]);

  /**
   * Manually set elapsed seconds. Adjusts the accumulated counter and
   * re-anchors the segment start so future ticks are correct.
   */
  const setElapsedSeconds = (seconds: number) => {
    const s = Math.max(0, seconds);
    const now = Date.now();
    accumulatedRef.current = s;
    if (!isPaused) {
      segmentStartRef.current = now;
    }
    // Keep startTime consistent for any display that uses it
    setStartTimeState(now - s * 1000);
  };

  const setStartTime = (ms: number) => {
    const now = Date.now();
    const s = Math.max(0, Math.floor((now - ms) / 1000));
    accumulatedRef.current = s;
    if (!isPaused) {
      segmentStartRef.current = now;
    }
    setStartTimeState(ms);
  };

  const setMinimized = (v: boolean) => setIsMinimizedState(v);

  // ── exercise helpers ──────────────────────────────────────────────────────

  const setExercises = (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => {
    setExercisesState(value as any);
  };

  const addExercises = (exercisesToAdd: Exercise[]) => {
    const newExercises = exercisesToAdd.map((ex: any) => {
      const uniqueInstanceId = `${ex.id}-${Date.now()}-${Math.random()}`;
      const hasSavedRoutineData = ex.routineSets && ex.routineSets.length > 0;
      const routineRestTimer = ex.restTimerDuration ?? settings.defaultRestSeconds;

      return {
        ...ex,
        id: uniqueInstanceId,
        originalExerciseId: ex.id,   // <-- preserve original library id
        notes: '',
        restTimerDuration: routineRestTimer,
        sets: hasSavedRoutineData
          ? ex.routineSets.map((s: any) => ({ ...s, completed: false }))
          : Array.from({ length: ex.defaultSets }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: String(ex.defaultReps ?? ''),
              weight: '0',
              completed: false,
              type: 'normal' as SetType,
            })),
      };
    });
    setExercisesState((prev) => [...prev, ...newExercises]);
  };

  const calculateStats = (exs: LogExercise[]) => {
    let totalVolume = 0;
    exs.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed && set.weight && set.reps) {
          const isWarmup = set.type === 'warmup';
          if (settings.countWarmupInVolume || !isWarmup) {
            totalVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
          }
        }
      });
    });
    return totalVolume;
  };

  const calculateCompletedSets = (exs: LogExercise[]) =>
    exs.reduce((acc, ex) => acc + ex.sets.filter((set) => set.completed).length, 0);

  // ── private reset (shared by clearWorkout + discardWorkout) ──────────────

  const _resetState = () => {
    setExercisesState([]);
    setIsActive(false);
    setIsMinimizedState(false);
    setIsPaused(false);
    setStartTimeState(null);
    accumulatedRef.current = 0;
    segmentStartRef.current = null;
  };

  const clearWorkout = (routineName: string = 'Custom Workout') => {
    if (exercises.length > 0) {
      const elapsed = getElapsedSeconds();
      const record: CompletedWorkout = {
        id: `${Date.now()}-${Math.random()}`,
        routineName,
        exercises,
        completedAt: Date.now(),
        durationSeconds: elapsed,
        durationMinutes: Math.round(elapsed / 60),
        totalVolumeKg: calculateStats(exercises),
        totalSets: calculateCompletedSets(exercises),
      };
      setCompletedWorkouts((prev) => [...prev, record]);
    }
    _resetState();
  };

  const saveWorkout = (payload: SaveWorkoutPayload) => {
    if (exercises.length === 0) {
      _resetState();
      return;
    }

    const safeDurationSeconds = Math.max(0, Math.floor(payload.durationSeconds));
    const safeDurationMinutes = Math.max(0, Math.floor(payload.durationMinutes));
    const safeVolume = Math.max(0, payload.totalVolumeKg);
    const safeSets = Math.max(0, Math.floor(payload.totalSets));

    const record: CompletedWorkout = {
      id: `${Date.now()}-${Math.random()}`,
      routineName: payload.routineName.trim() || 'Custom Workout',
      exercises,
      completedAt: payload.completedAt,
      durationSeconds: safeDurationSeconds,
      durationMinutes: safeDurationMinutes,
      totalVolumeKg: safeVolume,
      totalSets: safeSets,
      description: payload.description?.trim() || undefined,
      photoUri: payload.photoUri,
    };

    setCompletedWorkouts((prev) => [...prev, record]);
    _resetState();
  };

  const discardWorkout = () => {
    _resetState();
  };

  // ── history queries ───────────────────────────────────────────────────────

  const getCompletedWorkoutsByDate = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return completedWorkouts.filter((w) => {
      const d = new Date(w.completedAt);
      return d >= start && d < end;
    });
  };

  const getCompletedDatesThisMonth = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const dates = new Set<number>();
    completedWorkouts.forEach((w) => {
      const d = new Date(w.completedAt);
      if (d.getMonth() === month && d.getFullYear() === year) {
        dates.add(d.getDate());
      }
    });
    return Array.from(dates).sort((a, b) => a - b);
  };

  const getRecentWorkout = (): CompletedWorkout | null =>
    completedWorkouts.length === 0 ? null : completedWorkouts[completedWorkouts.length - 1];

  const updateSettings = (patch: Partial<WorkoutSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <WorkoutContext.Provider
      value={{
        exercises,
        setExercises,
        addExercises,
        saveWorkout,
        clearWorkout,
        discardWorkout,
        completedWorkouts,
        getCompletedWorkoutsByDate,
        getCompletedDatesThisMonth,
        getRecentWorkout,
        isActive,
        isMinimized,
        setMinimized,
        isPaused,
        togglePause,
        startTime,
        setStartTime,
        getElapsedSeconds,
        setElapsedSeconds,
        ensureStarted,
        settings,
        updateSettings,
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

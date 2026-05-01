import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  /** Delete a completed workout from history by id */
  deleteCompletedWorkout: (id: string) => void;

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
  favoriteExerciseIds: Set<string>;
  toggleFavoriteExercise: (exerciseId: string) => void;
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

const FAVORITES_KEY = '@nexa/favorite_exercises';
const EXERCISE_HISTORY_KEY = '@nexa/exercise_set_history';
const WORKOUTS_KEY = '@nexa/completed_workouts';
const SETTINGS_KEY = '@nexa/workout_settings';

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set());
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, { reps: string; weight: string }>>({});

  // Load persisted data on mount
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Load completed workouts
        const workoutsRaw = await AsyncStorage.getItem(WORKOUTS_KEY);
        if (mounted && workoutsRaw) {
          const parsed = JSON.parse(workoutsRaw);
          if (Array.isArray(parsed)) {
            setCompletedWorkouts(parsed);
          }
        }
        // Load settings
        const settingsRaw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (mounted && settingsRaw) {
          const parsed = JSON.parse(settingsRaw);
          if (parsed && typeof parsed === 'object') {
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          }
        }
        // Load favorites
        const favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (mounted && favRaw) {
          const parsed = JSON.parse(favRaw);
          if (Array.isArray(parsed)) {
            setFavoriteExerciseIds(new Set(parsed.filter(id => typeof id === 'string')));
          }
        }
        // Load exercise set history
        const historyRaw = await AsyncStorage.getItem(EXERCISE_HISTORY_KEY);
        if (mounted && historyRaw) {
          const parsed = JSON.parse(historyRaw);
          if (parsed && typeof parsed === 'object') {
            setExerciseHistory(parsed);
          }
        }
      } catch {
        // Ignore restore failures
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  // Persist completed workouts when changed
  useEffect(() => {
    AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(completedWorkouts)).catch(() => {});
  }, [completedWorkouts]);

  // Persist settings when changed
  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  // Persist favorites when changed
  useEffect(() => {
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteExerciseIds])).catch(() => {});
  }, [favoriteExerciseIds]);

  // Persist exercise set history when changed
  useEffect(() => {
    AsyncStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(exerciseHistory)).catch(() => {});
  }, [exerciseHistory]);

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

      // Check if there's history for this exercise
      const history = exerciseHistory[ex.id];

      return {
        ...ex,
        id: uniqueInstanceId,
        originalExerciseId: ex.id,   // <-- preserve original library id
        notes: '',
        restTimerDuration: routineRestTimer,
        sets: hasSavedRoutineData
          ? ex.routineSets.map((s: any) => ({ ...s, completed: false }))
          : [{
              id: `${uniqueInstanceId}-set-0`,
              reps: history ? history.reps : '',
              weight: history ? history.weight : '',
              completed: false,
              type: 'normal' as SetType,
            }], // Always provide at least one set, pre-filled with history if available
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
      // Only save exercises that have at least one completed set
      const exercisesToSave = exercises
        .map(ex => ({
          ...ex,
          sets: ex.sets.filter(s => s.completed) // Only save completed sets
        }))
        .filter(ex => ex.sets.length > 0); // Only include exercises with completed sets
      
      if (exercisesToSave.length === 0) {
        _resetState();
        return;
      }
      
      const record: CompletedWorkout = {
        id: `${Date.now()}-${Math.random()}`,
        routineName,
        exercises: exercisesToSave,
        completedAt: Date.now(),
        durationSeconds: elapsed,
        durationMinutes: Math.round(elapsed / 60),
        totalVolumeKg: calculateStats(exercisesToSave),
        totalSets: calculateCompletedSets(exercisesToSave),
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

    // Save exercise set history for future pre-fill
    const newHistory = { ...exerciseHistory };
    exercises.forEach((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length > 0) {
        // Save the last completed set as reference
        const lastSet = completedSets[completedSets.length - 1];
        newHistory[ex.originalExerciseId] = {
          reps: lastSet.reps,
          weight: lastSet.weight,
        };
      }
    });
    setExerciseHistory(newHistory);

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

  const deleteCompletedWorkout = (id: string) => {
    setCompletedWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const updateSettings = (patch: Partial<WorkoutSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const toggleFavoriteExercise = (exerciseId: string) => {
    setFavoriteExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next))).catch(() => {
        // Keep UI responsive even if persistence fails.
      });
      return next;
    });
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
        deleteCompletedWorkout,
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
        favoriteExerciseIds,
        toggleFavoriteExercise,
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

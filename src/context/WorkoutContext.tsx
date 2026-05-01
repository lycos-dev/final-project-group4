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
import { useAuth } from './AuthContext';

export type SetType = 'normal' | 'warmup' | 'failure' | 'drop';
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
  supersetWith?: string; // id of paired exercise for superset
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
  // ── active workout exercises ──────────────────────────────────────────
  exercises: LogExercise[];
  setExercises: (value: LogExercise[] | ((prev: LogExercise[]) => LogExercise[])) => void;
  addExercises: (exercisesToAdd: Exercise[]) => void;
  saveWorkout: (payload: SaveWorkoutPayload) => void;
  /** Save the workout to history then reset all state. */
  clearWorkout: (routineName?: string) => void;
  /** Reset all state WITHOUT saving to history (discard). */
  discardWorkout: () => void;

  // ── completed history ─────────────────────────────────────────────
  completedWorkouts: CompletedWorkout[];
  exerciseHistory: Record<string, { setCount: number; reps: string; weight: string }>;
  getCompletedWorkoutsByDate: (date: Date) => CompletedWorkout[];
  getCompletedDatesThisMonth: () => number[];
  getRecentWorkout: () => CompletedWorkout | null;
  /** Delete a completed workout from history by id */
  deleteCompletedWorkout: (id: string) => void;

  // ── timer / session state ─────────────────────────────────────────
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

  // ── settings ──────────────────────────────────────────────────────
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

const getUserKey = (email: string | undefined, key: string) => {
  if (!email) return key; // fallback for no user
  return `${key}_${email.toLowerCase()}`;
};

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userEmail = user?.email;
  
  const getKey = (key: string) => getUserKey(userEmail, key);
  
  const [exercises, setExercisesState] = useState<LogExercise[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<Set<string>>(new Set());
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, { setCount: number; reps: string; weight: string }>>({});

  // Clear state when user changes
  useEffect(() => {
    setExercisesState([]);
    setCompletedWorkouts([]);
    setSettings(DEFAULT_SETTINGS);
    setFavoriteExerciseIds(new Set());
    setExerciseHistory({});
  }, [userEmail]);

  // Load persisted data on mount - depends on userEmail
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Load completed workouts
        const workoutsRaw = await AsyncStorage.getItem(getKey(WORKOUTS_KEY));
        if (mounted && workoutsRaw) {
          const parsed = JSON.parse(workoutsRaw);
          if (Array.isArray(parsed)) {
            setCompletedWorkouts(parsed);
          }
        }
        // Load settings
        const settingsRaw = await AsyncStorage.getItem(getKey(SETTINGS_KEY));
        if (mounted && settingsRaw) {
          const parsed = JSON.parse(settingsRaw);
          if (parsed && typeof parsed === 'object') {
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          }
        }
        // Load favorites
        const favRaw = await AsyncStorage.getItem(getKey(FAVORITES_KEY));
        if (mounted && favRaw) {
          const parsed = JSON.parse(favRaw);
          if (Array.isArray(parsed)) {
            setFavoriteExerciseIds(new Set(parsed.filter(id => typeof id === 'string')));
          }
        }
        // Load exercise set history
        const historyRaw = await AsyncStorage.getItem(getKey(EXERCISE_HISTORY_KEY));
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
  }, [userEmail]);

  // Persist completed workouts when changed
  useEffect(() => {
    const key = getKey(WORKOUTS_KEY);
    AsyncStorage.setItem(key, JSON.stringify(completedWorkouts)).catch(() => {});
  }, [completedWorkouts, userEmail]);

  // Persist settings when changed
  useEffect(() => {
    const key = getKey(SETTINGS_KEY);
    AsyncStorage.setItem(key, JSON.stringify(settings)).catch(() => {});
  }, [settings, userEmail]);

  // Persist favorites when changed
  useEffect(() => {
    const key = getKey(FAVORITES_KEY);
    AsyncStorage.setItem(key, JSON.stringify([...favoriteExerciseIds])).catch(() => {});
  }, [favoriteExerciseIds, userEmail]);

  // Persist exercise set history when changed
  useEffect(() => {
    const key = getKey(EXERCISE_HISTORY_KEY);
    AsyncStorage.setItem(key, JSON.stringify(exerciseHistory)).catch(() => {});
  }, [exerciseHistory, userEmail]);

  // ── timer internals ───────────────────────────────────────────────
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

  // ── timer helpers ─────────────────────────────────────────────────

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

  // ── exercise helpers ─────────────────────────────────────────────

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
          : history
          ? // Create same number of sets as in history, pre-filled with history values
            Array.from({ length: history.setCount }, (_, i) => ({
              id: `${uniqueInstanceId}-set-${i}`,
              reps: history.reps,
              weight: history.weight,
              completed: false,
              type: 'normal' as SetType,
            }))
          : [{
              id: `${uniqueInstanceId}-set-0`,
              reps: '',
              weight: '',
              completed: false,
              type: 'normal' as SetType,
            }], // Always provide at least one empty set
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

  // ── private reset (shared by clearWorkout + discardWorkout) ──────
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
      if (ex.sets.length > 0) {
        // Save the total number of sets and the values from the first set
        newHistory[ex.originalExerciseId] = {
          setCount: ex.sets.length,
          reps: ex.sets[0].reps,
          weight: ex.sets[0].weight,
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

  // ── history queries ─────────────────────────────────────────────

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
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])).catch(() => {
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
        exerciseHistory,
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
      }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within a WorkoutProvider');
  return ctx;
};

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Routine, RoutineExercise, Exercise } from '../types';

interface RoutineContextType {
  routines: Routine[];
  currentRoutine: Routine | null;
  addRoutine: (routine: Routine) => void;
  updateRoutine: (routine: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  setCurrentRoutine: (routine: Routine | null) => void;
  addExerciseToRoutine: (exercise: RoutineExercise) => void;
  removeExerciseFromRoutine: (exerciseId: string) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider = ({ children }: { children: ReactNode }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);

  const addRoutine = (routine: Routine) => {
    setRoutines((prev) => [...prev, routine]);
  };

  const updateRoutine = (routine: Routine) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? routine : r))
    );
  };

  const deleteRoutine = (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    if (currentRoutine?.id === routineId) {
      setCurrentRoutine(null);
    }
  };

  const addExerciseToRoutine = (exercise: RoutineExercise) => {
    if (!currentRoutine) return;
    const updated = {
      ...currentRoutine,
      exercises: [...currentRoutine.exercises, exercise],
    };
    setCurrentRoutine(updated);
    updateRoutine(updated);
  };

  const removeExerciseFromRoutine = (exerciseId: string) => {
    if (!currentRoutine) return;
    const updated = {
      ...currentRoutine,
      exercises: currentRoutine.exercises.filter((e) => e.id !== exerciseId),
    };
    setCurrentRoutine(updated);
    updateRoutine(updated);
  };

  return (
    <RoutineContext.Provider
      value={{
        routines,
        currentRoutine,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        setCurrentRoutine,
        addExerciseToRoutine,
        removeExerciseFromRoutine,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (context === undefined) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
};

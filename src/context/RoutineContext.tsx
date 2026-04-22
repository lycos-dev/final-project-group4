import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Routine, RoutineExercise, RoutineFolder } from '../types';

interface RoutineContextType {
  routines: Routine[];
  currentRoutine: Routine | null;
  folders: RoutineFolder[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (routine: Routine) => void;
  deleteRoutine: (routineId: string) => void;
  setCurrentRoutine: (routine: Routine | null) => void;
  addExerciseToRoutine: (exercise: RoutineExercise) => void;
  removeExerciseFromRoutine: (exerciseId: string) => void;
  // Folder management
  addFolder: (name: string) => RoutineFolder;
  deleteFolder: (folderId: string) => void;
  assignRoutineToFolder: (routineId: string, folderId: string | undefined) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider = ({ children }: { children: ReactNode }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [folders, setFolders] = useState<RoutineFolder[]>([]);

  const addRoutine = (routine: Routine) => {
    setRoutines((prev) => [...prev, routine]);
  };

  const updateRoutine = (routine: Routine) => {
    setRoutines((prev) => prev.map((r) => (r.id === routine.id ? routine : r)));
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

  // ── Folder methods ──────────────────────────────────────────────────────────

  const addFolder = (name: string): RoutineFolder => {
    const folder: RoutineFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, folder]);
    return folder;
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Un-assign routines that were in the deleted folder
    setRoutines((prev) =>
      prev.map((r) => (r.folderId === folderId ? { ...r, folderId: undefined } : r))
    );
  };

  const assignRoutineToFolder = (routineId: string, folderId: string | undefined) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, folderId } : r))
    );
  };

  return (
    <RoutineContext.Provider
      value={{
        routines,
        currentRoutine,
        folders,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        setCurrentRoutine,
        addExerciseToRoutine,
        removeExerciseFromRoutine,
        addFolder,
        deleteFolder,
        assignRoutineToFolder,
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
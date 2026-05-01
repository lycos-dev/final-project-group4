import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, RoutineExercise, RoutineFolder } from '../types';
import { useAuth } from './AuthContext';

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

const STORAGE_KEY = '@nexa/routines';
const FOLDERS_STORAGE_KEY = '@nexa/routine_folders';

const getUserKey = (email: string | undefined, key: string) => {
  if (!email) return key;
  return `${key}_${email.toLowerCase()}`;
};

export const RoutineProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const getKey = (key: string) => getUserKey(userEmail, key);
  
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [folders, setFolders] = useState<RoutineFolder[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Clear state when user changes
  useEffect(() => {
    setRoutines([]);
    setCurrentRoutine(null);
    setFolders([]);
    setLoaded(false);
  }, [userEmail]);

  // Load routines from storage on mount - depends on userEmail
  useEffect(() => {
    const loadRoutines = async () => {
      try {
        const [routinesJson, foldersJson] = await Promise.all([
          AsyncStorage.getItem(getKey(STORAGE_KEY)),
          AsyncStorage.getItem(getKey(FOLDERS_STORAGE_KEY)),
        ]);
        if (routinesJson) {
          setRoutines(JSON.parse(routinesJson));
        }
        if (foldersJson) {
          setFolders(JSON.parse(foldersJson));
        }
      } catch (e) {
        console.error('Failed to load routines from storage', e);
      } finally {
        setLoaded(true);
      }
    };
    loadRoutines();
  }, [userEmail]);

  // Save routines to storage whenever they change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(getKey(STORAGE_KEY), JSON.stringify(routines)).catch((e) =>
      console.error('Failed to save routines', e),
    );
  }, [routines, loaded, userEmail]);

  // Save folders to storage whenever they change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(getKey(FOLDERS_STORAGE_KEY), JSON.stringify(folders)).catch((e) =>
      console.error('Failed to save routine folders', e),
    );
  }, [folders, loaded, userEmail]);

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

  // ── Folder methods ──────────────────────────────────────────────────

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
      prev.map((r) => (r.folderId === folderId ? { ...r, folderId: undefined } : r)),
    );
  };

  const assignRoutineToFolder = (routineId: string, folderId: string | undefined) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, folderId } : r)),
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

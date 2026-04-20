import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Exercise } from '../types';
import { MOCK_EXERCISES } from '../data/mockExercises';

type Action =
  | { type: 'ADD'; payload: Exercise }
  | { type: 'UPDATE'; payload: Exercise }
  | { type: 'REMOVE'; payload: string };

const reducer = (state: Exercise[], action: Action): Exercise[] => {
  switch (action.type) {
    case 'ADD': return [action.payload, ...state];
    case 'UPDATE': return state.map((e) => (e.id === action.payload.id ? action.payload : e));
    case 'REMOVE': return state.filter((e) => e.id !== action.payload);
    default: return state;
  }
};

interface ExerciseContextValue {
  exercises: Exercise[];
  addExercise: (e: Omit<Exercise, 'id'>) => Exercise;
  updateExercise: (e: Exercise) => void;
  removeExercise: (id: string) => void;
  getById: (id: string) => Exercise | undefined;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

export const ExerciseProvider = ({ children }: { children: ReactNode }) => {
  const [exercises, dispatch] = useReducer(reducer, MOCK_EXERCISES);

  const addExercise = (e: Omit<Exercise, 'id'>) => {
    const newEx: Exercise = { ...e, id: Date.now().toString() };
    dispatch({ type: 'ADD', payload: newEx });
    return newEx;
  };
  const updateExercise = (e: Exercise) => dispatch({ type: 'UPDATE', payload: e });
  const removeExercise = (id: string) => dispatch({ type: 'REMOVE', payload: id });
  const getById = (id: string) => exercises.find((e) => e.id === id);

  return (
    <ExerciseContext.Provider value={{ exercises, addExercise, updateExercise, removeExercise, getById }}>
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExercises = () => {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error('useExercises must be used inside ExerciseProvider');
  return ctx;
};

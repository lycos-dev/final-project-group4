import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Profile, Settings, Goal, GoalType } from '../types';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: Profile;
  settings: Settings;
  goals: Goal[];
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  createGoal: (goal: {
    name: string;
    type: GoalType;
    targetValue: number;
    startingValue: number;
    deadline: string;
  }) => void;
  updateGoalProgress: (goalId: string, currentValue: number) => void;
  deleteGoal: (goalId: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const initialProfile: Profile = {
  name: 'Alex Rivera',
  age: 27,
  heightCm: 178,
  weightKg: 76,
  goal: 'Build lean muscle and improve endurance',
};

const initialSettings: Settings = { units: 'metric', notifications: true };

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();

  // Update profile when user logs in
  useEffect(() => {
    if (user) {
      const heightCm = user.height; // Height is already in cm from signup
      const weightKg = user.weightUnit === 'kg' ? user.weight : user.weight * 0.453592; // Convert lbs to kg if needed
      
      setProfile({
        name: `${user.firstName} ${user.lastName}`,
        age: user.age,
        heightCm,
        weightKg,
        goal: 'Achieve fitness goals',
      });
    }
  }, [user]);

  const updateProfile = (p: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...p }));
  const updateSettings = (s: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...s }));

  const createGoal = (goal: {
    name: string;
    type: GoalType;
    targetValue: number;
    startingValue: number;
    deadline: string;
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setGoals((prev) => [
      {
        id,
        name: goal.name,
        type: goal.type,
        targetValue: goal.targetValue,
        startingValue: goal.startingValue,
        currentValue: goal.startingValue,
        hasManualUpdate: false,
        deadline: goal.deadline,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const updateGoalProgress = (goalId: string, currentValue: number) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, currentValue, hasManualUpdate: true } : goal
      )
    );
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        settings,
        goals,
        updateProfile,
        updateSettings,
        createGoal,
        updateGoalProgress,
        deleteGoal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
};

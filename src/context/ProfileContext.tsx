import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Profile, Settings } from '../types';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: Profile;
  settings: Settings;
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (s: Partial<Settings>) => void;
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

  return (
    <ProfileContext.Provider value={{ profile, settings, updateProfile, updateSettings }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
};

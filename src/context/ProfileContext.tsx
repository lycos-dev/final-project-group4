import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profile, Settings } from '../types';

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

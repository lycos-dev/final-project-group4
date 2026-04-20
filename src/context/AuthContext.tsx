import React, { createContext, useContext, useState } from 'react';

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  height: number;
}

interface User extends SignupData {
  email: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store registered users
let registeredUsers: Map<string, SignupData> = new Map([
  ['admin@gmail.com', { email: 'admin@gmail.com', password: 'password', firstName: 'Admin', lastName: 'User', age: 30, weight: 70, weightUnit: 'kg', height: 180 }],
]);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const userData = registeredUsers.get(email);

    if (userData && userData.password === password) {
      setIsLoggedIn(true);
      setUser({ ...userData, email });
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const signup = async (data: SignupData) => {
    if (registeredUsers.has(data.email)) {
      throw new Error('Email already registered');
    }

    registeredUsers.set(data.email, data);
    setIsLoggedIn(true);
    setUser({ ...data, email: data.email });
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

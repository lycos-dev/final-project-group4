import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  /** Always stored in cm */
  height: number;
}

export interface User extends Omit<SignupData, 'password'> {
  email: string;
}

interface AuthContextType {
  /** Tri-state: null = still restoring session, false = logged out, true = logged in */
  isLoggedIn: boolean | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  SESSION: '@nexa/session',
  USER_PREFIX: '@nexa/user/',
} as const;

const userKey = (email: string) => `${KEYS.USER_PREFIX}${email.toLowerCase()}`;

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // ── Restore session on mount ───────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(KEYS.SESSION);
        if (raw) {
          const stored: User = JSON.parse(raw);
          setUser(stored);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    restoreSession();
  }, []);

  // ── login ──────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const raw = await AsyncStorage.getItem(userKey(email));

    // Also allow the built-in demo account even after a fresh install
    const isDemo =
      email.toLowerCase() === 'admin@gmail.com' && password === 'password';

    if (!raw && !isDemo) {
      throw new Error('No account found with that email address.');
    }

    let userData: SignupData;
    if (raw) {
      userData = JSON.parse(raw) as SignupData;
      if (userData.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
    } else {
      // Demo account fallback
      userData = {
        email: 'admin@gmail.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'User',
        age: 30,
        weight: 70,
        weightUnit: 'kg',
        height: 180,
      };
    }

    const { password: _pw, ...safeUser } = userData;
    const sessionUser: User = { ...safeUser, email: userData.email };

    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setIsLoggedIn(true);
  }, []);

  // ── signup ─────────────────────────────────────────────────────────────
  const signup = useCallback(async (data: SignupData) => {
    const existing = await AsyncStorage.getItem(userKey(data.email));
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    await AsyncStorage.setItem(userKey(data.email), JSON.stringify(data));

    const { password: _pw, ...safeUser } = data;
    const sessionUser: User = { ...safeUser, email: data.email };

    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setIsLoggedIn(true);
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(KEYS.SESSION);
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
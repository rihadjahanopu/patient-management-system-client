/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Receptionist' | 'Doctor' | 'Patient';
  phone: string;
  avatar?: string;
  doctorProfile?: any;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (...roles: string[]) => boolean;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_CACHE_KEY = 'auth_user';

function saveUserCache(user: User): void {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function loadUserCache(): User | null {
  try {
    const raw: string | null = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  Cookies.remove('token', { path: '/' });
  localStorage.removeItem('token');
  localStorage.removeItem(USER_CACHE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken: string | undefined = Cookies.get('token') || localStorage.getItem('token') || undefined;

    if (!storedToken) {
      setLoading(false);
      return;
    }

    // ✅ Immediately restore from cache so pages don't redirect to /login
    const cachedUser: User | null = loadUserCache();
    if (cachedUser) {
      setToken(storedToken);
      setUser(cachedUser);
      setLoading(false); // Show page immediately with cached user
    }

    // Then silently re-validate with backend in background
    api.auth.me()
      .then((data: any) => {
        const rawUser: any = data.user;
        const freshUser: User = {
          ...rawUser,
          id: String(rawUser.id || rawUser._id || ''),
          _id: String(rawUser._id || rawUser.id || ''),
        };
        setUser(freshUser);
        setToken(storedToken);
        saveUserCache(freshUser);
      })
      .catch((err: unknown) => {
        const msg: string = err instanceof Error ? err.message : '';
        const isDefiniteAuthError: boolean =
          msg.includes('401') ||
          msg.includes('403') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('deactivated') ||
          msg.toLowerCase().includes('invalid token') ||
          msg.toLowerCase().includes('unauthorized');

        if (isDefiniteAuthError) {
          // Hard auth failure → force logout
          clearSession();
          setToken(null);
          setUser(null);
          router.push('/login');
        }
        // Network error / server down → keep cached user, stay logged in
      })
      .finally(() => {
        if (!cachedUser) setLoading(false);
      });
  }, [router]);

  const login = async (email: string, password: string): Promise<void> => {
    const data: any = await api.auth.login(email, password);

    // Persist token
    Cookies.set('token', data.token, { expires: 7, path: '/' });
    localStorage.setItem('token', data.token);

    // Persist user for offline-safe reload
    const loggedInUser: User = data.user;
    saveUserCache(loggedInUser);

    setToken(data.token);
    setUser(loggedInUser);

    // Role-based redirect
    const roleRoutes: Record<string, string> = {
      Admin: '/admin',
      Receptionist: '/receptionist',
      Doctor: '/doctor',
      Patient: '/track',
    };
    router.push(roleRoutes[loggedInUser.role] || '/');
  };

  const logout = (): void => {
    clearSession();
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const isRole = (...roles: string[]): boolean => !!user && roles.includes(user.role);

  const updateUser = (updatedData: Partial<User>): void => {
    setUser((prev: User | null) => {
      if (!prev) return null;
      const merged: User = { ...prev, ...updatedData };
      saveUserCache(merged);
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx: AuthContextValue | null = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

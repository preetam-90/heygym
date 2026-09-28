'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialise from the persisted session and verify it with the server.
  // Falls back to the stored user only when the backend is unreachable,
  // and clears the session when the token is rejected.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const stored = api.getStoredUser();
      if (!stored || !api.isAuthenticated()) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const verified = await api.me();
        if (!cancelled) setUser(verified);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '';
          // Token rejected/expired and refresh failed → drop the session.
          // Network failure → keep the stored user so the UI still works offline-ish.
          if (message === 'Session expired. Please log in again.') {
            setUser(null);
          } else {
            setUser(stored);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();

    // Keep auth state in sync across tabs.
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'user' || event.key === 'accessToken') {
        setUser(api.getStoredUser());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await api.login(email, password);
    setUser(auth.user);
    return auth.user;
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; role?: string }) => {
      const auth = await api.register(data);
      setUser(auth.user);
      return auth.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const verified = await api.me();
      setUser(verified);
      return verified;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

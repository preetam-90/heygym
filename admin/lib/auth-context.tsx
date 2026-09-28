'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export const ACCESS_DENIED_MESSAGE = 'Access denied: this area is for admins only.';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** ADMIN-only guard: non-admin sessions are rejected and their tokens cleared. */
function requireRole(user: User): User {
  if (user.role !== 'ADMIN') {
    throw new Error(ACCESS_DENIED_MESSAGE);
  }
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialise from the persisted session and verify it with the server.
  // Only ADMIN users are kept; anyone else is logged out (tokens cleared).
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
        const verified = requireRole(await api.me());
        if (!cancelled) setUser(verified);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '';
          if (message === ACCESS_DENIED_MESSAGE || message === 'Session expired. Please log in again.') {
            // Not an admin, or token rejected — drop the session entirely.
            await api.logout();
            setUser(null);
          } else {
            // Network failure → keep the stored user only if it is an admin,
            // so the UI still works offline-ish without leaking access.
            setUser(stored.role === 'ADMIN' ? stored : null);
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
        const stored = api.getStoredUser();
        if (stored && stored.role === 'ADMIN') {
          setUser(stored);
        } else {
          // Non-ADMIN user observed from another tab — clear tokens too.
          void api.logout();
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    // Verify the role server-side via GET /me; non-admins get
    // access-denied and their tokens are cleared immediately.
    const verified = await api.me();
    try {
      requireRole(verified);
    } catch (err) {
      await api.logout();
      throw err;
    }
    setUser(verified);
    return verified;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const verified = requireRole(await api.me());
      setUser(verified);
      return verified;
    } catch {
      // Non-admin or expired session — drop the session entirely.
      await api.logout();
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

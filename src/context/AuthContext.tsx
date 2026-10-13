import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { api, tokenStorage } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  quickLoginAs: (role: UserRole, index?: number, username?: string) => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
  isKadis: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        tokenStorage.clear();
        setUser(null);
      }
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/api/auth/login', { identifier, password });
    if (res.success && res.token) {
      tokenStorage.set(res.token);
      setUser(res.user);
    } else {
      throw new Error(res.message || 'Login gagal.');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}
    tokenStorage.clear();
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  // Quick login helper for demonstration and test scenarios
  const quickLoginAs = async (role: UserRole, index = 1, username?: string, userId?: string) => {
    try {
      const res = await api.post('/api/auth/quick-login', {
        role,
        identifier: username,
        userId,
      });
      if (res.success && res.token && res.user) {
        tokenStorage.set(res.token);
        setUser(res.user);
        return;
      }
    } catch {
      // Fallback to credential login if quick endpoint has issues
    }

    let identifier = username || '';
    let password = '';

    if (!identifier) {
      if (role === 'admin') {
        identifier = 'admin';
      } else if (role === 'kadis') {
        identifier = 'kadis';
      } else {
        identifier = `pengawas${index}`;
      }
    }

    if (identifier === 'admin') {
      password = 'AdminGarut2026!';
    } else if (identifier === 'kadis') {
      password = 'KadisGarut2026!';
    } else {
      password = 'Pengawas123!';
    }

    await login(identifier, password);
  };

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const isKadis = user?.role === 'kadis';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshProfile,
        quickLoginAs,
        isAdmin,
        isSupervisor,
        isKadis,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

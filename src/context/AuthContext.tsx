'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Tenant } from '@/types';
import { getStoredUser, setStoredUser, clearStoredAuth } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenant = useCallback(async () => {
    try {
      const res = await api.get<{ data: Tenant }>('/tenants/my');
      setTenant(res.data.data);
    } catch {
      // SaaS admin has no tenant
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ data: User }>('/auth/me');
      setUser(res.data.data);
      if (res.data.data.tenantId) await fetchTenant();
    } catch {
      clearStoredAuth();
      setUser(null);
    }
  }, [fetchTenant]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ data: { user: User; accessToken: string } }>('/auth/login', {
      email, password,
    });
    const { user: u, accessToken } = res.data.data;
    setStoredUser(u, accessToken);
    setUser(u);
    if (u.tenantId) await fetchTenant();
    return u;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearStoredAuth();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

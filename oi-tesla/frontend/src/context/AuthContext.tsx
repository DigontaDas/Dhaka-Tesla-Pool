'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'passenger' | 'driver';
  driver_status?: 'online' | 'offline' | 'on_trip';
  tesla_pay_balance_poysha: number;
  rating_avg: number;
  total_rides: number;
}

interface AuthContextType {
  user: User | null;
  role: 'passenger' | 'driver';
  token: string | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Story cast IDs
export const CAST = {
  NUSRAT: 'p1000000-0000-0000-0000-000000000001',
  RAFIQ: 'p1000000-0000-0000-0000-000000000002',
  SHIRIN: 'p1000000-0000-0000-0000-000000000003',
  JASHIM: 'd1000000-0000-0000-0000-000000000001',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize with Nusrat (default demo passenger) or saved session
  useEffect(() => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('oi_tesla_user_id') : null;
    const initialId = savedUserId || CAST.NUSRAT;
    switchUser(initialId).finally(() => setLoading(false));
  }, []);

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await ApiClient.post('/auth/login', { userId });
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        ApiClient.setAuth(res.token, res.user.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('oi_tesla_user_id', res.user.id);
        }
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await ApiClient.post('/auth/login', { phone });
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        ApiClient.setAuth(res.token, res.user.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('oi_tesla_user_id', res.user.id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    ApiClient.setAuth(null, null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oi_tesla_user_id');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    const res = await ApiClient.get('/auth/me');
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'passenger',
        token,
        loading,
        login,
        switchUser,
        logout,
        refreshUser,
      }}
    >
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

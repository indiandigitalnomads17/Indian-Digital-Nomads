"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export type UserRole = 'CLIENT' | 'FREELANCER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: AuthUser }>('/api/v1/user/me', {
        withCredentials: true,
      });

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const logout = async () => {
    try {
      await api.post('/api/v1/user/logout', {}, { withCredentials: true });
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated, logout, refreshUser: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

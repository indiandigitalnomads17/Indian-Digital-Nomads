"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'CLIENT' | 'FREELANCER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  [key: string]: unknown; // allow extra profile fields from backend
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ME_ENDPOINT = '/api/v1/user/me';
const LOGOUT_ENDPOINT = '/api/v1/user/logout';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth
 *
 * Fetches the current user's profile on mount and provides logout functionality.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      try {
        const response = await api.get<{ success: boolean; data: AuthUser }>(ME_ENDPOINT, {
          withCredentials: true,
        });

        if (cancelled) return;

        if (response.data.success && response.data.data) {
          setUser(response.data.data);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        if (cancelled) return;
        setAuthenticated(false);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    try {
      await api.post(LOGOUT_ENDPOINT, {}, { withCredentials: true });
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/auth'; // Redirect to login page
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state as a fallback
      setUser(null);
      setAuthenticated(false);
      window.location.href = '/auth';
    }
  };

  return { user, loading, authenticated, logout };
}

export default useAuth;

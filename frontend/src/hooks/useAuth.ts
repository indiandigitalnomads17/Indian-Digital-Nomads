"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'CLIENT' | 'FREELANCER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  [key: string]: unknown; // allow extra profile fields from backend
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
}

// ─── Endpoint map ─────────────────────────────────────────────────────────────

const PROFILE_ENDPOINTS: Record<UserRole, string> = {
  CLIENT: '/api/v1/user/get-profile-data',
  FREELANCER: '/api/v1/freelancer/get-profile-data',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth
 *
 * Fetches the current user's profile on mount.
 *
 * Strategy:
 *  1. Try the CLIENT endpoint first (most common role).
 *  2. If that returns 401, try the FREELANCER endpoint.
 *  3. If both fail with 401 (or any auth error), mark as unauthenticated.
 *
 * The axios instance already has `withCredentials: true` set globally in
 * @/lib/api, so session cookies are sent automatically.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);

      // Try CLIENT endpoint first, then fallback to FREELANCER.
      const rolesToTry: UserRole[] = ['CLIENT', 'FREELANCER'];

      for (const role of rolesToTry) {
        try {
          const { data } = await api.get<AuthUser>(PROFILE_ENDPOINTS[role], {
            withCredentials: true,
          });

          if (cancelled) return;

          setUser({ ...data, role });
          setAuthenticated(true);
          setLoading(false);
          return; // success — stop trying further roles
        } catch (error: unknown) {
          const axiosError = error as {
            response?: { status: number };
            message?: string;
          };

          const status = axiosError?.response?.status;

          // Only continue to the next role for auth errors (401 / 403).
          // For any other error (network, 500, etc.) stop and mark as unauthenticated.
          if (status !== 401 && status !== 403) {
            break;
          }
          // status === 401/403 → try the next role in the list
        }
      }

      // Exhausted all roles without a successful response.
      if (!cancelled) {
        setUser(null);
        setAuthenticated(false);
        setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, authenticated };
}

export default useAuth;

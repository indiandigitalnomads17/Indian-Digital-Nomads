"use client";
import { useAuthContext, AuthUser, UserRole, UseAuthReturn } from '../context/AuthContext';

// Re-export types for backward compatibility
export type { AuthUser, UserRole };

export interface UseAuthReturnExtended extends UseAuthReturn {
  // Add any extra fields if needed
}

/**
 * useAuth
 *
 * A hook that uses the global AuthContext to provide authentication state.
 * This prevents redundant network requests for checking the session.
 */
export function useAuth() {
  const context = useAuthContext();
  return context;
}

export default useAuth;

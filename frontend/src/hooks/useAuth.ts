"use client";
import { useContext } from 'react';
import { AuthContext, AuthUser, UserRole, AuthContextType } from '../context/AuthProvider';

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
// Re-export types for backward compatibility
export type { AuthUser, UserRole };

export interface UseAuthReturnExtended extends AuthContextType {
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

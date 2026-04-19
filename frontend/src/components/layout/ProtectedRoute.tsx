'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  /** The page / content to render when the user is authenticated. */
  children: React.ReactNode;
  /**
   * Optional: restrict access to a specific role.
   * If omitted, any authenticated user (CLIENT or FREELANCER) is allowed.
   */
  requiredRole?: 'CLIENT' | 'FREELANCER';
  /** Path to redirect unauthenticated users to. Defaults to "/auth". */
  redirectPath?: string;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface text-on-surface">
      {/* Animated ring */}
      <div
        className="w-12 h-12 rounded-full border-4 border-outline-variant border-t-primary animate-spin"
        aria-label="Verifying your session…"
        role="status"
      />
      <p className="text-sm text-on-surface-variant font-medium">
        Verifying your session…
      </p>
    </div>
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

/**
 * ProtectedRoute
 *
 * Wraps any page or subtree that requires authentication.
 *
 * Behaviour:
 *  - While the auth check is in-flight → renders a loading spinner.
 *  - If unauthenticated (401 from backend) → redirects to `redirectPath` ("/auth").
 *  - If `requiredRole` is provided and the user's role doesn't match → also redirects.
 *  - Otherwise → renders `children`.
 *
 * Usage (Next.js App Router):
 *
 * ```tsx
 * // app/dashboard/layout.tsx
 * import ProtectedRoute from '@/components/layout/ProtectedRoute';
 *
 * export default function DashboardLayout({ children }) {
 *   return <ProtectedRoute requiredRole="CLIENT">{children}</ProtectedRoute>;
 * }
 * ```
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  redirectPath = '/auth',
}: ProtectedRouteProps) {
  const { user, loading, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait until the check finishes

    if (!authenticated) {
      router.replace(redirectPath);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // Role mismatch — send them back to auth (or a 403 page if you prefer)
      router.replace(redirectPath);
    }
  }, [loading, authenticated, user, requiredRole, redirectPath, router]);

  // 1. Still loading — show spinner
  if (loading) {
    return <AuthLoadingSpinner />;
  }

  // 2. Not authenticated — render nothing while the redirect kicks in
  if (!authenticated) {
    return null;
  }

  // 3. Role mismatch — render nothing while the redirect kicks in
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // 4. All checks passed — render protected content
  return <>{children}</>;
}

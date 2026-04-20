'use client';

import ProtectedRoute from '@/components/layout/ProtectedRoute';

export default function FreelancerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="FREELANCER">
      {children}
    </ProtectedRoute>
  );
}

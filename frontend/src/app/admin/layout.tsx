'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import useAuth from '@/hooks/useAuth';
import api from '@/lib/api';

// Icon Asset Ecosystem Imports
import { 
  BarChart01, 
  ShieldTick, 
  Users01, 
  LogOut01 
} from '@untitledui/icons';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingKyc, setPendingKyc] = useState(0);

  useEffect(() => {
    // Safely sync the sidebar validation notification queue count badges
    api.get('/api/v1/admin/metrics/dashboard')
      .then(res => {
        if (res.data.success) {
          setPendingKyc(res.data.data.kycVerification.PENDING_REVIEW || 0);
        }
      })
      .catch(() => {});
  }, [pathname]); // Refresh sync pointers whenever view nodes cycle

  const navItems = [
    { label: 'Platform Metrics', path: '/admin', icon: BarChart01 },
    { label: 'KYC Verification Queue', path: '/admin/kyc', icon: ShieldTick, badge: pendingKyc },
    { label: 'Manage Businesses', path: '/admin/businesses', icon: Users01 },
    { label: 'Manage Freelancers', path: '/admin/freelancers', icon: Users01 },
  ];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-slate-50 flex">
        
        {/* ─── PREMIUM PERSISTENT SIDEBAR PANEL ─────────────────────────── */}
        <aside className="w-80 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 shrink-0 sticky top-0 h-screen p-6 z-20">
          <div className="space-y-8">
            {/* Branding Anchor */}
            <div className="px-4 flex items-center gap-3">
              <span className="text-3xl font-black text-blue-500 tracking-tighter">LocalGigs</span>
              <span className="bg-blue-500/10 border border-blue-500/30 text-[10px] font-black text-blue-400 px-2.5 py-0.5 rounded-lg tracking-widest uppercase">Admin</span>
            </div>

            {/* Navigation Element Hub Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className="size-5" />
                      {item.label}
                    </div>
                    {!!item.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Master Admin Profile & Signout Control Action Anchor Footer */}
          <div className="border-t border-slate-800/60 pt-4 px-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm border border-slate-700">👑</div>
              <div>
                <p className="text-xs font-bold text-white max-w-[160px] truncate">{user?.fullName || 'System Admin'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Platform Admin</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-800/40 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-800/80 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              <LogOut01 className="size-4" /> Terminate Session
            </button>
          </div>
        </aside>

        {/* ─── LIVE APP WORKSPACE CONTENT VIEWER VIEWPORT ─────────────────── */}
        <main className="flex-1 p-12 overflow-y-auto max-w-[1500px] mx-auto w-full">
          {children}
        </main>

      </div>
    </ProtectedRoute>
  );
}
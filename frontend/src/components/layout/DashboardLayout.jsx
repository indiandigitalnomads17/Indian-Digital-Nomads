'use client';
import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from '../common/NotificationBell';

const DashboardLayout = ({ children }) => {
  return (
    <div className="bg-surface text-on-surface min-h-screen font-body flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Utility Bar */}
        <header className="h-20 flex items-center justify-end px-8 z-50">
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <NotificationBell />
          </div>
        </header>

        <main className="px-8 pb-12 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/40 px-6 py-4 rounded-xl flex items-center gap-3 active:scale-95 transition-all duration-200 z-[100] group hover:scale-105">
        <span className="material-symbols-outlined font-bold group-hover:rotate-90 transition-transform">add</span>
        <span className="font-headline font-bold tracking-tight text-xs uppercase tracking-[0.2em]">Post a New Gig</span>
      </button>
    </div>
  );
};

export default DashboardLayout;
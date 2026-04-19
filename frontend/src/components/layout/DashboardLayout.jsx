'use client';
import React from 'react';
import Navbar from '../Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="bg-surface text-on-surface min-h-screen font-body">
      <Navbar />
      <Sidebar />
      <main className="md:ml-64 pt-24 px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl shadow-primary/40 px-6 py-4 rounded-xl flex items-center gap-3 active:scale-95 transition-all duration-200 z-[100]">
        <span className="material-symbols-outlined font-bold">add</span>
        <span className="font-headline font-bold tracking-tight">Post a New Gig</span>
      </button>
    </div>
  );
};

export default DashboardLayout;
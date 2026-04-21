"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, authenticated, logout } = useAuth();
  
  const isClient = user?.role === 'CLIENT';

  const clientLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Active Gigs', href: '/dashboard/active', icon: 'work' },
    { name: 'Post a Gig', href: '/dashboard/post-gig', icon: 'add_circle' },
    { name: 'Payments', href: '/dashboard/payments', icon: 'payments' },
  ];

  const freelancerLinks = [
    { name: 'Dashboard', href: '/freelancer', icon: 'dashboard' },
    { name: 'My Profile', href: '/freelancer/profile', icon: 'account_circle' },
    { name: 'My Applications', href: '/freelancer/applications', icon: 'assignment_turned_in' },
    { name: 'Messages', href: '/freelancer/messages', icon: 'forum' },
    { name: 'Earnings', href: '/freelancer/earnings', icon: 'payments' },
  ];

  const links = isClient ? clientLinks : freelancerLinks;

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-white border-r border-slate-200 fixed left-0 top-0 overflow-y-auto z-[60] shadow-xl shadow-slate-200/20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <Link href="/" className="text-xl font-black tracking-tighter text-[#2563EB]">
            LocalGigs
        </Link>
      </div>

      {/* User Status Section */}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div className="truncate">
            <h1 className="text-sm font-black text-slate-900 leading-none mb-1">
              {user?.fullName || 'Guest User'}
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              {isClient ? 'Business Owner' : 'Expert Pro'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={logout}
            className="w-full text-xs font-black text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl border border-red-100 transition-all uppercase tracking-widest text-center"
          >
            Logout session
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all rounded-xl group ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:translate-x-1'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? '' : 'text-slate-400 group-hover:text-blue-500'}`}>
                  {link.icon}
                </span>
                <span className="text-xs font-black uppercase tracking-wider">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {/* Support Section */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">Support & Meta</p>
          <div className="flex flex-col gap-1">
             <Link href="/help" className="text-[10px] font-bold text-slate-600 hover:text-blue-600 py-1 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">help</span> Help Center
             </Link>
             <Link href="/terms" className="text-[10px] font-bold text-slate-600 hover:text-blue-600 py-1 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">menu_book</span> User Guide
             </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2">
           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">v1.2.4</span>
           <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-100"></div>
              <div className="w-2 h-2 rounded-full bg-blue-200"></div>
              <div className="w-2 h-2 rounded-full bg-blue-300"></div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
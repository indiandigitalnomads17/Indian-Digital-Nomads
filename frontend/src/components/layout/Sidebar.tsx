"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Determine if we show Client or Freelancer links
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
    <aside className="hidden md:flex h-screen w-64 flex-col gap-2 p-4 bg-slate-50 border-r border-slate-200/15 fixed left-0 top-0 overflow-y-auto pt-28">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {isClient ? 'business' : 'person'}
          </span>
        </div>
        <div>
          <h1 className="text-sm font-black text-blue-700 font-headline leading-none truncate max-w-[120px]">
            {user?.fullName || 'Local User'}
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            {isClient ? 'Business Owner' : 'Top Rated Pro'}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all rounded-lg group ${
                isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? 'fill-icon' : ''}`} 
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {link.icon}
              </span>
              <span className="text-sm font-semibold">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-surface-container-low rounded-xl">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
          {isClient ? 'Concierge Mode' : 'Premium Tier'}
        </p>
        <button className="w-full py-2 px-4 bg-white text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
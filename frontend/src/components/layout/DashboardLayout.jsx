'use client';
import React from 'react';
import { MainSidebarContent } from './MainSidebarContent';
import { MobileNavigationHeader } from '../application/app-navigation/base-components/mobile-header';
import NotificationBell from '../common/NotificationBell';
import { Button } from '@/components/base/buttons/button';
import { Tooltip } from '@/components/base/tooltip/tooltip';
import { Plus } from '@untitledui/icons';

const DashboardLayout = ({ children }) => {
  return (
    <div className="bg-surface text-on-surface min-h-screen font-body flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <MobileNavigationHeader>
        <MainSidebarContent />
      </MobileNavigationHeader>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0">
        <MainSidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Utility Bar (Desktop only or shared) */}
        <header className="h-20 hidden lg:flex items-center justify-end px-8 z-50">
          <div className="bg-white/80 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <NotificationBell />
          </div>
        </header>

        <main className="px-4 lg:px-8 pb-12 transition-all duration-300 flex-1">
          <div className="max-w-7xl mx-auto pt-4 lg:pt-0">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <Tooltip title="Post a new gig to attract talent">
        <Button 
          className="fixed bottom-8 right-8 shadow-2xl z-[100] hover:scale-105 active:scale-95 transition-all"
          color="primary"
          size="lg"
          iconLeading={Plus}
        >
          Post a New Gig
        </Button>
      </Tooltip>
    </div>
  );
};

export default DashboardLayout;
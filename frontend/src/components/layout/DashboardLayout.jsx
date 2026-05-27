'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { MainSidebarContent } from './MainSidebarContent';
import { MobileNavigationHeader } from '../application/app-navigation/base-components/mobile-header';
import NotificationBell from '../common/NotificationBell';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

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
      {user?.role === 'CLIENT' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="fixed bottom-8 right-8 shadow-2xl z-[100] transition-all hover:scale-105 active:scale-95"
                size="lg"
                onClick={() => router.push('/client/post-gig')}
              >
                <Plus data-icon="inline-start" />
                Post a New Gig
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-semibold mr-2">
              Post a new gig to attract talent
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default DashboardLayout;
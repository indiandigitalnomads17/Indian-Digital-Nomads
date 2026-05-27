"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/base/buttons/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-10 text-center space-y-6">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-5xl">construction</span>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Coming Soon</h1>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            We're still building this part of the platform. Please check back later!
          </p>
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <Button 
            onClick={() => {
              console.log("[not-found.tsx] Go Back clicked, executing router.back()");
              router.back();
            }} 
            color="primary" 
            className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-xs"
          >
            Go Back
          </Button>
          <Button 
            href="/" 
            color="tertiary" 
            className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] active:scale-95 transition-all text-xs"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}

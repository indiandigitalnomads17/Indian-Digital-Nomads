"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldTick, Star01, MarkerPin01 } from '@untitledui/icons';

interface FreelancerProps {
  id: string;
  fullName: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  nomadScore: number;
  profile: {
    location: string | null;
    profilePicLink: string | null;
  } | null;
  reviewsRec: Array<{ rating: number }>;
  onActionClick: () => void;
}

export default function FreelancerRowCard({ 
  id,
  fullName, 
  email, 
  status, 
  nomadScore, 
  profile, 
  reviewsRec, 
  onActionClick 
}: FreelancerProps) {
  const router = useRouter();

  const totalReviews = reviewsRec?.length || 0;
  const avgRating = totalReviews > 0 
    ? (reviewsRec.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) 
    : "No Reviews";

  const statusConfig = {
    ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active Status' },
    SUSPENDED: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Suspended' },
    DEACTIVATED: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Restricted' }
  }[status] || { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Unknown' };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
            alt={fullName} 
            className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-xs"
          />
          <span className={`absolute -bottom-1 -right-1 border-2 border-white w-3.5 h-3.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' : status === 'SUSPENDED' ? 'bg-amber-400' : 'bg-red-500'}`} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 
              onClick={() => router.push(`/admin/freelancers/${id}`)} 
              className="text-base font-bold text-slate-900 tracking-tight cursor-pointer hover:text-blue-600 active:text-blue-700 transition-colors"
            >
              {fullName}
            </h4>
            <span className={`border px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-1.5">{email}</p>
          
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1"><MarkerPin01 className="size-3.5 text-slate-400" /> {profile?.location || "Unset Location"}</span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1 text-amber-600"><Star01 className="size-3.5 fill-amber-500 text-amber-500" /> {avgRating} {totalReviews > 0 && `(${totalReviews})`}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomad Performance</p>
          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
            <ShieldTick className="size-4 text-blue-600" />
            <span className="text-lg font-black text-slate-900 tracking-tight">{nomadScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        <button
          onClick={onActionClick}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
            status === 'ACTIVE'
              ? 'bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 border-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-xs'
          }`}
        >
          {status === 'ACTIVE' ? 'Take Action' : 'Update Access'}
        </button>
      </div>
    </div>
  );
}
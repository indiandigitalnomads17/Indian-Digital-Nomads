"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCardPremium } from '../../components/common/StatCardPremium';
import { FreelancerCardPremium } from '../../components/common/FreelancerCardPremium';
import { Button } from '@/components/base/buttons/button';
import { Plus, Users01, ShieldTick } from '@untitledui/icons';
import useAuth from '@/hooks/useAuth';
import api from '@/lib/api';

interface Freelancer {
  fullName: string;
  matchPercent: number;
  profile?: {
    preferredJobType?: string;
    profilePicLink?: string;
  };
}

interface AccountStats {
  fullName?: string;
  email?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  nomadScore: number;
  profilePicLink: string | null;
  location: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
}

interface Financials {
  lifetimeSpentGross: number;
  lifetimeFeesPaid: number;
  lifetimeNetSpent: number;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountStats | null>(null);
  const [stats, setStats] = useState({
    activeGigs: 0,
    totalHired: 0,
    pendingProposals: 0,
    completedGigs: 0,
    cancelledGigs: 0,
    totalProducts: 0
  });
  const [financials, setFinancials] = useState<Financials>({
    lifetimeSpentGross: 0,
    lifetimeFeesPaid: 0,
    lifetimeNetSpent: 0
  });
  const [recommendations, setRecommendations] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, recsRes] = await Promise.all([
        api.get('/api/v1/client/get-profile-data'),
        api.get('/api/v1/client/recommendations')
      ]);

      if (profileRes.data.success) {
        const { account, activeGigs, totalHired, pendingProposals, completedGigs, cancelledGigs, totalProducts, financials } = profileRes.data.data;
        
        setAccount(account);
        setStats({
          activeGigs,
          totalHired,
          pendingProposals,
          completedGigs,
          cancelledGigs,
          totalProducts
        });
        setFinancials(financials);

        if (!account.bio || account.bio.length < 10 || !account.location || !account.phoneNumber) {
          setNeedsOnboarding(true);
        }
      }
      if (recsRes.data.success) {
        setRecommendations(recsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatFreelancerData = (freelancer: Freelancer) => {
    return {
      name: freelancer.fullName,
      role: freelancer.profile?.preferredJobType || "Professional",
      match: freelancer.matchPercent + "%",
      rating: "4.9",
      dist: "Nearby",
      img: freelancer.profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"
    };
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">Initializing Business Dashboard...</div>;

  if (needsOnboarding) {
    return (
      <DashboardLayout>
         <div className="max-w-xl mx-auto mt-20 text-center space-y-8 bg-white p-12 rounded-[40px] shadow-2xl shadow-blue-500/10 border border-slate-50">
            <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/40">
               <span className="material-symbols-outlined text-5xl">domain</span>
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Welcome, {user?.fullName}!</h1>
               <p className="text-slate-500 font-semibold leading-relaxed">Before you can start hiring local expert nomads, we need to set up your business profile.</p>
            </div>
            <button 
              onClick={() => router.push('/client/profile')}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
               Set Up Business Profile
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Takes less than 2 minutes</p>
         </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline flex items-center gap-3">
            Hello, {account?.fullName || user?.fullName || 'Business Owner'}
            {account?.isVerified && (
              <ShieldTick className="size-7 text-blue-600 fill-blue-50" />
            )}
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage corporate tasks and match local freelancers.</p>
        </div>

        {account && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 min-w-[200px] shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              N⚡️
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nomad Score</p>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {account.nomadScore} <span className="text-xs font-medium text-slate-400">/ 100</span>
              </h4>
            </div>
          </div>
        )}
      </header>

      {/* Bento Grid Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCardPremium label="Active Projects" value={stats.activeGigs.toString()} suffix="Active Gigs" />
        <StatCardPremium label="Total Hired" value={stats.totalHired.toString()} suffix="Freelancers" />
        
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
          <div className="relative z-10">
            <p className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Review Required</p>
            <h3 className="text-2xl text-slate-900 font-bold tracking-tight mb-4">
              {stats.pendingProposals} Pending Proposals
            </h3>
          </div>
          <Button className="w-fit" color="primary" size="md">
            Review Now
          </Button>
          <div className="absolute -right-4 -bottom-4 text-slate-100/70 pointer-events-none">
             <span className="material-symbols-outlined text-9xl opacity-10">group</span>
          </div>
        </div>
      </div>

      {/* Supplemental Operational Metrics Grid Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed Contracts</p>
          <h5 className="text-xl font-bold text-slate-800">{stats.completedGigs} Gigs</h5>
        </div>
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cancelled Contracts</p>
          <h5 className="text-xl font-bold text-slate-800">{stats.cancelledGigs} Gigs</h5>
        </div>
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Store Inventory</p>
          <h5 className="text-xl font-bold text-slate-800">{stats.totalProducts} Products</h5>
        </div>
        
        <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Capital Outflow</p>
            <h5 className="text-xl font-extrabold tracking-tight">
              ${(financials.lifetimeSpentGross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h5>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Net Transacted: ${(financials.lifetimeNetSpent ?? 0).toFixed(2)} | Gateway Fees: ${(financials.lifetimeFeesPaid ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Matching Feed Section */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight font-headline">Matching Feed</h2>
        </div>
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((freelancer, idx) => (
              <FreelancerCardPremium key={idx} data={formatFreelancerData(freelancer)} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">person_search</span>
            <p className="text-slate-500 font-bold">No matching freelancers found yet.</p>
            <p className="text-slate-400 text-sm">Post a gig with specific skills to see recommendations.</p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
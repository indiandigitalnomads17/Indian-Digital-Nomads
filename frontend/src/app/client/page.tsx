"use client";
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCardPremium } from '../../components/common/StatCardPremium';
import { FreelancerCardPremium } from '../../components/common/FreelancerCardPremium';
import { Button } from '@/components/base/buttons/button';
import { Plus, Users01, ShieldTick, AlertCircle } from '@untitledui/icons';
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
}

interface Financials {
  lifetimeSpentGross: number;
  lifetimeFeesPaid: number;
  lifetimeNetSpent: number;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // UNIFIED CALL: Diverted from 'dashboard-stats' to hit your primary profile data resource route
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

  return (
    <DashboardLayout>
      <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline flex items-center gap-3">
            Hello, {account?.fullName || user?.fullName || 'Business Owner'}
            {account?.isVerified && (
              <ShieldTick className="size-6 text-emerald-500 fill-emerald-50" />
            )}
          </h1>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {account?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="size-3" /> Verify Email
              </span>
            )}

            {account?.isPhoneNumberVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                SMS Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="size-3" /> Link Mobile
              </span>
            )}
          </div>
        </div>

        {account && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 min-w-[180px]">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              N⚡️
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nomad Score</p>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {account.nomadScore} <span className="text-xs font-medium text-slate-400">/ 100</span>
              </h4>
            </div>
          </div>
        )}
      </header>

      {/* Stats Bento Layout */}
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
          <Button 
            className="w-fit"
            color="primary" 
            size="md"
          >
            Review Now
          </Button>
          <div className="absolute -right-4 -bottom-4 text-slate-100">
             <Users01 className="size-32" />
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
              ${financials.lifetimeSpentGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h5>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Net Transacted: ${financials.lifetimeNetSpent.toFixed(2)} | Gateway Fees: ${financials.lifetimeFeesPaid.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Matching Feed Section */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight font-headline">Matching Feed</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-solid"></div>
          </div>
        ) : recommendations.length > 0 ? (
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
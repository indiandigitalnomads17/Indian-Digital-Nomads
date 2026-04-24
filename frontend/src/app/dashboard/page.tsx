"use client";
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCardPremium } from '../../components/common/StatCardPremium';
import { FreelancerCardPremium } from '../../components/common/FreelancerCardPremium';
import { Button } from '@/components/base/buttons/button';
import { Plus, Users01 } from '@untitledui/icons';
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

const BusinessDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeGigs: 0,
    totalHired: 0,
    pendingProposals: 0
  });
  const [recommendations, setRecommendations] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, recsRes] = await Promise.all([
          api.get('/api/v1/client/dashboard-stats'),
          api.get('/api/v1/client/recommendations')
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
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
      rating: "4.9", // Placeholder for now as we don't have real ratings yet
      dist: "Nearby",
      img: freelancer.profile?.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"
    };
  };

  return (
    <DashboardLayout>
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline">
          Hello, {user?.fullName || 'Business Owner'}
        </h1>
        <p className="text-slate-500 font-medium">Manage your active projects and discover talent.</p>
      </header>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <StatCardPremium label="Active Projects" value={stats.activeGigs.toString()} suffix="Active Gigs" />
        <StatCardPremium label="Total Hired" value={stats.totalHired.toString()} suffix="Freelancers" />
        
        {/* New Proposals Card */}
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

      {/* Feed */}
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
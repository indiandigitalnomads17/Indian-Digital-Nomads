"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GigCard from '../../components/common/GigCard';
import SpeedCallItem from '../../components/common/SpeedCallItem';
import ApplyModal from '../../components/common/ApplyModal';
import api from '@/lib/api';
import useAuth from '@/hooks/useAuth';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'JUST NOW';
  if (diffInHours === 1) return '1 HOUR AGO';
  if (diffInHours < 24) return `${diffInHours} HOURS AGO`;
  return `${Math.floor(diffInHours / 24)} DAYS AGO`;
};

const FreelancerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ activeJobs: 0, pendingProposals: 0, monthlyEarnings: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes, profileRes] = await Promise.all([
        api.get('/api/v1/freelancer/dashboard-stats'),
        api.get('/api/v1/freelancer/recommendations'),
        api.get('/api/v1/freelancer/get-profile-data')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data);
      }
      
      // Check if profile is complete (e.g., bio exists)
      const profile = profileRes.data.data.profile;
      if (!profile || !profile.bio || profile.bio.length < 10) {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error("Error fetching freelancer dashboard data:", error);
      if (error.response?.status === 404) {
          setNeedsOnboarding(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
        fetchDashboardData();
    }
  }, [authLoading, user]);

  const transformedJobs = jobs.map(job => ({
    id: job.id,
    title: job.title,
    match: job.matchPercent ? `${job.matchPercent}%` : "Match",
    time: formatTimeAgo(job.createdAt),
    dist: job.location || "Nearby",
    price: job.budget ? `₹${job.budget}` : "Flexible",
    description: job.description
  }));

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  if (authLoading || loading) return <div className="p-20 text-center font-black animate-pulse">Initializing Nomad Dashboard...</div>;

  if (needsOnboarding) {
    return (
      <DashboardLayout>
         <div className="max-w-xl mx-auto mt-20 text-center space-y-8 bg-white p-12 rounded-[40px] shadow-2xl shadow-blue-500/10 border border-slate-50">
            <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/40">
               <span className="material-symbols-outlined text-5xl">person_add</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Welcome, {user?.fullName}!</h1>
              <p className="text-slate-500 font-semibold leading-relaxed">Before you can start applying for local gigs, we need to set up your professional nomad profile.</p>
            </div>
            <button 
              onClick={() => router.push('/freelancer/profile')}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
               Set Up Profile Now
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Takes less than 2 minutes</p>
         </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="xl:col-span-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em] mb-3">Available Match</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 font-headline">Nomad Marketplace</h1>
              <p className="text-slate-500 font-semibold italic text-sm">Discover high-value opportunities within your reach.</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-2xl shadow-sm px-4">
              <span className="material-symbols-outlined text-slate-400 text-lg">tune</span>
              <select className="bg-transparent border-none focus:ring-0 text-xs font-black text-slate-900 pr-8 py-1 uppercase tracking-widest cursor-pointer">
                <option>Within 10km</option>
                <option>Within 25km</option>
                <option>Within 50km</option>
              </select>
            </div>
          </header>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transformedJobs.map((gig, idx) => (
                <GigCard key={gig.id} data={gig} isUrgent={idx === 0} onApply={handleApply} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-100 p-20 rounded-[40px] text-center">
              <span className="material-symbols-outlined text-7xl text-slate-100 mb-6 flex justify-center">radar</span>
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No Gigs Found Nearby</h3>
              <p className="text-slate-400 font-semibold text-sm max-w-xs mx-auto">Try expanding your search radius or adding more skills to your profile.</p>
            </div>
          )}
        </div>

        {/* Sidebar Metrics */}
        <div className="xl:col-span-4 space-y-8">
          {/* Availability Toggle */}
          <div className="bg-slate-900 p-8 rounded-[35px] shadow-2xl shadow-slate-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Live Status</h4>
                <span className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> Ready for Hire
                </span>
              </div>
              <button className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner">
                 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all"></div>
              </button>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="bg-white p-8 rounded-[35px] border border-slate-50 shadow-xl shadow-slate-200/40">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 text-center">Monthly Revenue</h4>
            <div className="text-5xl font-black text-slate-900 mb-8 text-center tracking-tighter">
              ₹{stats.monthlyEarnings.toLocaleString()}
            </div>
            <div className="flex items-end gap-1.5 h-16 px-4">
              {[40, 60, 50, 80, 90, 100, 30].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-lg transition-all duration-500 ${i === 5 ? 'bg-blue-600' : 'bg-blue-50'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-3xl border border-slate-50 text-center shadow-sm">
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-2">Active Jobs</p>
                <p className="text-2xl font-black text-slate-900">{stats.activeJobs}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-50 text-center shadow-sm">
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-2">Proposals</p>
                <p className="text-2xl font-black text-blue-600">{stats.pendingProposals}</p>
             </div>
          </div>

          {/* Speed Calls */}
          <div className="bg-white p-8 rounded-[35px] border border-slate-50 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Next Speed Session</h4>
              <span className="material-symbols-outlined text-blue-600 text-lg hover:rotate-45 transition-transform cursor-pointer">calendar_today</span>
            </div>
            <div className="space-y-6">
              <SpeedCallItem isToday time="Today at 4:30 PM" company="Nexus Coffee Bar" role="UI Designer" />
              <SpeedCallItem time="Wed at 11:00 AM" company="D-Nomad Hub" role="Logo Design" />
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <ApplyModal 
          job={selectedJob} 
          onClose={() => setShowApplyModal(false)}
          onUpdate={fetchDashboardData}
        />
      )}
    </DashboardLayout>
  );
};

export default FreelancerDashboard;
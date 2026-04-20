"use client";
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GigCard from '../../components/common/GigCard';
import SpeedCallItem from '../../components/common/SpeedCallItem';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeJobs: 0, pendingProposals: 0, monthlyEarnings: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/api/v1/freelancer/dashboard-stats'),
          api.get('/api/v1/freelancer/recommendations')
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (jobsRes.data.success) {
          setJobs(jobsRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching freelancer dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const transformedJobs = jobs.map(job => ({
    title: job.title,
    match: job.matchPercent ? `${job.matchPercent}%` : "Match",
    time: formatTimeAgo(job.createdAt),
    dist: job.location || "Nearby",
    price: job.budget ? `$${job.budget}` : "Flexible",
    description: job.description
  }));

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="xl:col-span-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Local Gigs Near You</h1>
              <p className="text-on-surface-variant font-medium">Discover opportunities within your neighborhood.</p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-full px-4">
              <span className="material-symbols-outlined text-outline">tune</span>
              <select className="bg-transparent border-none focus:ring-0 text-sm font-bold text-on-surface pr-8 py-1">
                <option>Within 5km</option>
                <option>Within 10km</option>
                <option>Within 25km</option>
              </select>
            </div>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-surface-container-low rounded-xl"></div>
              ))}
            </div>
          ) : transformedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transformedJobs.map((gig, idx) => (
                <GigCard key={idx} data={gig} isUrgent={idx === 0} />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low p-12 rounded-2xl text-center">
              <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
              <h3 className="text-xl font-bold text-on-surface mb-2">No Gigs Found</h3>
              <p className="text-on-surface-variant">Try expanding your search radius or updating your skills.</p>
            </div>
          )}
        </div>

        {/* Sidebar Metrics */}
        <div className="xl:col-span-4 space-y-6">
          {/* Availability Toggle */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-secondary">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-outline mb-1">Status</h4>
                <span className="text-lg font-bold text-secondary flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-secondary rounded-full animate-pulse"></span> Online
                </span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <div className="w-12 h-6 bg-secondary rounded-full"></div>
                <div className="absolute left-6 w-5 h-5 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="bg-primary text-on-primary p-8 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-sm font-black uppercase tracking-widest text-on-primary/60 mb-1">Monthly Earnings</h4>
              <div className="text-5xl font-black mb-6 tracking-tighter">
                ${stats.monthlyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              {/* Simplified Bar Chart visualization */}
              <div className="flex items-end gap-1 h-12">
                {[40, 60, 50, 80, 90, 100, 30].map((h, i) => (
                  <div key={i} className={`w-full rounded-t-sm ${i === 5 ? 'bg-white' : 'bg-on-primary/20'}`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Speed Calls */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">Speed Calls</h4>
              <span className="text-primary text-xs font-bold hover:underline cursor-pointer">Calendar</span>
            </div>
            <div className="space-y-4">
              <SpeedCallItem isToday time="Today • 2:30 PM" company="Main St. Coffee Co." role="Graphic Designer" />
              <SpeedCallItem time="Tomorrow • 10:00 AM" company="TechNode Systems" role="React Developer" />
            </div>
            <div className="mt-6 text-center">
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">Calls are restricted to 3 minutes!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FreelancerDashboard;
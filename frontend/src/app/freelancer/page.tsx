"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GigCard from '../../components/common/GigCard';
import ApplyModal from '../../components/common/ApplyModal';
import api from '@/lib/api';
import useAuth from '@/hooks/useAuth';

// Shadcn UI components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'JUST NOW';
  if (diffInHours === 1) return '1 HOUR AGO';
  if (diffInHours < 24) return `${diffInHours} HOURS AGO`;
  return `${Math.floor(diffInHours / 24)} DAYS AGO`;
};

interface Job {
  id: string;
  title: string;
  matchPercent?: number;
  createdAt: string;
  location?: string;
  budget?: number;
  description: string;
  client?: any;
}

const FreelancerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get('/api/v1/freelancer/dashboard-stats'),
        api.get('/api/v1/freelancer/recommendations')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
        const bioText = statsRes.data.data.profileMetadata?.bio || "";
        if (!bioText || bioText.trim().length < 10) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      }
      if (jobsRes.data.success) {
        setJobs(jobsRes.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching freelancer dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
        fetchDashboardData();
    }
  }, [authLoading, user]);

  const transformedJobs = jobs.map((job: any) => ({
    id: job.id,
    title: job.title,
    match: job.matchPercent ? `${job.matchPercent}%` : "Match",
    time: formatTimeAgo(job.createdAt),
    dist: job.location || "Nearby",
    price: job.budget ? `₹${job.budget}` : "Flexible",
    description: job.description,
    client: job.client,
    videoUrl: job.videoUrl
  }));

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  if (authLoading || loading) return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

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
            <Button 
              onClick={() => router.push('/freelancer/profile')}
              size="lg"
              className="w-full h-14 text-sm font-bold uppercase tracking-widest shadow-xl shadow-slate-200"
            >
               Set Up Profile Now
            </Button>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Takes less than 2 minutes</p>
         </div>
      </DashboardLayout>
    );
  }

  // Derived Dynamic Data from Backend
  const earnings = stats?.earningsLedgerSummary?.lifetimeNetTakeHome || 0;
  const activeJobs = stats?.workHistoryMetrics?.activeContracts || 0;
  const pendingProposals = stats?.proposalFunnelMetrics?.activeApplications || 0;
  
  const recentJobs = stats?.jobsAsFreelancer || [];
  const recentProposals = stats?.proposals || [];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-4 sm:px-6 py-6 pb-20 max-w-7xl mx-auto">
        
        {/* Main Feed */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
            <div>
              <Badge variant="outline" className="mb-3 text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] border-blue-200 bg-blue-50">
                Available Match
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 font-headline flex items-center gap-2">
                Nomad Marketplace
              </h1>
              <p className="text-muted-foreground font-medium text-sm">Discover high-value opportunities within your reach.</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl shadow-sm px-4">
              <span className="material-symbols-outlined text-slate-400 text-lg">tune</span>
              <select className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-900 pr-8 py-1 uppercase tracking-widest cursor-pointer outline-none">
                <option>Within 10km</option>
                <option>Within 25km</option>
                <option>Within 50km</option>
              </select>
            </div>
          </header>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {transformedJobs.map((gig, idx) => (
                <GigCard key={gig.id} data={gig} isUrgent={idx === 0} onApply={handleApply} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 py-16 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-0">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">radar</span>
                <CardTitle className="text-xl mb-2">No Gigs Found Nearby</CardTitle>
                <CardDescription className="max-w-xs mx-auto">
                  Try expanding your search radius or adding more skills to your profile.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Live Status Card */}
          <Card className="bg-slate-900 border-none shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <CardContent className="p-6 relative z-10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Live Status</p>
                <span className="text-lg font-bold flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> 
                  Ready for Hire
                </span>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner flex items-center p-1 cursor-pointer">
                 <div className="w-4 h-4 bg-white rounded-full shadow-lg ml-auto transition-all"></div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Card */}
          <Card className="shadow-md border-slate-200">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 text-center">Net Lifetime Earnings</p>
              <div className="text-4xl font-bold text-slate-900 mb-6 text-center tracking-tight">
                ₹{earnings.toLocaleString()}
              </div>
              <div className="flex items-end gap-1.5 h-12 w-full max-w-[200px] mx-auto">
                {[40, 60, 50, 80, 90, 100, 30].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 ${i === 5 ? 'bg-blue-600' : 'bg-blue-100'}`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
             <Card className="shadow-sm border-slate-200 text-center">
               <CardContent className="p-4 flex flex-col justify-center h-full">
                  <p className="text-[10px] font-black text-muted-foreground tracking-wider uppercase mb-1">Active Jobs</p>
                  <p className="text-2xl font-bold text-slate-900">{activeJobs}</p>
               </CardContent>
             </Card>
             <Card className="shadow-sm border-slate-200 text-center">
               <CardContent className="p-4 flex flex-col justify-center h-full">
                  <p className="text-[10px] font-black text-muted-foreground tracking-wider uppercase mb-1">Proposals</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingProposals}</p>
               </CardContent>
             </Card>
          </div>

          {/* Dynamic Active Jobs */}
          {recentJobs.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">Current Work</CardTitle>
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">work</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {recentJobs.map((job: any, index: number) => (
                    <div key={job.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm line-clamp-1">{job.title}</p>
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">In Progress</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Client: {job.client?.fullName}</p>
                      <p className="text-xs font-bold text-slate-900">₹{job.budget?.toLocaleString() || '0'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Recent Proposals */}
          {recentProposals.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900">Recent Applications</CardTitle>
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">send</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {recentProposals.slice(0, 3).map((prop: any, index: number) => (
                    <div key={prop.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm line-clamp-1 flex-1 pr-2">{prop.job?.title || 'Unknown Gig'}</p>
                        <Badge variant={prop.status === 'ACCEPTED' ? 'default' : prop.status === 'PENDING' ? 'outline' : 'secondary'} 
                               className={`text-[9px] uppercase tracking-wider ${prop.status === 'ACCEPTED' ? 'bg-green-600' : ''}`}>
                          {prop.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Applied: {new Date(prop.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-slate-900">Bid: ₹{prop.bidAmount?.toLocaleString() || '0'}</p>
                    </div>
                  ))}
                </div>
                {recentProposals.length > 3 && (
                   <div className="p-3 text-center border-t border-slate-100 bg-slate-50/50">
                     <p className="text-[10px] font-bold text-slate-500 uppercase hover:text-blue-600 cursor-pointer transition-colors">View All Applications</p>
                   </div>
                )}
              </CardContent>
            </Card>
          )}
          
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

"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';
import { ShieldTick, Home01, Briefcase01 } from '@untitledui/icons';

interface Job {
  id: string;
  title: string;
  type: string;
  budget: number;
  estimatedHours: number | null;
  createdAt: string;
}

interface Review {
  rating: number;
  comment: string;
  reviewer: {
    fullName: string;
  };
}

interface ClientPublicProfile {
  id: string;
  fullName: string;
  createdAt: string;
  role: string;
  profile: {
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    videoLink: string | null;
    location: string | null;
    phoneNumber: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  recentJobs: Job[];
  reviewsRec: Review[];
  metrics: {
    totalMoneySpent: number;
    freelancersHiredCount: number;
    totalCompletedJobs: number;
  };
}

const ClientPublicProfileView = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPublicProfile = async () => {
      try {
        const res = await api.get(`/api/v1/public/clients/${id}`);
        if (res.data.success) {
          setClient(res.data.data);
        } else {
          setError(res.data.error || "Profile not found");
        }
      } catch (err: any) {
        console.error("Error fetching public client profile:", err);
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProfile();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-bold">Loading client profile details...</div>;
  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-20 text-center space-y-6 bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Error Loading Profile</h2>
          <p className="text-slate-500 font-semibold">{error || "The requested client profile does not exist or you do not have permission to view it."}</p>
          <Button onClick={() => router.back()} color="secondary" className="w-full rounded-xl">Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const joinDate = new Date(client.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <DashboardLayout>
      <main className="pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button onClick={() => router.back()} color="link-gray" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Directory
            </Button>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="h-48 relative">
              {client.profile?.bannerLink ? (
                <img src={client.profile.bannerLink} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              )}
            </div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6">
                <Avatar 
                  size="2xl"
                  src={client.profile?.profilePicLink || undefined}
                  initials={client.fullName.charAt(0)}
                  alt="Company Logo"
                  rounded
                  contentClassName="bg-blue-100 text-blue-600 border-4 border-white shadow-lg"
                />
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                    {client.fullName}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Verified Client
                    </span>
                  </h1>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_month</span> Joined {joinDate}</span>
                    {client.profile?.location && (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {client.profile.location}</span>
                    )}
                    {client.profile?.phoneNumber && (
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">phone</span> {client.profile.phoneNumber}</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">About the Company</h3>
                  <p className="text-base text-slate-600 font-semibold leading-relaxed max-w-4xl">
                    {client.profile?.bio || "This client has not added a business bio yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bento & Video Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-xs space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Activity Metrics</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Jobs</span>
                    <span className="text-lg font-black text-slate-900">{client.metrics.totalCompletedJobs}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Freelancers Hired</span>
                    <span className="text-lg font-black text-slate-900">{client.metrics.freelancersHiredCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Investment Spent</span>
                    <span className="text-lg font-black text-emerald-600">${client.metrics.totalMoneySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {client.profile?.latitude && client.profile?.longitude && (
                <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-xs">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">map</span> Location Map
                  </h3>
                  <div className="h-40 rounded-2xl bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-3xl text-blue-500 mb-2">explore</span>
                    <p className="text-xs font-bold text-slate-700">{client.profile.location}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Coordinates: {client.profile.latitude.toFixed(4)}, {client.profile.longitude.toFixed(4)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Pitch */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-xs h-full flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">videocam</span> Company Introduction Video
                </h3>
                {client.profile?.videoLink ? (
                  <div className="flex-1 rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-md">
                    <video src={client.profile.videoLink} controls className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-150 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[240px]">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">video_library</span>
                    <p className="text-sm font-bold text-slate-500">No Video Available</p>
                    <p className="text-xs text-slate-400 mt-1">This client has not uploaded an introductory video yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Jobs and Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Jobs */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Recent Completed Jobs</h3>
              {client.recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {client.recentJobs.map(job => (
                    <div key={job.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{job.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {job.type} {job.estimatedHours ? `• ${job.estimatedHours} hrs` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-black text-blue-600">${job.budget}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-semibold">No completed jobs listed yet.</div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Reviews from Nomad Pros</h3>
              {client.reviewsRec.length > 0 ? (
                <div className="space-y-4">
                  {client.reviewsRec.map((review, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900">{review.reviewer?.fullName}</span>
                        <div className="flex items-center text-amber-500 gap-0.5">
                          <span className="material-symbols-outlined text-sm fill-current">star</span>
                          <span className="text-xs font-bold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-semibold">No reviews received yet.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ClientPublicProfileView;

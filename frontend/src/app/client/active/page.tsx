"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Button } from '@/components/base/buttons/button';
import { Avatar } from '@/components/base/avatar/avatar';
import api from '@/lib/api';

interface Skill {
  id: string;
  name: string;
}

interface FreelancerProfile {
  profilePicLink: string | null;
  bio: string | null;
  location: string | null;
  skills: { name: string }[];
}

interface Freelancer {
  id: string;
  fullName: string;
  email: string;
  profile: FreelancerProfile | null;
}

interface Proposal {
  id: string;
  coverLetter: string;
  bidAmount: number | string;
  estimatedDays: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  freelancer: Freelancer;
}

interface Job {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: 'FIXED_PRICE' | 'HOURLY';
  budget: number | string | null;
  estimatedHours: number | null;
  createdAt: string;
  skillsRequired: Skill[];
  freelancerId: string | null;
  freelancer: Freelancer | null;
  _count: {
    proposals: number;
  };
}

export default function ActiveGigsPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab states for filter
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  
  // For managing inline proposal viewing
  const [expandedGigId, setExpandedGigId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<{ [jobId: string]: Proposal[] }>({});
  const [loadingProposals, setLoadingProposals] = useState<string | null>(null);

  // Proposal modal or confirmation state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/client/gigs');
      if (res.data.success) {
        setGigs(res.data.data);
      } else {
        setError('Failed to retrieve gig postings.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while loading your gigs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchProposalsForGig = async (jobId: string) => {
    if (proposals[jobId]) {
      // Toggle accordion if already loaded
      setExpandedGigId(expandedGigId === jobId ? null : jobId);
      return;
    }

    try {
      setLoadingProposals(jobId);
      const res = await api.get(`/api/v1/client/gigs/${jobId}/proposals`);
      if (res.data.success) {
        setProposals(prev => ({ ...prev, [jobId]: res.data.data }));
        setExpandedGigId(jobId);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoadingProposals(null);
    }
  };

  const handleProposalAction = async (proposalId: string, jobId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const confirmation = status === 'ACCEPTED' 
      ? "Are you sure you want to accept this proposal? This will hire this nomad, close applications, and set the gig status to In Progress." 
      : "Are you sure you want to reject this proposal?";
    
    if (!confirm(confirmation)) return;

    try {
      setActionLoading(proposalId);
      const res = await api.patch(`/api/v1/client/proposals/${proposalId}`, { status });
      if (res.data.success) {
        // Refresh gig listings and clear local proposals cache for this gig to force reload
        await fetchGigs();
        setProposals(prev => {
          const updated = { ...prev };
          delete updated[jobId];
          return updated;
        });
        setExpandedGigId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update proposal status.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Gigs list
  const filteredGigs = gigs.filter(gig => {
    if (activeTab === 'ALL') return true;
    return gig.status === activeTab;
  });

  // Gigs count metrics
  const totalCount = gigs.length;
  const openCount = gigs.filter(g => g.status === 'OPEN').length;
  const inProgressCount = gigs.filter(g => g.status === 'IN_PROGRESS').length;
  const completedCount = gigs.filter(g => g.status === 'COMPLETED').length;

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Gigs & Projects</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your job listings, hire digital nomads, and track running contracts.</p>
          </div>
          <Button 
            color="primary" 
            onClick={() => router.push('/client/post-gig')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg shadow-blue-500/10"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Post New Gig
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Postings', count: totalCount, icon: 'list_alt', color: 'text-slate-600 bg-slate-50 border-slate-100' },
            { label: 'Open Gigs', count: openCount, icon: 'campaign', color: 'text-blue-600 bg-blue-50/50 border-blue-100' },
            { label: 'In Progress', count: inProgressCount, icon: 'clock_loader_10', color: 'text-amber-600 bg-amber-50/50 border-amber-100' },
            { label: 'Completed Gigs', count: completedCount, icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' }
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border bg-white flex items-center justify-between shadow-sm`}>
              <div>
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{item.label}</span>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{item.count}</h3>
              </div>
              <span className={`material-symbols-outlined p-3 rounded-xl border ${item.color} text-2xl`}>
                {item.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 border-b border-slate-100 mb-6 overflow-x-auto pb-px">
          {[
            { id: 'ALL', label: 'All Postings' },
            { id: 'OPEN', label: 'Open Opportunities' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setExpandedGigId(null);
              }}
              className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined animate-spin text-4xl text-blue-600">rotate_right</span>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mt-4">Compiling gig dashboard data...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
            <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
            <div>
              <h3 className="font-bold text-red-900">Unable to load Gig data</h3>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              <Button color="primary-destructive" size="sm" onClick={fetchGigs} className="mt-3">Retry Request</Button>
            </div>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300">work_outline</span>
            <h3 className="text-lg font-black text-slate-900 mt-4 tracking-tight">No Gigs Found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">There are no gig posts in this category matching your selection.</p>
            <Button 
              color="tertiary" 
              onClick={() => router.push('/client/post-gig')}
              className="mt-6"
            >
              Post a New Opportunity
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGigs.map(gig => {
              const isOpen = gig.status === 'OPEN';
              const isInProgress = gig.status === 'IN_PROGRESS';
              const isCompleted = gig.status === 'COMPLETED';
              const isCancelled = gig.status === 'CANCELLED';
              const isExpanded = expandedGigId === gig.id;
              
              let statusBadge = (
                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                  Open Gigs
                </span>
              );
              if (isInProgress) {
                statusBadge = (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                    In Progress
                  </span>
                );
              } else if (isCompleted) {
                statusBadge = (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                    Completed
                  </span>
                );
              } else if (isCancelled) {
                statusBadge = (
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                    Cancelled
                  </span>
                );
              }

              return (
                <div key={gig.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                  {/* Gig Header Info */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          {statusBadge}
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Posted {new Date(gig.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{gig.title}</h2>
                        <p className="text-slate-500 text-sm mt-2 line-clamp-3 leading-relaxed">{gig.description}</p>
                        
                        {/* Skills required tags */}
                        {gig.skillsRequired && gig.skillsRequired.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {gig.skillsRequired.map(skill => (
                              <span key={skill.id} className="px-2 py-1 bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 rounded-md">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Side info columns */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 border-t border-slate-50 md:border-t-0 pt-4 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black text-slate-900">
                            {gig.budget ? `₹${Number(gig.budget).toLocaleString()}` : 'Flexible'}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                            {gig.type === 'HOURLY' ? 'Hourly billing' : 'Fixed milestones'}
                          </p>
                        </div>

                        {gig.estimatedHours && (
                          <div className="text-left md:text-right">
                            <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {gig.estimatedHours} hrs est.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gig Actions Panel */}
                    <div className="border-t border-slate-50 mt-6 pt-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                      
                      {/* Left: display nomad information if hired */}
                      <div>
                        {gig.freelancer ? (
                          <div className="flex items-center gap-3 bg-slate-50/50 hover:bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50 transition-all">
                            <Avatar 
                              src={gig.freelancer.profile?.profilePicLink || ''} 
                              alt={gig.freelancer.fullName} 
                              initials={getInitials(gig.freelancer.fullName)}
                              size="sm" 
                              className="border border-slate-200" 
                            />
                            <div>
                              <p className="text-xs font-black text-slate-900">Hired Nomad Professional</p>
                              <p className="text-[11px] font-medium text-slate-500">{gig.freelancer.fullName}</p>
                            </div>
                          </div>
                        ) : isOpen ? (
                          <span className="text-xs font-bold text-slate-400 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {gig._count.proposals} applicant proposals received
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">No professional hired</span>
                        )}
                      </div>

                      {/* Right: Expand proposals action or status indicators */}
                      <div className="flex items-center gap-2 justify-end">
                        {isOpen && (
                          <Button
                            color={isExpanded ? "tertiary" : "primary"}
                            onClick={() => fetchProposalsForGig(gig.id)}
                            className="flex items-center gap-2"
                            isDisabled={loadingProposals === gig.id}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {loadingProposals === gig.id ? 'sync' : isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            {isExpanded ? 'Hide Proposals' : `Review Proposals (${gig._count.proposals})`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Proposals List for Gigs in OPEN status */}
                  {isExpanded && isOpen && (
                    <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-4">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">
                        Applicant Gigs Proposals
                      </h3>

                      {!proposals[gig.id] || proposals[gig.id].length === 0 ? (
                        <div className="text-center py-8 bg-white border border-slate-100 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-wider">
                          No applications have been sent for this gig yet.
                        </div>
                      ) : (
                        proposals[gig.id].map(proposal => (
                          <div key={proposal.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 hover:border-blue-200 transition-all">
                            <div className="space-y-3 flex-1">
                              {/* Freelancer Header */}
                              <div className="flex items-start gap-3">
                                <Avatar 
                                  src={proposal.freelancer.profile?.profilePicLink || ''} 
                                  alt={proposal.freelancer.fullName} 
                                  initials={getInitials(proposal.freelancer.fullName)}
                                  size="md" 
                                />
                                <div>
                                  <h4 className="font-black text-slate-900 text-sm tracking-tight">
                                    {proposal.freelancer.fullName}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {proposal.freelancer.profile?.location || 'Remote'}
                                  </p>
                                </div>
                              </div>

                              {/* Cover Letter */}
                              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50">
                                <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                                  {proposal.coverLetter}
                                </p>
                              </div>

                              {/* Skills */}
                              {proposal.freelancer.profile?.skills && proposal.freelancer.profile.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {proposal.freelancer.profile.skills.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 rounded border border-slate-100">
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Offer metrics and Hiring Buttons */}
                            <div className="w-full md:w-auto flex md:flex-col justify-between md:justify-start items-center md:items-end gap-4 shrink-0 pt-4 md:pt-0 border-t border-slate-50 md:border-t-0">
                              <div className="text-left md:text-right">
                                <p className="text-lg font-black text-blue-600">
                                  ₹{Number(proposal.bidAmount).toLocaleString()}
                                </p>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                  Bid Amount / {proposal.estimatedDays ? `${proposal.estimatedDays} days est.` : 'flexible timeline'}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  color="primary-destructive" 
                                  size="sm" 
                                  onClick={() => handleProposalAction(proposal.id, gig.id, 'REJECTED')}
                                  isDisabled={actionLoading !== null}
                                >
                                  Decline
                                </Button>
                                <Button 
                                  color="primary" 
                                  size="sm"
                                  onClick={() => handleProposalAction(proposal.id, gig.id, 'ACCEPTED')}
                                  isDisabled={actionLoading !== null}
                                  className="shadow-sm shadow-blue-500/10"
                                >
                                  {actionLoading === proposal.id ? 'Hiring...' : 'Hire Nomad'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ListTodo, Megaphone, Clock, CheckCircle2, Briefcase, AlertTriangle, Users, ChevronDown, ChevronUp, MapPin, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

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
  const [activeTab, setActiveTab] = useState<string>('ALL');
  
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

  const filteredGigs = gigs.filter(gig => {
    if (activeTab === 'ALL') return true;
    return gig.status === activeTab;
  });

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
      <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-8 pt-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Active Gigs & Projects</h1>
            <p className="text-muted-foreground">Manage your job listings, hire digital nomads, and track running contracts.</p>
          </div>
          <Button 
            onClick={() => router.push('/client/post-gig')}
            size="lg"
          >
            <Plus className="mr-2 size-5" />
            Post New Gig
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Postings</CardTitle>
              <ListTodo className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Open Gigs</CardTitle>
              <Megaphone className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{openCount}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-amber-500/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Progress</CardTitle>
              <Clock className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <LoadingIndicator type="line-spinner" size="md" label="Compiling gig dashboard data..." />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 bg-destructive/5 rounded-xl border border-destructive/20 p-8">
            <AlertTriangle className="size-10 text-destructive" />
            <div className="text-center">
              <h3 className="font-bold text-lg text-destructive">Unable to load Gig data</h3>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
            <Button variant="destructive" onClick={fetchGigs}>Retry Request</Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setExpandedGigId(null); }} className="w-full flex flex-col">
            <TabsList className="w-full flex flex-row items-center justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              {[
                { id: 'ALL', label: 'All Postings' },
                { id: 'OPEN', label: 'Open Opportunities' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'COMPLETED', label: 'Completed' }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-semibold text-muted-foreground data-[state=active]:text-primary transition-all flex-none h-auto"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0 outline-none">
              {filteredGigs.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 text-center shadow-none bg-muted/30 border-dashed">
                  <Briefcase className="size-12 text-muted-foreground mb-4 opacity-50" />
                  <CardTitle className="text-xl mb-2">No Gigs Found</CardTitle>
                  <CardDescription>There are no gig posts in this category matching your selection.</CardDescription>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/client/post-gig')}
                    className="mt-6"
                  >
                    Post a New Opportunity
                  </Button>
                </Card>
              ) : (
                <div className="flex flex-col gap-6">
                  {filteredGigs.map(gig => {
                    const isOpen = gig.status === 'OPEN';
                    const isInProgress = gig.status === 'IN_PROGRESS';
                    const isCompleted = gig.status === 'COMPLETED';
                    const isCancelled = gig.status === 'CANCELLED';
                    const isExpanded = expandedGigId === gig.id;
                    
                    let statusBadge = (
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">Open Gigs</Badge>
                    );
                    if (isInProgress) {
                      statusBadge = <Badge variant="default" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">In Progress</Badge>;
                    } else if (isCompleted) {
                      statusBadge = <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">Completed</Badge>;
                    } else if (isCancelled) {
                      statusBadge = <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">Cancelled</Badge>;
                    }

                    return (
                      <Card key={gig.id} className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md border-primary/30' : 'shadow-sm hover:border-primary/20'}`}>
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                {statusBadge}
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Posted {new Date(gig.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h2 className="text-xl font-bold tracking-tight">{gig.title}</h2>
                              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{gig.description}</p>
                              
                              {gig.skillsRequired && gig.skillsRequired.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {gig.skillsRequired.map(skill => (
                                    <Badge key={skill.id} variant="secondary" className="font-normal text-xs">
                                      {skill.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Side info columns */}
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 md:pl-6 md:border-l">
                              <div className="text-left md:text-right flex flex-col gap-1">
                                <p className="text-2xl font-bold flex items-center md:justify-end gap-1">
                                  {gig.budget ? `₹${Number(gig.budget).toLocaleString()}` : 'Flexible'}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  {gig.type === 'HOURLY' ? 'Hourly billing' : 'Fixed milestones'}
                                </p>
                              </div>

                              {gig.estimatedHours && (
                                <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 font-medium">
                                  <Clock className="size-3 mr-1" />
                                  {gig.estimatedHours} hrs est.
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Separator className="my-6" />

                          {/* Gig Actions Panel */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            
                            {/* Left: display nomad information if hired */}
                            <div className="flex items-center">
                              {gig.freelancer ? (
                                <div className="flex items-center gap-3 bg-muted/50 py-2 px-4 rounded-full border border-border/50">
                                  <Avatar className="size-8 border border-background">
                                    <AvatarImage src={gig.freelancer.profile?.profilePicLink || ''} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(gig.freelancer.fullName)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hired Nomad</p>
                                    <p className="text-xs font-bold">{gig.freelancer.fullName}</p>
                                  </div>
                                </div>
                              ) : isOpen ? (
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                  <Users className="size-4" />
                                  <span>{gig._count.proposals} applicant proposals received</span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-muted-foreground">No professional hired</span>
                              )}
                            </div>

                            {/* Right: Expand proposals action */}
                            {isOpen && (
                              <Button
                                variant={isExpanded ? "secondary" : "default"}
                                onClick={() => fetchProposalsForGig(gig.id)}
                                disabled={loadingProposals === gig.id}
                                className="w-full md:w-auto"
                              >
                                {loadingProposals === gig.id ? (
                                  <LoadingIndicator type="line-spinner" size="sm" className="mr-2" />
                                ) : isExpanded ? (
                                  <ChevronUp className="mr-2 size-4" />
                                ) : (
                                  <ChevronDown className="mr-2 size-4" />
                                )}
                                {isExpanded ? 'Hide Proposals' : `Review Proposals (${gig._count.proposals})`}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Proposals List for Gigs in OPEN status */}
                        {isExpanded && isOpen && (
                          <div className="bg-muted/30 border-t p-6">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-6 flex items-center gap-2">
                              <Users className="size-4" /> Applicant Proposals
                            </h3>

                            {!proposals[gig.id] || proposals[gig.id].length === 0 ? (
                              <div className="text-center py-8 bg-background border rounded-xl text-muted-foreground text-sm font-medium">
                                No applications have been sent for this gig yet.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4">
                                {proposals[gig.id].map(proposal => (
                                  <Card key={proposal.id} className="shadow-sm hover:border-primary/30 transition-colors">
                                    <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-6">
                                      <div className="flex-1 flex flex-col gap-4">
                                        {/* Freelancer Header */}
                                        <div className="flex items-start gap-3">
                                          <Avatar className="size-10 border border-background">
                                            <AvatarImage src={proposal.freelancer.profile?.profilePicLink || ''} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(proposal.freelancer.fullName)}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex flex-col">
                                            <h4 className="font-bold text-base tracking-tight">{proposal.freelancer.fullName}</h4>
                                            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                              <MapPin className="size-3" /> {proposal.freelancer.profile?.location || 'Remote'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Cover Letter */}
                                        <div className="bg-muted/50 p-4 rounded-xl border border-border/50 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                          {proposal.coverLetter}
                                        </div>

                                        {/* Skills */}
                                        {proposal.freelancer.profile?.skills && proposal.freelancer.profile.skills.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {proposal.freelancer.profile.skills.map((s, i) => (
                                              <Badge key={i} variant="outline" className="text-[10px] font-semibold text-muted-foreground">
                                                {s.name}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Offer metrics and Hiring Buttons */}
                                      <div className="w-full md:w-auto flex md:flex-col justify-between md:justify-start items-center md:items-end gap-4 shrink-0 md:pl-6 md:border-l">
                                        <div className="text-left md:text-right flex flex-col gap-1">
                                          <p className="text-xl font-bold text-primary flex items-center md:justify-end gap-1">
                                            ₹{Number(proposal.bidAmount).toLocaleString()}
                                          </p>
                                          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                                            {proposal.estimatedDays ? `${proposal.estimatedDays} days est.` : 'flexible timeline'}
                                          </p>
                                        </div>

                                        <div className="flex gap-2">
                                          <Button 
                                            variant="destructive"
                                            size="sm" 
                                            onClick={() => handleProposalAction(proposal.id, gig.id, 'REJECTED')}
                                            disabled={actionLoading !== null}
                                          >
                                            Decline
                                          </Button>
                                          <Button 
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleProposalAction(proposal.id, gig.id, 'ACCEPTED')}
                                            disabled={actionLoading !== null}
                                          >
                                            {actionLoading === proposal.id ? <LoadingIndicator type="line-spinner" size="sm" className="mr-2" /> : null}
                                            {actionLoading === proposal.id ? 'Hiring...' : 'Hire Nomad'}
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

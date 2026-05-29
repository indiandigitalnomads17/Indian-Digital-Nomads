"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

// Shadcn UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JobPost {
  id: string;
  title: string;
  description: string;
  type: 'FIXED_PRICE' | 'HOURLY';
  budget: number | string | null;
  estimatedHours: number | null;
  location: string;
  createdAt: string;
  skillsRequired: { name: string }[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number | string;
  discountedPrice: number | string | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    fullName: string;
    profile: {
      profilePicLink: string | null;
    } | null;
  };
}

interface ClientProfileData {
  id: string;
  fullName: string;
  isVerified: boolean;
  nomadScore: number;
  createdAt: string;
  role: string;
  profile: {
    id: string;
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    videoLink: string | null;
    location: string | null;
  } | null;
  openJobs: JobPost[];
  listedProducts: Product[];
  recentReviews: Review[];
  metrics: {
    totalCompletedContracts: number;
    totalActiveProductsCount: number;
    averageRating: number;
    totalReviewCount: number;
  };
}

export default function BusinessPublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [clientData, setClientData] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    // Connects seamlessly to your public endpoint matching your structural parameters
    api.get(`/api/v1/public/clients/${id}`)
      .then((res) => {
        if (res.data?.success) {
          setClientData(res.data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load business profile context parameters:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[75vh] items-center justify-center text-sm font-medium text-muted-foreground">
        Loading business profile data layout...
      </div>
    </DashboardLayout>
  );

  if (!clientData) return (
    <DashboardLayout>
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">The requested business profile could not be found.</p>
        <Button onClick={() => router.push('/businesses')} size="sm">Back to Businesses</Button>
      </div>
    </DashboardLayout>
  );

  const p = clientData.profile;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 pb-20 px-4 sm:px-6 space-y-6">
        
        {/* Dynamic Profile Header Card Block */}
        <Card className="overflow-hidden border shadow-sm">
          <div className="h-40 sm:h-52 w-full relative bg-slate-100">
            {p?.bannerLink ? (
              <img src={p.bannerLink} alt="Company Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800" />
            )}
          </div>

          <CardContent className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -translate-y-10 sm:-translate-y-12 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <Avatar className="size-20 sm:size-28 border-4 border-background shadow-md rounded-xl bg-background">
                  <AvatarImage src={p?.profilePicLink || undefined} alt="Logo" className="object-cover" />
                  <AvatarFallback className="text-2xl font-black bg-primary/5 text-primary">
                    {clientData.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">{clientData.fullName}</h1>
                    {clientData.isVerified && (
                      <Badge className="bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase px-2">Verified</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-bold">Trust Score: {clientData.nomadScore}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {p?.location || "Global Business Node"}
                  </p>
                </div>
              </div>

              <div className="bg-background border rounded-xl p-3 flex gap-6 shadow-2xs divide-x max-w-xs shrink-0 self-start sm:self-auto">
                <div className="text-left pr-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Client Rating</span>
                  <span className="text-base font-black text-foreground block">★ {clientData.metrics.averageRating || '0.0'}</span>
                </div>
                <div className="text-left pl-4 pr-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contracts Filled</span>
                  <span className="text-base font-black text-foreground block">{clientData.metrics.totalCompletedContracts} Jobs</span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90 max-w-4xl -mt-4 whitespace-pre-wrap">
              {p?.bio || "No business overview statement has been posted by this client yet."}
            </p>
          </CardContent>
        </Card>

        {/* Multi-Tab Workspace Grid Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Tabs Workspace Column */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className="bg-transparent border-b rounded-none p-0 h-auto gap-6 w-full justify-start">
                <TabsTrigger value="jobs" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none bg-transparent px-1 pb-3 text-sm font-bold transition-all">
                  Open Positions ({clientData.openJobs.length})
                </TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none bg-transparent px-1 pb-3 text-sm font-bold transition-all">
                  Digital Products ({clientData.listedProducts.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none bg-transparent px-1 pb-3 text-sm font-bold transition-all">
                  Feedback History ({clientData.metrics.totalReviewCount})
                </TabsTrigger>
              </TabsList>

              {/* Tab Content: Open Position Lists */}
              <TabsContent value="jobs" className="pt-6 space-y-4">
                {clientData.openJobs.length > 0 ? (
                  clientData.openJobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black tracking-tight text-foreground truncate">{job.title}</h3>
                            <Badge variant={job.type === 'HOURLY' ? 'secondary' : 'default'} className="text-[9px] uppercase font-bold">
                              {job.type === 'HOURLY' ? 'Hourly' : 'Fixed Price'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Posted {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {job.location || "Remote Scope"}
                          </p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right min-w-[120px] w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Allocation</p>
                          <p className="text-lg font-black text-foreground">
                            {job.budget ? `₹${Number(job.budget).toLocaleString()}` : 'Hourly Billing'}
                          </p>
                          <Button onClick={() => router.push(`/jobs/${job.id}`)} size="sm" className="w-full sm:w-auto h-8 text-xs font-bold mt-2">
                            View Job
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed text-center rounded-xl text-xs font-medium text-muted-foreground bg-muted/5">
                    This client doesn't have any open project briefs listed currently.
                  </div>
                )}
              </TabsContent>

              {/* Tab Content: Digital Products Marketplace Grid */}
              <TabsContent value="products" className="pt-6">
                {clientData.listedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clientData.listedProducts.map((prod) => (
                      <Card key={prod.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="w-full aspect-video bg-muted border-b relative overflow-hidden">
                          {prod.coverImageUrl ? (
                            <img src={prod.coverImageUrl} alt={prod.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            </div>
                          )}
                        </div>
                        <CardHeader className="p-4 space-y-1">
                          <CardTitle className="text-base font-bold text-foreground line-clamp-1">{prod.title}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2 leading-relaxed">{prod.description}</CardDescription>
                        </CardHeader>
                        <div className="px-4 pb-4 pt-0 flex items-center justify-between gap-4 border-t border-dashed mt-2 pt-3">
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-bold uppercase">Price</span>
                            <span className="text-base font-black text-emerald-600">
                              ₹{Number(prod.discountedPrice || prod.price).toLocaleString()}
                            </span>
                          </div>
                          <Button size="sm" className="h-8 text-xs font-bold" onClick={() => alert("Digital checkout workspace coming soon!")}>
                            Buy Asset
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed text-center rounded-xl text-xs font-medium text-muted-foreground bg-muted/5">
                    No digital products or project files uploaded by this user account.
                  </div>
                )}
              </TabsContent>

              {/* Tab Content: Review Snippet Container List */}
              <TabsContent value="reviews" className="pt-6 space-y-3">
                {clientData.recentReviews.length > 0 ? (
                  clientData.recentReviews.map((rev) => (
                    <Card key={rev.id} className="border shadow-sm">
                      <CardContent className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="size-6 border bg-background">
                              <AvatarImage src={rev.reviewer?.profile?.profilePicLink || undefined} className="object-cover" />
                              <AvatarFallback className="text-[9px] font-black bg-muted">{rev.reviewer?.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-foreground truncate">{rev.reviewer?.fullName}</span>
                          </div>
                          <span className="text-xs font-black text-amber-600 shrink-0">★ {rev.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs leading-relaxed italic text-muted-foreground">
                          "{rev.comment || "The reviewer did not submit any descriptive text commentary feedback parameters."}"
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed text-center rounded-xl text-xs font-medium text-muted-foreground bg-muted/5">
                    No verified platform feedback ratings compiled yet.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar Dashboard Columns */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Quick Profile Meta Metrics Info Panel */}
            <Card className="p-5 border shadow-sm space-y-3 bg-muted/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Ledger</h4>
              <div className="space-y-2 text-xs font-medium text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Digital Inventory:</span>
                  <strong className="text-foreground">{clientData.metrics.totalActiveProductsCount} assets listed</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reviews Compiled:</span>
                  <strong className="text-foreground">{clientData.metrics.totalReviewCount} entries</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Registered Platform Base:</span>
                  <strong className="text-foreground">
                    {new Date(clientData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </strong>
                </div>
              </div>
            </Card>

            {/* Video Pitch Player integration box if mapped inside schema payload */}
            {p?.videoLink && (
              <Card className="p-4 border shadow-sm space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Brief Video</h4>
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  <video src={p.videoLink} controls className="w-full h-full object-cover" />
                </div>
              </Card>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  title: string;
  description: string | null;
  links: string[];
  videoUrl?: string | null;
  completedAt?: string | null;
  images: { url: string; altText?: string | null }[];
  skillsUsed: { name: string }[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    fullName: string;
    profile?: { profilePicLink?: string | null } | null;
  };
}

interface PublicProfile {
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
    hourlyRate: number | string | null;
    isHourly: boolean;
    preferredJobType: string;
    projects: Project[];
    groupedSkills: {
      categories: { id: string; name: string }[];
      parentSkills: { id: string; name: string }[];
      subSkills: { id: string; name: string }[];
      specializations: { id: string; name: string }[];
    };
  } | null;
  workHistory: { id: string; title: string; type: string; createdAt: string }[];
  recentReviews: Review[];
  achievements: {
    badges: string[];
    metrics: {
      totalCompletedJobs: number;
      averageRating: number;
      totalReviewCount: number;
    };
  };
}

export default function PublicFreelancerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    // FIXED: Pointing strictly to your active icfreelancers path parameter routing setup
    api.get(`/api/v1/public/freelancers/${id}`)
      .then(res => {
        if (res.data?.success) setProfileData(res.data.data);
      })
      .catch(err => console.error("Failed to load public portfolio:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[75vh] items-center justify-center text-sm font-medium text-muted-foreground">
        Loading freelancer profile...
      </div>
    </DashboardLayout>
  );

  if (!profileData) return (
    <DashboardLayout>
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">Profile not found.</p>
        <Button onClick={() => router.push('/talent')} size="sm">Back to Directory</Button>
      </div>
    </DashboardLayout>
  );

  const p = profileData.profile;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 pb-20 px-4 sm:px-6 space-y-8">
        
        {/* Banner Card */}
        <Card className="overflow-hidden border shadow-sm">
          <div className="h-44 sm:h-56 w-full relative">
            {p?.bannerLink ? (
              <img src={p.bannerLink} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-blue-600 to-indigo-700" />
            )}
          </div>

          <CardContent className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -translate-y-10 sm:-translate-y-12 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <Avatar className="size-20 sm:size-28 border-4 border-background shadow-md rounded-xl">
                  <AvatarImage src={p?.profilePicLink || undefined} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                    {profileData.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">{profileData.fullName}</h1>
                    {profileData.isVerified && <Badge className="bg-blue-600 text-white text-[10px] font-bold">Verified</Badge>}
                    <Badge variant="secondary" className="text-[10px] font-bold">Score: {profileData.nomadScore} pts</Badge>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span> {p?.location || "Remote"}
                  </p>
                </div>
              </div>

              <div className="bg-background border rounded-xl p-3 flex gap-6 shadow-sm divide-x max-w-xs shrink-0 self-start sm:self-auto">
                <div className="text-left pr-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rating</span>
                  <span className="text-base font-black text-foreground block">★ {profileData.achievements.metrics.averageRating || '0.0'}</span>
                </div>
                <div className="text-left pl-4 pr-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Hourly Rate</span>
                  <span className="text-base font-black text-foreground block">
                    {p?.isHourly && p?.hourlyRate ? `₹${Number(p.hourlyRate).toLocaleString()}/hr` : "Fixed-Price"}
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements Badges */}
            {profileData.achievements.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mt-4">
                {profileData.achievements.badges.map((b, idx) => (
                  <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                    ✨ {b.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-sm leading-relaxed text-foreground/90 max-w-4xl mt-6 whitespace-pre-wrap">{p?.bio || "No summary added yet."}</p>
          </CardContent>
        </Card>

        {/* Tab System Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="bg-transparent border-b rounded-none p-0 h-auto gap-6 w-full justify-start">
                {/* SIMPLIFIED: Replaced technical/contract terms with light personal project phrasing */}
                <TabsTrigger value="projects" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none bg-transparent px-1 pb-3 text-sm font-semibold">
                  Personal Projects ({p?.projects?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none bg-transparent px-1 pb-3 text-sm font-semibold">
                  Client Feedback ({profileData.achievements.metrics.totalReviewCount || 0})
                </TabsTrigger>
              </TabsList>

              {/* Projects Grid */}
              <TabsContent value="projects" className="pt-6">
                {p?.projects && p.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {p.projects.map((project) => (
                      <Card 
                        key={project.id}
                        onClick={() => router.push(`/jobs/project/${project.id}`)}
                        className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <div className="aspect-video bg-muted relative overflow-hidden w-full border-b">
                          {project.images?.[0]?.url ? (
                            <img src={project.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                              <span className="material-symbols-outlined text-4xl">image</span>
                            </div>
                          )}
                        </div>
                        <CardHeader className="p-4 space-y-1">
                          <CardTitle className="text-base font-bold truncate group-hover:text-primary transition-colors">{project.title}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2 leading-relaxed">{project.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed text-center rounded-xl text-xs italic text-muted-foreground">No projects uploaded yet.</div>
                )}
              </TabsContent>

              {/* Client Feedback */}
              <TabsContent value="reviews" className="pt-6 space-y-3">
                {profileData.recentReviews && profileData.recentReviews.length > 0 ? (
                  profileData.recentReviews.map((rev) => (
                    <Card key={rev.id} className="border shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 border">
                              <AvatarImage src={rev.reviewer?.profile?.profilePicLink || undefined} className="object-cover" />
                              <AvatarFallback className="text-[10px] font-bold">{rev.reviewer.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-foreground">{rev.reviewer.fullName}</span>
                          </div>
                          <span className="text-xs font-black text-amber-600">★ {rev.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs leading-relaxed italic text-muted-foreground">"{rev.comment || 'No comment left.'}"</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed text-center rounded-xl text-xs italic text-muted-foreground">No client feedback received yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Skills List */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 border shadow-sm space-y-4 bg-muted/5">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Skills & Technologies</h4>
              
              {p?.groupedSkills && [
                ...p.groupedSkills.specializations,
                ...p.groupedSkills.subSkills,
                ...p.groupedSkills.parentSkills
              ].length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...p.groupedSkills.specializations,
                    ...p.groupedSkills.subSkills,
                    ...p.groupedSkills.parentSkills
                  ].map((s, idx) => (
                    <span key={idx} className="bg-background border text-foreground/80 px-2.5 py-1 rounded-md text-xs font-medium shadow-2xs">
                      {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No skills listed yet.</p>
              )}
            </Card>

            {p?.videoLink && (
              <Card className="p-4 border shadow-sm space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Intro Video</h4>
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
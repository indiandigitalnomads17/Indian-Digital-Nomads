"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

// Shadcn UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SpecificationImage {
  id: string;
  url: string;
}

interface JobDetails {
  id: string;
  title: string;
  description: string;
  type: 'FIXED_PRICE' | 'HOURLY';
  budget: number | null;
  estimatedHours: number | null;
  location: string;
  videoUrl: string | null;
  postedAt: string;
  specificationImages: SpecificationImage[];
  skillsRequired: {
    categories: { id: string; name: string }[];
    parentSkills: { id: string; name: string }[];
    subSkills: { id: string; name: string }[];
    specializations: { id: string; name: string }[];
  };
  business: {
    id: string;
    companyName: string;
    isVerified: boolean;
    nomadScore: number;
    memberSince: string;
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    headquarters: string | null;
    metrics: {
      averageRating: number;
      totalReviewCount: number;
    };
  };
}

export default function PublicJobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/v1/public/jobs/${id}`)
      .then(res => {
        if (res.data?.success) {
          setJob(res.data.data);
        }
      })
      .catch(err => {
        console.error("Error retrieving job description metrics:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // FIXED: Replaced shadcn useToast hook import with an elegant, native browser notification fallback alert
  const handleApplyNowClick = () => {
    alert("Application Pipeline Status: Feature coming soon! Our submission tracking engine is launching shortly.");
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[75vh] items-center justify-center text-sm font-medium text-muted-foreground">
        Loading job metrics layout...
      </div>
    </DashboardLayout>
  );

  if (!job) return (
    <DashboardLayout>
      <div className="flex h-[75vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">The requested job listing could not be found.</p>
        <Button onClick={() => router.push('/jobs')} size="sm">Back to Marketplace</Button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 pb-20 px-4 sm:px-6 space-y-6">
        
        {/* Main Job Overview Title Card */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b p-6 flex flex-row items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[280px]">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">{job.title}</CardTitle>
                <Badge variant={job.type === 'HOURLY' ? 'secondary' : 'default'} className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                  {job.type === 'HOURLY' ? 'Hourly Rate' : 'Fixed Price'}
                </Badge>
              </div>
              <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Posted on: {new Date(job.postedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • Located in: {job.location || "Remote Grid"}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/jobs')} className="text-xs font-bold">
                <span className="material-symbols-outlined text-sm mr-1">arrow_back</span> Marketplace
              </Button>
              <Button onClick={handleApplyNowClick} size="sm" className="text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                Apply Now
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Main Stream Section: Descriptions, Skills, Project Media */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Description Segment */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Specification & Scope</h3>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/20 p-5 rounded-xl border">
                    {job.description}
                  </p>
                </div>

                {/* Skills Taxonomy Tags Row Layout */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Required Core Skills</h3>
                  <div className="flex flex-wrap gap-1.5 bg-background p-4 rounded-xl border">
                    {[
                      ...job.skillsRequired.specializations,
                      ...job.skillsRequired.subSkills,
                      ...job.skillsRequired.parentSkills,
                      ...job.skillsRequired.categories
                    ].length > 0 ? (
                      [
                        ...job.skillsRequired.specializations,
                        ...job.skillsRequired.subSkills,
                        ...job.skillsRequired.parentSkills,
                        ...job.skillsRequired.categories
                      ].map((skill, idx) => (
                        <span key={idx} className="bg-muted text-foreground/80 px-3 py-1 rounded-md text-xs font-medium border">
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No unique skill requirements stated.</span>
                    )}
                  </div>
                </div>

                {/* Specification Images / Documents Gallery */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Images & Mockups</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.specificationImages && job.specificationImages.length > 0 ? (
                      job.specificationImages.map((img) => (
                        <div key={img.id} className="border rounded-xl overflow-hidden aspect-video bg-muted shadow-2xs">
                          <img src={img.url} alt="Specification Attachment" className="w-full h-full object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 border border-dashed text-center rounded-xl text-xs italic text-muted-foreground bg-background">
                        No supporting design mockups or screenshots attached.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Sidebar Section: Financial Layout & Client Details */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Financial Ledger Sidebar Block */}
                <div className="p-5 rounded-xl border bg-muted/10 space-y-3.5 shadow-2xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget Metrics</h4>
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-foreground block">
                      {job.budget ? `₹${job.budget.toLocaleString('en-IN')}` : "Undetermined"}
                    </span>
                    {job.type === 'HOURLY' && job.estimatedHours && (
                      <span className="text-xs font-medium text-muted-foreground block">
                        Estimated Hours Needed: <strong>{job.estimatedHours} Hours</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Client Company Card Context Block */}
                <Card className="p-4 border shadow-2xs bg-muted/5 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">About the Client</h4>
                  
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11 border rounded-lg shrink-0 bg-background">
                      <AvatarImage src={job.business.profilePicLink || undefined} className="object-cover" />
                      <AvatarFallback className="font-bold text-primary bg-primary/5">{job.business.companyName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-black text-foreground truncate">{job.business.companyName}</p>
                      <p className="text-xs text-amber-600 font-bold flex items-center gap-0.5">
                        ★ {job.business.metrics.averageRating || '0.0'}
                        <span className="text-muted-foreground font-normal">({job.business.metrics.totalReviewCount} reviews)</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {job.business.bio || "No custom business overview posted yet."}
                  </p>

                  <Separator />

                  <div className="flex flex-col gap-2 text-[11px] font-medium text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Headquarters:</span>
                      <strong className="text-foreground">{job.business.headquarters || "Not Stated"}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trust Rating Score:</span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 h-auto font-black border-slate-200 bg-background">
                        {job.business.nomadScore} pts
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Member Since:</span>
                      <strong className="text-foreground">
                        {new Date(job.business.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </strong>
                    </div>
                  </div>
                </Card>

                {/* Optional Interactive Video Brief Hook */}
                {job.videoUrl && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Video Explainer Brief</h4>
                    <div className="rounded-xl overflow-hidden bg-black aspect-video border shadow-xs">
                      <video src={job.videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

              </div>

            </div>
          </CardContent>
        </Card>
        
      </div>
    </DashboardLayout>
  );
}
"use client";
import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldTick, AlertCircle, Mail01, CheckCircle, Loading01 } from '@untitledui/icons';

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ScrollArea } from '@/components/ui/scroll-area';

type UserRole = 'CLIENT' | 'FREELANCER';
type JobStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type JobType = 'FIXED_PRICE' | 'HOURLY';
type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
type KycStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface SkillNode {
  id: string;
  name: string;
  tier: number;
  parentId?: string | null;
  subSkills?: SkillNode[];
  parent?: {
    id: string;
    name: string;
    tier: number;
    parent?: { 
      id: string; 
      name: string; 
      tier: number;
      parent?: { id: string; name: string; tier: number } | null;
    } | null;
  } | null;
}

interface ProjectImage {
  id: string;
  url: string;
  altText?: string | null;
  projectId: string;
}

interface Project {
  id: string;
  profileId: string;
  title: string;
  description: string | null;
  links: string[];
  videoUrl?: string | null;
  completedAt?: string | null;
  images: ProjectImage[];
  skillsUsed: SkillNode[];
}

interface ActiveJob {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  type: JobType;
  budget: number | string | null; 
  estimatedHours?: number | null;
  createdAt: string;
  client: { id: string; fullName: string; email: string };
}

interface Proposal {
  id: string;
  coverLetter: string;
  bidAmount: number | string; 
  estimatedDays?: number | null;
  status: ProposalStatus;
  createdAt: string;
  job: { id: string; title: string; budget: number | string | null };
}

interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null; 
  createdAt: string;
  reviewer: {
    fullName: string;
    profile?: { profilePicLink?: string | null } | null;
  };
  job: { title: string };
}

interface Verifications {
  isEmailVerified: boolean;
  isPhoneNumberVerified: boolean;
  isGlobalVerified: boolean;
  kycStatus: KycStatus;
  kycNotes?: string | null;
}

interface ReputationScorecard {
  nomadScore: number;
  averageRating: string;
  totalReviewsCount: number;
}

interface ProposalFunnelMetrics {
  totalApplicationsSubmitted: number;
  activeApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  proposalWinRate: string;
}

interface WorkHistoryMetrics {
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  lifetimeJobsSecured: number;
}

interface EarningsLedgerSummary {
  successfulPayoutsCount: number;
  lifetimeEarningsGross: number;
  lifetimePlatformFeesPaid: number;
  lifetimeNetTakeHome: number;
}

interface ProfileData {
  account: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    role: UserRole;
    createdAt: string;
    verifications: Verifications;
  };
  reputationScorecard: ReputationScorecard;
  profileMetadata: {
    bio?: string | null;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    rates: {
      isHourly: boolean;
      hourlyRate?: number | string | null;
      preferredJobType: JobType;
    };
    profilePicLink?: string | null;
    bannerLink?: string | null;
    videoLink?: string | null;
    skillsTree: SkillNode[];
  };
  workHistoryMetrics: WorkHistoryMetrics;
  proposalFunnelMetrics: ProposalFunnelMetrics;
  portfolioStore: {
    totalProjectsListed: number;
    currentBatch: Project[];
  };
  earningsLedgerSummary: EarningsLedgerSummary;
  reviewsRec: Review[]; 
  proposals: Proposal[];   
  jobsAsFreelancer: ActiveJob[]; 
}

const FreelancerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [allSkills, setAllSkills] = useState<SkillNode[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  
  // --- INTEGRATED IDENTITY OTP STATE HANDLERS ---
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Strict 4-Tier Filtering Selectors State Elements
  const [selectedParentId, setSelectedParentId] = useState<string>(''); 
  const [selectedSubId, setSelectedSubId] = useState<string>('');    
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');   
  const [selectedAtomicLeafId, setSelectedAtomicLeafId] = useState<string>(''); 

  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    phoneNumber: '',
    hourlyRate: '',
    isHourly: false,
    preferredJobType: 'FIXED_PRICE' as JobType,
    skills: [] as string[],
    latitude: 0,
    longitude: 0,
  });
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const router = useRouter();

  const fetchProfileDashboardDataset = async () => {
    try {
      const [profileRes, skillsRes] = await Promise.all([
        api.get('/api/v1/freelancer/dashboard-stats'), 
        api.get('/api/v1/skills/tree')
      ]);

      if (profileRes.data.success) {
        const data = profileRes.data.data as ProfileData;
        setProfile(data);
        setFormData({
          bio: data.profileMetadata?.bio || '',
          location: data.profileMetadata?.location || '',
          phoneNumber: data.account?.phoneNumber || '',
          hourlyRate: data.profileMetadata?.rates?.hourlyRate !== undefined && data.profileMetadata?.rates?.hourlyRate !== null 
            ? String(data.profileMetadata.rates.hourlyRate) 
            : '',
          isHourly: data.profileMetadata?.rates?.isHourly || false,
          preferredJobType: data.profileMetadata?.rates?.preferredJobType || 'FIXED_PRICE',
          skills: data.profileMetadata?.skillsTree.map((s: SkillNode) => s.id) || [],
          latitude: data.profileMetadata?.latitude || 0,
          longitude: data.profileMetadata?.longitude || 0,
        });
        setBannerPreview(data.profileMetadata?.bannerLink || null);
        setProfilePicPreview(data.profileMetadata?.profilePicLink || null);
        setVideoPreview(data.profileMetadata?.videoLink || null);
      }
      if (skillsRes.data.success) {
        setAllSkills(skillsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load secure database datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDashboardDataset();
  }, []);

  const handleRequestEmailOtp = async () => {
    setActionLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/v1/user/auth/send-email-otp');
      if (res.data.success) {
        setShowEmailInput(true);
        setFeedbackMessage({ type: 'success', text: '6-digit code dispatched to your inbox!' });
      }
    } catch (err: any) {
      setFeedbackMessage({ 
        type: 'error', 
        text: err.response?.data?.message || "Failed to trigger email validation code." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (emailOtp.length < 6) return;

    setActionLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/v1/user/auth/verify-email', { otp: emailOtp });
      if (res.data.success) {
        setFeedbackMessage({ type: 'success', text: 'Email verified successfully!' });
        setShowEmailInput(false);
        setEmailOtp("");
        await fetchProfileDashboardDataset(); 
      }
    } catch (err: any) {
      setFeedbackMessage({ 
        type: 'error', 
        text: err.response?.data?.message || "Incorrect verification token code entered." 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderSkillHierarchy = (skill: SkillNode) => {
    const parts: string[] = [];
    if (skill.parent?.parent?.parent?.name) parts.push(skill.parent.parent.parent.name);
    if (skill.parent?.parent?.name) parts.push(skill.parent.parent.name);
    if (skill.parent?.name) parts.push(skill.parent.name);
    parts.push(skill.name);
    return parts.join(' → ');
  };

  const getSkillPathString = (id: string): string => {
    for (const parent of allSkills) {
      if (parent.id === id) return parent.name;
      if (parent.subSkills) {
        for (const sub of parent.subSkills) {
          if (sub.id === id) return `${parent.name} → ${sub.name}`;
          if (sub.subSkills) {
            for (const leaf of sub.subSkills) {
              if (leaf.id === id) return `${parent.name} → ${sub.name} → ${leaf.name}`;
              if (leaf.subSkills) {
                for (const atomicLeaf of leaf.subSkills) {
                  if (atomicLeaf.id === id) return `${parent.name} → ${sub.name} → ${leaf.name} → ${atomicLeaf.name}`;
                }
              }
            }
          }
        }
      }
    }
    return 'Loading Marker...';
  };

  const handleAddSkillFromChain = () => {
    const targetId = selectedAtomicLeafId || selectedLeafId || selectedSubId || selectedParentId;
    if (!targetId) return;

    if (!formData.skills.includes(targetId)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, targetId]
      });
    }
    setSelectedAtomicLeafId('');
    setSelectedLeafId('');
    setSelectedSubId('');
    setSelectedParentId('');
  };

  const handleRemoveSkillTag = (idToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(id => id !== idToRemove)
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('bio', formData.bio);
      payload.append('location', formData.location);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('isHourly', String(formData.isHourly));
      payload.append('hourlyRate', String(formData.hourlyRate));
      payload.append('preferredJobType', formData.preferredJobType);
      payload.append('skills', JSON.stringify(formData.skills));
      payload.append('latitude', String(formData.latitude));
      payload.append('longitude', String(formData.longitude));

      if (bannerFile) payload.append('banner', bannerFile);
      if (profilePicFile) payload.append('profilePic', profilePicFile);
      if (videoFile) payload.append('introVideo', videoFile);

      const res = await api.patch('/api/v1/freelancer/onboard', payload);
      if (res.data.success) {
        setIsEditing(false);
        setBannerFile(null);
        setProfilePicFile(null);
        setVideoFile(null);
        await fetchProfileDashboardDataset();
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Update error mapping failure:", err);
        alert("Something went wrong. Please check your inputs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.address;
          const locationName = address.city || address.town || address.village || address.suburb || "Unknown District";
          const country = address.country || "";

          setFormData({
            ...formData,
            latitude,
            longitude,
            location: country ? `${locationName}, ${country}` : locationName
          });
        } catch (err) {
          console.error("Location lookup error:", err);
        } finally {
          setDetecting(false);
        }
      },
      () => {
        alert("Location access denied.");
        setDetecting(false);
      }
    );
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'profilePic' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'banner') { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
      if (type === 'profilePic') { setProfilePicFile(file); setProfilePicPreview(URL.createObjectURL(file)); }
      if (type === 'video') { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); }
    }
  };

  const subSkillOptions = allSkills.find(p => p.id === selectedParentId)?.subSkills || [];
  const leafSkillOptions = subSkillOptions.find(s => s.id === selectedSubId)?.subSkills || [];
  const atomicLeafSkillOptions = leafSkillOptions.find(l => l.id === selectedLeafId)?.subSkills || [];

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loading01 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Loading secure professional profile dashboard...</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <main className="container py-8 pb-20">
        <div className="mx-auto max-w-7xl flex flex-col gap-8">
          
          {/* Top Main Banner Widget Card */}
          <Card className="overflow-hidden border-none shadow-md">
            <div className="group relative h-48 sm:h-64">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Profile Banner" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              )}
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30">
                    <span className="material-symbols-outlined">photo_camera</span>
                    {bannerFile ? bannerFile.name : 'Change Banner'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'banner')} />
                  </label>
                </div>
              )}
            </div>

            <CardContent className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
              <div className="mb-6 flex -translate-y-12 items-end justify-between sm:-translate-y-16">
                <div className="group/avatar relative inline-flex rounded-full shadow-lg border-4 border-background">
                  <Avatar className="size-24 sm:size-32">
                    <AvatarImage src={profilePicPreview || undefined} alt="Profile" className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{profile?.account?.fullName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover/avatar:opacity-100">
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'profilePic')} />
                    </label>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditing(!isEditing); setErrors({}); }} className="gap-2">
                    <span className="material-symbols-outlined text-sm">{isEditing ? 'close' : 'edit'}</span>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-8">
                  {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                      <p className="mb-2 text-sm font-semibold text-destructive">Validation Errors Found:</p>
                      <ul className="list-inside list-disc space-y-1">
                        {Object.entries(errors).map(([key, val]) => (
                          <li key={key} className="text-sm text-destructive/90">
                            <span className="capitalize">{key}</span>: {((val as any)._errors as string[])?.join(', ') || 'Invalid parameter'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex flex-col gap-6">
                       <div className="flex flex-col gap-2">
                         <Label>Professional Tagline</Label>
                         <Textarea 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})} 
                            placeholder="Passionate expert specializing in..." 
                            className="min-h-[120px] resize-none" 
                         />
                       </div>

                       <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
                          <Label className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-base">videocam</span> Intro Video Pitch
                          </Label>
                          <div className="flex items-center gap-4">
                            <label className="cursor-pointer rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                              Choose Video File
                              <input type="file" className="hidden" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} />
                            </label>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{videoFile ? videoFile.name : (videoPreview ? 'Active verified profile clip' : 'No clip attached')}</span>
                          </div>
                          {videoPreview && (
                            <div className="mt-2 aspect-video max-h-40 overflow-hidden rounded-md bg-black">
                              <video src={videoPreview} controls className="h-full w-full" />
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="flex flex-col gap-6">
                       <div className="flex flex-col gap-2">
                          <Label>Home Base (Location)</Label>
                          <div className="flex gap-2">
                            <Input 
                               type="text" 
                               value={formData.location} 
                               onChange={e => setFormData({...formData, location: e.target.value})} 
                               placeholder="City, Country" 
                            />
                            <Button type="button" variant="secondary" onClick={detectLocation} disabled={detecting} className="w-12 px-0">
                                {detecting ? <Loading01 className="size-4 animate-spin" /> : <span className="material-symbols-outlined text-sm">my_location</span>}
                            </Button>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label>Preferred Structure</Label>
                            {/* In a real scenario you'd use Shadcn Select, but native select works for this refactor to keep logic simple */}
                            <select 
                              value={formData.preferredJobType} 
                              onChange={e => setFormData({...formData, preferredJobType: e.target.value as JobType})} 
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="FIXED_PRICE">Fixed Price Contracts</option>
                              <option value="HOURLY">Hourly Billing Layout</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Phone Contact</Label>
                            <Input type="text" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                          </div>
                       </div>

                       <div className="flex flex-col gap-4 rounded-lg border bg-muted/50 p-4">
                          <div className="flex items-center justify-between">
                            <Label>Open to Hourly Freelancing</Label>
                            <button type="button" onClick={() => setFormData({...formData, isHourly: !formData.isHourly})} className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${formData.isHourly ? 'bg-primary justify-end' : 'bg-input justify-start'}`}>
                                <span className="h-5 w-5 rounded-full bg-background shadow-sm transition-transform"></span>
                            </button>
                          </div>
                          {formData.isHourly && (
                            <div className="flex flex-col gap-2">
                              <Label>Hourly Compensation Rate (₹)</Label>
                              <Input type="number" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} />
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-6">
                    <div>
                      <Label>Technical Stack & Core Expertise Mapping</Label>
                      <p className="text-sm text-muted-foreground">Traverse categories systematically down to specific atomic skill nodes ($Category \rightarrow Parent \rightarrow Sub \rightarrow Leaf$).</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">1. Main Category</Label>
                        <select 
                          value={selectedParentId} 
                          onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(''); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">-- Choose Category --</option>
                          {allSkills.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">2. Parent Skill</Label>
                        <select 
                          value={selectedSubId} 
                          disabled={!selectedParentId}
                          onChange={(e) => { setSelectedSubId(e.target.value); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">-- Choose Parent Skill --</option>
                          {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">3. Sub-Skill</Label>
                        <select 
                          value={selectedLeafId} 
                          disabled={!selectedSubId}
                          onChange={(e) => { setSelectedLeafId(e.target.value); setSelectedAtomicLeafId(''); }}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">-- Choose Sub-Skill --</option>
                          {leafSkillOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">4. Specific Leaf Node</Label>
                        <div className="flex gap-2">
                          <select 
                            value={selectedAtomicLeafId} 
                            disabled={!selectedLeafId}
                            onChange={(e) => setSelectedAtomicLeafId(e.target.value)}
                            className="flex h-10 w-full flex-1 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                          >
                            <option value="">-- Choose Framework --</option>
                            {atomicLeafSkillOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          
                          <Button type="button" onClick={handleAddSkillFromChain} disabled={!(selectedParentId || selectedSubId || selectedLeafId || selectedAtomicLeafId)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />
                    
                    <div className="flex flex-col gap-2">
                      <Label>Currently Stacked Skills Tree ({formData.skills.length})</Label>
                      <div className="flex flex-col gap-2">
                        {formData.skills.map((id) => (
                          <div key={id} className="flex items-center justify-between rounded-md border bg-background px-4 py-2 text-sm shadow-sm">
                            <span className="text-foreground">{getSkillPathString(id)}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSkillTag(id)} className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </Button>
                          </div>
                        ))}
                        {formData.skills.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No hierarchy paths selected yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-6">
                    <Button type="submit" size="lg" disabled={submitting}>
                        {submitting && <Loading01 className="mr-2 size-4 animate-spin" />}
                        {submitting ? 'Saving Changes...' : 'Update Professional Profile'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {profile?.account?.fullName}
                      </h1>
                      {profile?.account?.verifications?.isGlobalVerified && (
                        <ShieldTick className="size-6 sm:size-8 text-primary animate-pulse" />
                      )}
                    </div>

                    {/* Verified Flags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {profile?.account?.verifications?.isEmailVerified ? (
                         <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5">
                           <span className="size-1.5 rounded-full bg-emerald-500" /> Nomad Email Verified
                         </Badge>
                      ) : (
                         <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 animate-pulse">
                           <span className="size-1.5 rounded-full bg-destructive" /> Action Required: Email Unverified
                         </Badge>
                      )}
                      
                      {profile?.account?.verifications?.isPhoneNumberVerified ? (
                         <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1.5">
                           <span className="size-1.5 rounded-full bg-emerald-500" /> Secure SMS Terminal Bound
                         </Badge>
                      ) : (
                         <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1.5">
                           <span className="size-1.5 rounded-full bg-amber-500" /> Mobile Gateway Unlinked
                         </Badge>
                      )}

                      <Badge variant="secondary" className="gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                        KYC Registry: {profile?.account?.verifications?.kycStatus || 'NOT_SUBMITTED'}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2">
                       <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                         <Mail01 className="size-4" />{profile?.account?.email}
                       </p>
                       <p className="text-base text-foreground sm:text-lg max-w-3xl leading-relaxed">
                         {profile?.profileMetadata?.bio || "No professional tagline added yet."}
                       </p>
                    </div>
                  </div>
                  
                  <Separator />

                  <div className="flex flex-wrap gap-6 sm:gap-10">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Base</span>
                        <span className="text-base font-semibold text-foreground">{profile?.profileMetadata?.location || "Not Set"}</span>
                      </div>
                    </div>

                    {profile?.profileMetadata?.rates?.isHourly && (
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                          <span className="material-symbols-outlined">local_atm</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Standard Rate</span>
                          <span className="text-base font-semibold text-foreground">₹{profile?.profileMetadata?.rates?.hourlyRate || '0'}/hr</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <span className="material-symbols-outlined">event_available</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Preference</span>
                        <span className="text-base font-semibold text-foreground">{profile?.profileMetadata?.rates?.preferredJobType === 'HOURLY' ? 'Hourly Basis' : 'Fixed Project'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                     <Card className="shadow-none bg-muted/30">
                        <CardContent className="p-4 flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verified Contact Phone</span>
                           <span className="text-sm font-medium text-foreground">{profile?.account?.phoneNumber || <span className="text-muted-foreground italic">Not set yet</span>}</span>
                        </CardContent>
                     </Card>
                     <Card className="shadow-none bg-muted/30">
                        <CardContent className="p-4 flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hourly Discovery Visibility</span>
                           <span className="text-sm font-medium text-foreground">
                             {profile?.profileMetadata?.rates?.isHourly ? (
                               <span className="flex items-center gap-2 text-emerald-600"><span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span> Active in Directories</span>
                             ) : (
                               <span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-muted-foreground/40"></span> Off-grid (Fixed Only)</span>
                             )}
                           </span>
                        </CardContent>
                     </Card>
                     <Card className="shadow-none bg-muted/30">
                        <CardContent className="p-4 flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Registration Date</span>
                           <span className="text-sm font-medium text-foreground">{profile?.account?.createdAt ? new Date(profile.account.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                        </CardContent>
                     </Card>
                  </div>

                  {profile?.profileMetadata?.videoLink && (
                    <div className="flex flex-col gap-4">
                       <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                         <span className="size-2 rounded-full bg-primary"></span>Video Pitch
                       </h3>
                       <div className="aspect-video max-w-xl overflow-hidden rounded-xl bg-black">
                         <video src={profile.profileMetadata.videoLink} controls className="h-full w-full object-cover" />
                       </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                      <span className="size-2 rounded-full bg-primary"></span>
                      Verified Hierarchy Expertise Stack
                    </h3>
                    <div className="flex flex-wrap gap-3">
                       {profile?.profileMetadata?.skillsTree.map(skill => (
                         <div key={skill.id} className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                           <span className="material-symbols-outlined text-primary text-base">layers</span>
                           <span>{renderSkillHierarchy(skill)}</span>
                         </div>
                       ))}
                       {(!profile?.profileMetadata?.skillsTree || profile.profileMetadata.skillsTree.length === 0) && (
                         <span className="text-sm text-muted-foreground italic">No expertise added yet.</span>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subsections Content Framework Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            <div className="flex flex-col gap-6 lg:col-span-8">
               
               <Tabs defaultValue="showcase" className="w-full">
                 <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                   <TabsTrigger value="showcase" className="rounded-lg border bg-background px-6 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                     Portfolio Showcase ({profile?.portfolioStore?.totalProjectsListed || 0})
                   </TabsTrigger>
                   <TabsTrigger value="contracts" className="rounded-lg border bg-background px-6 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                     Active Contracts ({profile?.workHistoryMetrics?.activeContracts || 0})
                   </TabsTrigger>
                   <TabsTrigger value="proposals" className="rounded-lg border bg-background px-6 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                     Sent Proposals ({profile?.proposalFunnelMetrics?.totalApplicationsSubmitted || 0})
                   </TabsTrigger>
                   <TabsTrigger value="reviews" className="rounded-lg border bg-background px-6 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                     Client Reviews ({profile?.reputationScorecard?.totalReviewsCount || 0})
                   </TabsTrigger>
                 </TabsList>

                 {/* --- DYNAMIC OTP INPUT CODE SLIDE PANELS --- */}
                 {showEmailInput && (
                   <Card className="mt-6 border-primary/30 bg-primary/5 shadow-sm">
                     <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                       <h4 className="mb-2 text-lg font-semibold text-foreground">Confirm OTP Token Code</h4>
                       <p className="mb-6 text-sm text-muted-foreground">Type the 6-digit verification code sent to your email handle dynamically.</p>
                       
                       <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp}>
                         <InputOTPGroup className="gap-2">
                           <InputOTPSlot index={0} className="rounded-md border bg-background h-12 w-12 text-lg" />
                           <InputOTPSlot index={1} className="rounded-md border bg-background h-12 w-12 text-lg" />
                           <InputOTPSlot index={2} className="rounded-md border bg-background h-12 w-12 text-lg" />
                           <InputOTPSlot index={3} className="rounded-md border bg-background h-12 w-12 text-lg" />
                           <InputOTPSlot index={4} className="rounded-md border bg-background h-12 w-12 text-lg" />
                           <InputOTPSlot index={5} className="rounded-md border bg-background h-12 w-12 text-lg" />
                         </InputOTPGroup>
                       </InputOTP>

                       <div className="mt-8 flex items-center justify-center gap-4">
                         <Button variant="ghost" onClick={() => setShowEmailInput(false)}>
                           Cancel
                         </Button>
                         <Button onClick={handleVerifyEmail} disabled={actionLoading || emailOtp.length < 6}>
                           {actionLoading && <Loading01 className="mr-2 size-4 animate-spin" />}
                           Submit Verification
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 <TabsContent value="showcase" className="mt-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl border bg-background p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-foreground">Showcase</h2>
                      <Button onClick={() => router.push('/freelancer/profile/add-project')} variant="secondary" size="sm" className="gap-2">
                        <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Add Project
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4">
                      {profile?.portfolioStore?.currentBatch && profile.portfolioStore.currentBatch.length > 0 ? (
                        profile.portfolioStore.currentBatch.map((project: Project) => (
                          <Card key={project.id} className="group overflow-hidden transition-all hover:border-primary/50">
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative h-40 w-full shrink-0 bg-muted sm:w-48 sm:h-auto">
                                {project.images?.[0] ? (
                                   <img src={project.images[0].url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> 
                                ) : (
                                   <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                     <span className="material-symbols-outlined text-4xl">image</span>
                                   </div>
                                )}
                              </div>
                              <CardContent className="flex flex-1 flex-col justify-center p-6">
                                <h3 className="mb-2 text-lg font-bold uppercase tracking-tight text-foreground">{project.title}</h3>
                                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                              </CardContent>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
                          No showcase elements attached.
                        </div>
                      )}
                    </div>
                 </TabsContent>

                 <TabsContent value="contracts" className="mt-6 flex flex-col gap-4">
                    {profile?.jobsAsFreelancer && profile.jobsAsFreelancer.length > 0 ? (
                      profile.jobsAsFreelancer.map((job: ActiveJob) => (
                        <Card key={job.id} className="border-l-4 border-l-primary shadow-sm">
                          <CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                            <div className="flex flex-col gap-2">
                              <div>
                                <Badge variant="secondary">{job.status}</Badge>
                              </div>
                              <h3 className="text-lg font-bold tracking-tight text-foreground">{job.title}</h3>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-2xl font-bold text-foreground">₹{Number(job.budget).toLocaleString()}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
                        No operational contracts running currently.
                      </div>
                    )}
                 </TabsContent>

                 <TabsContent value="proposals" className="mt-6 flex flex-col gap-4">
                    {profile?.proposals && profile.proposals.length > 0 ? (
                      profile.proposals.map((prop: Proposal) => (
                        <Card key={prop.id} className="shadow-sm">
                          <CardContent className="flex items-center justify-between p-6">
                            <h4 className="text-base font-bold text-foreground">{prop.job.title}</h4>
                            <div className="shrink-0">
                               <Badge variant={prop.status === 'ACCEPTED' ? 'default' : 'secondary'} className={prop.status === 'ACCEPTED' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                 {prop.status}
                               </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
                        No active business inquiries placed.
                      </div>
                    )}
                 </TabsContent>

                 <TabsContent value="reviews" className="mt-6 flex flex-col gap-4">
                    {profile?.reviewsRec && profile.reviewsRec.length > 0 ? (
                      profile.reviewsRec.map((review: Review) => (
                        <Card key={review.id} className="shadow-sm">
                          <CardContent className="p-6">
                            <p className="text-sm font-medium italic text-muted-foreground">"{review.comment}"</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
                        No verified client feedback compiled.
                      </div>
                    )}
                 </TabsContent>
               </Tabs>
            </div>

            {/* Right Side Column Panels - Identity center integrated here */}
            <div className="flex flex-col gap-6 lg:col-span-4">
               
               {/* HIGH-DENSITY INTERACTIVE TRUST BADGE SECURITY CENTER PANEL */}
               <Card className="flex flex-col justify-between shadow-sm">
                 <CardHeader className="flex flex-row items-center justify-between border-b p-6">
                   <CardTitle className="text-sm uppercase tracking-widest">Identity Security</CardTitle>
                   <span className={`size-2.5 rounded-full ${profile?.account?.verifications?.isGlobalVerified ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-amber-400'}`} />
                 </CardHeader>
                 
                 <CardContent className="flex flex-col gap-4 p-6">
                     <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                       <div className="flex items-center gap-3">
                         <Mail01 className={`size-5 ${profile?.account?.verifications?.isEmailVerified ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                         <div className="flex flex-col gap-0.5">
                           <span className="text-sm font-semibold text-foreground">Email Verification</span>
                           <span className="truncate text-xs text-muted-foreground max-w-[130px]">{profile?.account?.email}</span>
                         </div>
                       </div>
                       {profile?.account?.verifications?.isEmailVerified ? (
                         <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                           <CheckCircle className="size-3.5" /> Secure
                         </Badge>
                       ) : (
                         <Button size="sm" onClick={handleRequestEmailOtp} disabled={actionLoading}>
                           Verify
                         </Button>
                       )}
                     </div>

                     <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                       <div className="flex items-center gap-3">
                         <span className="material-symbols-outlined text-[20px] text-muted-foreground">smartphone</span>
                         <div className="flex flex-col gap-0.5">
                           <span className="text-sm font-semibold text-foreground">Mobile SMS Link</span>
                           <span className="text-xs text-muted-foreground">{profile?.account?.phoneNumber || "Unlinked"}</span>
                         </div>
                       </div>
                       {profile?.account?.verifications?.isPhoneNumberVerified ? (
                         <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                           <CheckCircle className="size-3.5" /> Linked
                         </Badge>
                       ) : (
                         <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                           <AlertCircle className="size-3.5" /> Pending
                         </Badge>
                       )}
                     </div>

                     {feedbackMessage.text && (
                       <div className={`rounded-md p-3 text-center text-sm font-medium ${feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-destructive/10 text-destructive'}`}>
                         {feedbackMessage.text}
                       </div>
                     )}
                 </CardContent>
               </Card>

               <Card className="shadow-sm">
                  <CardHeader className="border-b p-6">
                    <CardTitle className="text-sm uppercase tracking-widest">Operational Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6 p-6">
                     <div className="flex items-end justify-between">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jobs Secured</span>
                           <span className="text-2xl font-bold text-foreground">{profile?.workHistoryMetrics?.lifetimeJobsSecured || 0}</span>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[20px]">task_alt</span>
                        </div>
                     </div>
                     <div className="flex items-end justify-between">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Proposal Win Rate</span>
                           <span className="text-2xl font-bold text-primary">{profile?.proposalFunnelMetrics?.proposalWinRate || '0%'}</span>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                          <span className="material-symbols-outlined text-[20px]">trending_up</span>
                        </div>
                     </div>
                     <div className="flex items-end justify-between">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client Feedback</span>
                           <span className="text-2xl font-bold text-emerald-600">{profile?.reputationScorecard?.totalReviewsCount || 0}</span>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                          <span className="material-symbols-outlined text-[20px]">reviews</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="shadow-sm">
                  <CardHeader className="border-b p-6">
                    <CardTitle className="text-sm uppercase tracking-widest">Financial Ledger</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Gross Inflow Earnings</span>
                      <span className="text-foreground">₹{(profile?.earningsLedgerSummary?.lifetimeEarningsGross || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Platform Comm. Fees</span>
                      <span className="text-destructive">- ₹{(profile?.earningsLedgerSummary?.lifetimePlatformFeesPaid || 0).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-foreground">Net Take-Home Yield</span>
                      <span className="text-emerald-600">₹{(profile?.earningsLedgerSummary?.lifetimeNetTakeHome || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
               </Card>

               <Card className="group relative overflow-hidden border-none bg-slate-900 text-white shadow-xl">
                  <div className="absolute -mt-16 -mr-16 right-0 top-0 size-32 bg-primary/20 blur-3xl"></div>
                  <CardContent className="flex flex-col p-8 sm:p-10">
                    <span className="material-symbols-outlined mb-6 flex text-5xl text-primary transition-transform group-hover:scale-110">auto_awesome</span>
                    <h3 className="mb-3 text-2xl font-bold tracking-tight">Nomad Network</h3>
                    <div className="mb-6 flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network Trust Rating</span>
                      <h4 className="flex items-baseline gap-1 text-3xl font-bold tracking-tight text-white">
                        {profile?.reputationScorecard?.nomadScore} <span className="text-xs font-medium text-slate-400">/ 100 PTS</span>
                      </h4>
                    </div>
                    <p className="mb-8 text-sm font-medium leading-relaxed text-slate-300">You are currently visible to top local clients within your verified coverage zone.</p>
                    <Button variant="secondary" size="lg" className="w-full tracking-widest uppercase">
                      View Network
                    </Button>
                  </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default FreelancerProfile;
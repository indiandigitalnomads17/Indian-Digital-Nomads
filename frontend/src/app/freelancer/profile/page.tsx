"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';

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
  reviewsRec: Review[]; // Retained backend array mapping fields
  proposals: Proposal[];   // Retained custom raw mapping models
  jobsAsFreelancer: ActiveJob[]; // Retained inline models fallback
}

const FreelancerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [allSkills, setAllSkills] = useState<SkillNode[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'showcase' | 'contracts' | 'proposals' | 'reviews'>('showcase');

  // Strict 4-Tier Filtering Selectors State Elements
  const [selectedParentId, setSelectedParentId] = useState<string>(''); // Tier 1
  const [selectedSubId, setSelectedSubId] = useState<string>('');    // Tier 2
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');   // Tier 3
  const [selectedAtomicLeafId, setSelectedAtomicLeafId] = useState<string>(''); // Tier 4

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          api.get('/api/v1/freelancer/get-profile-data'), 
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
    fetchData();
  }, []);

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
        
        const profileRes = await api.get('/api/v1/freelancer/get-profile-data');
        const refreshedData = profileRes.data.data;
        setProfile(refreshedData);
        setBannerPreview(refreshedData.profileMetadata?.bannerLink || null);
        setProfilePicPreview(refreshedData.profileMetadata?.profilePicLink || null);
        setVideoPreview(refreshedData.profileMetadata?.videoLink || null);
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

  // 4-Tier Destructuring Level Resolvers
  const subSkillOptions = allSkills.find(p => p.id === selectedParentId)?.subSkills || [];
  const leafSkillOptions = subSkillOptions.find(s => s.id === selectedSubId)?.subSkills || [];
  const atomicLeafSkillOptions = leafSkillOptions.find(l => l.id === selectedLeafId)?.subSkills || [];

  if (loading) return <div className="p-20 text-center font-bold">Loading secure professional profile dashboard...</div>;

  return (
    <DashboardLayout>
      <main className="pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="h-48 relative group">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Profile Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <label className="cursor-pointer bg-white/20 backdrop-blur-md px-6 py-2 rounded-xl text-white font-bold border border-white/30 hover:bg-white/30 truncate max-w-[200px]">
                    <span className="material-symbols-outlined align-middle mr-2">photo_camera</span>
                    {bannerFile ? bannerFile.name : 'Change Banner'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'banner')} />
                  </label>
                </div>
              )}
            </div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-between items-end">
                <div className="relative group/avatar inline-flex rounded-full shadow-xl">
                  <Avatar 
                    size="2xl"
                    src={profilePicPreview || undefined}
                    initials={profile?.account?.fullName?.charAt(0)}
                    alt="Profile"
                    rounded
                    contentClassName="bg-blue-100 text-blue-600"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all text-white z-10">
                      <span className="material-symbols-outlined text-lg">add_a_photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'profilePic')} />
                    </label>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => { setIsEditing(!isEditing); setErrors({}); }} color="secondary" size="sm" className="bg-white text-black border border-slate-200 rounded-xl hover:border-blue-400 hover:text-white hover:bg-blue-500 transition-all">
                    <span className="material-symbols-outlined text-md">{isEditing ? 'close' : 'edit'}</span>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-2">Validation Errors Found:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.entries(errors).map(([key, val]) => (
                          <li key={key} className="text-xs font-bold text-red-500">
                            <span className="capitalize">{key}</span>: {((val as any)._errors as string[])?.join(', ') || 'Invalid parameter'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex flex-col space-y-2">
                         <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Professional Tagline</label>
                         <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold min-h-[120px]`} placeholder="Passionate expert specializing in..." />
                       </div>

                       <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-blue-600">videocam</span> Intro Video Pitch
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 shadow-sm transition-all">
                              Choose Video File
                              <input type="file" className="hidden" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} />
                            </label>
                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{videoFile ? videoFile.name : (videoPreview ? 'Active verified profile clip' : 'No clip attached')}</span>
                          </div>
                          {videoPreview && (
                            <div className="mt-2 rounded-xl overflow-hidden bg-black aspect-video max-h-40">
                              <video src={videoPreview} controls className="w-full h-full" />
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Home Base (Location)</label>
                          <div className="flex gap-2">
                            <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Country" className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold" />
                            <Button type="button" onClick={detectLocation} isLoading={detecting} className="bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white"><span className="material-symbols-outlined text-lg">my_location</span></Button>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Preferred Structure</label>
                            <select value={formData.preferredJobType} onChange={e => setFormData({...formData, preferredJobType: e.target.value as JobType})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold">
                              <option value="FIXED_PRICE">Fixed Price Contracts</option>
                              <option value="HOURLY">Hourly Billing Layout</option>
                            </select>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Phone Contact</label>
                            <input type="text" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold" />
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-700 tracking-tight">Open to Hourly Freelancing</p>
                            </div>
                            <button type="button" onClick={() => setFormData({...formData, isHourly: !formData.isHourly})} className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${formData.isHourly ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}><span className="bg-white w-4 h-4 rounded-full shadow-md"></span></button>
                          </div>
                          {formData.isHourly && (
                            <div className="space-y-1">
                              <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Hourly Compensation Rate (₹)</label>
                              <input type="number" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold" />
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Complete 4-Tier Structural Taxonomy Node Entry Dropdown Chain */}
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Technical Stack & Core Expertise Mapping</label>
                      <p className="text-[11px] text-slate-400 font-semibold mb-3">Traverse categories systematically down to specific atomic skill nodes ($Category \rightarrow Parent \rightarrow Sub \rightarrow Leaf$).</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">1. Main Category</span>
                        <select 
                          value={selectedParentId} 
                          onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(''); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                          className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none"
                        >
                          <option value="">-- Choose Category --</option>
                          {allSkills.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">2. Parent Skill</span>
                        <select 
                          value={selectedSubId} 
                          disabled={!selectedParentId}
                          onChange={(e) => { setSelectedSubId(e.target.value); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                          className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Choose Parent Skill --</option>
                          {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">3. Sub-Skill</span>
                        <select 
                          value={selectedLeafId} 
                          disabled={!selectedSubId}
                          onChange={(e) => { setSelectedLeafId(e.target.value); setSelectedAtomicLeafId(''); }}
                          className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Choose Sub-Skill --</option>
                          {leafSkillOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">4. Specific Leaf Node</span>
                        <div className="flex gap-2">
                          <select 
                            value={selectedAtomicLeafId} 
                            disabled={!selectedLeafId}
                            onChange={(e) => setSelectedAtomicLeafId(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                          >
                            <option value="">-- Choose Framework / Tool --</option>
                            {atomicLeafSkillOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          
                          <Button
                            type="button"
                            onClick={handleAddSkillFromChain}
                            isDisabled={!(selectedParentId || selectedSubId || selectedLeafId || selectedAtomicLeafId)}
                            color="primary"
                            className="px-5 rounded-xl uppercase shadow-md flex items-center justify-center"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60 mt-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 pl-1">Currently Stacked Skills Tree ({formData.skills.length})</p>
                      <div className="flex flex-col space-y-2">
                        {formData.skills.map((id) => (
                          <div key={id} className="flex justify-between items-center px-4 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all">
                            <span className="tracking-tight text-slate-600">{getSkillPathString(id)}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveSkillTag(id)} 
                              className="w-5 h-5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 inline-flex items-center justify-center font-bold text-[11px] border transition-all"
                            >
                              ⟷
                            </button>
                          </div>
                        ))}
                        {formData.skills.length === 0 && (
                          <p className="text-xs text-slate-400 font-bold italic pl-1">No hierarchy paths selected yet.</p>
                        )}
                      </div>
                      {errors.skills && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.skills._errors?.[0]}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" isLoading={submitting} color="secondary" size="xl" className="rounded-xl font-black shadow-xl shadow-blue-500/30 uppercase tracking-widest">{submitting ? 'Saving Changes...' : 'Update Professional Profile'}</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                      {profile?.account?.fullName}
                      {profile?.account?.verifications?.isGlobalVerified && (
                        <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1 rounded-full text-base border border-blue-200">verified</span>
                      )}
                    </h1>
                    
                    {/* Security Compliance Ladder Verification Badges Grid */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${profile?.account?.verifications?.isEmailVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {profile?.account?.verifications?.isEmailVerified ? '✓ Email Verified' : '⚠ Email Unverified'}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${profile?.account?.verifications?.isPhoneNumberVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {profile?.account?.verifications?.isPhoneNumberVerified ? '✓ SMS Linked' : '⚠ SMS Unlinked'}
                      </span>
                      <span className="bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        KYC: {profile?.account?.verifications?.kycStatus}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">mail</span>{profile?.account?.email}
                    </p>
                    <p className="text-lg text-slate-500 font-semibold max-w-2xl leading-relaxed">{profile?.profileMetadata?.bio || "No professional tagline added yet."}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 py-8 border-y border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><span className="material-symbols-outlined text-2xl">location_on</span></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Current Base</p>
                        <p className="text-base font-bold text-slate-900">{profile?.profileMetadata?.location || "Not Set"}</p>
                      </div>
                    </div>
                    {profile?.profileMetadata?.rates?.isHourly && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100"><span className="material-symbols-outlined text-2xl">local_atm</span></div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Standard Rate</p>
                          <p className="text-base font-bold text-slate-900">₹{profile?.profileMetadata?.rates?.hourlyRate || '0'}/hr</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100"><span className="material-symbols-outlined text-2xl">event_available</span></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Job Preference</p>
                        <p className="text-base font-bold text-slate-900">{profile?.profileMetadata?.rates?.preferredJobType === 'HOURLY' ? 'Hourly Basis' : 'Fixed Project'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Verified Contact Phone</p>
                      <p className="text-sm font-bold text-slate-800">{profile?.account?.phoneNumber || <span className="text-slate-400 italic">Not set yet</span>}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Hourly Discovery Visibility</p>
                      <p className="text-sm font-bold text-slate-800">
                        {profile?.profileMetadata?.rates?.isHourly ? (
                          <span className="text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active in Directories</span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Off-grid (Fixed Only)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Account Registration Date</p>
                      <p className="text-sm font-bold text-slate-800">{profile?.account?.createdAt ? new Date(profile.account.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>

                  {profile?.profileMetadata?.videoLink && (
                    <div className="space-y-3">
                       <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Video Pitch</h3>
                       <div className="max-w-xl rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-md"><video src={profile.profileMetadata.videoLink} controls className="w-full h-full" /></div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      Verified Hierarchy Expertise Stack
                    </h3>
                    <div className="flex flex-col space-y-2">
                       {profile?.profileMetadata?.skillsTree.map(skill => (
                         <div key={skill.id} className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black shadow-sm flex items-center gap-2">
                           <span className="material-symbols-outlined text-blue-600 text-base">layers</span>
                           <span className="tracking-tight">{renderSkillHierarchy(skill)}</span>
                         </div>
                       ))}
                       {(!profile?.profileMetadata?.skillsTree || profile?.profileMetadata?.skillsTree.length === 0) && (
                         <p className="text-xs text-slate-400 font-bold italic">No expertise structural markers mapped yet.</p>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
               <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-2 overflow-x-auto">
                 {[
                   { id: 'showcase', label: 'Portfolio Showcase', count: profile?.portfolioStore?.totalProjectsListed || 0 },
                   { id: 'contracts', label: 'Active Contracts', count: profile?.workHistoryMetrics?.activeContracts || 0 },
                   { id: 'proposals', label: 'Sent Proposals', count: profile?.proposalFunnelMetrics?.totalApplicationsSubmitted || 0 },
                   { id: 'reviews', label: 'Client Reviews', count: profile?.reputationScorecard?.totalReviewsCount || 0 },
                 ].map((tab) => (
                   <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[120px] py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 bg-transparent'}`}>
                     {tab.label} ({tab.count})
                   </button>
                 ))}
               </div>

               {activeTab === 'showcase' && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h2 className="text-xl font-black text-slate-900">Showcase</h2>
                      <Button onClick={() => router.push('/freelancer/profile/add-project')} color="secondary" size="sm" className="rounded-xl text-xs font-black uppercase tracking-wider"><span className="material-symbols-outlined text-sm">add_photo_alternate</span> Add Project</Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {profile?.portfolioStore?.currentBatch && profile.portfolioStore.currentBatch.length > 0 ? (
                        profile.portfolioStore.currentBatch.map((project: Project) => (
                          <div key={project.id} className="bg-white rounded-3xl p-6 border border-slate-100 flex gap-6 items-start hover:border-blue-400 transition-all group shadow-sm">
                            <div className="w-40 h-28 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                              {project.images?.[0] ? <img src={project.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-outlined text-4xl">image</span></div>}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{project.title}</h3>
                              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>
                              <div className="flex flex-col space-y-1">
                                {project.skillsUsed.map(s => (
                                  <span key={s.id} className="text-[10px] font-bold text-slate-500 truncate bg-slate-50 px-2 py-0.5 rounded-md border max-w-xs block">
                                    {renderSkillHierarchy(s)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed text-slate-400 text-xs font-bold uppercase tracking-widest">No showcase elements attached.</div>
                      )}
                    </div>
                 </div>
               )}

               {activeTab === 'contracts' && (
                 <div className="space-y-4">
                    {profile?.jobsAsFreelancer && profile.jobsAsFreelancer.length > 0 ? (
                      profile.jobsAsFreelancer.map((job: ActiveJob) => (
                        <div key={job.id} className="bg-white rounded-3xl p-6 border border-l-4 border-l-blue-600 border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest rounded-md">{job.status}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{job.title}</h3>
                            <p className="text-xs text-slate-400 font-medium">Client: <a href={`/client/profile/${job.client.id}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all">{job.client.fullName}</a> ({job.client.email})</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-black text-slate-900">₹{Number(job.budget).toLocaleString()}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{job.type === 'HOURLY' ? '/hr billing setup' : 'Fixed Milestone total'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed text-slate-400 text-xs font-bold uppercase tracking-widest">No operational contracts running currently.</div>
                    )}
                 </div>
               )}

               {activeTab === 'proposals' && (
                 <div className="space-y-4">
                    {profile?.proposals && profile.proposals.length > 0 ? (
                      profile.proposals.map((prop: Proposal) => (
                        <div key={prop.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-black text-slate-900 mb-1">{prop.job.title}</h4>
                            <p className="text-xs text-slate-400 font-medium">Job Target Budget: <span className="font-bold text-slate-600">₹{Number(prop.job.budget).toLocaleString()}</span></p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-2">Submitted {new Date(prop.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-slate-900">Bid: ₹{Number(prop.bidAmount).toLocaleString()}</p>
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider mt-1 ${prop.status === 'ACCEPTED' ? 'bg-green-50 text-green-600 border border-green-100' : prop.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                              {prop.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed text-slate-400 text-xs font-bold uppercase tracking-widest">No active business inquiries placed.</div>
                    )}
                 </div>
               )}

               {activeTab === 'reviews' && (
                 <div className="space-y-4">
                    {profile?.reviewsRec && profile.reviewsRec.length > 0 ? (
                      profile.reviewsRec.map((review: Review) => (
                        <div key={review.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                                {review.reviewer.profile?.profilePicLink ? <img src={review.reviewer.profile.profilePicLink} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{review.reviewer.fullName.charAt(0)}</div>}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{review.reviewer.fullName}</h4>
                                <p className="text-[11px] text-slate-400 font-medium">Contract: {review.job.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-amber-500 gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                              <span className="material-symbols-outlined text-sm fill-current">star</span>
                              <span className="text-xs font-black">{review.rating}</span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-slate-600 font-semibold italic bg-slate-50/50 p-3 rounded-xl border border-slate-50 leading-relaxed">"{review.comment}"</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed text-slate-400 text-xs font-bold uppercase tracking-widest">No verified client feedback compiled.</div>
                    )}
                 </div>
               )}
            </div>

            <div className="space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-8 pb-4 border-b border-slate-50">Operational Analytics</h3>
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Jobs Secured</p>
                           <p className="text-2xl font-black text-slate-900">{profile?.workHistoryMetrics?.lifetimeJobsSecured || 0}</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-2 rounded-lg">task_alt</span>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Proposal Win Rate</p>
                           <p className="text-2xl font-black text-blue-600">{profile?.proposalFunnelMetrics?.proposalWinRate || '0%'}</p>
                        </div>
                        <span className="material-symbols-outlined text-purple-500 bg-purple-50 p-2 rounded-lg">trending_up</span>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Client Feedback</p>
                           <p className="text-2xl font-black text-green-600">{profile?.reputationScorecard?.totalReviewsCount || 0}</p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 bg-green-50 p-2 rounded-lg">reviews</span>
                     </div>
                  </div>
               </div>

               {/* Complete High-Density Financial Outflow Earnings Box Card */}
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-6 pb-4 border-b border-slate-50">Financial Ledger</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Gross Inflow Earnings</span>
                      <span className="text-slate-800">₹{(profile?.earningsLedgerSummary?.lifetimeEarningsGross || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Platform Comm. Fees</span>
                      <span className="text-red-500">- ₹{(profile?.earningsLedgerSummary?.lifetimePlatformFeesPaid || 0).toLocaleString()}</span>
                    </div>
                    <hr className="border-slate-100" />
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-slate-900">Net Take-Home Yield</span>
                      <span className="text-emerald-600">₹{(profile?.earningsLedgerSummary?.lifetimeNetTakeHome || 0).toLocaleString()}</span>
                    </div>
                  </div>
               </div>

               <div className="bg-[#0B1C30] p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16"></div>
                  <span className="material-symbols-outlined text-blue-400 text-5xl mb-6 flex group-hover:scale-110 transition-transform">auto_awesome</span>
                  <h3 className="text-2xl font-black tracking-tight mb-3">Nomad Network</h3>
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Network Trust Rating</p>
                    <h4 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                      {profile?.reputationScorecard?.nomadScore} <span className="text-xs font-medium text-slate-500">/ 100 PTS</span>
                    </h4>
                  </div>
                  <p className="text-slate-400 text-sm font-semibold leading-relaxed mb-8">You are currently visible to top local clients within your verified coverage zone.</p>
                  <Button color="secondary" className="w-full py-4 bg-white text-[#0B1C30] rounded-2xl uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5">
                    View Network
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default FreelancerProfile;
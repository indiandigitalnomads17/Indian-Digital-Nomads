"use client";
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShieldCheck, AlertCircle, Mail, Smartphone, MapPin, Camera, Video, Briefcase, FileText, CheckCircle2, XCircle, DollarSign, Package } from 'lucide-react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface Financials {
  lifetimeSpentGross: number;
  lifetimeFeesPaid: number;
  lifetimeNetSpent: number;
}

interface ClientProfileData {
  account: {
    fullName: string;
    email: string;
    phoneNumber: string | null;
    isVerified: boolean;
    isEmailVerified: boolean;
    isPhoneNumberVerified: boolean;
    nomadScore: number;
    profilePicLink: string | null;
    bannerLink: string | null;
    videoLink: string | null;
    location: string | null;
    bio: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  activeGigs: number;
  totalHired: number;
  pendingProposals: number;
  completedGigs: number;
  cancelledGigs: number;
  totalProducts: number;
  financials: Financials;
}

const ClientProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // --- IDENTITY TRANSACTION OTP STATES ---
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    phoneNumber: '',
    latitude: 0,
    longitude: 0,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const router = useRouter();

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/api/v1/client/get-profile-data');
      if (res.data.success) {
        const data = res.data.data as ClientProfileData;
        setProfile(data);
        setFormData({
          bio: data.account?.bio || '',
          location: data.account?.location || '',
          phoneNumber: data.account?.phoneNumber || '',
          latitude: data.account?.latitude || 0,
          longitude: data.account?.longitude || 0,
        });
        setLogoPreview(data.account?.profilePicLink || null);
        setVideoPreview(data.account?.videoLink || null);
        setBannerPreview(data.account?.bannerLink || null);
      }
    } catch (err) {
      console.error("Failed to load client profile stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleRequestEmailOtp = async () => {
    setActionLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/v1/user/auth/send-email-otp');
      if (res.data.success) {
        setShowEmailInput(true);
        setFeedbackMessage({ type: 'success', text: '6-digit validation code dispatched to inbox!' });
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
        await fetchProfileData(); 
      }
    } catch (err: any) {
      setFeedbackMessage({ 
        type: 'error', 
        text: err.response?.data?.message || "Incorrect code entered." 
      });
    } finally {
      setActionLoading(false);
    }
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
      payload.append('latitude', String(formData.latitude));
      payload.append('longitude', String(formData.longitude));

      if (logoFile) payload.append('companyLogo', logoFile);
      if (videoFile) payload.append('businessVideo', videoFile);
      if (bannerFile) payload.append('banner', bannerFile);

      const res = await api.patch('/api/v1/client/onboard', payload);
      if (res.data.success) {
        setIsEditing(false);
        setLogoFile(null);
        setVideoFile(null);
        setBannerFile(null);
        await fetchProfileData();
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'video' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
      if (type === 'video') { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); }
      if (type === 'banner') { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingIndicator type="line-spinner" size="md" label="Loading business profile dashboard..." />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-8 max-w-7xl mx-auto pt-4">
        
        {/* Header Banner & Profile Form/View */}
        <Card className="overflow-hidden shadow-sm">
          <div className="h-48 relative group">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Business Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary"></div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-background/20 backdrop-blur-md px-6 py-2 rounded-xl text-white font-medium border border-white/30 hover:bg-background/30 truncate max-w-[200px] flex items-center gap-2">
                  <Camera className="size-4" />
                  {bannerFile ? bannerFile.name : 'Change Banner'}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'banner')} />
                </label>
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-6 flex justify-between items-end">
              <div className="relative group/avatar inline-flex rounded-full bg-background p-1 shadow-sm">
                <Avatar className="size-32 border-4 border-background">
                  <AvatarImage src={logoPreview || undefined} alt="Company Logo" className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                    {profile?.account?.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute inset-1 rounded-full bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white z-10">
                    <Camera className="size-6 mb-1" />
                    <span className="text-[10px] font-medium">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'logo')} />
                  </label>
                )}
              </div>
              
              <Button 
                variant={isEditing ? "outline" : "default"} 
                onClick={() => { setIsEditing(!isEditing); setErrors({}); }}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                {Object.keys(errors).length > 0 && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-2">Validation Errors Found:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.entries(errors).map(([key, val]) => (
                        <li key={key} className="text-xs font-medium text-destructive/80">
                          <span className="capitalize">{key}</span>: {((val as any)._errors as string[])?.join(', ') || 'Invalid parameter'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="bio">Company bio / description</Label>
                      <Textarea 
                        id="bio"
                        value={formData.bio} 
                        onChange={e => setFormData({...formData, bio: e.target.value})} 
                        className={errors.bio ? "border-destructive focus-visible:ring-destructive" : ""}
                        placeholder="We are a growing startup looking for talented nomads who specialize in..." 
                        rows={5}
                      />
                    </div>

                    <div className="flex flex-col gap-3 p-4 bg-muted/30 border rounded-xl">
                      <Label className="flex items-center gap-2">
                        <Video className="size-4 text-primary" /> Company Introduction Video
                      </Label>
                      <div className="flex items-center gap-4">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <label className="cursor-pointer">
                            Choose Video File
                            <input type="file" className="hidden" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} />
                          </label>
                        </Button>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {videoFile ? videoFile.name : (videoPreview ? 'Active verified company clip' : 'No clip attached')}
                        </span>
                      </div>
                      {videoPreview && (
                        <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video max-h-40">
                          <video src={videoPreview} controls className="w-full h-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="location">Business Location</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="location"
                          type="text" 
                          value={formData.location} 
                          onChange={e => setFormData({...formData, location: e.target.value})} 
                          placeholder="City, Country" 
                        />
                        <Button 
                          type="button" 
                          variant="secondary"
                          size="icon"
                          onClick={detectLocation} 
                          disabled={detecting} 
                        >
                          {detecting ? <LoadingIndicator type="line-spinner" size="sm" /> : <MapPin className="size-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="phone">Contact Phone Number</Label>
                      <Input 
                        id="phone"
                        type="tel" 
                        value={formData.phoneNumber} 
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                        placeholder="+91 9999999999" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting} size="lg">
                    {submitting ? <LoadingIndicator type="line-spinner" size="sm" className="mr-2" /> : null}
                    {submitting ? 'Saving Changes...' : 'Update Business Profile'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    {profile?.account?.fullName}
                    {profile?.account?.isVerified && (
                      <ShieldCheck className="size-6 text-primary" />
                    )}
                  </h1>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant={profile?.account?.isEmailVerified ? "default" : "destructive"} className={profile?.account?.isEmailVerified ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 shadow-none" : "animate-pulse"}>
                      <span className={`mr-1.5 size-1.5 rounded-full ${profile?.account?.isEmailVerified ? 'bg-emerald-500' : 'bg-destructive'}`} />
                      {profile?.account?.isEmailVerified ? 'Corporate Email Verified' : 'Action Required: Email Unverified'}
                    </Badge>
                    <Badge variant={profile?.account?.isPhoneNumberVerified ? "default" : "secondary"} className={profile?.account?.isPhoneNumberVerified ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 shadow-none" : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 shadow-none"}>
                      <span className={`mr-1.5 size-1.5 rounded-full ${profile?.account?.isPhoneNumberVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {profile?.account?.isPhoneNumberVerified ? 'Mobile Terminal Connected' : 'Mobile Gateway Unlinked'}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Mail className="size-4" /> {profile?.account?.email}
                  </p>
                  <p className="text-base text-muted-foreground/90 max-w-2xl mt-2 leading-relaxed">
                    {profile?.account?.bio || "No business description added yet."}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">Business Base</span>
                      <span className="text-base font-bold">{profile?.account?.location || "Not Set"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Smartphone className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-1">Phone Contact</span>
                      <span className="text-base font-bold">{profile?.account?.phoneNumber || "Not Set"}</span>
                    </div>
                  </div>
                </div>

                {profile?.account?.videoLink && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" /> Business Video Pitch
                      </h3>
                      <div className="max-w-xl rounded-xl overflow-hidden bg-black aspect-video shadow-sm">
                        <video src={profile.account.videoLink} controls className="w-full h-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Split Content Rows for Metrics vs Verifications */}
        {!isEditing && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column Operations Bento Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 h-fit">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground font-semibold text-xs mb-1 uppercase tracking-wider">Active Jobs</p>
                  <h3 className="text-4xl font-bold tracking-tight">{profile.activeGigs}</h3>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground font-semibold text-xs mb-1 uppercase tracking-wider">Total Hired</p>
                  <h3 className="text-4xl font-bold tracking-tight">{profile.totalHired}</h3>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground font-semibold text-xs mb-1 uppercase tracking-wider">Gross Capital Spent</p>
                  <h3 className="text-3xl font-bold tracking-tight pt-1">
                    ${(profile.financials?.lifetimeSpentGross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Premium Interactive Identity Security Side-Bento */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Card className="shadow-sm flex flex-col justify-between h-fit">
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider">Identity Gateway</CardTitle>
                    <span className={`size-2 rounded-full ${profile.account?.isVerified ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-amber-400'}`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-4">
                  
                  {/* Email Row */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Mail className={`size-5 ${profile.account?.isEmailVerified ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold">Email Verification</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">{profile.account?.email}</p>
                      </div>
                    </div>
                    {profile.account?.isEmailVerified ? (
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-200">
                        <CheckCircle2 className="mr-1 size-3" /> Verified
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={handleRequestEmailOtp}
                        disabled={actionLoading}
                        className="text-xs h-7 px-3"
                      >
                        Verify Now
                      </Button>
                    )}
                  </div>

                  {/* SMS Row */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Smartphone className="size-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold">Mobile Terminal</p>
                        <p className="text-[11px] text-muted-foreground">{profile.account?.phoneNumber || "Unlinked"}</p>
                      </div>
                    </div>
                    {profile.account?.isPhoneNumberVerified ? (
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-200">
                        <CheckCircle2 className="mr-1 size-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 bg-amber-500/10 border-amber-200">
                        <AlertCircle className="mr-1 size-3" /> Pending
                      </Badge>
                    )}
                  </div>

                  {feedbackMessage.text && (
                    <div className={`text-xs font-medium mt-1 p-2 rounded-md text-center ${feedbackMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-destructive/15 text-destructive'}`}>
                      {feedbackMessage.text}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inline Expanded Entry Dropdown Form Grid Box */}
              {showEmailInput && (
                <Card className="bg-primary/5 border-primary/20 shadow-none">
                  <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-semibold text-sm">Confirm Security Access Token</h4>
                      <p className="text-xs text-muted-foreground">Provide the 6-digit confirmation key deployed to your inbox.</p>
                    </div>
                    
                    <InputOTP maxLength={6} value={emailOtp} onChange={(val) => setEmailOtp(val)}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>

                    <div className="flex gap-2 w-full mt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowEmailInput(false)}>
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleVerifyEmail}
                        disabled={actionLoading || emailOtp.length < 6}
                      >
                        {actionLoading ? <LoadingIndicator type="line-spinner" size="sm" className="mr-2" /> : null}
                        Confirm Identity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;
"use client";
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';
import { ShieldTick, AlertCircle, Mail01, CheckCircle, Loading01 } from '@untitledui/icons';

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
  const [emailOtp, setEmailOtp] = useState<string[]>(new Array(6).fill(""));
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const inputRefs = useRef<HTMLInputElement[]>([]);

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

  // --- IDENTITY VERIFICATION OPERATIONAL HANDLERS ---
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

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...emailOtp];
    newOtp[index] = value.substring(value.length - 1);
    setEmailOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    const finalOtp = emailOtp.join("");
    if (finalOtp.length < 6) return;

    setActionLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    try {
      const res = await api.post('/api/v1/user/auth/verify-email', { otp: finalOtp });
      if (res.data.success) {
        setFeedbackMessage({ type: 'success', text: 'Email verified successfully!' });
        setShowEmailInput(false);
        setEmailOtp(new Array(6).fill(""));
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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'video' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
      if (type === 'video') { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); }
      if (type === 'banner') { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">Loading business profile dashboard...</div>;

  return (
    <DashboardLayout>
      <main className="pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Banner */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="h-48 relative group">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Business Banner" className="w-full h-full object-cover" />
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
                    src={logoPreview || undefined}
                    initials={profile?.account?.fullName?.charAt(0)}
                    alt="Company Logo"
                    rounded
                    contentClassName="bg-blue-100 text-blue-600 border-4 border-white"
                  />
                  {isEditing && (
                    <label className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all text-white z-10">
                      <span className="material-symbols-outlined text-lg">add_a_photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaChange(e, 'logo')} />
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
                         <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Company bio / description</label>
                         <textarea 
                           value={formData.bio} 
                           onChange={e => setFormData({...formData, bio: e.target.value})} 
                           className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold min-h-[120px]`} 
                           placeholder="We are a growing startup looking for talented nomads who specialize in..." 
                         />
                       </div>

                       <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-blue-600">videocam</span> Company Introduction Video
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 shadow-sm transition-all">
                              Choose Video File
                              <input type="file" className="hidden" accept="video/*" onChange={(e) => handleMediaChange(e, 'video')} />
                            </label>
                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{videoFile ? videoFile.name : (videoPreview ? 'Active verified company clip' : 'No clip attached')}</span>
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
                          <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Business Location</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={formData.location} 
                              onChange={e => setFormData({...formData, location: e.target.value})} 
                              placeholder="City, Country" 
                              className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold" 
                            />
                            <Button 
                              type="button" 
                              onClick={detectLocation} 
                              isLoading={detecting} 
                              className="bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white"
                            >
                              <span className="material-symbols-outlined text-lg">my_location</span>
                            </Button>
                          </div>
                       </div>

                       <div className="flex flex-col space-y-2">
                         <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Contact Phone Number</label>
                         <input 
                           type="text" 
                           value={formData.phoneNumber} 
                           onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                           placeholder="+91 9999999999" 
                           className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 text-sm font-semibold" 
                         />
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" isLoading={submitting} color="secondary" size="xl" className="rounded-xl font-black shadow-xl shadow-blue-500/30 uppercase tracking-widest">{submitting ? 'Saving Changes...' : 'Update Business Profile'}</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-3">
                      {profile?.account?.fullName}
                      {profile?.account?.isVerified && (
                        <ShieldTick className="size-7 text-blue-600 fill-blue-50 animate-pulse" />
                      )}
                    </h1>

                    {/* HIGH IMPORTANCE: Premium Trust Compliance Identity Badges Display */}
                    <div className="flex flex-wrap gap-2.5 mb-4">
                      <span className={`text-[11px] px-3.5 py-1 rounded-xl font-extrabold border shadow-xs tracking-tight flex items-center gap-1.5 transition-all ${profile?.account?.isEmailVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${profile?.account?.isEmailVerified ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {profile?.account?.isEmailVerified ? 'Corporate Email Verified' : 'Action Required: Email Unverified'}
                      </span>
                      <span className={`text-[11px] px-3.5 py-1 rounded-xl font-extrabold border shadow-xs tracking-tight flex items-center gap-1.5 transition-all ${profile?.account?.isPhoneNumberVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-amber-50 text-amber-700 border-amber-200/80'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${profile?.account?.isPhoneNumberVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {profile?.account?.isPhoneNumberVerified ? 'Mobile Terminal Connected' : 'Mobile Gateway Unlinked'}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">mail</span>{profile?.account?.email}
                    </p>
                    <p className="text-lg text-slate-500 font-semibold max-w-2xl leading-relaxed">{profile?.account?.bio || "No business description added yet."}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 py-8 border-y border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><span className="material-symbols-outlined text-2xl">location_on</span></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Business Base</p>
                        <p className="text-base font-bold text-slate-900">{profile?.account?.location || "Not Set"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100"><span className="material-symbols-outlined text-2xl">call</span></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Phone Contact</p>
                        <p className="text-base font-bold text-slate-900">{profile?.account?.phoneNumber || "Not Set"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profile?.account?.videoLink && (
                      <div className="space-y-3">
                         <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>Business Video Pitch</h3>
                         <div className="max-w-xl rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-md">
                           <video src={profile.account.videoLink} controls className="w-full h-full" />
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Split Content Rows for Metrics vs Verifications Dashboard */}
          {!isEditing && profile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column Operations Bento Cards */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 h-fit">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Active Jobs</p>
                  <h3 className="text-4xl text-slate-900 font-black tracking-tight">{profile.activeGigs}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Total Hired</p>
                  <h3 className="text-4xl text-slate-900 font-black tracking-tight">{profile.totalHired}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-widest">Gross Capital Spent</p>
                  <h3 className="text-3xl text-slate-900 font-black tracking-tight pt-1">
                    ${(profile.financials?.lifetimeSpentGross || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>

              {/* Right Column: Premium Interactive Identity Security Side-Bento */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between h-fit">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Identity Gateway</h3>
                      <span className={`h-2 w-2 rounded-full ${profile.account?.isVerified ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-amber-400'}`} />
                    </div>
                    
                    <div className="space-y-4">
                      {/* Email Row */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Mail01 className={`size-5 ${profile.account?.isEmailVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900">Email Verification</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[130px]">{profile.account?.email}</p>
                          </div>
                        </div>
                        {profile.account?.isEmailVerified ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="size-3" /> Verified
                          </span>
                        ) : (
                          <button 
                            onClick={handleRequestEmailOtp}
                            disabled={actionLoading}
                            className="text-[11px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition active:scale-95 whitespace-nowrap shadow-xs"
                          >
                            Verify Now
                          </button>
                        )}
                      </div>

                      {/* SMS Row */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg text-slate-500">smartphone</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Mobile Terminal Status</p>
                            <p className="text-[11px] text-slate-500">{profile.account?.phoneNumber || "Unlinked"}</p>
                          </div>
                        </div>
                        {profile.account?.isPhoneNumberVerified ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="size-3" /> Connected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <AlertCircle className="size-3" /> Pending Link
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {feedbackMessage.text && (
                    <p className={`text-xs font-semibold mt-3 p-2 rounded-lg text-center ${feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {feedbackMessage.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inline Expanded Entry Dropdown Form Grid Box */}
          {showEmailInput && (
            <div className="w-full bg-blue-50/40 border border-blue-200/60 rounded-3xl p-6 mt-6 transition-all duration-300">
              <div className="max-w-md mx-auto text-center space-y-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Confirm Security Access Token</h4>
                  <p className="text-xs text-slate-500">Provide the 6-digit confirmation key deployed to your corporate email handle inbox.</p>
                </div>
                
                <div className="flex justify-center gap-2">
                  {emailOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      ref={(el) => { if (el) inputRefs.current[idx] = el; }}
                      className="w-11 h-12 text-center text-lg font-bold border border-slate-300 bg-white rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-xs text-slate-900"
                    />
                  ))}
                </div>

                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowEmailInput(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyEmail}
                    disabled={actionLoading || emailOtp.includes("")}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:bg-slate-300 transition flex items-center gap-2 shadow-sm"
                  >
                    {actionLoading && <Loading01 className="size-3 animate-spin" />}
                    Confirm Identity
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </DashboardLayout>
  );
};

export default ClientProfile;
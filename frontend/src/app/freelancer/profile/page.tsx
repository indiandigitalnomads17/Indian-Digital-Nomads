"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

const FreelancerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    phoneNumber: '',
    hourlyRate: '',
    isHourly: false,
    preferredJobType: 'FIXED_PRICE',
    skills: [], // IDs of selected skills
    latitude: 0,
    longitude: 0,
  });
  
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          api.get('/api/v1/freelancer/get-profile-data'),
          api.get('/api/v1/skills/tree')
        ]);

        if (profileRes.data.success) {
          const data = profileRes.data.data;
          setProfile(data);
          setFormData({
            bio: data.profile?.bio || '',
            location: data.profile?.location || '',
            phoneNumber: data.phoneNumber || '',
            hourlyRate: data.profile?.hourlyRate || '',
            isHourly: data.profile?.isHourly || false,
            preferredJobType: data.profile?.preferredJobType || 'FIXED_PRICE',
            skills: data.profile?.skills.map(s => s.id) || [],
            latitude: data.profile?.latitude || 0,
            longitude: data.profile?.longitude || 0,
          });
          setBannerPreview(data.profile?.bannerLink || null);
        }
        if (skillsRes.data.success) {
          setAllSkills(skillsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e) => {
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

      if (bannerFile) {
        payload.append('banner', bannerFile);
      }

      const res = await api.patch('/api/v1/freelancer/onboard', payload);
      if (res.data.success) {
        setIsEditing(false);
        // Refresh data
        const profileRes = await api.get('/api/v1/freelancer/get-profile-data');
        setProfile(profileRes.data.data);
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        console.error("Update failed:", err);
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
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.address;
          const locationName = address.city || address.town || address.village || address.suburb || address.state_district || address.county || "Unknown District";
          const country = address.country || "";

          setFormData({
            ...formData,
            latitude,
            longitude,
            location: country ? `${locationName}, ${country}` : locationName
          });
        } catch (err) {
          console.error("Location error:", err);
        } finally {
          setDetecting(false);
        }
      },
      () => {
        alert("Unable to retrieve your location. Please ensure location permissions are enabled.");
        setDetecting(false);
      }
    );
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">Loading your professional profile...</div>;

  return (
    <DashboardLayout>
      <main className="pt-8 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Cover / Profile Header */}
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
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
                  </label>
                </div>
              )}
            </div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-between items-end">
                <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-blue-100 flex items-center justify-center text-4xl font-black text-blue-600">
                    {profile?.fullName?.charAt(0)}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setErrors({});
                    }}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:border-blue-400 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-md">{isEditing ? 'close' : 'edit'}</span>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-2">Please fix the following issues:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.entries(errors).map(([key, val]) => (
                          <li key={key} className="text-xs font-bold text-red-500">
                            {val._errors?.join(', ') || 'Invalid input'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Professional Tagline</label>
                       <textarea 
                          value={formData.bio}
                          onChange={e => setFormData({...formData, bio: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold min-h-[120px]`}
                          placeholder="Passionate digital nomad with expertise in..."
                       />
                       {errors.bio && <p className="text-[10px] font-bold text-red-500">{errors.bio._errors?.[0]}</p>}
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1 leading-none">Home Base (Location)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={formData.location}
                              onChange={e => setFormData({...formData, location: e.target.value})}
                              placeholder="City, Country"
                              className={`flex-1 px-4 py-3 bg-slate-50 rounded-xl border ${errors.location ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold`}
                            />
                            <button 
                              type="button"
                              onClick={detectLocation}
                              disabled={detecting}
                              className="px-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 text-xs font-black"
                            >
                              <span className="material-symbols-outlined text-lg">{detecting ? 'sync' : 'my_location'}</span>
                            </button>
                          </div>
                          {errors.location && <p className="text-[10px] font-bold text-red-500">{errors.location._errors?.[0]}</p>}
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Hourly Rate ($)</label>
                            <input 
                              type="number" 
                              value={formData.hourlyRate}
                              onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                              className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.hourlyRate ? 'border-red-300' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Phone</label>
                            <input 
                              type="text" 
                              value={formData.phoneNumber}
                              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                              className={`w-full px-4 py-3 bg-slate-50 rounded-xl border ${errors.phoneNumber ? 'border-red-300' : 'border-slate-200'} focus:border-blue-500 outline-none text-sm font-semibold`}
                            />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Technical Stack & Expertise</label>
                    <div className={`flex flex-wrap gap-2 p-6 bg-slate-50 rounded-2xl border ${errors.skills ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}>
                       {allSkills.map(skill => (
                         <button
                           key={skill.id}
                           type="button"
                           onClick={() => {
                             const newSkills = formData.skills.includes(skill.id) 
                               ? formData.skills.filter(id => id !== skill.id)
                               : [...formData.skills, skill.id];
                             setFormData({...formData, skills: newSkills});
                           }}
                           className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                             formData.skills.includes(skill.id)
                             ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                             : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
                           }`}
                         >
                           {skill.name}
                         </button>
                       ))}
                    </div>
                    {errors.skills && <p className="text-[10px] font-bold text-red-500">{errors.skills._errors?.[0]}</p>}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className={`px-12 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/30 active:scale-95 transition-all uppercase tracking-widest ${submitting ? 'opacity-50' : ''}`}
                    >
                      {submitting ? 'Saving Changes...' : 'Update Professional Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{profile?.fullName}</h1>
                    <p className="text-lg text-slate-500 font-semibold max-w-2xl leading-relaxed">{profile?.profile?.bio || "No professional tagline added yet."}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-8 py-8 border-y border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                        <span className="material-symbols-outlined text-2xl">location_on</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Current Base</p>
                        <p className={`text-base font-bold ${profile?.profile?.location ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                          {profile?.profile?.location || "Not Set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                        <span className="material-symbols-outlined text-2xl">local_atm</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Standard Rate</p>
                        <p className="text-base font-bold text-slate-900">${profile?.profile?.hourlyRate || '0'}/hr</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                        <span className="material-symbols-outlined text-2xl">event_available</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Job Preference</p>
                        <p className="text-base font-bold text-slate-900">
                          {profile?.profile?.preferredJobType === 'HOURLY' ? 'Hourly Basis' : 'Fixed Project'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                       Technical Stack
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                       {profile?.profile?.skills.map(skill => (
                         <span key={skill.id} className="px-5 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-sm">
                           {skill.name}
                         </span>
                       ))}
                       {(!profile?.profile?.skills || profile?.profile?.skills.length === 0) && (
                         <p className="text-xs text-slate-400 font-bold italic">No expertise markers defined yet.</p>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Portfolio Section */}
            <div className="md:col-span-2 space-y-6">
               <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Showcase</h2>
                  <button 
                    onClick={() => router.push('/freelancer/profile/add-project')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    <span className="material-symbols-outlined text-sm">add_photo_alternate</span> Add Project
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-6">
                 {profile?.profile?.projects.length > 0 ? (
                   profile.profile.projects.map(project => (
                     <div key={project.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-8 items-start hover:border-blue-400 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group">
                        <div className="w-48 h-32 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative">
                           {project.images?.[0] ? (
                             <img src={project.images[0].url} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-5xl">image</span>
                             </div>
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                        </div>
                        <div className="flex-1 py-1">
                          <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.title}</h3>
                          <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-4 line-clamp-2">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                             {project.skillsUsed.map(s => (
                               <span key={s.name} className="text-[10px] font-black uppercase px-3 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 group-hover:border-blue-100 group-hover:text-blue-400 transition-all">
                                 {s.name}
                               </span>
                             ))}
                          </div>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-slate-300">architecture</span>
                      </div>
                      <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Start building your legacy</p>
                      <button 
                        onClick={() => router.push('/freelancer/profile/add-project')}
                        className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
                      >
                        Upload First Project
                      </button>
                   </div>
                 )}
               </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-8 pb-4 border-b border-slate-50">Impact Metrics</h3>
                  <div className="space-y-8">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Jobs Completed</p>
                           <p className="text-2xl font-black text-slate-900">{profile?._count.jobsAsFreelancer}</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-500 bg-blue-50 p-2 rounded-lg">task_alt</span>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Delivery Rate</p>
                           <p className="text-2xl font-black text-green-600">98%</p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 bg-green-50 p-2 rounded-lg">speed</span>
                     </div>
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Proposals</p>
                           <p className="text-2xl font-black text-slate-900">{profile?._count.proposals}</p>
                        </div>
                        <span className="material-symbols-outlined text-orange-500 bg-orange-50 p-2 rounded-lg">send</span>
                     </div>
                  </div>
               </div>

               <div className="bg-[#0B1C30] p-10 rounded-3xl text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16"></div>
                  <span className="material-symbols-outlined text-blue-400 text-5xl mb-6 flex group-hover:scale-110 transition-transform">auto_awesome</span>
                  <h3 className="text-2xl font-black tracking-tight mb-3">Nomad Network</h3>
                  <p className="text-slate-400 text-sm font-semibold leading-relaxed mb-8">You are currently visible to top local clients in your area.</p>
                  <button className="w-full py-4 bg-white text-[#0B1C30] rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5">
                    View Network
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default FreelancerProfile;

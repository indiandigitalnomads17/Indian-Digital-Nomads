"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Stepper from '../../../components/common/Stepper';
import RadiusMap from '../../../components/common/RadiusMap';
import { Button } from '@/components/base/buttons/button';
import api from '@/lib/api';

interface Skill {
  id: string;
  name: string;
  tier: number;
  subSkills?: Skill[];
}

const PostGig = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [budget, setBudget] = useState(250);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  const [skillTree, setSkillTree] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{id: string, name: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<Skill | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<Skill | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "FIXED_PRICE",
    estimatedHours: "",
    location: "",
  });

  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lng: 77.2090 }); // Default to New Delhi

  useEffect(() => {
    api.get('/api/v1/skills/tree')
      .then(res => {
        if (res.data?.success) {
          setSkillTree(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load skills", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStep1Valid = formData.title.length >= 10 && formData.description.length >= 25;
  const isStep2Valid = selectedSkills.length > 0;
  const isStep3Valid = budget >= 500 && formData.location.trim().length > 0;

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

          setCoordinates({ lat: latitude, lng: longitude });
          setFormData(prev => ({
            ...prev,
            location: country ? `${locationName}, ${country}` : locationName
          }));
        } catch (err) {
          console.error("Location lookup error:", err);
          setCoordinates({ lat: latitude, lng: longitude });
          setFormData(prev => ({ ...prev, location: "My Current Location" }));
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

  const handlePostGig = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        budget: budget,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        location: formData.location,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        skills: selectedSkills.map(s => s.id)
      };
      
      const res = await api.post('/api/v1/client/create', payload);
      alert("Gig posted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to post gig. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-center w-full max-w-6xl mx-auto gap-12 px-4">
        {/* Main Content Column */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <Stepper currentStep={currentStep} />

          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
              
              {currentStep === 1 && (
                <>
                  <header className="mb-8">
                    <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Gig Details</h3>
                    <p className="text-slate-500">Provide a clear title and detailed description for your gig.</p>
                  </header>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Job Title</label>
                      <input 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Need a Senior React Developer"
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                      <p className="text-[10px] font-medium text-slate-400">Min 10 characters.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="Describe the gig requirements..."
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                      />
                      <p className="text-[10px] font-medium text-slate-400">Min 25 characters.</p>
                    </div>
                    <div className="pt-6 flex justify-end">
                      <Button color="primary" size="xl" onClick={nextStep} isDisabled={!isStep1Valid} className="px-8 rounded-xl font-extrabold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                        Next Step <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <header className="mb-8">
                    <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Skills & Terms</h3>
                    <p className="text-slate-500">Specify the required skills and project terms.</p>
                  </header>
                  <div className="space-y-6">
                    
                    {/* Skills Selector */}
                    <div className="space-y-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Required Skills</label>
                      
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          {selectedSkills.map(skill => (
                            <span key={skill.id} className="bg-primary text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium shadow-sm">
                              {skill.name}
                              <button 
                                onClick={() => setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))} 
                                className="hover:text-primary-container transition-colors flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Categories */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {skillTree.map(cat => {
                            const isLeaf = !cat.subSkills || cat.subSkills.length === 0;
                            const isSelected = selectedSkills.some(s => s.id === cat.id);
                            
                            return (
                              <button 
                                key={cat.id} 
                                onClick={() => { 
                                  if (isLeaf) {
                                    if (isSelected) {
                                      setSelectedSkills(prev => prev.filter(s => s.id !== cat.id));
                                    } else {
                                      setSelectedSkills(prev => [...prev, { id: cat.id, name: cat.name }]);
                                    }
                                  } else {
                                    setActiveCategory(cat); 
                                    setActiveSubcategory(null); 
                                  }
                                }}
                                className={`px-3 py-2 text-xs rounded-xl border transition-all text-left truncate font-medium flex items-center ${
                                  isLeaf && isSelected
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : activeCategory?.id === cat.id 
                                      ? 'bg-secondary text-white border-secondary shadow-sm' 
                                      : 'bg-surface-container-lowest border-outline-variant/30 text-slate-600 hover:border-outline-variant/80 hover:bg-surface-container'
                                }`}
                              >
                                {isLeaf && isSelected && <span className="material-symbols-outlined text-[14px] mr-1">check</span>}
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>

                        {/* Subcategories */}
                        {activeCategory && activeCategory.subSkills && activeCategory.subSkills.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-secondary/20 grid grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {activeCategory.subSkills.map(sub => {
                              const isLeaf = !sub.subSkills || sub.subSkills.length === 0;
                              const isSelected = selectedSkills.some(s => s.id === sub.id);
                              
                              return (
                                <button 
                                  key={sub.id} 
                                  onClick={() => {
                                    if (isLeaf) {
                                      if (isSelected) {
                                        setSelectedSkills(prev => prev.filter(s => s.id !== sub.id));
                                      } else {
                                        setSelectedSkills(prev => [...prev, { id: sub.id, name: sub.name }]);
                                      }
                                    } else {
                                      setActiveSubcategory(sub);
                                    }
                                  }}
                                  className={`px-3 py-2 text-xs rounded-xl border transition-all text-left truncate font-medium flex items-center ${
                                    isLeaf && isSelected
                                      ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
                                      : activeSubcategory?.id === sub.id 
                                        ? 'bg-secondary-container text-on-secondary-container border-secondary/30 shadow-sm' 
                                        : 'bg-surface-container-lowest border-outline-variant/30 text-slate-600 hover:border-outline-variant/80 hover:bg-surface-container'
                                  }`}
                                >
                                  {isLeaf && isSelected && <span className="material-symbols-outlined text-[14px] mr-1">check</span>}
                                  {sub.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Leaf Skills */}
                        {activeSubcategory && activeSubcategory.subSkills && activeSubcategory.subSkills.length > 0 && (
                          <div className="mt-3 pl-8 border-l-2 border-primary/20 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {activeSubcategory.subSkills.map(skill => {
                              const isSelected = selectedSkills.some(s => s.id === skill.id);
                              return (
                                <button 
                                  key={skill.id} 
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedSkills(prev => prev.filter(s => s.id !== skill.id));
                                    } else {
                                      setSelectedSkills(prev => [...prev, { id: skill.id, name: skill.name }]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium flex items-center gap-1 ${isSelected ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-surface-container-lowest border-outline-variant/50 text-slate-700 hover:border-primary/50 hover:bg-primary/5'}`}
                                >
                                  {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                                  {skill.name}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Project Type</label>
                        <select 
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                          <option value="FIXED_PRICE">Fixed Price</option>
                          <option value="HOURLY">Hourly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Est. Hours (Optional)</label>
                        <input 
                          type="number"
                          name="estimatedHours"
                          value={formData.estimatedHours}
                          onChange={handleInputChange}
                          placeholder="e.g. 40"
                          className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="pt-6 flex justify-between gap-4">
                      <Button color="tertiary" size="xl" onClick={prevStep} className="px-8 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all">
                        <span className="material-symbols-outlined text-lg mr-1">arrow_back</span> Back
                      </Button>
                      <Button color="primary" size="xl" onClick={nextStep} isDisabled={!isStep2Valid} className="flex-1 rounded-xl font-extrabold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                        Next Step <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <header className="mb-8">
                    <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Budget & Location</h3>
                    <p className="text-slate-500">Set your financial range and the broadcast radius for local talent discovery.</p>
                  </header>
                  <div className="space-y-10">
                    {/* Budget Section */}
                    <section className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Estimated Budget (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                        <input 
                          type="number"
                          value={budget || ""}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          placeholder="1000"
                          min="500"
                          className="w-full bg-surface-container rounded-xl pl-8 pr-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                        />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">Enter your expected budget (Minimum ₹500).</p>
                    </section>

                    {/* Broadcast Zone Section */}
                    <section className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Broadcast Zone (Location)</label>
                        <button 
                          onClick={detectLocation}
                          disabled={detecting}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className={`material-symbols-outlined text-[14px] ${detecting ? 'animate-spin' : ''}`}>
                            {detecting ? 'sync' : 'my_location'}
                          </span>
                          {detecting ? 'Detecting...' : 'Detect'}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold material-symbols-outlined text-[18px]">location_on</span>
                        <input 
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="e.g. Mumbai, India"
                          className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                        />
                      </div>

                      {formData.location && (
                        <div className="pt-2 animate-in fade-in">
                          <RadiusMap radiusText="Tier 1: 11km Radius" locationName={formData.location} />
                        </div>
                      )}
                    </section>

                    {/* Actions */}
                    <div className="pt-6 flex items-center justify-between gap-4">
                      <Button color="tertiary" size="xl" onClick={prevStep} className="px-8 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all">
                        <span className="material-symbols-outlined text-lg mr-1">arrow_back</span> Back
                      </Button>
                      <Button 
                        color="primary" 
                        size="xl" 
                        onClick={handlePostGig}
                        isLoading={isSubmitting}
                        className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white font-extrabold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Post Gig <span className="material-symbols-outlined text-lg ml-1">rocket_launch</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Trust Banners */}
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              <TrustItem icon="verified_user" text="Local Verified Talent Only" />
              <TrustItem icon="payments" text="Escrow Protected Payments" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Info */}
        <div className="hidden lg:block w-72 shrink-0 pt-24 space-y-4">
          <ProTipCard text="Increasing your radius to 25km could connect you with 45% more qualified workers." />
          <GigSummaryCard 
            title={formData.title || "UI Redesign"} 
            skills={selectedSkills.map(s => s.name).join(", ") || "Figma, UX"} 
            tier="Free Tier" 
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

// Internal Sub-components for cleaner code
const TrustItem = ({ icon, text }: { icon: string; text: string }) => (
  <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3">
    <span className="material-symbols-outlined text-secondary">{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600">{text}</span>
  </div>
);

const ProTipCard = ({ text }: { text: string }) => (
  <div className="p-5 bg-secondary-container/20 rounded-2xl border border-secondary/10">
    <h4 className="font-headline font-bold text-secondary flex items-center gap-2 mb-2">
      <span className="material-symbols-outlined">lightbulb</span> Pro Tip
    </h4>
    <p className="text-xs leading-relaxed text-on-secondary-container">{text}</p>
  </div>
);

const GigSummaryCard = ({ title, skills, tier }: { title: string; skills: string; tier: string }) => (
  <div className="p-5 bg-surface-container-high rounded-2xl border border-primary/5">
    <h4 className="font-headline font-bold text-primary mb-3">Gig Summary</h4>
    <div className="space-y-3">
      <SummaryRow label="Title" value={title} />
      <SummaryRow label="Skills" value={skills} />
      <hr className="border-outline-variant/20"/>
      <SummaryRow label="Fees (0%)" value={tier} isSecondary />
    </div>
  </div>
);

const SummaryRow = ({ label, value, isSecondary }: { label: any; value: any; isSecondary?: any }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
    <span className={`text-xs font-semibold truncate ml-2 max-w-[120px] text-right ${isSecondary ? 'text-secondary' : ''}`}>{value}</span>
  </div>
);

export default PostGig;
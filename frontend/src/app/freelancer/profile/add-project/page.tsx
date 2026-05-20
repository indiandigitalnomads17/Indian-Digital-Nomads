"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/base/buttons/button';

interface SkillNode {
  id: string;
  name: string;
  tier: number;
  parentId?: string | null;
  subSkills?: SkillNode[];
}

const AddProject = () => {
  const [allSkills, setAllSkills] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Strict 4-Tier Filtering Selectors State Elements
  const [selectedParentId, setSelectedParentId] = useState<string>(''); // Tier 1 Category
  const [selectedSubId, setSelectedSubId] = useState<string>('');       // Tier 2 Parent Skill
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');     // Tier 3 Subskill
  const [selectedAtomicLeafId, setSelectedAtomicLeafId] = useState<string>(''); // Tier 4 Leaf Node

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    links: [''],
    skills: [] as string[],
    completedAt: '',
    screenshots: [] as File[],
  });

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

        if (profileRes.data.success && skillsRes.data.success) {
          // Sync with the updated high-density data object contract layout
          const profileWrapper = profileRes.data.data;
          const userSkillsList = profileWrapper.profileMetadata?.skillsTree || [];
          const userSkillIds = new Set(userSkillsList.map((s: any) => s.id));
          const fullTree = skillsRes.data.data as SkillNode[];

          // UPDATED: Recursively maps structural branches across all 4 production depths
          const filteredTree = fullTree.map(category => {
            const filteredParents = (category.subSkills || []).map(parentSkill => {
              const filteredSubs = (parentSkill.subSkills || []).map(subSkill => {
                const filteredLeaves = (subSkill.subSkills || []).filter(leafNode => userSkillIds.has(leafNode.id));
                
                if (userSkillIds.has(subSkill.id) || filteredLeaves.length > 0) {
                  return { ...subSkill, subSkills: filteredLeaves };
                }
                return null;
              }).filter(Boolean) as SkillNode[];

              if (userSkillIds.has(parentSkill.id) || filteredSubs.length > 0) {
                return { ...parentSkill, subSkills: filteredSubs };
              }
              return null;
            }).filter(Boolean) as SkillNode[];

            if (userSkillIds.has(category.id) || filteredParents.length > 0) {
              return { ...category, subSkills: filteredParents };
            }
            return null;
          }).filter(Boolean) as SkillNode[];

          setAllSkills(filteredTree);
        }
      } catch (err) {
        console.error("Failed to load skills data:", err);
      }
    };
    fetchData();
  }, []);

  const getSkillPathString = (id: string): string => {
    for (const category of allSkills) {
      if (category.id === id) return category.name;
      if (category.subSkills) {
        for (const parentSkill of category.subSkills) {
          if (parentSkill.id === id) return `${category.name} → ${parentSkill.name}`;
          if (parentSkill.subSkills) {
            for (const subSkill of parentSkill.subSkills) {
              if (subSkill.id === id) return `${category.name} → ${parentSkill.name} → ${subSkill.name}`;
              if (subSkill.subSkills) {
                for (const leafNode of subSkill.subSkills) {
                  if (leafNode.id === id) return `${category.name} → ${parentSkill.name} → ${subSkill.name} → ${leafNode.name}`;
                }
              }
            }
          }
        }
      }
    }
    return 'Loading...';
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, screenshots: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      
      const validLinks = formData.links.filter(link => link.trim() !== '');
      payload.append('links', JSON.stringify(validLinks));
      payload.append('completedAt', formData.completedAt);
      payload.append('skills', JSON.stringify(formData.skills));
      
      formData.screenshots.forEach(file => {
        payload.append('screenshots', file);
      });

      if (videoFile) {
        payload.append('projectVideo', videoFile);
      }

      const res = await api.post('/api/v1/freelancer/add-project', payload);
      if (res.data.success) {
        router.push('/freelancer/profile');
      }
    } catch (err) {
      console.error("Failed to add project:", err);
      alert("Something went wrong while publishing your showcase item.");
    } finally {
      setLoading(false);
    }
  };

  // 4-Tier UI Select Chain Layer Map Resolvers
  const parentSkillOptions = allSkills.find(c => c.id === selectedParentId)?.subSkills || [];
  const subSkillOptions = parentSkillOptions.find(p => p.id === selectedSubId)?.subSkills || [];
  const atomicLeafSkillOptions = subSkillOptions.find(s => s.id === selectedLeafId)?.subSkills || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Showcase New Project</h1>
              <p className="text-slate-500 font-semibold text-sm">Add a project to your portfolio to impress potential clients.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold"
                    placeholder="E.g. Full-stack Supply Chain Dashboard Layout"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold min-h-[120px]"
                    placeholder="Describe your architecture role, technical stack, and overall outcome milestones..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Project Links (Optional)</label>
                      <Button 
                        type="button" 
                        color="link-color"
                        onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })}
                        className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:text-blue-700 p-0"
                      >
                        + Add Link
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.links.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={link}
                            onChange={e => {
                              const newLinks = [...formData.links];
                              newLinks[index] = e.target.value;
                              setFormData({ ...formData, links: newLinks });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold"
                            placeholder="https://deployedproject.com"
                          />
                          {formData.links.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const newLinks = formData.links.filter((_, i) => i !== index);
                                setFormData({ ...formData, links: newLinks });
                              }}
                              color="tertiary-destructive"
                              className="px-3 rounded-xl flex items-center justify-center border-red-100"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Completion Date</label>
                    <input
                      type="date"
                      required
                      value={formData.completedAt}
                      onChange={e => setFormData({ ...formData, completedAt: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Updated 4-Tier Functional Selector Form Chain */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Skills Mapped to This Project</label>
                    <p className="text-[11px] text-slate-400 font-semibold mb-3">Tag exactly which pipeline nodes your portfolio milestone demonstrates.</p>
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
                        {allSkills.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                        {parentSkillOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                        {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">4. Leaf Expertise (Optional)</span>
                      <div className="flex gap-2">
                        <select 
                          value={selectedAtomicLeafId} 
                          disabled={!selectedLeafId}
                          onChange={(e) => setSelectedAtomicLeafId(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Choose Framework --</option>
                          {atomicLeafSkillOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <Button
                          type="button"
                          onClick={handleAddSkillFromChain}
                          isDisabled={!(selectedParentId || selectedSubId || selectedLeafId || selectedAtomicLeafId)}
                          color="primary"
                          className="px-4 rounded-xl uppercase transition-all shadow-md flex items-center justify-center border-blue-500"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 pl-1">Connected Project Stack ({formData.skills.length})</p>
                    <div className="flex flex-col space-y-2">
                      {formData.skills.map((id) => (
                        <div key={id} className="flex justify-between items-center px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm">
                          <span className="tracking-tight text-slate-600">{getSkillPathString(id)}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkillTag(id)} 
                            className="w-5 h-5 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 inline-flex items-center justify-center font-bold text-[11px] border transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {formData.skills.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold italic pl-1">No technologies linked yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 pl-1">
                    <span className="material-symbols-outlined text-lg text-blue-600">videocam</span> 
                    Project Demo Video Clip (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 shadow-sm transition-all">
                      Choose Video File
                      <input type="file" className="hidden" accept="video/*" onChange={handleVideoChange} />
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[250px]">
                      {videoFile ? videoFile.name : 'No demonstration file attached'}
                    </span>
                  </div>
                  {videoPreview && (
                    <div className="mt-2 rounded-xl overflow-hidden bg-black aspect-video max-h-44">
                      <video src={videoPreview} controls className="w-full h-full" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Project Screenshots</label>
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-4 py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group-hover:border-blue-400 transition-all">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        {formData.screenshots.length > 0 
                          ? `${formData.screenshots.length} showcase snapshots staged` 
                          : 'Click to upload user interface screenshots'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  color="tertiary"
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  color="primary"
                  className="flex-1 py-3 rounded-xl uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {loading ? 'Publishing showcase instance...' : 'Publish Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default AddProject;
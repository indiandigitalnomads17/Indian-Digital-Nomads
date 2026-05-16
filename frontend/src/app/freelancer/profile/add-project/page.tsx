"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
  
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');

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
          const userSkillsList = profileRes.data.data.profile?.skills || [];
          const userSkillIds = new Set(userSkillsList.map((s: any) => s.id));
          const fullTree = skillsRes.data.data as SkillNode[];

          const filteredTree = fullTree.map(parent => {
            const filteredSubs = (parent.subSkills || []).map(sub => {
              const filteredLeaves = (sub.subSkills || []).filter(leaf => userSkillIds.has(leaf.id));
              if (userSkillIds.has(sub.id) || filteredLeaves.length > 0) {
                return { ...sub, subSkills: filteredLeaves };
              }
              return null;
            }).filter(Boolean) as SkillNode[];

            if (userSkillIds.has(parent.id) || filteredSubs.length > 0) {
              return { ...parent, subSkills: filteredSubs };
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
    for (const parent of allSkills) {
      if (parent.id === id) return parent.name;
      if (parent.subSkills) {
        for (const sub of parent.subSkills) {
          if (sub.id === id) return `${parent.name} → ${sub.name}`;
          if (sub.subSkills) {
            for (const leaf of sub.subSkills) {
              if (leaf.id === id) return `${parent.name} → ${sub.name} → ${leaf.name}`;
            }
          }
        }
      }
    }
    return 'Loading...';
  };

  const handleAddSkillFromChain = () => {
    const targetId = selectedLeafId || selectedSubId || selectedParentId;
    if (!targetId) return;

    if (!formData.skills.includes(targetId)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, targetId]
      });
    }
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

  const subSkillOptions = allSkills.find(p => p.id === selectedParentId)?.subSkills || [];
  const leafSkillOptions = subSkillOptions.find(s => s.id === selectedSubId)?.subSkills || [];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
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
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })}
                        className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:text-blue-700"
                      >
                        + Add Link
                      </button>
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
                            placeholder="https://github.com/your-repo"
                          />
                          {formData.links.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = formData.links.filter((_, i) => i !== index);
                                setFormData({ ...formData, links: newLinks });
                              }}
                              className="px-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center border border-red-100"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
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

                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Skills Mapped to This Project</label>
                    <p className="text-[11px] text-slate-400 font-semibold mb-3">Select skills from your profile to connect to this project.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">1. Parent Category</span>
                      <select 
                        value={selectedParentId} 
                        onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(''); setSelectedLeafId(''); }}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none"
                      >
                        <option value="">-- Choose Category --</option>
                        {allSkills.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">2. Sub Category</span>
                      <select 
                        value={selectedSubId} 
                        disabled={!selectedParentId}
                        onChange={(e) => { setSelectedSubId(e.target.value); setSelectedLeafId(''); }}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                      >
                        <option value="">-- Choose Sub-Skill --</option>
                        {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">3. Specific Leaf Skill (Optional)</span>
                      <div className="flex gap-2">
                        <select 
                          value={selectedLeafId} 
                          disabled={!selectedSubId}
                          onChange={(e) => setSelectedLeafId(e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Choose Expertise --</option>
                          {leafSkillOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddSkillFromChain}
                          disabled={!(selectedParentId || selectedSubId || selectedLeafId)}
                          className="px-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center border border-blue-500"
                        >
                          Add
                        </button>
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
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Publishing showcase instance...' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default AddProject;
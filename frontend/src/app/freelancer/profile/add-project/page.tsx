"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

const AddProject = () => {
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectUrl: '',
    skills: [],
    completedAt: '',
    screenshots: [],
  });
  const router = useRouter();

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/api/v1/skills/tree');
        if (res.data.success) setAllSkills(res.data.data);
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      }
    };
    fetchSkills();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('projectUrl', formData.projectUrl);
      payload.append('completedAt', formData.completedAt);
      payload.append('skills', JSON.stringify(formData.skills));
      
      formData.screenshots.forEach(file => {
        payload.append('screenshots', file);
      });

      const res = await api.post('/api/v1/freelancer/add-project', payload);
      if (res.data.success) {
        router.push('/freelancer/profile');
      }
    } catch (err) {
      console.error("Failed to add project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, screenshots: Array.from(e.target.files) });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="pl-72 pt-32 pr-8 pb-20">
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
                    placeholder="E.g. E-commerce Website Design"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold min-h-[120px]"
                    placeholder="Describe your role and the outcome..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Project URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.projectUrl}
                      onChange={e => setFormData({ ...formData, projectUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm font-semibold"
                      placeholder="https://..."
                    />
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

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Skills Applied</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {allSkills.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          const newSkills = formData.skills.includes(skill.id)
                            ? formData.skills.filter(id => id !== skill.id)
                            : [...formData.skills, skill.id];
                          setFormData({ ...formData, skills: newSkills });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                          formData.skills.includes(skill.id)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
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
                          ? `${formData.screenshots.length} files selected` 
                          : 'Click to upload screenshots'}
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
                  {loading ? 'Publishing...' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddProject;

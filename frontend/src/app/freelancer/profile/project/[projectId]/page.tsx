"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface SkillNode {
  id: string;
  name: string;
  tier: number;
  parentId?: string | null;
  subSkills?: SkillNode[];
}

interface ProjectImage {
  id: string;
  url: string;
}

const ViewEditProject = () => {
  const router = useRouter();
  const { projectId } = useParams();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allSkills, setAllSkills] = useState<SkillNode[]>([]);

  // Dropdown States for Skills Selector
  const [selectedParentId, setSelectedParentId] = useState<string>(''); 
  const [selectedSubId, setSelectedSubId] = useState<string>('');       
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');     
  const [selectedAtomicLeafId, setSelectedAtomicLeafId] = useState<string>(''); 

  // Project Display Data State
  const [projectData, setProjectData] = useState<{
    title: string;
    description: string;
    links: string[];
    completedAt: string;
    images: ProjectImage[];
    skillsUsed: { id: string; name: string; tier: number }[];
    videoUrl?: string | null;
  } | null>(null);

  // Edit Form Fields State
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

  // Fetch project details and general skills data
  const fetchProjectAndTreeData = async () => {
    try {
      const [projectRes, skillsTreeRes] = await Promise.all([
        api.get(`/api/v1/freelancer/project/${projectId}`),
        api.get('/api/v1/skills/tree')
      ]);

      if (projectRes.data.success && skillsTreeRes.data.success) {
        const rawProj = projectRes.data.data;
        const parsedDate = rawProj.completedAt ? new Date(rawProj.completedAt).toISOString().split('T')[0] : '';

        const structuredProject = {
          title: rawProj.title || '',
          description: rawProj.description || '',
          links: Array.isArray(rawProj.links) ? rawProj.links : [],
          completedAt: parsedDate,
          images: rawProj.images || [],
          skillsUsed: rawProj.skillsUsed || [],
          videoUrl: rawProj.videoUrl || null
        };

        setProjectData(structuredProject);
        setAllSkills(skillsTreeRes.data.data);

        setFormData({
          title: structuredProject.title,
          description: structuredProject.description,
          links: structuredProject.links.length > 0 ? structuredProject.links : [''],
          skills: structuredProject.skillsUsed.map((s: any) => s.id),
          completedAt: parsedDate,
          screenshots: [],
        });
        setVideoPreview(rawProj.videoUrl || null);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      alert("Error finding project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectAndTreeData();
  }, [projectId]);

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
    return 'Skill Node';
  };

  const handleAddSkillFromChain = () => {
    const targetId = selectedAtomicLeafId || selectedLeafId || selectedSubId || selectedParentId;
    if (!targetId) return;

    if (!formData.skills.includes(targetId)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, targetId] }));
    }
    setSelectedAtomicLeafId('');
    setSelectedLeafId('');
    setSelectedSubId('');
    setSelectedParentId('');
  };

  const handleRemoveSkillTag = (idToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(id => id !== idToRemove) }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updatePayload = new FormData();
      updatePayload.append('title', formData.title);
      updatePayload.append('description', formData.description);
      
      const cleanLinks = formData.links.filter(url => url.trim() !== '');
      updatePayload.append('links', JSON.stringify(cleanLinks));
      updatePayload.append('completedAt', formData.completedAt);
      updatePayload.append('skills', JSON.stringify(formData.skills));

      formData.screenshots.forEach(file => {
        updatePayload.append('screenshots', file);
      });

      if (videoFile) {
        updatePayload.append('projectVideo', videoFile);
      }

      const res = await api.patch(`/api/v1/freelancer/projects/${projectId}`, updatePayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setIsEditing(false);
        await fetchProjectAndTreeData();
      }
    } catch (err) {
      console.error("Failed to update project:", err);
      alert("Error saving updates.");
    } finally {
      setSubmitting(false);
    }
  };

  const parentSkillOptions = allSkills.find(c => c.id === selectedParentId)?.subSkills || [];
  const subSkillOptions = parentSkillOptions.find(p => p.id === selectedSubId)?.subSkills || [];
  const atomicLeafSkillOptions = subSkillOptions.find(s => s.id === selectedLeafId)?.subSkills || [];

  if (loading) return (
    <DashboardLayout>
      <div className="flex h-[75vh] items-center justify-center text-sm font-medium text-muted-foreground">
        Loading project details...
      </div>
    </DashboardLayout>
  );

  const isFormValid = formData.title.trim().length >= 5 && formData.description.trim().length >= 20 && formData.completedAt;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 pb-20 px-4 sm:px-6">
        <Card className="border shadow-md overflow-hidden">
          
          <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b p-6">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Project Portfolio</CardTitle>
              <CardDescription className="text-xs font-medium">View or modify this project item.</CardDescription>
            </div>
            <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
              <span className="material-symbols-outlined text-sm mr-1">{isEditing ? 'visibility' : 'edit_note'}</span>
              {isEditing ? 'Switch to View' : 'Edit Project Details'}
            </Button>
          </CardHeader>

          <CardContent className="p-8">
            {!isEditing ? (
              
              /* ================= SHOWCASE VIEW ================= */
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{projectData?.title}</h1>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Date of Completion: {projectData?.completedAt ? new Date(projectData.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column: Descriptions, Skills and Photos */}
                  <div className="md:col-span-2 space-y-6">
                    
                    {/* Project Description */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Project Description</h3>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap bg-muted/20 p-5 rounded-xl border">
                        {projectData?.description}
                      </p>
                    </div>

                    {/* FIXED POSITION: Skills Stack moved here for maximum screen space */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Skills & Technologies Used</h3>
                      <div className="flex flex-col gap-2 bg-background p-4 rounded-xl border">
                        {projectData?.skillsUsed && projectData.skillsUsed.length > 0 ? (
                          projectData.skillsUsed.map((skill) => (
                            <div key={skill.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs font-medium shadow-sm w-full min-w-0">
                              <span className="size-1.5 bg-primary rounded-full shrink-0" />
                              <span className="break-all whitespace-normal">{getSkillPathString(skill.id)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No skills linked to this project.</span>
                        )}
                      </div>
                    </div>

                    {/* Project Photos */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Project Photos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectData?.images && projectData.images.length > 0 ? (
                          projectData.images.map((img) => (
                            <div key={img.id} className="border rounded-xl overflow-hidden aspect-video bg-muted group shadow-sm">
                              <img src={img.url} alt="Project Snapshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 py-8 border border-dashed text-center rounded-xl text-xs italic text-muted-foreground">
                            No photos uploaded for this project.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar: Links and Videos */}
                  <div className="space-y-6">
                    
                    {/* Project Links */}
                    <div className="space-y-3 p-5 rounded-xl border bg-muted/10">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Links</h4>
                      <div className="flex flex-col gap-2">
                        {projectData?.links && projectData.links.length > 0 ? (
                          projectData.links.map((link, idx) => (
                            <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 truncate">
                              <span className="material-symbols-outlined text-sm shrink-0">link</span>
                              <span className="truncate">{link}</span>
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No links provided.</span>
                        )}
                      </div>
                    </div>

                    {/* Demo Video */}
                    {projectData?.videoUrl && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Demo Video</h4>
                        <div className="rounded-xl overflow-hidden bg-black aspect-video border shadow-sm">
                          <video src={projectData.videoUrl} controls className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              
              /* ================= EDIT MODE ================= */
              <form onSubmit={handleUpdateSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="editTitle">Project Title</Label>
                  <Input id="editTitle" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="editDesc">Project Description</Label>
                  <Textarea id="editDesc" required rows={6} className="resize-none leading-relaxed" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label>Project Links</Label>
                      <Button type="button" variant="link" onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })} className="h-auto p-0 text-xs font-bold text-primary">+ Add New Link</Button>
                    </div>
                    <div className="space-y-2">
                      {formData.links.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input type="url" value={link} onChange={e => {
                            const updated = [...formData.links];
                            updated[index] = e.target.value;
                            setFormData({ ...formData, links: updated });
                          }} placeholder="https://yourproject.com" />
                          {formData.links.length > 1 && (
                            <Button type="button" variant="destructive" size="icon" onClick={() => setFormData({ ...formData, links: formData.links.filter((_, i) => i !== index) })}>
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="editCompletion">Date of Completion</Label>
                    <Input id="editCompletion" type="date" required value={formData.completedAt} onChange={e => setFormData({ ...formData, completedAt: e.target.value })} />
                  </div>
                </div>

                {/* Edit Skills section */}
                <div className="flex flex-col gap-4 p-5 rounded-xl border bg-muted/30">
                  <div>
                    <Label className="font-bold text-sm">Update Project Skills</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Select a category path below to link skills to your project.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                      <select value={selectedParentId} onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(''); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">-- Category --</option>
                        {allSkills.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Parent Skill</Label>
                      <select value={selectedSubId} disabled={!selectedParentId} onChange={(e) => { setSelectedSubId(e.target.value); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus:outline-none">
                        <option value="">-- Parent --</option>
                        {parentSkillOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sub-Skill</Label>
                      <select value={selectedLeafId} disabled={!selectedSubId} onChange={(e) => { setSelectedLeafId(e.target.value); setSelectedAtomicLeafId(''); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus:outline-none">
                        <option value="">-- Subskill --</option>
                        {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Leaf Node</Label>
                      <div className="flex gap-2">
                        <select value={selectedAtomicLeafId} disabled={!selectedLeafId} onChange={(e) => setSelectedAtomicLeafId(e.target.value)} className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 focus:outline-none">
                          <option value="">-- Leaf --</option>
                          {atomicLeafSkillOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <Button type="button" size="sm" onClick={handleAddSkillFromChain} disabled={!(selectedParentId || selectedSubId || selectedLeafId || selectedAtomicLeafId)} className="h-10 font-bold text-xs">Link</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Linked Skills List ({formData.skills.length})</Label>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                      {formData.skills.map((id) => (
                        <div key={id} className="flex justify-between items-center px-3 py-2 bg-background rounded-lg border text-xs font-medium shadow-sm animate-in fade-in duration-150">
                          <span className="break-all pr-2">{getSkillPathString(id)}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSkillTag(id)} className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0">
                            <span className="material-symbols-outlined text-xs">close</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Project Photos Upload */}
                <div className="flex flex-col gap-3">
                  <Label>Project Photos (Uploading new ones will replace existing photos)</Label>
                  <div className="relative group border-2 border-dashed rounded-xl p-6 bg-muted/10 text-center hover:bg-muted/20 cursor-pointer transition-colors">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                      if (e.target.files) setFormData({ ...formData, screenshots: Array.from(e.target.files) });
                    }} />
                    <span className="material-symbols-outlined text-2xl text-muted-foreground mb-1">upload_file</span>
                    <p className="text-xs font-semibold text-muted-foreground">Click to upload image files ({formData.screenshots.length} selected)</p>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting || !isFormValid} className="min-w-[120px] font-bold">
                    {submitting ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewEditProject;
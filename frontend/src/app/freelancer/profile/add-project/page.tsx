"use client";
import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
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

const AddProject = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [allSkills, setAllSkills] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

  // Strict 4-Tier Filtering Selectors State Elements
  const [selectedParentId, setSelectedParentId] = useState<string>(''); // Tier 1 Category
  const [selectedSubId, setSelectedSubId] = useState<string>('');       // Tier 2 Parent Skill
  const [selectedLeafId, setSelectedLeafId] = useState<string>('');     // Tier 3 Subskill
  const [selectedAtomicLeafId, setSelectedAtomicLeafId] = useState<string>(''); // Tier 4 Leaf Node

  // Form States synced with backend schema contract
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    links: [''],
    skills: [] as string[],
    completedAt: '',
    screenshots: [] as File[],
  });

  // Video Files and recording/camera states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [recordingMode, setRecordingMode] = useState<'upload' | 'camera'>('upload');
  const [cameraState, setCameraState] = useState<'inactive' | 'preview' | 'recording' | 'review'>('inactive');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const router = useRouter();

  // Fetch and filter standard 4-tier skill tree configurations on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          api.get('/api/v1/freelancer/dashboard-stats'),
          api.get('/api/v1/skills/tree')
        ]);

        if (profileRes.data.success && skillsRes.data.success) {
          const profileWrapper = profileRes.data.data;
          const userSkillsList = profileWrapper.profileMetadata?.skillsTree || [];
          const userSkillIds = new Set(userSkillsList.map((s: any) => s.id));
          const fullTree = skillsRes.data.data as SkillNode[];

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

  // Structural resource cleanup hook
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedBlobUrl) URL.revokeObjectURL(recordedBlobUrl);
    };
  }, [recordedBlobUrl]);

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
    return 'Matched Framework Technology';
  };

  // Video utilities configuration mappings
  const getSupportedMimeType = () => {
    if (typeof window === 'undefined') return '';
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4', 'video/quicktime'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraState('preview');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(e => console.log("Stream interrupted", e));
      }
    } catch (err: any) {
      console.error("Camera permissions check failure:", err);
      setCameraError("Could not gain access to camera and audio systems. Check browser permissions.");
      setCameraState('inactive');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setMediaStream(null);
    }
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  const startRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    setRecordingTimer(0);
    const mimeType = getSupportedMimeType();

    try {
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const type = mimeType || 'video/webm';
        const blob = new Blob(chunks, { type });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setCameraState('review');
        stopCamera();
      };

      setMediaRecorder(recorder);
      recorder.start(1000);
      setCameraState('recording');

      timerRef.current = setInterval(() => {
        setRecordingTimer(prev => {
          if (prev >= 120) {
            clearInterval(timerRef.current);
            if (recorder.state !== 'inactive') recorder.stop();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("MediaRecorder capture initialization failed:", err);
      alert("Recording pipeline failure. Use direct file upload methods instead.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  };

  const handleRerecord = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      setRecordedBlobUrl(null);
    }
    setRecordingTimer(0);
    startCamera();
  };

  const handleUseRecordedVideo = async () => {
    if (!recordedBlobUrl) return;
    try {
      const res = await fetch(recordedBlobUrl);
      const blob = await res.blob();
      const mimeType = getSupportedMimeType();
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `project-walkthrough.${ext}`, { type: blob.type || 'video/webm' });
      
      setVideoFile(file);
      setRecordingMode('upload');
      setCameraState('inactive');
    } catch (err) {
      console.error("Blob to File conversion failure:", err);
    }
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  // Process Video Briefing Context using standard multi-part payload formatting
  const handleAnalyzeOrProceed = async () => {
    if (!videoFile) {
      setCurrentStep(2);
      return;
    }

    setIsAnalyzingVideo(true);
    const multiPartForm = new FormData();
    multiPartForm.append("video", videoFile);
    if (formData.title) multiPartForm.append("title", formData.title);

    try {
      const res = await api.post('/api/v1/freelancer/analyze-project-video', multiPartForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const aiPayload = res.data.data || res.data; 
        
        // Match Groq structure properties exactly with clean form content fallbacks
        const targetTitle = aiPayload.projectTitle || aiPayload.title || formData.title;
        const targetDescription = aiPayload.projectOverview || aiPayload.description || formData.description;

        setFormData(prev => ({
          ...prev,
          title: targetTitle,
          description: targetDescription,
        }));

        // Safe Deep Traversal Loop for Skills Array Matrix Ingestion
        if (aiPayload.matchedSkills && Array.isArray(aiPayload.matchedSkills)) {
          const extractedSkillsList: string[] = [];

          const traverseAndCollectIds = (nodes: any) => {
            if (!nodes) return;
            const nodesArray = Array.isArray(nodes) ? nodes : [nodes];
            
            nodesArray.forEach(node => {
              if (node && typeof node === 'object') {
                if (node.id) extractedSkillsList.push(node.id);
                if (node.subSkills) traverseAndCollectIds(node.subSkills);
              }
            });
          };

          traverseAndCollectIds(aiPayload.matchedSkills);
          
          const unifiedSkillIds = Array.from(
            new Set([...formData.skills, ...extractedSkillsList])
          ).filter(Boolean);

          // Auto-hydrate taxonomy dropdown filters based on the first matched skill node
          if (unifiedSkillIds.length > 0) {
            const firstSkillId = unifiedSkillIds[0];
            
            for (const category of allSkills) {
              if (category.id === firstSkillId) {
                setSelectedParentId(category.id);
                break;
              }
              if (category.subSkills) {
                for (const parent of category.subSkills) {
                  if (parent.id === firstSkillId) {
                    setSelectedParentId(category.id);
                    setSelectedSubId(parent.id);
                    break;
                  }
                  if (parent.subSkills) {
                    for (const sub of parent.subSkills) {
                      if (sub.id === firstSkillId) {
                        setSelectedParentId(category.id);
                        setSelectedSubId(parent.id);
                        setSelectedLeafId(sub.id);
                        break;
                      }
                    }
                  }
                }
              }
            }
          }

          setFormData(prev => ({ ...prev, skills: unifiedSkillIds }));
        }
      }
      setCurrentStep(2);
    } catch (err) {
      console.error("Showcase context parser optimization failed:", err);
      alert("AI analysis encountered an error parsing the payload. Proceeding to manual construction mode.");
      setCurrentStep(2);
    } finally {
      setIsAnalyzingVideo(false);
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

      const res = await api.post('/api/v1/freelancer/add-project', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        router.push('/freelancer/profile');
      }
    } catch (err) {
      console.error("Showcase publication structural exception:", err);
      alert("Something went wrong while publishing your showcase item.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 4-Tier UI Select Chain Layer Map Resolvers
  const parentSkillOptions = allSkills.find(c => c.id === selectedParentId)?.subSkills || [];
  const subSkillOptions = parentSkillOptions.find(p => p.id === selectedSubId)?.subSkills || [];
  const atomicLeafSkillOptions = subSkillOptions.find(s => s.id === selectedLeafId)?.subSkills || [];

  const isStep2Valid = formData.title.trim().length >= 5 && formData.description.trim().length >= 20 && formData.completedAt;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 pb-20 px-4 sm:px-6 relative">
        
        {/* Full-screen Loading Overlay for Video Extraction */}
        {isAnalyzingVideo && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
            <div className="bg-background text-foreground p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center mx-4 border animate-in fade-in zoom-in-95 duration-200">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">sync</span>
              <h4 className="text-xl font-bold tracking-tight">Analyzing Demonstration...</h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Extracting technical parameters, design architecture, and layout matching frameworks across taxonomy trees.
              </p>
            </div>
          </div>
        )}

        <Card className="border shadow-md">
          <CardHeader className="pb-6 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">Showcase New Project</CardTitle>
                <CardDescription className="text-sm font-medium mt-1">Publish production benchmarks to amplify project visibility profiles.</CardDescription>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                Step {currentStep} of 2
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-8">

            {/* STEP 1: Context Video / Brief Intake */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <div className="text-sm">
                    <p className="font-bold text-primary">Optional AI Auto-Fill Setup</p>
                    <p className="text-muted-foreground mt-0.5">Upload or record a quick demo walkthrough video. Our models can parse metadata requirements, technical stack configurations, and structural project descriptions automatically.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-bold">Working Base Title (Optional)</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g. Full-stack Analytics Engine Core"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider font-bold">Demonstration / Walkthrough Clip</Label>
                  
                  {videoFile ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-600 bg-emerald-500/10 p-2 rounded-lg border">movie</span>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[280px] sm:max-w-md">{videoFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Staged for showcase mapping</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setVideoFile(null)} className="text-muted-foreground hover:text-destructive">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex rounded-lg bg-muted p-1 border">
                        <button
                          type="button"
                          onClick={() => { setRecordingMode('upload'); stopCamera(); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${recordingMode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">file_upload</span> Upload Clip
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecordingMode('camera'); startCamera(); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${recordingMode === 'camera' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">videocam</span> Capture Camera
                        </button>
                      </div>

                      {recordingMode === 'upload' && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
                        >
                          <input type="file" ref={fileInputRef} accept="video/*" onChange={handleVideoChange} className="hidden" />
                          <span className="material-symbols-outlined text-4xl text-muted-foreground group-hover:text-primary transition-colors mb-2">video_library</span>
                          <p className="text-sm font-semibold">Select or drop project demonstration context clip</p>
                          <p className="text-xs text-muted-foreground mt-1">Acceptable standard media up to 50MB</p>
                        </div>
                      )}

                      {recordingMode === 'camera' && (
                        <div className="border rounded-xl overflow-hidden bg-slate-950 relative aspect-video flex flex-col items-center justify-center shadow-inner">
                          {(cameraState === 'preview' || cameraState === 'recording') && (
                            <video ref={videoPreviewRef} muted playsInline autoPlay className="w-full h-full object-cover scale-x-[-1]" />
                          )}
                          {cameraState === 'review' && recordedBlobUrl && (
                            <video src={recordedBlobUrl} controls playsInline className="w-full h-full object-cover" />
                          )}
                          
                          {cameraState === 'inactive' && cameraError && (
                            <div className="p-6 text-center text-white">
                              <span className="material-symbols-outlined text-4xl text-destructive mb-2">videocam_off</span>
                              <p className="text-xs font-bold text-destructive/90 max-w-xs mx-auto">{cameraError}</p>
                              <Button variant="outline" size="sm" onClick={startCamera} className="mt-4 text-slate-900 bg-white hover:bg-slate-100">Try Enable Camera</Button>
                            </div>
                          )}

                          {cameraState === 'recording' && (
                            <div className="absolute top-4 left-4 bg-destructive text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md animate-pulse">
                              <span className="size-2 bg-white rounded-full"></span> REC {formatTime(recordingTimer)} / 02:00
                            </div>
                          )}

                          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-3">
                            {cameraState === 'preview' && (
                              <Button type="button" onClick={startRecording} className="bg-destructive text-white hover:bg-destructive/90 font-bold text-xs rounded-lg shadow-lg">
                                <span className="material-symbols-outlined text-base mr-1">fiber_manual_record</span> Start Capture
                              </Button>
                            )}
                            {cameraState === 'recording' && (
                              <Button type="button" onClick={stopRecording} className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-lg shadow-lg">
                                <span className="material-symbols-outlined text-base mr-1">stop</span> End & Buffer
                              </Button>
                            )}
                            {cameraState === 'review' && (
                              <div className="flex gap-2 w-full max-w-xs justify-center">
                                <Button type="button" variant="secondary" onClick={handleRerecord} className="flex-1 text-xs">Re-record</Button>
                                <Button type="button" onClick={handleUseRecordedVideo} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold">Use Video</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t flex justify-end">
                  <Button type="button" onClick={handleAnalyzeOrProceed} className="px-8 font-bold shadow-md">
                    {videoFile ? 'Analyze & Continue' : 'Skip & Setup Manually'} 
                    <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Detail Hydration, Taxonomy Selectors & Media Attachments */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="projectTitle">Project Showcase Title</Label>
                  <Input
                    id="projectTitle"
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g. Distributed Ledger Infrastructure Setup"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="projectDescription">Architectural / Deliverables Summary</Label>
                  <Textarea
                    id="projectDescription"
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[140px] resize-none leading-relaxed"
                    placeholder="Detail the problem space, framework design paradigms, scaling metrics, and structural stack nodes utilized..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label>Live Production Anchors (Optional)</Label>
                      <Button 
                        type="button" 
                        variant="link"
                        onClick={() => setFormData({ ...formData, links: [...formData.links, ''] })}
                        className="h-auto p-0 text-xs font-bold text-primary"
                      >
                        + Add Deploy URL
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.links.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="url"
                            value={link}
                            onChange={e => {
                              const newLinks = [...formData.links];
                              newLinks[index] = e.target.value;
                              setFormData({ ...formData, links: newLinks });
                            }}
                            placeholder="https://github.com/profile/repo"
                          />
                          {formData.links.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const newLinks = formData.links.filter((_, i) => i !== index);
                                setFormData({ ...formData, links: newLinks });
                              }}
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="completedAt">Milestone Completion Boundary</Label>
                    <Input
                      id="completedAt"
                      type="date"
                      required
                      value={formData.completedAt}
                      onChange={e => setFormData({ ...formData, completedAt: e.target.value })}
                    />
                  </div>
                </div>

                {/* 4-Tier Hierarchical Skill Tree Selector Layout */}
                <div className="flex flex-col gap-4 p-5 rounded-xl border bg-muted/30">
                  <div>
                    <Label className="font-bold text-sm">Relational Skills Taxonomy Matrix</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Isolate systemic leaf definitions to link backend verification nodes.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                      <select 
                        value={selectedParentId} 
                        onChange={(e) => { setSelectedParentId(e.target.value); setSelectedSubId(''); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">-- Category --</option>
                        {allSkills.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Parent Skill</Label>
                      <select 
                        value={selectedSubId} 
                        disabled={!selectedParentId}
                        onChange={(e) => { setSelectedSubId(e.target.value); setSelectedLeafId(''); setSelectedAtomicLeafId(''); }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                      >
                        <option value="">-- Parent --</option>
                        {parentSkillOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sub-Skill</Label>
                      <select 
                        value={selectedLeafId} 
                        disabled={!selectedSubId}
                        onChange={(e) => { setSelectedLeafId(e.target.value); setSelectedAtomicLeafId(''); }}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                      >
                        <option value="">-- Subskill --</option>
                        {subSkillOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Leaf Nodes</Label>
                      <div className="flex gap-2">
                        <select 
                          value={selectedAtomicLeafId} 
                          disabled={!selectedLeafId}
                          onChange={(e) => setSelectedAtomicLeafId(e.target.value)}
                          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                        >
                          <option value="">-- Leaf node --</option>
                          {atomicLeafSkillOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddSkillFromChain}
                          disabled={!(selectedParentId || selectedSubId || selectedLeafId || selectedAtomicLeafId)}
                          className="h-9 px-4 font-bold text-xs"
                        >
                          Link
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-1" />
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Active Demonstration Stack ({formData.skills.length})</Label>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {formData.skills.map((id) => (
                        <div key={id} className="flex justify-between items-center px-3 py-2 bg-background rounded-lg border shadow-sm animate-in fade-in duration-150">
                          <span className="text-xs font-medium">{getSkillPathString(id)}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveSkillTag(id)} 
                            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </Button>
                        </div>
                      ))}
                      {formData.skills.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No skills linked to showcase timeline parameters.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Staged Screenshots File Drop-zone Wrapper */}
                <div className="flex flex-col gap-3">
                  <Label>Production Interface Snapshots (Max 6)</Label>
                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files) {
                          setFormData(prev => ({ ...prev, screenshots: Array.from(e.target.files!).slice(0, 6) }));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl border-2 border-dashed group-hover:border-primary/50 transition-colors text-center">
                      <span className="material-symbols-outlined text-3xl text-muted-foreground mb-2">add_photo_alternate</span>
                      <p className="text-xs font-medium text-muted-foreground">
                        {formData.screenshots.length > 0 
                          ? `${formData.screenshots.length} interface captures successfully locked in` 
                          : 'Select platform user-interface layout mockups'}
                      </p>
                    </div>
                  </div>
                  {formData.screenshots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                      {formData.screenshots.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded-lg border text-[11px] font-medium">
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, idx) => idx !== i) }))} 
                            className="text-destructive font-bold hover:underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Navigation Controllers */}
                <div className="flex justify-end gap-4 pt-6 border-t mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 font-bold"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !isStep2Valid}
                    className="px-8 font-bold min-w-[140px]"
                  >
                    {loading ? 'Publishing...' : 'Publish Showcase'}
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

export default AddProject;
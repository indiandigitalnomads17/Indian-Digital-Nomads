"use client";
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Stepper from '../../../components/common/Stepper';
import RadiusMap from '../../../components/common/RadiusMap';
import { Button } from '@/components/base/buttons/button';
import api from '@/lib/api';

interface Skill {
  id?: string;
  name: string;
  tier: number;
  subSkills?: Skill[];
}

const PostGig = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [budget, setBudget] = useState(5000); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  // Media Files References
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Skill Tree Matrix States
  const [skillTree, setSkillTree] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{id: string, name: string}[]>([]);
  const [suggestedNewSkills, setSuggestedNewSkills] = useState<Skill[]>([]);
  
  // 4-Tier Interactive State Management
  const [activeCategory, setActiveCategory] = useState<Skill | null>(null);       // Tier 1
  const [activeParentSkill, setActiveParentSkill] = useState<Skill | null>(null); // Tier 2
  const [activeSubcategory, setActiveSubcategory] = useState<Skill | null>(null); // Tier 3

  // Form States
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "FIXED_PRICE",
    estimatedHours: "",
    location: "",
    videoUrl: "" 
  });

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Video recording/camera states
  const [recordingMode, setRecordingMode] = useState<'upload' | 'camera'>('upload');
  const [cameraState, setCameraState] = useState<'inactive' | 'preview' | 'recording' | 'review'>('inactive');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Fetch standard 4-tier skill tree configuration on mount
  useEffect(() => {
    api.get('/api/v1/skills/tree')
      .then(res => {
        if (res.data?.success) {
          setSkillTree(res.data.data);
          if (res.data.data.length > 0) setActiveCategory(res.data.data[0]);
        }
      })
      .catch(err => console.error("Failed to load skills tree matrix:", err));
  }, []);

  // Cleanup effect for camera and recorded URLs
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
    };
  }, [recordedBlobUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Video recording utilities
  const getSupportedMimeType = () => {
    if (typeof window === 'undefined') return '';
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      'video/quicktime'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
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
        videoPreviewRef.current.play().catch(e => console.log("Play interrupted", e));
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? "Permission to access camera/microphone was denied. Please review browser permission settings." 
          : "Could not access camera/microphone. Please verify that the device is connected and not in use."
      );
      setCameraState('inactive');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setMediaStream(null);
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
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
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
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
          if (prev >= 120) { // Limit to 2 minutes
            clearInterval(timerRef.current);
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Failed to initialize video recording. Please upload a file instead.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
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
      
      const file = new File([blob], `recorded-brief.${ext}`, { type: blob.type || 'video/webm' });
      setVideoFile(file);
      
      setRecordingMode('upload');
      setCameraState('inactive');
      
    } catch (err) {
      console.error("Failed to prepare video file:", err);
      alert("Failed to process recorded video.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Processes the uploaded video file to extract project requirements 
   * and auto-populate step 2 fields based on 4-tier structural output.
   */
  const handleAnalyzeVideoBrief = async () => {
    if (!videoFile) return;

    setIsAnalyzingVideo(true);
    const multiPartForm = new FormData();
    multiPartForm.append("video", videoFile);
    multiPartForm.append("title", formData.title);

    try {
      const res = await api.post('/api/v1/client/analyze-video', multiPartForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const aiPayload = res.data.data;
        
        setFormData(prev => ({
          ...prev,
          title: aiPayload.title || prev.title,
          description: aiPayload.description || prev.description,
          videoUrl: aiPayload.videoUrl || ""
        }));

        if (aiPayload.suggestedNewSkills) setSuggestedNewSkills(aiPayload.suggestedNewSkills);

        if (aiPayload.matchedSkills) {
          const extractedLeafNodes: { id: string; name: string }[] = [];
          
          const traverseAndCollectLeaves = (nodes: Skill[]) => {
            nodes.forEach(node => {
              if (node.tier === 4 && node.id) {
                extractedLeafNodes.push({ id: node.id, name: node.name });
              }
              if (node.subSkills && node.subSkills.length > 0) {
                traverseAndCollectLeaves(node.subSkills);
              }
            });
          };
          
          traverseAndCollectLeaves(aiPayload.matchedSkills);
          setSelectedSkills(extractedLeafNodes);
        }

        setCurrentStep(2);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to analyze video brief. Proceeding to manual setup mode.");
      setCurrentStep(2);
    } finally {
      setIsAnalyzingVideo(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStep1Valid = formData.title.length >= 5 && videoFile !== null;
  const isStep2Valid = formData.title.length >= 10 && formData.description.length >= 25 && selectedSkills.length > 0 && formData.location.trim().length > 0;

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
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
    const finalPostPayload = new FormData();

    finalPostPayload.append("title", formData.title);
    finalPostPayload.append("description", formData.description);
    finalPostPayload.append("type", formData.type);
    finalPostPayload.append("budget", String(budget));
    
    if (formData.estimatedHours) {
      finalPostPayload.append("estimatedHours", formData.estimatedHours);
    }
    
    finalPostPayload.append("location", formData.location);

    if (coordinates) {
      finalPostPayload.append("latitude", String(coordinates.lat));
      finalPostPayload.append("longitude", String(coordinates.lng));
    }

    selectedSkills.forEach(skill => {
      finalPostPayload.append("skills[]", skill.id);
    });

    imageFiles.forEach(file => {
      finalPostPayload.append("jobImages", file);
    });

    if (videoFile) {
      finalPostPayload.append("briefVideo", videoFile);
    } else if (formData.videoUrl) {
      finalPostPayload.append("videoUrl", formData.videoUrl);
    }

    try {
      await api.post('/api/v1/client/create', finalPostPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      nextStep(); 
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit gig details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-center w-full max-w-6xl mx-auto gap-12 px-4 relative">
        
        {isAnalyzingVideo && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
            <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center mx-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">sync</span>
              <h4 className="text-xl font-bold tracking-tight">Analyzing Video Brief...</h4>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Extracting requirements and matching system skills across 4 relational tree depths to build your job template.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center w-full max-w-2xl">
          <Stepper currentStep={currentStep} />

          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
              
              {/* STEP 1: Title & Video Briefing Input */}
              {currentStep === 1 && (
                <>
                  <header className="mb-8">
                    <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Gig Briefing</h3>
                    <p className="text-slate-500">Provide a baseline working title and record or upload your requirements video clip to auto-fill configurations.</p>
                  </header>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Working Project Title</label>
                      <input 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. E-commerce Dashboard Overhaul"
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Video Briefing Clip</label>
                      
                      {videoFile ? (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-250">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-100/50 p-2 rounded-lg border border-emerald-200">movie</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate max-w-[200px] md:max-w-[320px]">
                                {videoFile.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideoFile(null)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Selector Tab */}
                          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/50">
                            <button
                              type="button"
                              onClick={() => {
                                setRecordingMode('upload');
                                stopCamera();
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                recordingMode === 'upload'
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">file_upload</span>
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRecordingMode('camera');
                                startCamera();
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                                recordingMode === 'camera'
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">videocam</span>
                              Record with Camera
                            </button>
                          </div>

                          {/* File upload input */}
                          {recordingMode === 'upload' && (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-outline-variant/60 rounded-xl p-8 text-center bg-surface-container-low hover:bg-surface-container/40 transition-all cursor-pointer group"
                            >
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                accept="video/*" 
                                onChange={handleVideoChange} 
                                className="hidden"
                              />
                              <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary transition-colors mb-2">movie_creation</span>
                              <p className="text-sm font-semibold text-slate-600">Select or drag requirements presentation clip</p>
                              <p className="text-xs text-slate-400 mt-1">Accepts standard video containers up to 50MB</p>
                            </div>
                          )}

                          {/* Camera Recording View */}
                          {recordingMode === 'camera' && (
                            <div className="border border-outline-variant/60 rounded-xl overflow-hidden bg-slate-950 relative aspect-video flex flex-col items-center justify-center shadow-inner">
                              
                              {/* Live camera video or playback */}
                              {(cameraState === 'preview' || cameraState === 'recording') && (
                                <video
                                  ref={videoPreviewRef}
                                  muted
                                  playsInline
                                  autoPlay
                                  className="w-full h-full object-cover scale-x-[-1]"
                                />
                              )}

                              {cameraState === 'review' && recordedBlobUrl && (
                                <video
                                  src={recordedBlobUrl}
                                  controls
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              )}

                              {/* Camera Error Display */}
                              {cameraState === 'inactive' && cameraError && (
                                <div className="p-6 text-center text-white">
                                  <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">videocam_off</span>
                                  <p className="text-xs font-bold text-rose-400 max-w-xs mx-auto leading-relaxed">{cameraError}</p>
                                  <Button
                                    color="secondary"
                                    size="sm"
                                    onClick={startCamera}
                                    className="mt-4 text-white bg-slate-800 hover:bg-slate-700"
                                  >
                                    Try Enable Camera
                                  </Button>
                                </div>
                              )}

                              {/* Camera HUD Indicator */}
                              {cameraState === 'recording' && (
                                <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md animate-pulse">
                                  <span className="size-2 bg-white rounded-full"></span>
                                  REC {formatTime(recordingTimer)} / 02:00
                                </div>
                              )}

                              {cameraState === 'preview' && (
                                <div className="absolute top-4 left-4 bg-slate-950/90 text-white text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md">
                                  <span className="size-2 bg-emerald-500 rounded-full animate-ping"></span>
                                  Camera Ready
                                </div>
                              )}

                              {/* Controllers */}
                              {cameraState !== 'inactive' && (
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-center justify-center gap-3">
                                  {cameraState === 'preview' && (
                                    <button
                                      type="button"
                                      onClick={startRecording}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all scale-100 hover:scale-[1.02]"
                                    >
                                      <span className="material-symbols-outlined text-base">fiber_manual_record</span>
                                      Start Recording
                                    </button>
                                  )}

                                  {cameraState === 'recording' && (
                                    <button
                                      type="button"
                                      onClick={stopRecording}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-lg transition-all scale-100 hover:scale-[1.02]"
                                    >
                                      <span className="material-symbols-outlined text-base">stop</span>
                                      Stop & Save
                                    </button>
                                  )}

                                  {cameraState === 'review' && (
                                    <div className="flex gap-2 w-full max-w-sm justify-center">
                                      <button
                                        type="button"
                                        onClick={handleRerecord}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
                                      >
                                        <span className="material-symbols-outlined text-base">refresh</span>
                                        Re-record
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleUseRecordedVideo}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                                      >
                                        <span className="material-symbols-outlined text-base">check</span>
                                        Use Video
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 flex justify-end">
                      <Button color="primary" size="xl" onClick={handleAnalyzeVideoBrief} isDisabled={!isStep1Valid} className="px-8 rounded-xl font-extrabold shadow-lg hover:scale-[1.02] transition-all">
                        Continue <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: Autofilled Review Page */}
              {currentStep === 2 && (
                <>
                  <header className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span> Suggested Details Generated
                      </span>
                    </div>
                    <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-1">Review Specifications</h3>
                    <p className="text-slate-500">Confirm or modify your project variables, locations, constraints, and dependencies before broadcasting.</p>
                  </header>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Refined Job Title</label>
                      <input 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Scope Deliverables</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Payment Type</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary outline-none">
                          <option value="FIXED_PRICE">Fixed Price</option>
                          <option value="HOURLY">Hourly Engagement</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Est. Delivery Hours</label>
                        <input type="number" name="estimatedHours" value={formData.estimatedHours} onChange={handleInputChange} placeholder="e.g. 40" className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface border border-outline-variant/30 focus:border-primary outline-none" />
                      </div>
                    </div>

                    <div className="space-y-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Estimated Budget</label>
                        <span className="text-sm font-extrabold text-primary bg-primary/5 px-3 py-1 rounded-md border border-primary/10">₹{budget.toLocaleString('en-IN')}</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="100000" 
                        step="500"
                        value={budget} 
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Min: ₹500</span>
                        <span>Max: ₹1,0,000+</span>
                      </div>
                    </div>

                    <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                      <div className="flex justify-between items-end">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Target Location</label>
                        <button type="button" onClick={detectLocation} disabled={detecting} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                          <span className={`material-symbols-outlined text-[14px] ${detecting ? 'animate-spin' : ''}`}>{detecting ? 'sync' : 'my_location'}</span>
                          Detect Location
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">location_on</span>
                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Type or locate target region..." className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-semibold border border-outline-variant/30 focus:border-primary outline-none" />
                      </div>

                      {formData.location && <RadiusMap radiusText="Local Talent Coverage Area" locationName={formData.location} />}
                    </div>

                    {/* Skill taxonomy panel */}
                    <div className="space-y-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Required Skills Matrix</label>
                        <p className="text-[10px] text-slate-400 mt-0.5">Select a Category $\rightarrow$ Parent Skill $\rightarrow$ Subskill to toggle specific Leaf skills.</p>
                      </div>
                      
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-3 bg-white rounded-xl border border-outline-variant/20 shadow-inner">
                          {selectedSkills.map(skill => (
                            <span key={skill.id} className="bg-primary text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium shadow-sm">
                              {skill.name}
                              <button type="button" onClick={() => setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))}>
                                <span className="material-symbols-outlined text-[12px] flex items-center justify-center">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {suggestedNewSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {suggestedNewSkills.map((ns, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-800 text-[10px] px-2.5 py-1 rounded-md font-bold border border-amber-200/60">
                              ✨ Suggested: {ns.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 pt-2 border-t border-dashed">
                        {/* Tier 1 Categories */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                          {skillTree.map(cat => (
                            <button 
                              key={cat.id} 
                              type="button"
                              onClick={() => { setActiveCategory(cat); setActiveParentSkill(null); setActiveSubcategory(null); }}
                              className={`px-3 py-2 text-left text-xs font-semibold rounded-xl border transition-all truncate ${activeCategory?.id === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-outline-variant/20 hover:bg-slate-50'}`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>

                        {/* Tier 2 Parent Skills */}
                        {activeCategory?.subSkills && activeCategory.subSkills.length > 0 && (
                          <div className="pl-2 border-l-2 border-slate-900/30 grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                            {activeCategory.subSkills.map(parentSkill => (
                              <button 
                                key={parentSkill.id}
                                type="button"
                                onClick={() => { setActiveParentSkill(parentSkill); setActiveSubcategory(null); }}
                                className={`px-2.5 py-1.5 text-left text-xs font-semibold rounded-xl border transition-all truncate ${activeParentSkill?.id === parentSkill.id ? 'bg-secondary text-white border-secondary' : 'bg-slate-50 text-slate-600 border-outline-variant/10 hover:bg-slate-100'}`}
                              >
                                {parentSkill.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Tier 3 Sub-Categories */}
                        {activeParentSkill?.subSkills && activeParentSkill.subSkills.length > 0 && (
                          <div className="pl-4 border-l-2 border-secondary/30 grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200">
                            {activeParentSkill.subSkills.map(sub => (
                              <button 
                                key={sub.id}
                                type="button"
                                onClick={() => setActiveSubcategory(sub)}
                                className={`px-2.5 py-1.5 text-left text-xs rounded-lg border font-medium truncate ${activeSubcategory?.id === sub.id ? 'bg-secondary-container text-on-secondary-container border-secondary/40' : 'bg-white text-slate-500'}`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Tier 4 Leaf Nodes */}
                        {activeSubcategory?.subSkills && activeSubcategory.subSkills.length > 0 && (
                          <div className="pl-6 border-l-2 border-primary/30 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
                            {activeSubcategory.subSkills.map(leaf => {
                              const isSelected = selectedSkills.some(s => s.id === leaf.id);
                              return (
                                <button 
                                  key={leaf.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedSkills(prev => prev.filter(s => s.id !== leaf.id));
                                    } else if (leaf.id) {
                                      setSelectedSkills(prev => [...prev, { id: leaf.id!, name: leaf.name }]);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                >
                                  {isSelected && "✓ "} {leaf.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">Supplementary Mockups / Images (Optional)</label>
                      <div className="flex items-center gap-4">
                        <Button type="button" color="secondary" size="sm" onClick={() => imageInputRef.current?.click()}>
                          <span className="material-symbols-outlined text-sm mr-1">file_upload</span> Attach Images
                        </Button>
                        <span className="text-xs text-slate-400">{imageFiles.length} files selected</span>
                        <input type="file" multiple ref={imageInputRef} accept="image/*" onChange={handleImagesChange} className="hidden" />
                      </div>
                      
                      {imageFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {imageFiles.map((file, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border text-xs">
                              <span className="truncate max-w-[150px]">{file.name}</span>
                              <button type="button" onClick={() => removeImageFile(i)} className="text-red-500 hover:underline ml-2">Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 flex justify-between gap-4">
                      <Button color="tertiary" size="xl" onClick={prevStep} className="px-8 bg-slate-100 text-slate-700 font-bold rounded-xl font-headline uppercase tracking-wider">Back</Button>
                      <Button color="primary" size="xl" onClick={handlePostGig} isLoading={isSubmitting} isDisabled={!isStep2Valid} className="flex-1 bg-gradient-to-br from-primary to-primary-container text-white font-extrabold rounded-xl shadow-lg">
                        Publish Gig <span className="material-symbols-outlined text-lg ml-1">rocket_launch</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3: Escrow Checkout Cover */}
              {currentStep === 3 && (
                <>
                  <header className="mb-6 text-center">
                    <span className="material-symbols-outlined text-6xl text-emerald-500 animate-bounce mb-2">check_circle</span>
                    <h3 className="text-3xl font-extrabold font-headline text-on-surface">Milestone Saved!</h3>
                    <p className="text-slate-500 mt-1">Your contract parameters have been created successfully. Fund the escrow allocation to activate discovery pipelines.</p>
                  </header>
                  
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60 my-6 space-y-4 shadow-sm">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-slate-500">Contract Deliverable Value</span>
                      <strong className="text-slate-800">₹{budget.toLocaleString('en-IN')}.00</strong>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-slate-500">Platform Processing Fee (0%)</span>
                      <strong className="text-emerald-600">FREE</strong>
                    </div>
                    <div className="flex justify-between text-base pt-1 font-extrabold">
                      <span className="text-slate-800">Total Escrow Protection Cover</span>
                      <span className="text-primary">₹{budget.toLocaleString('en-IN')}.00</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 opacity-80 select-none relative shadow-sm">
                    <div className="absolute inset-0 bg-slate-100/30 backdrop-blur-[0.5px] rounded-xl flex items-center justify-center z-10">
                      <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-md shadow-md tracking-widest uppercase">DEMO MODE CHECKOUT</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Card Holder Name</label>
                      <input disabled placeholder="John Doe" className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Card Details</label>
                      <input disabled placeholder="4242 •••• •••• 4242" className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs" />
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <Button color="primary" size="xl" onClick={() => alert("Escrow simulation complete. Discovery pipeline active!")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition-all">
                      Authorize Escrow Cover (₹{budget.toLocaleString('en-IN')})
                    </Button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

        <div className="hidden lg:block w-72 shrink-0 pt-24 space-y-4">
          <ProTipCard text="Analyzing the uploaded project context automatically structures the workspace fields to match platform classifications." />
          <GigSummaryCard 
            title={formData.title || "Awaiting inputs..."} 
            skills={selectedSkills.map(s => s.name).join(", ") || "No skills mapped"} 
            tier={`₹${budget.toLocaleString('en-IN')} Allocation`} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

const ProTipCard = ({ text }: { text: string }) => (
  <div className="p-5 bg-secondary-container/20 rounded-2xl border border-secondary/10">
    <h4 className="font-headline font-bold text-secondary flex items-center gap-2 mb-2"><span className="material-symbols-outlined">lightbulb</span> Pro Tip</h4>
    <p className="text-xs leading-relaxed text-on-secondary-container">{text}</p>
  </div>
);

const GigSummaryCard = ({ title, skills, tier }: { title: string; skills: string; tier: string }) => (
  <div className="p-5 bg-surface-container-high rounded-2xl border border-primary/5 shadow-sm">
    <h4 className="font-headline font-bold text-primary mb-3">Gig Summary</h4>
    <div className="space-y-3">
      <SummaryRow label="Title" value={title} />
      <SummaryRow label="Skills" value={skills} />
      <hr className="border-outline-variant/20"/>
      <SummaryRow label="Budget" value={tier} isSecondary />
    </div>
  </div>
);

const SummaryRow = ({ label, value, isSecondary }: { label: any; value: any; isSecondary?: any }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
    <span className={`text-xs font-semibold truncate ml-2 max-w-[140px] text-right ${isSecondary ? 'text-secondary' : 'text-slate-700'}`}>{value}</span>
  </div>
);

export default PostGig;
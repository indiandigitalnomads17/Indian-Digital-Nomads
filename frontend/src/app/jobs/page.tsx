"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // FIXED: Added missing Input component import
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SkillNode {
  id: string;
  name: string;
  tier: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  type: 'FIXED_PRICE' | 'HOURLY';
  budget: number | string;
  estimatedHours: number | null;
  location: string;
  distanceAwayKm: number | null;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    isVerified: boolean;
    nomadScore: number;
    profilePicLink: string | null;
  };
  jobTaxonomy: {
    categories: string[];
    parentSkills: string[];
    subSkills: string[];
    specializations: string[];
  };
}

export default function BrowseJobs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSkillParam = searchParams.get('skill') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [flatSkillsList, setFlatSkillsList] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [skill, setSkill] = useState(urlSkillParam);
  const [type, setType] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState('11');
  const [geoActive, setGeoActive] = useState(false);

  const flattenSkillTreeNodes = (nodes: any[]): SkillNode[] => {
    let result: SkillNode[] = [];
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, tier: node.tier });
      if (node.subSkills && node.subSkills.length > 0) {
        result = result.concat(flattenSkillTreeNodes(node.subSkills));
      }
    });
    return result;
  };

  useEffect(() => {
    api.get("/api/v1/skills/tree")
      .then((res) => {
        if (res.data?.success) {
          setFlatSkillsList(flattenSkillTreeNodes(res.data.data));
        }
      })
      .catch((err) => console.error("Taxonomy synchronization error:", err));
  }, []);

  useEffect(() => {
    setSkill(urlSkillParam);
  }, [urlSkillParam]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const queries = new URLSearchParams();
      if (skill) queries.append('skill', skill);
      if (type) queries.append('type', type);
      if (maxBudget) queries.append('maxBudget', maxBudget);

      if (geoActive && latitude && longitude) {
        queries.append('latitude', String(latitude));
        queries.append('longitude', String(longitude));
        queries.append('radius', radius);
      }

      const res = await api.get(`/api/v1/public/getPublicJobs?${queries.toString()}`);
      if (res.data?.success || res.data?.data) {
        setJobs(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load open marketplace requirements:", err);
    } finally {
      setLoading(false);
    }
  }, [skill, type, maxBudget, geoActive, latitude, longitude, radius]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleProximityGeo = () => {
    if (!geoActive) {
      if (!navigator.geolocation) {
        alert("Browser lacks location coordination modules.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGeoActive(true);
        },
        () => alert("Location capture denied.")
      );
    } else {
      setGeoActive(false);
      setLatitude(null);
      setLongitude(null);
    }
  };

  const clearFormFilters = () => {
    setSkill('');
    setType('');
    setMaxBudget('');
    setGeoActive(false);
    setLatitude(null);
    setLongitude(null);
    router.push('/jobs');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore Open Contracts</h1>
          <p className="text-muted-foreground mt-1 text-sm">Apply to open requests posted directly across localized digital networks.</p>
        </header>

        {/* TOP FILTER BAR */}
        <Card className="p-6 border shadow-sm bg-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">filter_alt</span> Filter Pipelines
            </h3>
            <button type="button" onClick={clearFormFilters} className="text-xs text-primary font-semibold hover:underline">Reset</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Required Technology</Label>
              <select 
                value={skill} 
                onChange={e => setSkill(e.target.value)}
                className="w-full border rounded-md px-2 h-9 bg-background text-xs outline-none focus:border-slate-400"
              >
                <option value="">All Requirements</option>
                {flatSkillsList.map(node => (
                  <option key={node.id} value={node.name}>{node.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Budget Type</Label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-md px-2 h-9 bg-background text-xs outline-none">
                <option value="">All Arrangements</option>
                <option value="FIXED_PRICE">Fixed Price Models</option>
                <option value="HOURLY">Hourly Milestones</option>
              </select>
            </div>

            {/* FIXED: Explicitly typed event parameters to resolve 'any' issues */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Max Budget Limit (₹)</Label>
              <Input type="number" value={maxBudget} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxBudget(e.target.value)} placeholder="Max Limit Cap" className="bg-background h-9 text-xs" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200/60">
            <Button 
              type="button" 
              variant={geoActive ? "default" : "outline"} 
              onClick={toggleProximityGeo}
              className="h-8 text-xs font-bold gap-2 px-4"
            >
              <span className="material-symbols-outlined text-sm">distance</span>
              {geoActive ? "Proximity Radius Active" : "Find Near Contracts"}
            </Button>

            {geoActive && (
              <div className="flex items-center gap-3 bg-background border px-3 py-1 rounded-lg animate-in fade-in duration-150">
                <Label className="text-xs font-bold shrink-0">Distance Limit: {radius}km</Label>
                <input type="range" min="5" max="100" step="5" value={radius} onChange={e => setRadius(e.target.value)} className="w-28 sm:w-40 accent-primary" />
              </div>
            )}
          </div>
        </Card>

        {/* VERTICAL LISTINGS CONTAINER */}
        <div className="space-y-4 w-full">
          {loading ? (
            <div className="py-24 text-center text-sm font-medium text-muted-foreground">Indexing open opportunities...</div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow w-full">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                    
                    <div className="flex-1 space-y-3 min-w-0 w-full">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-black text-foreground tracking-tight truncate">{job.title}</h2>
                          <Badge variant={job.type === "HOURLY" ? "secondary" : "default"} className="text-[10px] font-bold px-2 py-0.5 shrink-0">
                            {job.type === "HOURLY" ? "Hourly Contract" : "Fixed Arrangement"}
                          </Badge>
                          {job.distanceAwayKm !== null && (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                              📍 Local: {job.distanceAwayKm} km away
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          Posted {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {job.location || "Remote Scope"}
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed pr-2">
                        {job.description}
                      </p>

                      {job.jobTaxonomy && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {[
                            ...(job.jobTaxonomy.specializations || []),
                            ...(job.jobTaxonomy.subSkills || []),
                            ...(job.jobTaxonomy.parentSkills || [])
                          ].slice(0, 5).map((sk, sIdx) => (
                            <span key={sIdx} className="bg-muted px-2.5 py-0.5 rounded text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      <Separator className="my-2" />

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="size-5 border">
                          <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">
                            {job.client.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>Posted by <strong className="text-foreground">{job.client.fullName}</strong></span>
                        <span className="text-[11px] px-1.5 py-0.25 bg-muted rounded font-bold shrink-0">Trust Score: {job.client.nomadScore}</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end shrink-0 gap-4 md:min-w-[160px]">
                      <div className="space-y-1 text-left md:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Contract Allocation</span>
                        <span className="text-2xl font-black text-foreground block">₹{Number(job.budget).toLocaleString()}</span>
                        {job.type === "HOURLY" && job.estimatedHours && (
                          <span className="text-xs text-muted-foreground font-semibold block">Est: {job.estimatedHours} Hours</span>
                        )}
                      </div>

                      <Button onClick={() => router.push(`/jobs/${job.id}`)} className="font-bold text-xs shrink-0 px-4" size="sm">
                        View Proposal Specs
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl font-medium text-muted-foreground bg-background">
              No active job requests found matching this search configuration path.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
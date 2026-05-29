"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // FIXED: Added missing Input component import
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SkillNode {
  id: string;
  name: string;
  tier: number;
}

interface Freelancer {
  id: string;
  fullName: string;
  isVerified: boolean;
  nomadScore: number;
  distanceAwayKm: number | null;
  profile: {
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    location: string | null;
    hourlyRate: number | string | null;
    isHourly: boolean;
    preferredJobType: 'FIXED_PRICE' | 'HOURLY';
    groupedSkills: {
      categories: string[];
      parentSkills: string[];
      subSkills: string[];
      specializations: string[];
    };
  } | null;
  metrics: {
    averageRating: number;
    totalReviews: number;
  };
}

export default function BrowseTalent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSkillParam = searchParams.get('skill') || '';

  const [talents, setTalents] = useState<Freelancer[]>([]);
  const [flatSkillsList, setFlatSkillsList] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [skill, setSkill] = useState(urlSkillParam);
  const [location, setLocation] = useState('');
  const [minNomadScore, setMinNomadScore] = useState('');
  const [maxHourlyRate, setMaxHourlyRate] = useState('');
  const [preferredJobType, setPreferredJobType] = useState('');
  const [minRating, setMinRating] = useState('');

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

  const fetchTalents = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (skill) queryParams.append('skill', skill);
      if (location) queryParams.append('location', location);
      if (minNomadScore) queryParams.append('minNomadScore', minNomadScore);
      if (maxHourlyRate) queryParams.append('maxHourlyRate', maxHourlyRate);
      if (preferredJobType) queryParams.append('preferredJobType', preferredJobType);
      if (minRating) queryParams.append('minRating', minRating);
      
      if (geoActive && latitude && longitude) {
        queryParams.append('latitude', String(latitude));
        queryParams.append('longitude', String(longitude));
        queryParams.append('radius', radius);
      }

      const res = await api.get(`/api/v1/public/getPublicFreelancers?${queryParams.toString()}`);
      if (res.data?.success || res.data?.data) {
        setTalents(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading freelancer repository data:", err);
    } finally {
      setLoading(false);
    }
  }, [skill, location, minNomadScore, maxHourlyRate, preferredJobType, minRating, geoActive, latitude, longitude, radius]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  const toggleLocalRadius = () => {
    if (!geoActive) {
      if (!navigator.geolocation) {
        alert("Your web browser does not support location tracking.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGeoActive(true);
        },
        () => alert("Location permission denied.")
      );
    } else {
      setGeoActive(false);
      setLatitude(null);
      setLongitude(null);
    }
  };

  const clearFilters = () => {
    setSkill('');
    setLocation('');
    setMinNomadScore('');
    setMaxHourlyRate('');
    setPreferredJobType('');
    setMinRating('');
    setGeoActive(false);
    setLatitude(null);
    setLongitude(null);
    router.push('/talent');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Browse Professional Talent</h1>
          <p className="text-muted-foreground mt-1 text-sm">Find verified freelancers across structural framework networks instantly.</p>
        </header>

        {/* TOP FILTER BAR */}
        <Card className="p-6 border shadow-sm bg-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">tune</span> Search Filters
            </h3>
            <button type="button" onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline">Clear All</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">System Skill</Label>
              <select 
                value={skill} 
                onChange={e => setSkill(e.target.value)}
                className="w-full border rounded-md px-2 h-9 bg-background text-xs outline-none focus:border-slate-400"
              >
                <option value="">All Expertise</option>
                {flatSkillsList.map(node => (
                  <option key={node.id} value={node.name}>{node.name}</option>
                ))}
              </select>
            </div>

            {/* FIXED: Explicitly typed event parameters to resolve 'any' issues */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Location</Label>
              <Input value={location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} placeholder="e.g. Delhi" className="bg-background h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Min Score</Label>
              <Input type="number" min="0" max="100" value={minNomadScore} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinNomadScore(e.target.value)} placeholder="e.g. 80" className="bg-background h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Max Rate (₹)</Label>
              <Input type="number" value={maxHourlyRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxHourlyRate(e.target.value)} placeholder="Max rate" className="bg-background h-9 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Preference</Label>
              <select value={preferredJobType} onChange={e => setPreferredJobType(e.target.value)} className="w-full border rounded-md px-2 h-9 bg-background text-xs outline-none">
                <option value="">All Contracts</option>
                <option value="FIXED_PRICE">Fixed Price</option>
                <option value="HOURLY">Hourly Billing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Rating</Label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full border rounded-md px-2 h-9 bg-background text-xs outline-none">
                <option value="">Any Rating</option>
                <option value="4.5">4.5 ★ & Above</option>
                <option value="4.0">4.0 ★ & Above</option>
                <option value="3.0">3.0 ★ & Above</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-200/60">
            <Button 
              type="button" 
              variant={geoActive ? "default" : "outline"} 
              onClick={toggleLocalRadius}
              className="h-8 text-xs font-bold gap-2 px-4"
            >
              <span className="material-symbols-outlined text-sm">my_location</span>
              {geoActive ? "Radius Active" : "Filter by Nearby Distance"}
            </Button>

            {geoActive && (
              <div className="flex items-center gap-3 bg-background border px-3 py-1 rounded-lg animate-in fade-in duration-150">
                <Label className="text-xs font-bold shrink-0">Distance Radius: {radius}km</Label>
                <input type="range" min="5" max="100" step="5" value={radius} onChange={e => setRadius(e.target.value)} className="w-28 sm:w-40 accent-primary" />
              </div>
            )}
          </div>
        </Card>

        {/* VERTICAL LISTINGS CONTAINER */}
        <div className="space-y-4 w-full">
          {loading ? (
            <div className="py-24 text-center text-sm font-medium text-muted-foreground">Searching network repositories...</div>
          ) : talents.length > 0 ? (
            talents.map((freelancer) => (
              <Card key={freelancer.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow w-full">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                    
                    <div className="flex flex-1 items-start gap-4 min-w-0 w-full">
                      <Avatar className="size-16 border rounded-xl shrink-0">
                        <AvatarImage src={freelancer.profile?.profilePicLink || undefined} alt="" className="object-cover" />
                        <AvatarFallback className="text-lg font-bold bg-primary/5 text-primary">
                          {freelancer.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-extrabold tracking-tight text-foreground truncate">{freelancer.fullName}</h2>
                          {freelancer.isVerified && (
                            <Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 shrink-0">Verified</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] font-bold shrink-0">Score: {freelancer.nomadScore}</Badge>
                          {freelancer.distanceAwayKm !== null && (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                              📍 {freelancer.distanceAwayKm} km away
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                          <span>{freelancer.profile?.location || "Remote"}</span>
                        </p>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 pr-2">
                          {freelancer.profile?.bio || "No summary profile description listed."}
                        </p>

                        {freelancer.profile?.groupedSkills && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {[
                              ...(freelancer.profile.groupedSkills.specializations || []),
                              ...(freelancer.profile.groupedSkills.subSkills || []),
                              ...(freelancer.profile.groupedSkills.parentSkills || [])
                            ].slice(0, 6).map((skillName, sIdx) => (
                              <span key={sIdx} className="bg-muted px-2.5 py-0.5 rounded-md text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {skillName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end shrink-0 gap-4 md:min-w-[160px]">
                      <div className="space-y-1 text-left md:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Compensation</span>
                        <span className="text-lg font-black text-foreground block">
                          {freelancer.profile?.isHourly && freelancer.profile?.hourlyRate 
                            ? `₹${Number(freelancer.profile.hourlyRate).toLocaleString()}/hr` 
                            : "Fixed-Price"}
                        </span>
                        <span className="text-xs text-amber-600 font-bold flex items-center md:justify-end gap-0.5">
                          ★ {freelancer.metrics.averageRating || '0.0'} 
                          <span className="text-muted-foreground font-normal">({freelancer.metrics.totalReviews})</span>
                        </span>
                      </div>

                      <Button onClick={() => router.push(`/talent/${freelancer.id}`)} size="sm" className="font-bold text-xs shrink-0 px-4">
                        View Portfolio
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )
          ) ): (
            <div className="text-center py-20 border-2 border-dashed rounded-xl font-medium text-muted-foreground bg-background">
              No freelancers match your search query constraints.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
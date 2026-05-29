"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // FIXED: Added missing useRouter hook import
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Business {
  id: string;
  businessName: string;
  isVerified: boolean;
  nomadScore: number;
  joinedAt: string;
  distanceAwayKm: number;
  profile: {
    bio: string | null;
    profilePicLink: string | null;
    bannerLink: string | null;
    location: string | null;
    latitude: number;
    longitude: number;
  } | null;
  metrics: {
    averageRating: number;
    totalReviewCount: number;
    activeOpenJobsCount: number;
  };
}

export default function BrowseBusinesses() {
  const router = useRouter(); // FIXED: Initialized router hook instance inside the component
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  // Geospatial states required by your backend controller
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState('11'); // Defaults to your 11km spec

  // Core fetch mechanism
  const fetchBusinesses = useCallback(async (lat: number, lon: number, currentRadius: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('latitude', String(lat));
      queryParams.append('longitude', String(lon));
      queryParams.append('radius', currentRadius);

      const res = await api.get(`/api/v1/public/getPublicBuisnesses?${queryParams.toString()}`);
      if (res.data?.success) {
        setBusinesses(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load local businesses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Request browser coordinate triggers
  const requestLocationAccess = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location features.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationStatus('granted');
        fetchBusinesses(pos.coords.latitude, pos.coords.longitude, radius);
      },
      (err) => {
        console.warn("Location check rejected:", err);
        setLocationStatus('denied');
      }
    );
  }, [radius, fetchBusinesses]);

  // Request automatically on mount
  useEffect(() => {
    requestLocationAccess();
  }, [requestLocationAccess]);

  // Refetch when the slider shifts the distance boundaries
  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = e.target.value;
    setRadius(newRadius);
    if (latitude && longitude) {
      fetchBusinesses(latitude, longitude, newRadius);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Local Businesses</h1>
          <p className="text-muted-foreground mt-1 text-sm">Discover nearby companies and clients looking for talent in your region.</p>
        </header>

        {locationStatus === 'granted' && (
          /* TOP FILTER BAR */
          <Card className="p-6 border shadow-sm bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">distance</span>
                  Proximity Filter
                </h3>
                <p className="text-xs text-muted-foreground">Showing local businesses based on your coordinates.</p>
              </div>
              
              <div className="flex items-center gap-4 bg-background border px-4 py-2 rounded-xl shadow-xs min-w-[280px] sm:min-w-[340px]">
                <Label className="text-xs font-bold shrink-0 min-w-[110px]">Max Distance: {radius} km</Label>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5" 
                  value={radius} 
                  onChange={handleRadiusChange} 
                  className="w-full accent-primary cursor-pointer" 
                />
              </div>
            </div>
          </Card>
        )}

        {/* CONTENT INTERFACE CONDITIONAL ROUTER */}
        {locationStatus === 'prompt' && (
          <div className="py-24 text-center text-sm font-medium text-muted-foreground animate-pulse">
            Requesting proximity coordinates permission...
          </div>
        )}

        {locationStatus === 'denied' && (
          <Card className="border shadow-xs max-w-md mx-auto mt-12">
            <CardContent className="p-8 text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-amber-500 bg-amber-50 p-3 rounded-full border border-amber-200">location_off</span>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">Location Access Required</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This directory filters businesses dynamically within your local traveling area. Please allow location sharing to see nearby matches.
                </p>
              </div>
              <Button onClick={requestLocationAccess} size="sm" className="w-full font-bold">
                Share My Location
              </Button>
            </CardContent>
          </Card>
        )}

        {locationStatus === 'granted' && (
          <div className="space-y-4 w-full">
            {loading ? (
              <div className="py-24 text-center text-sm font-medium text-muted-foreground">
                Mapping nearby companies...
              </div>
            ) : businesses.length > 0 ? (
              businesses.map((biz) => (
                <Card key={biz.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 w-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                      
                      {/* Left Side Info Details */}
                      <div className="flex flex-1 items-start gap-4 min-w-0 w-full">
                        <Avatar className="size-16 border rounded-xl shrink-0 bg-background">
                          <AvatarImage src={biz.profile?.profilePicLink || undefined} alt="" className="object-cover" />
                          <AvatarFallback className="text-lg font-bold bg-primary/5 text-primary">
                            {biz.businessName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-extrabold tracking-tight text-foreground truncate">{biz.businessName}</h2>
                            {biz.isVerified && (
                              <Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 shrink-0">Verified</Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] font-bold shrink-0">Score: {biz.nomadScore}</Badge>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                              📍 {biz.distanceAwayKm} km away
                            </Badge>
                          </div>

                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm shrink-0">corporate_fare</span>
                            <span>{biz.profile?.location || "Local Client Hub"}</span>
                          </p>

                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 pr-2">
                            {biz.profile?.bio || "No business summary details listed by this employer."}
                          </p>
                        </div>
                      </div>

                      {/* Right Side Statistics & Actions */}
                      <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end shrink-0 gap-4 md:min-w-[160px]">
                        <div className="space-y-1 text-left md:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Active Requests</span>
                          <span className="text-lg font-black text-blue-600 block">
                            {biz.metrics.activeOpenJobsCount} Open Jobs
                          </span>
                          <span className="text-xs text-amber-600 font-bold flex items-center md:justify-end gap-0.5">
                            ★ {biz.metrics.averageRating || '0.0'} 
                            <span className="text-muted-foreground font-normal">({biz.metrics.totalReviewCount})</span>
                          </span>
                        </div>

                        <Button onClick={() => router.push(`/businesses/${biz.id}`)} size="sm" className="font-bold text-xs shrink-0 px-4">
                          View Listings
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl font-medium text-muted-foreground bg-background">
                No active businesses found within this distance radius threshold. Try sliding the bar to increase range.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
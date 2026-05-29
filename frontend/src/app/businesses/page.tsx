"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [error, setError] = useState("");

    const fetchBusinesses = async (lat?: number, lng?: number) => {
        setLoading(true);
        try {
            let url = "/api/v1/public/getPublicBuisnesses";
            if (lat && lng) {
                url += `?latitude=${lat}&longitude=${lng}&radius=50`;
            } else {
                // The API currently requires lat/long, if not present it returns 400. 
                // We'll pass a default coordinate (e.g. Center of India) if user hasn't provided location.
                url += `?latitude=20.5937&longitude=78.9629&radius=2000`;
            }
            const res = await api.get(url);
            setBusinesses(res.data?.data || res.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load businesses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                fetchBusinesses(latitude, longitude);
            },
            () => setError("Unable to retrieve your location")
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="pt-24 max-w-6xl mx-auto px-4 md:px-8 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Browse Businesses</h1>
                        <p className="text-slate-500 font-medium mt-1">Discover verified companies and clients hiring now.</p>
                    </div>
                    <Button onClick={getLocation} color="secondary" size="sm">
                        <span className="material-symbols-outlined text-sm mr-2">my_location</span>
                        Businesses Near Me
                    </Button>
                </div>
                
                {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-44 rounded-xl" />
                        ))}
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">storefront</span>
                        <h3 className="text-lg font-black text-slate-900">No Businesses Found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your location or check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((business) => (
                            <Card key={business.id} className="hover:shadow-lg transition-all border-slate-100 flex flex-col justify-between">
                                <div>
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-black text-slate-900">
                                                {business.businessName || business.fullName}
                                            </CardTitle>
                                            {business.isVerified && (
                                                <Badge variant="default" className="bg-blue-500">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            Joined {new Date(business.joinedAt).toLocaleDateString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                                            {business.profile?.bio || "No description provided."}
                                        </p>
                                    </CardContent>
                                </div>
                                <div className="px-6 pb-6 pt-0">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {business.distanceAwayKm !== undefined && business.distanceAwayKm !== null
                                                ? `${business.distanceAwayKm} km away`
                                                : business.profile?.location || "Remote"}
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <span className="material-symbols-outlined text-sm">work</span>
                                            {business.metrics?.activeOpenJobsCount || 0} Open Jobs
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
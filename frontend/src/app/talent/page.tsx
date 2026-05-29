"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TalentPage() {
    const [talent, setTalent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [error, setError] = useState("");

    const fetchTalent = async (lat?: number, lng?: number) => {
        setLoading(true);
        try {
            let url = "/api/v1/public/getPublicFreelancers";
            if (lat && lng) {
                url += `?latitude=${lat}&longitude=${lng}&radius=50`;
            }
            const res = await api.get(url);
            setTalent(res.data.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load talent.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTalent();
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
                fetchTalent(latitude, longitude);
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Browse Talent</h1>
                        <p className="text-slate-500 font-medium mt-1">Discover top-rated freelancers and experts.</p>
                    </div>
                    <Button onClick={getLocation} color="secondary" size="sm">
                        <span className="material-symbols-outlined text-sm mr-2">my_location</span>
                        Find Near Me
                    </Button>
                </div>
                
                {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-xl" />
                        ))}
                    </div>
                ) : talent.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group_off</span>
                        <h3 className="text-lg font-black text-slate-900">No Talent Found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your location or search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {talent.map((user) => (
                            <Card key={user.id} className="hover:shadow-lg transition-all border-slate-100">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-black text-slate-900">
                                            {user.fullName}
                                        </CardTitle>
                                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md text-xs font-black">
                                            <span className="material-symbols-outlined text-[14px]">star</span>
                                            {user.metrics?.averageRating || "New"}
                                        </div>
                                    </div>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        {user.profile?.preferredJobType === "HOURLY" ? "Hourly Rate: ₹" + user.profile?.hourlyRate : "Fixed Price Projects"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                                        {user.profile?.bio || "No bio available."}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {user.profile?.groupedSkills?.categories?.slice(0, 3).map((skill: string, i: number) => (
                                            <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {user.distanceAwayKm !== null ? `${user.distanceAwayKm} km away` : user.profile?.location || "Remote"}
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-500">
                                            <span className="material-symbols-outlined text-sm">workspace_premium</span>
                                            Score: {user.nomadScore}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

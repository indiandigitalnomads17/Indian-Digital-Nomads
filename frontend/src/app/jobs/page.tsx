"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/ui/skeleton";

function JobsContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get("category");
    const skillId = searchParams.get("skill");

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [error, setError] = useState("");

    const fetchJobs = async (lat?: number, lng?: number) => {
        setLoading(true);
        try {
            let url = "/api/v1/public/getPublicJobs";
            const params = new URLSearchParams();
            if (skillId) params.append("skill", skillId);
            if (categoryId) params.append("category", categoryId);
            if (lat && lng) {
                params.append("latitude", lat.toString());
                params.append("longitude", lng.toString());
                params.append("radius", "50");
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const res = await api.get(url);
            setJobs(res.data?.data || res.data || []);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [categoryId, skillId]);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                fetchJobs(latitude, longitude);
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Browse Jobs</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            {skillId ? `Jobs requiring ${skillId}` : categoryId ? "Browse Jobs by Category" : "Find your next opportunity"}
                        </p>
                    </div>
                    <Button onClick={getLocation} color="secondary" size="sm">
                        <span className="material-symbols-outlined text-sm mr-2">my_location</span>
                        Jobs Near Me
                    </Button>
                </div>
                
                {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-40 rounded-xl" />
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">work_off</span>
                        <h3 className="text-lg font-black text-slate-900">No Jobs Found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your location or search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.id} className="hover:shadow-lg transition-all border-slate-100 flex flex-col justify-between">
                                <div>
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg font-black text-slate-900 line-clamp-1">
                                                {job.title}
                                            </CardTitle>
                                            <Badge variant={job.type === "FIXED_PRICE" ? "default" : "secondary"}>
                                                {job.type}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            {job.client?.fullName || "Verified Client"} • {job.location || "Remote"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                                            {job.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {job.skillsRequired?.slice(0, 3).map((skill: any) => (
                                                <Badge key={skill.id} variant="outline" className="text-slate-500 border-slate-200">
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="px-6 pb-6 pt-0">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {job.estimatedHours ? `${job.estimatedHours} hrs` : "Flexible"}
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600">
                                            <span className="material-symbols-outlined text-sm">payments</span>
                                            {job.budget ? `₹${job.budget}` : "Negotiable"}
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

export default function JobsPage() {
    return (
        <Suspense fallback={<div className="pt-24 px-4 md:px-8 max-w-6xl mx-auto text-slate-500 font-medium">Loading jobs...</div>}>
            <JobsContent />
        </Suspense>
    );
}
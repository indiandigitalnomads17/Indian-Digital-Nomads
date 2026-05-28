"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function JobsPage() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get("category");
    const skillId = searchParams.get("skill");

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Build the query parameter based on selection
        let queryParam = "";
        if (skillId) queryParam = `?skill=${skillId}`;
        else if (categoryId) queryParam = `?category=${categoryId}`;

        api.get(`/api/v1/public/getPublicJobs${queryParam}`)
            .then((res) => {
                // Adjust data target depending on your API's response layout
                setJobs(res.data?.data || res.data || []);
            })
            .catch((err) => console.error("Error fetching public jobs:", err))
            .finally(() => setLoading(false));
    }, [categoryId, skillId]);

    return (
        <div className="max-w-6xl mx-auto pt-24 px-4 md:px-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
                {skillId ? "Jobs requiring this Skill" : categoryId ? "Browse Jobs by Category" : "All Public Jobs"}
            </h1>
            
            {loading ? (
                <p className="text-slate-500 text-sm">Loading job feeds...</p>
            ) : jobs.length === 0 ? (
                <p className="text-slate-500 text-sm">No public listings matching this filter yet.</p>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job: any) => (
                        <div key={job.id || job._id} className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm">
                            <h2 className="font-semibold text-slate-800 text-base">{job.title}</h2>
                            <p className="text-slate-600 text-xs mt-1">{job.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
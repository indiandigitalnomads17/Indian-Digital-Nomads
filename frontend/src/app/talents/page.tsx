"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

function TalentsContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get("category");
    const skillId = searchParams.get("skill");

    const [talents, setTalents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let queryParam = "";
        if (skillId) queryParam = `?skill=${skillId}`;
        else if (categoryId) queryParam = `?category=${categoryId}`;

        api.get(`/api/v1/public/getPublicFreelancers${queryParam}`)
            .then((res) => {
                setTalents(res.data?.data || res.data || []);
            })
            .catch((err) => console.error("Error fetching public freelancers:", err))
            .finally(() => setLoading(false));
    }, [categoryId, skillId]);

    return (
        <div className="max-w-6xl mx-auto pt-24 px-4 md:px-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Available Talent Profiles</h1>
            
            {loading ? (
                <p className="text-slate-500 text-sm">Loading freelancers...</p>
            ) : talents.length === 0 ? (
                <p className="text-slate-500 text-sm">No talent profiles listed under this specific skill tree tier.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {talents.map((freelancer: any) => (
                        <div key={freelancer.id || freelancer._id} className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-800 text-base">{freelancer.fullName || freelancer.name}</h2>
                                <p className="text-blue-600 text-xs font-medium mt-0.5">{freelancer.title || "Freelancer"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TalentsPage() {
    return (
        <Suspense fallback={<p className="text-slate-500 text-sm pt-24 px-4 md:px-8">Loading talents...</p>}>
            <TalentsContent />
        </Suspense>
    );
}
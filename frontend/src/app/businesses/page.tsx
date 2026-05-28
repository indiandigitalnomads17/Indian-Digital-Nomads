"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/v1/public/getPublicBuisnesses")
            .then((res) => {
                setBusinesses(res.data?.data || res.data || []);
            })
            .catch((err) => console.error("Error fetching public businesses:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto pt-24 px-4 md:px-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Registered Businesses</h1>
            
            {loading ? (
                <p className="text-slate-500 text-sm">Loading directory profiles...</p>
            ) : businesses.length === 0 ? (
                <p className="text-slate-500 text-sm">No businesses registered on the platform yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {businesses.map((business: any) => (
                        <div key={business.id || business._id} className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm">
                            <h2 className="font-semibold text-slate-800 text-base">{business.companyName || business.name}</h2>
                            <p className="text-slate-600 text-xs mt-1">{business.industry || "Digital Nomad Member"}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
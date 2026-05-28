"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Imports Shared Modular Infrastructure Components
import BusinessRowCard from '@/components/admin/BusinessRowCard';
import UserActionModal from '@/components/admin/FreelancerActionModal'; // Reusing your dynamic action modal component layout
import { SearchSm, FilterLines, ShieldTick, ChevronLeft, ChevronRight } from '@untitledui/icons';

interface MetaPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export default function AdminBusinessesWorkspace() {
  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState<MetaPagination | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [location, setLocation] = useState('');
  const [minScore, setMinScore] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected state targeted items tracking pointers for modal pipeline updates
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Retrieves data rows tracking parameters array from node server controllers
  const loadBusinessesData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 8,
        location: location.trim() || undefined,
        minNomadScore: minScore || undefined
      };

      // FIXED: Points precisely to your newly designated endpoint token
      const response = await api.get('/api/v1/admin/getClients', { params });
      if (response.data.success) {
        setBusinesses(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error("Error retrieving admin businesses datasets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, location, minScore]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadBusinessesData();
    }, 400);
    return () => clearTimeout(debounceTimer);
  }, [loadBusinessesData]);

  // Processes administrative access status modifications
  const handleStatusChange = async (actionType: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE', reason: string) => {
    if (!selectedBusiness) return;
    
    const baseEndpoint = `/api/v1/admin/users/${selectedBusiness.id}`;
    let response;

    try {
      if (actionType === 'SUSPEND') response = await api.put(`${baseEndpoint}/suspend`, { reason });
      if (actionType === 'UNSUSPEND') response = await api.put(`${baseEndpoint}/unsuspend`, { reason });
      if (actionType === 'REACTIVATE') response = await api.put(`${baseEndpoint}/reactivate`, { reason });
      if (actionType === 'DEACTIVATE') response = await api.delete(`${baseEndpoint}/deactivate`, { data: { reason } });

      if (response && response.data.success) {
        loadBusinessesData();
      }
    } catch (error) {
      console.error("Error dispatching admin corporate control override action:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Heading layout */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline">Manage Businesses</h1>
        <p className="text-slate-500 text-sm font-medium">Audit client operations, regulate discovery indices, and override account visibility statuses.</p>
      </div>

      {/* Filter Control Strip Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <FilterLines className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text" 
            value={location}
            onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
            placeholder="Search by city or country location..." 
            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>

        <div className="relative">
          <ShieldTick className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <select
            value={minScore}
            onChange={(e) => { setMinScore(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">Minimum Nomad Score (All)</option>
            <option value="90">90+ Exceptional Rating</option>
            <option value="75">75+ Reliable Rating</option>
            <option value="50">50+ Moderate Rating</option>
          </select>
        </div>
      </div>

      {/* Core Directory Render List Box */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center text-xs uppercase tracking-widest font-black text-slate-400 animate-pulse">
          Refreshing Corporate Record Matrices...
        </div>
      ) : businesses.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {businesses.map((business: any) => (
              <BusinessRowCard 
                key={business.id}
                id={business.id} // <-- CRITICAL FIX: Explicitly bound to guarantee runtime delivery
                {...business}
                onActionClick={() => {
                  setSelectedBusiness(business);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>

          {/* App Pagination Footer Controls */}
          {pagination && pagination.totalPages > 1 && (
            <footer className="flex items-center justify-between pt-4 border-t border-slate-200 text-sm font-bold text-slate-600">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> Previous
              </button>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-black">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="size-4" />
              </button>
            </footer>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <p className="text-slate-500 font-bold mb-1">No corporate business parameters matched current query criteria.</p>
          <p className="text-slate-400 text-xs">Try clearing or widening your location search filters.</p>
        </div>
      )}

      {/* Floating Action Override Modal Pipeline Injection Point */}
      <AnimatePresence>
        {isModalOpen && selectedBusiness && (
          <UserActionModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedBusiness(null); }}
            onConfirm={handleStatusChange}
            freelancerName={selectedBusiness.fullName}
            currentStatus={selectedBusiness.status}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// Imports UI layout components
import FreelancerRowCard from '../../../components/admin/FreelancerRowCard';
import FreelancerActionModal from '../../../components/admin/FreelancerActionModal';
import { SearchSm, FilterLines, ShieldTick, ChevronLeft, ChevronRight } from '@untitledui/icons';

interface MetaPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export default function AdminFreelancersWorkspace() {
  const [freelancers, setFreelancers] = useState([]);
  const [pagination, setPagination] = useState<MetaPagination | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minScore, setMinScore] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected state targeted elements tracking pointers for modal pipeline updates
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync data rows retrieval tracking parameters array from node server controllers
  const loadFreelancersData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 8,
        skill: search.trim() || undefined,
        location: location.trim() || undefined,
        minNomadScore: minScore || undefined
      };

      // FIXED: Points to your exact backend route string token
      const response = await api.get('/api/v1/admin/getFreelancers', { params });
      if (response.data.success) {
        setFreelancers(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (error) {
      console.error("Error retrieving admin tracking datasets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, location, minScore]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadFreelancersData();
    }, 400); // 400ms debounce buffer prevents rapid database thrashing during typing
    return () => clearTimeout(debounceTimer);
  }, [loadFreelancersData]);

  // Direct access control method updates tracking handlers
  const handleStatusChange = async (actionType: 'SUSPEND' | 'DEACTIVATE' | 'UNSUSPEND' | 'REACTIVATE', reason: string) => {
    if (!selectedFreelancer) return;
    
    // Base router mount points matching: app.use("/api/v1/admin", adminRoutes);
    const baseEndpoint = `/api/v1/admin/users/${selectedFreelancer.id}`;
    let response;

    try {
      if (actionType === 'SUSPEND') {
        response = await api.put(`${baseEndpoint}/suspend`, { reason });
      }
      if (actionType === 'UNSUSPEND') {
        response = await api.put(`${baseEndpoint}/unsuspend`, { reason });
      }
      if (actionType === 'REACTIVATE') {
        response = await api.put(`${baseEndpoint}/reactivate`, { reason });
      }
      // CRITICAL FIXED: Dispatches an explicit native DELETE request with a body enclosure payload to match router rules
      if (actionType === 'DEACTIVATE') {
        response = await api.delete(`${baseEndpoint}/deactivate`, { data: { reason } });
      }

      if (response && response.data.success) {
        // Trigger table data reload seamlessly upon success
        loadFreelancersData();
      }
    } catch (error) {
      console.error("Error dispatching admin control update action:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Section */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter mb-2 font-headline">Manage Freelancers</h1>
        <p className="text-slate-500 text-sm font-medium">Verify credentials, adjust visibility metrics, or modify access levels across the platform.</p>
      </div>

      {/* Multi-tier Filter Array Control Strip Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <SearchSm className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Filter by skill set..." 
            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>

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

      {/* Content Rendering Dynamic Section Box Container */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center text-xs uppercase tracking-widest font-black text-slate-400 animate-pulse">
          Refreshing Sync Record Matrices...
        </div>
      ) : freelancers.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {freelancers.map((user: any) => (
              <FreelancerRowCard 
                key={user.id}
                id={user.id} // 💻 CRITICAL COUPLING ATTACHMENT: Forces exact context variable extraction on map
                {...user}
                onActionClick={() => {
                  setSelectedFreelancer(user);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>

          {/* Core App Pagination Footer Controls Element */}
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
          <p className="text-slate-500 font-bold mb-1">No matches found targeting current scope queries.</p>
          <p className="text-slate-400 text-xs">Try adjusting your filters or search criteria.</p>
        </div>
      )}

      {/* Floating Overrides Modal Pipeline Anchor Injection Point */}
      <AnimatePresence>
        {isModalOpen && selectedFreelancer && (
          <FreelancerActionModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedFreelancer(null); }}
            onConfirm={handleStatusChange}
            freelancerName={selectedFreelancer.fullName}
            currentStatus={selectedFreelancer.status}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';

// Imports Shared Modular Components Layout Structures
import KycReviewModal from '@/components/admin/KycReviewModal';
import { MarkerPin01, Calendar, ShieldTick, SearchSm, ChevronLeft, ChevronRight, FileX02, FileCheck02 } from '@untitledui/icons';

type KycSubTab = 'pending' | 'history';

interface MetaPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export default function AdminKycWorkspacePanel() {
  const [activeTab, setActiveTab] = useState<KycSubTab>('pending');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<MetaPagination | null>(null);

  // Core Data Storage Arrays
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Query Filter Hooks
  const [location, setLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Target Focus Items Selection Pointers
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── PIPELINE A: LOAD ACTIVE PENDING ENTRIES ───────────────────────────
  const fetchPendingData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 8,
        location: location.trim() || undefined,
        date: filterDate || undefined
      };
      const res = await api.get('/api/v1/admin/kyc/pending', { params });
      if (res.data.success) {
        setPendingRequests(res.data.data);
        setPagination(res.data.meta);
      }
    } catch (err) {
      console.error("Error retrieving active verification streams:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, location, filterDate]);

  // ─── PIPELINE B: LOAD HISTORICAL LOGS LEDGER ───────────────────────────
  const fetchHistoryLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 10 };
      const res = await api.get('/api/v1/admin/kyc/history', { params });
      if (res.data.success) {
        setHistoryLogs(res.data.data);
        setPagination(res.data.meta);
      }
    } catch (err) {
      console.error("Error pulling history audit data fields:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Handle centralized rendering triggers depending on tab contexts
  useEffect(() => {
    if (activeTab === 'pending') {
      const debounce = setTimeout(() => { fetchPendingData(); }, 350);
      return () => clearTimeout(debounce);
    } else {
      fetchHistoryLogs();
    }
  }, [activeTab, fetchPendingData, fetchHistoryLogs]);

  const handleTabChange = (target: KycSubTab) => {
    setActiveTab(target);
    setCurrentPage(1);
    setPagination(null);
  };

  // ─── PIPELINE C: COMMIT REVIEW OVERRIDE METRICS ───────────────────────
  const handleReviewExecution = async (action: 'APPROVED' | 'REJECTED', notes: string) => {
    if (!selectedRequest) return;
    try {
      const response = await api.put(`/api/v1/admin/kyc/${selectedRequest.id}/review`, {
        action,
        rejectionNotes: notes || undefined
      });

      if (response.data.success) {
        fetchPendingData(); // Instantly update active data rows layout cleanly upon success
      }
    } catch (error) {
      console.error("Error resolving user verification request node:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Descriptive Header Context */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter mb-1.5 font-headline text-slate-900">KYC Verification Desk</h1>
          <p className="text-slate-500 text-sm font-medium">Evaluate uploaded identification documents, grant platform credentials, and inspect historic log sheets.</p>
        </div>

        {/* Dynamic Navigation Subtabs Switcher Toggles */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-fit border border-slate-200/50">
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${
              activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ⏳ Pending Action
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            📖 Historic Log
          </button>
        </div>
      </header>

      {/* Conditional Filtering Bars Row - Only Rendered for Pending Queues */}
      {activeTab === 'pending' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <MarkerPin01 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              value={location}
              onChange={(e) => { setLocation(e.target.value); setCurrentPage(1); }}
              placeholder="Filter queues by location..." 
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-600"
            />
          </div>
        </div>
      )}

      {/* ─── LIVE DATA RENDERING ZONES LAYER ─── */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center text-xs tracking-widest font-black uppercase text-slate-400 animate-pulse">Syncing active verification data models...</div>
      ) : activeTab === 'pending' ? (
        /* RENDER CONDITIONAL BLOCK A: PENDING VALIDATIONS QUEUE STREAM */
        pendingRequests.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((reqItem: any) => (
                <div key={reqItem.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <img 
                      src={reqItem.profilePicLink || "https://res.cloudinary.com/dmv76qdpx/image/upload/v1713727931/default-avatar_vqc9tw.png"} 
                      alt={reqItem.fullName} 
                      className="w-12 h-12 object-cover rounded-xl border border-slate-100 shadow-xs shrink-0"
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">{reqItem.fullName}</h4>
                      <p className="text-xs text-slate-400 font-medium mb-1">{reqItem.email}</p>
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <MarkerPin01 className="size-3.5 text-slate-400" /> {reqItem.location}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedRequest(reqItem); setIsModalOpen(true); }}
                    className="px-4 py-2.5 bg-slate-900 border border-slate-900 hover:bg-blue-600 hover:border-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all w-full md:w-auto text-center"
                  >
                    Review Credentials
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-500 font-bold">🎉 Excellent! No pending registration verification claims waiting in queue.</div>
        )
      ) : (
        /* RENDER CONDITIONAL BLOCK B: AUDIT LOGS HISTORY TABLE LIST */
        historyLogs.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-500">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/70"><th className="p-4">Target Account User</th><th className="p-4">Audited Reviewer</th><th className="p-4 text-center">Verdict</th><th className="p-4">Administrative Feedback Statement</th><th className="p-4 text-right">Processed At</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900"><div>{log.userFullName}</div><div className="text-[10px] text-slate-400 font-medium">{log.userEmail}</div></td>
                      <td className="p-4 font-bold text-slate-700">⚙️ {log.reviewedByAdmin}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 border text-[10px] font-black rounded-md uppercase tracking-wider ${
                          log.verdict === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {log.verdict}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium max-w-xs truncate" title={log.notes}>{log.notes}</td>
                      <td className="p-4 text-right text-slate-400 font-medium">{new Date(log.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 font-bold">No historical audit log entries found in database registry indexes.</div>
        )
      )}

      {/* ─── PAGINATION BOTTOM LINK BAR CONTROLS ELEMENT ─── */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <footer className="flex items-center justify-between pt-4 border-t border-slate-200 text-sm font-bold text-slate-600">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 disabled:opacity-40 hover:bg-white"><ChevronLeft className="size-4"/> Previous</button>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Page {currentPage} of {pagination.totalPages}</span>
          <button disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, pagination.totalPages))} className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 disabled:opacity-40 hover:bg-white">Next <ChevronRight className="size-4"/></button>
        </footer>
      )}

      {/* Floating Modal Overrides Injection Workspace Anchor Frame */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <KycReviewModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setSelectedRequest(null); }}
            onConfirm={handleReviewExecution}
            user={selectedRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}